const store = require("../storage");
const { generateId } = require("../../shared/utils/ids");
const {
  startOfDay,
  differenceInDays,
  getHour,
  toIso,
  clamp,
} = require("../../shared/utils/time");

const ensureHabit = (habit) => {
  if (!habit.sessions) habit.sessions = [];
  if (!habit.metrics) habit.metrics = {};
  return habit;
};

const normalizeFocusScore = (value) => {
  if (!Number.isFinite(value)) return null;
  const normalized = value > 1 ? value / 100 : value;
  return clamp(normalized, 0, 1);
};

const exponentialProgress = (days, tau = 18) => 1 - Math.exp(-days / tau);

const computeMetrics = (habit) => {
  const sessions = habit.sessions || [];
  if (sessions.length === 0) {
    return {
      streakDays: 0,
      automaticityProgress: 0,
      consistency7d: 0,
      consistency30d: 0,
      didToday: false,
      todayScore: 0,
      totalSessions: 0,
      lastSessionAt: null,
      focusAverage: null,
      focusByHour: {},
    };
  }

  const dayKeys = Array.from(
    new Set(sessions.map((session) => startOfDay(session.timestamp).getTime()))
  ).sort((a, b) => b - a);

  let streakDays = 1;
  for (let i = 1; i < dayKeys.length; i += 1) {
    if (differenceInDays(dayKeys[i - 1], dayKeys[i]) === 1) {
      streakDays += 1;
    } else {
      break;
    }
  }

  const focusValues = sessions
    .map((session) => normalizeFocusScore(session.focusScore))
    .filter((value) => typeof value === "number");
  const focusAverage =
    focusValues.length > 0
      ? focusValues.reduce((sum, value) => sum + value, 0) / focusValues.length
      : null;

  const focusByHour = sessions.reduce((acc, session) => {
    const hour = getHour(session.timestamp);
    const value = normalizeFocusScore(session.focusScore);
    if (typeof value !== "number") return acc;
    if (!acc[hour]) {
      acc[hour] = { total: value, count: 1 };
      return acc;
    }
    acc[hour].total += value;
    acc[hour].count += 1;
    return acc;
  }, {});

  const focusByHourAverage = Object.entries(focusByHour).reduce((acc, entry) => {
    const [hour, stats] = entry;
    acc[hour] = stats.total / stats.count;
    return acc;
  }, {});

  const now = Date.now();
  const last7DaysCount = dayKeys.filter((key) => now - key <= 7 * 86400000).length;
  const last30DaysCount = dayKeys.filter((key) => now - key <= 30 * 86400000).length;
  const todayKey = startOfDay(now).getTime();
  const didToday = dayKeys.includes(todayKey);
  const automaticityProgress = clamp(exponentialProgress(dayKeys.length), 0, 1);

  return {
    streakDays,
    automaticityProgress,
    consistency7d: last7DaysCount / 7,
    consistency30d: last30DaysCount / 30,
    didToday,
    todayScore: didToday ? 1 : 0,
    totalSessions: sessions.length,
    lastSessionAt: toIso(sessions[sessions.length - 1].timestamp),
    focusAverage,
    focusByHour: focusByHourAverage,
  };
};

const listHabits = (userId) =>
  store.listHabits(userId).map((habit) => {
    const enriched = ensureHabit(habit);
    enriched.metrics = computeMetrics(enriched);
    return enriched;
  });

const addHabit = (userId, name) => {
  const habit = ensureHabit(store.addHabit(userId, name));
  habit.metrics = computeMetrics(habit);
  return habit;
};

const recordSession = (userId, habitId, input) => {
  const habit = ensureHabit(
    store.listHabits(userId).find((item) => item.id === habitId)
  );
  if (!habit) return null;

  const session = {
    id: generateId(),
    userId,
    habitId,
    timestamp: toIso(input.timestamp || Date.now()),
    durationMin: Number.isFinite(input.durationMin) ? input.durationMin : 25,
    focusScore:
      typeof input.focusScore === "number" ? input.focusScore : undefined,
    breakTaken: Boolean(input.breakTaken),
  };

  habit.sessions.push(session);
  habit.metrics = computeMetrics(habit);
  return session;
};

module.exports = { listHabits, addHabit, recordSession };
