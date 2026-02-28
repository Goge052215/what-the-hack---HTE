const store = require("./models");
const { generateId } = require("../../shared/utils/ids");
const env = require("../config/env");
const { SESSION_TTL_MS } = require("../config/constants");

const now = () => Date.now();

const createSession = (userId, roles = ["user"]) => {
  const sessionId = generateId();
  const expiresAt = now() + (env.sessionTtlMs || SESSION_TTL_MS);
  store.sessions.set(sessionId, { userId, roles, expiresAt });
  return { sessionId, userId, roles, expiresAt };
};

const getSession = (sessionId) => {
  if (!sessionId) return null;
  const session = store.sessions.get(sessionId);
  if (!session) return null;
  if (session.expiresAt <= now()) {
    store.sessions.delete(sessionId);
    return null;
  }
  return session;
};

const deleteSession = (sessionId) => {
  store.sessions.delete(sessionId);
};

const listTasks = (userId) => store.tasks.filter((task) => task.userId === userId);

const addTask = (userId, title) => {
  const task = { id: generateId(), userId, title, createdAt: now() };
  store.tasks.push(task);
  return task;
};

const listHabits = (userId) => store.habits.filter((habit) => habit.userId === userId);

const addHabit = (userId, name) => {
  const habit = { id: generateId(), userId, name, createdAt: now() };
  store.habits.push(habit);
  return habit;
};

const listSchedules = (userId) => store.schedules.filter((item) => item.userId === userId);

const addSchedule = (userId, items) => {
  const schedule = { id: generateId(), userId, items, createdAt: now() };
  store.schedules.push(schedule);
  return schedule;
};

const MAX_ANALYSES_PER_USER = 2000;

const addAnalysis = (userId, result) => {
  const analysis = { id: generateId(), userId, result, createdAt: now() };
  store.analyses.push(analysis);
  const userItems = store.analyses.filter((item) => item.userId === userId);
  if (userItems.length > MAX_ANALYSES_PER_USER) {
    const sorted = userItems.slice().sort((a, b) => a.createdAt - b.createdAt);
    const cutoff = sorted[sorted.length - MAX_ANALYSES_PER_USER]?.createdAt;
    store.analyses = store.analyses.filter(
      (item) => item.userId !== userId || item.createdAt >= cutoff
    );
  }
  return analysis;
};

const listAnalyses = (userId) => store.analyses.filter((item) => item.userId === userId);

module.exports = {
  createSession,
  getSession,
  deleteSession,
  listTasks,
  addTask,
  listHabits,
  addHabit,
  listSchedules,
  addSchedule,
  addAnalysis,
  listAnalyses,
};
