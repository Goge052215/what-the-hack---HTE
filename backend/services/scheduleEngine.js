const { addMinutes, formatTime, toDate, startOfDay, getHour } = require("../../shared/utils/time");

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

module.exports = { generateSchedule };
