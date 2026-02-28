const store = require("../storage");
const { scoreRelevance } = require("../services/relevanceScorer");
const { isNonEmptyString } = require("../../shared/utils/validation");
const { startOfDay, getHour } = require("../../shared/utils/time");

const MAX_GAP_MIN = 5;

const getLatestGoal = (userId, bodyGoal) => {
  if (isNonEmptyString(bodyGoal)) return bodyGoal.trim();
  const tasks = store.listTasks(userId) || [];
  if (tasks.length === 0) return "";
  const latest = tasks.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
  return latest?.title ? String(latest.title) : "";
};

const buildDailyReport = (analyses, dayStartMs, dayEndMs) => {
  const dayAnalyses = analyses
    .filter((entry) => entry.createdAt >= dayStartMs && entry.createdAt < dayEndMs)
    .sort((a, b) => a.createdAt - b.createdAt);

  if (dayAnalyses.length < 2) {
    return {
      trackedMinutes: 0,
      focusMinutes: 0,
      focusRatio: 0,
      averageContinuousFocusMinutes: 0,
      distractionCount: 0,
      taskSwitches: 0,
      taskSwitchingRate: 0,
      efficiencyDistribution: [],
    };
  }

  let trackedMinutes = 0;
  let focusMinutes = 0;
  let distractionCount = 0;
  let taskSwitches = 0;
  let currentFocusRun = 0;
  const focusRuns = [];
  const hourly = {};

  const getCategory = (entry) => entry.result?.category || "neutral";
  const getRelevance = (entry) =>
    typeof entry.result?.relevanceScore === "number" ? entry.result.relevanceScore : 0;
  const isFocused = (entry) => getCategory(entry) === "study" && getRelevance(entry) >= 0.6;

  for (let i = 0; i < dayAnalyses.length - 1; i += 1) {
    const current = dayAnalyses[i];
    const next = dayAnalyses[i + 1];
    const deltaMin = Math.max(
      0,
      Math.min(MAX_GAP_MIN, (next.createdAt - current.createdAt) / 60000)
    );
    if (deltaMin <= 0) continue;

    const focused = isFocused(current);
    trackedMinutes += deltaMin;
    if (focused) {
      focusMinutes += deltaMin;
      currentFocusRun += deltaMin;
    } else if (currentFocusRun > 0) {
      focusRuns.push(currentFocusRun);
      currentFocusRun = 0;
    }

    const hour = getHour(current.createdAt);
    if (!hourly[hour]) hourly[hour] = { focus: 0, total: 0 };
    hourly[hour].total += deltaMin;
    if (focused) hourly[hour].focus += deltaMin;

    const prev = i > 0 ? dayAnalyses[i - 1] : null;
    if (prev) {
      const prevFocused = isFocused(prev);
      if (prevFocused && !focused) {
        distractionCount += 1;
      }
      const prevCategory = getCategory(prev);
      const currentCategory = getCategory(current);
      if (prevCategory !== currentCategory) {
        taskSwitches += 1;
      }
    }
  }

  if (currentFocusRun > 0) focusRuns.push(currentFocusRun);

  const averageContinuousFocusMinutes =
    focusRuns.length > 0
      ? focusRuns.reduce((sum, value) => sum + value, 0) / focusRuns.length
      : 0;
  const focusRatio = trackedMinutes > 0 ? focusMinutes / trackedMinutes : 0;
  const taskSwitchingRate =
    trackedMinutes > 0 ? taskSwitches / (trackedMinutes / 60) : 0;

  const efficiencyDistribution = Object.entries(hourly)
    .map(([hour, stats]) => ({
      hour: Number(hour),
      focusMinutes: stats.focus,
      totalMinutes: stats.total,
      focusRatio: stats.total > 0 ? stats.focus / stats.total : 0,
    }))
    .sort((a, b) => b.focusRatio - a.focusRatio);

  return {
    trackedMinutes,
    focusMinutes,
    focusRatio,
    averageContinuousFocusMinutes,
    distractionCount,
    taskSwitches,
    taskSwitchingRate,
    efficiencyDistribution,
  };
};

const handleAnalyze = (req, res, ctx) => {
  const { method, url } = req;
  const parsedUrl = new URL(url, "http://localhost");
  const pathname = parsedUrl.pathname;
  if (pathname === "/api/analyze" && method === "POST") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    const context = req.body?.context;
    if (!isNonEmptyString(context)) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_context" });
    }
    const goal = getLatestGoal(user.id, req.body?.goal);
    const relevance = scoreRelevance({ goal, context });
    const score = relevance.relevanceScore;
    const result = {
      score,
      relevanceScore: relevance.relevanceScore,
      category: relevance.category,
      matchedKeywords: relevance.matchedKeywords,
      goal: relevance.goal,
      context,
    };
    store.addAnalysis(user.id, result);
    return ctx.sendJson(res, 200, { ok: true, data: result });
  }
  if (pathname === "/api/analyze/report" && method === "GET") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    const dayParam = parsedUrl.searchParams.get("day");
    const dayDate = dayParam ? new Date(`${dayParam}T00:00:00`) : new Date();
    const dayStart = startOfDay(dayDate).getTime();
    const dayEnd = startOfDay(dayStart + 86400000).getTime();
    const analyses = store.listAnalyses(user.id) || [];
    const report = buildDailyReport(analyses, dayStart, dayEnd);
    return ctx.sendJson(res, 200, {
      ok: true,
      data: {
        day: new Date(dayStart).toISOString().slice(0, 10),
        report,
      },
    });
  }
  return false;
};

module.exports = { handleAnalyze };
