const { addMinutes, formatTime, toDate, startOfDay, getHour } = require("../../shared/utils/time");
const { createSchedulePlan } = require("./llmClient");

const normalizeFocusScore = (value) => {
  if (!Number.isFinite(value)) return null;
  return value > 1 ? value / 100 : value;
};

const pickCycle = (cycle, durationMin) => {
  if (cycle === "ultradian") return { label: "ultradian", focus: 90, rest: 20 };
  if (cycle === "pomodoro")
    return { label: "pomodoro", focus: 25, rest: 5, longRest: 20 };
  if (durationMin >= 90) return { label: "ultradian", focus: 90, rest: 20 };
  return { label: "pomodoro", focus: 25, rest: 5, longRest: 20 };
};

const computePeakHour = (history) => {
  if (!Array.isArray(history) || history.length === 0) return null;
  const buckets = history.reduce((acc, session) => {
    const hour = getHour(session.timestamp);
    const score = normalizeFocusScore(session.focusScore);
    if (typeof score !== "number") return acc;
    if (!acc[hour]) acc[hour] = { total: score, count: 1 };
    else {
      acc[hour].total += score;
      acc[hour].count += 1;
    }
    return acc;
  }, {});
  const ranked = Object.entries(buckets).map(([hour, stats]) => ({
    hour: Number(hour),
    avg: stats.total / stats.count,
  }));
  if (ranked.length === 0) return null;
  ranked.sort((a, b) => b.avg - a.avg);
  return ranked[0].hour;
};

const resolveStartTime = (startTime, history) => {
  if (startTime) return toDate(startTime);
  const peakHour = computePeakHour(history);
  const base = startOfDay(Date.now());
  const targetHour = typeof peakHour === "number" ? peakHour : 9;
  base.setHours(targetHour, 0, 0, 0);
  return base;
};

const buildBlocks = (startTime, task, cycleConfig, state) => {
  const blocks = [];
  let remaining = Number.isFinite(task.durationMin) ? task.durationMin : cycleConfig.focus;
  let cursor = startTime;
  let pomodoroCount = state?.pomodoroCount ?? 0;

  while (remaining > 0) {
    const focusDuration = Math.min(cycleConfig.focus, remaining);
    blocks.push({
      start: formatTime(cursor),
      type: "focus",
      duration: focusDuration,
      task: task.title,
    });
    cursor = addMinutes(cursor, focusDuration);
    remaining -= focusDuration;
    if (cycleConfig.label === "pomodoro") {
      pomodoroCount += 1;
    }
    if (remaining <= 0) break;
    const longBreak =
      cycleConfig.label === "pomodoro" &&
      cycleConfig.longRest &&
      pomodoroCount % 4 === 0;
    const restDuration = longBreak ? cycleConfig.longRest : cycleConfig.rest;
    blocks.push({
      start: formatTime(cursor),
      type: "break",
      duration: restDuration,
    });
    cursor = addMinutes(cursor, restDuration);
  }

  if (state) state.pomodoroCount = pomodoroCount;
  return { blocks, endTime: cursor, pomodoroCount };
};

const normalizeTasks = (tasks = []) =>
  tasks.map((task, index) => ({
    title: String(task.title || task.description || task.name || `Task ${index + 1}`),
    durationMin: Number.isFinite(task.durationMin)
      ? task.durationMin
      : Number.isFinite(task.duration)
      ? task.duration
      : 25,
  }));

const parseTimeString = (value) => {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const sanitizeSchedulePlan = (plan, fallbackStart) => {
  if (!plan || !Array.isArray(plan.blocks) || plan.blocks.length === 0) return null;
  const startTime = parseTimeString(plan.startTime) || parseTimeString(fallbackStart);
  if (!startTime) return null;
  const cycle = plan.cycle === "ultradian" ? "ultradian" : "pomodoro";
  let cursor = new Date(startTime.getTime());
  const blocks = plan.blocks
    .map((block) => ({
      start: typeof block.start === "string" ? block.start : null,
      type: block.type === "break" ? "break" : "focus",
      duration: Number(block.duration),
      task: block.task ? String(block.task) : undefined,
    }))
    .filter((block) => Number.isFinite(block.duration) && block.duration > 0)
    .map((block) => {
      const parsedStart = parseTimeString(block.start);
      const normalizedStart = parsedStart ? formatTime(parsedStart) : formatTime(cursor);
      cursor = addMinutes(cursor, block.duration);
      return { ...block, start: normalizedStart };
    });
  if (blocks.length === 0) return null;
  const totalMinutes = blocks.reduce((sum, block) => sum + block.duration, 0);
  return {
    cycle,
    startTime: formatTime(startTime),
    blocks,
    totalMinutes,
  };
};

const buildSchedulePrompt = ({ tasks, focusHistory, cycle, startTime }) => {
  const normalizedTasks = normalizeTasks(tasks);
  const startAt = resolveStartTime(startTime, focusHistory);
  const cycleLabel = cycle === "ultradian" ? "ultradian" : "pomodoro";
  return [
    "Create a schedule for today.",
    'Return ONLY valid JSON with keys: "cycle", "startTime", "blocks", "totalMinutes".',
    'Each block: {"start":"HH:MM","type":"focus|break","duration":number,"task":string?}.',
    "Use 24-hour time. Ensure blocks are sequential and start at the given startTime.",
    "Suggest practice events after class-assignment tasks.",
    "Suggest revision events before class-exam tasks.",
    "Suggest relaxation after class-tasks events.",
    `Preferred cycle: ${cycleLabel}.`,
    `Start time: ${formatTime(startAt)}.`,
    `Tasks: ${JSON.stringify(normalizedTasks)}.`,
  ].join("\n");
};

const generateSchedule = ({
  tasks = [],
  focusHistory = [],
  cycle,
  startTime,
} = {}) => {
  const startAt = resolveStartTime(startTime, focusHistory);
  let cursor = startAt;
  const blocks = [];

  const state = { pomodoroCount: 0 };
  tasks.forEach((task) => {
    const cycleConfig = pickCycle(cycle, task.durationMin);
    const result = buildBlocks(cursor, task, cycleConfig, state);
    blocks.push(...result.blocks);
    cursor = result.endTime;
  });

  const totalMinutes = blocks.reduce((sum, block) => sum + block.duration, 0);
  const pickedCycle = pickCycle(cycle, tasks[0]?.durationMin).label;

  return {
    cycle: pickedCycle,
    startTime: formatTime(startAt),
    blocks,
    totalMinutes,
  };
};

const generateScheduleWithLLM = async ({
  tasks = [],
  focusHistory = [],
  cycle,
  startTime,
} = {}) => {
  const prompt = buildSchedulePrompt({ tasks, focusHistory, cycle, startTime });
  const fallback = generateSchedule({ tasks, focusHistory, cycle, startTime });
  try {
    const response = await createSchedulePlan(prompt);
    if (!response.ok || !response.content) {
      return fallback;
    }
    const cleaned = String(response.content)
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    const plan = sanitizeSchedulePlan(parsed, fallback.startTime);
    return plan || fallback;
  } catch {
    return fallback;
  }
};

module.exports = { generateSchedule, generateScheduleWithLLM };
