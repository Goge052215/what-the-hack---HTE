const store = require("../storage");
const { scoreRelevance } = require("../services/relevanceScorer");
const { isNonEmptyString } = require("../../shared/utils/validation");
const { createInsight, createScheduleSuggestions, createScheduleSuggestionsViaApi } = require("../services/llmClient");
const { startOfDay, getHour } = require("../../shared/utils/time");

const MAX_GAP_MIN = 5;
const DAY_PARAM_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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

const computeInsightFallback = (report) => {
  if (!report || !Array.isArray(report.efficiencyDistribution)) {
    return "Today's learning insight: Not enough data yet. Keep logging sessions for sharper recommendations.";
  }
  const distribution = report.efficiencyDistribution;
  if (distribution.length === 0 || !report.trackedMinutes) {
    return "Today's learning insight: Limited activity logged. Track more focused time blocks to reveal your efficiency curve.";
  }
  const peak = distribution.reduce((best, entry) =>
    entry.focusRatio > best.focusRatio ? entry : best
  );
  const peakHour = Number.isFinite(peak?.hour) ? peak.hour : null;
  const peakLabel =
    peakHour === null
      ? "peak hours"
      : `${String(peakHour).padStart(2, "0")}–${String((peakHour + 1) % 24).padStart(
          2,
          "0"
        )}`;
  const afterCut = distribution.filter((entry) => entry.hour >= 15);
  const beforeCut = distribution.filter((entry) => entry.hour < 15);
  const ratioFromEntries = (entries) => {
    const total = entries.reduce((sum, entry) => sum + (entry.totalMinutes || 0), 0);
    if (!total) return 0;
    const focus = entries.reduce((sum, entry) => sum + (entry.focusMinutes || 0), 0);
    return focus / total;
  };
  const beforeRatio = ratioFromEntries(beforeCut);
  const afterRatio = ratioFromEntries(afterCut);
  const dropPct =
    beforeRatio > 0 && afterRatio < beforeRatio
      ? Math.round(((beforeRatio - afterRatio) / beforeRatio) * 100)
      : 0;
  if (dropPct > 0) {
    return `Today's learning insight: You are most focused during ${peakLabel}, but distractions rise ${dropPct}% after 15:00. Schedule high-effort tasks in ${peakLabel}.`;
  }
  return `Today's learning insight: You are most focused during ${peakLabel}. Schedule high-effort tasks in ${peakLabel}, and use other hours for review or planning.`;
};

const buildFallbackSlots = ({ type, deadline }) => {
  const base = deadline ? new Date(deadline) : new Date(Date.now() + 2 * 60 * 60 * 1000);
  const isValidBase = !Number.isNaN(base.getTime());
  const anchor = isValidBase ? base : new Date(Date.now() + 2 * 60 * 60 * 1000);
  const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);
  if (type === "exam") {
    return [
      {
        title: "Exam revision session",
        start: addHours(anchor, -120).toISOString(),
        durationMin: 60,
      },
      {
        title: "Practice exam questions",
        start: addHours(anchor, -48).toISOString(),
        durationMin: 45,
      },
      {
        title: "Final review checklist",
        start: addHours(anchor, -24).toISOString(),
        durationMin: 30,
      },
    ];
  }
  if (type === "assignment") {
    return [
      {
        title: "Practice after class",
        start: addHours(anchor, -72).toISOString(),
        durationMin: 45,
      },
      {
        title: "Midway check-in",
        start: addHours(anchor, -36).toISOString(),
        durationMin: 30,
      },
      {
        title: "Final polish",
        start: addHours(anchor, -12).toISOString(),
        durationMin: 30,
      },
    ];
  }
  return [
    {
      title: "Relaxation break",
      start: addHours(anchor, 1).toISOString(),
      durationMin: 20,
    },
    {
      title: "Follow-up session",
      start: addHours(anchor, 24).toISOString(),
      durationMin: 30,
    },
    {
      title: "Quick review",
      start: addHours(anchor, 48).toISOString(),
      durationMin: 30,
    },
  ];
};

const buildSuggestionPrompt = ({ description, type, deadline }) => {
  const normalizedType = type === "exam" ? "exam" : type === "assignment" ? "assignment" : "task";
  return [
    'Return ONLY a JSON array of 3 to 5 objects with keys: "title", "start", "durationMin".',
    'Use ISO 8601 datetime strings for "start".',
    "Include practice events after class-assignment tasks.",
    "Include revision events before class-exam tasks.",
    "Include relaxation after class-tasks events.",
    "If a deadline is provided, schedule relative to the deadline.",
    `Task type: ${normalizedType}.`,
    `Task description: ${String(description || "").trim() || "Untitled task"}.`,
    deadline ? `Task deadline: ${deadline}.` : "Task deadline: none.",
  ].join("\n");
};

const buildInsightPrompt = (report) => {
  const peak = report?.efficiencyDistribution?.reduce((best, entry) =>
    entry.focusRatio > best.focusRatio ? entry : best
  );
  const peakHour = Number.isFinite(peak?.hour) ? peak.hour : null;
  const peakLabel =
    peakHour === null
      ? "peak hours"
      : `${String(peakHour).padStart(2, "0")}–${String((peakHour + 1) % 24).padStart(
          2,
          "0"
        )}`;
  const insightFallback = computeInsightFallback(report);
  return [
    "Use the data below to write 1-2 English sentences of learning insight.",
    'Requirement: start with "Today\'s learning insight:", mention a specific time window, no lists.',
    `Data: focus ratio ${(report?.focusRatio || 0).toFixed(2)}, avg continuous focus ${(
      report?.averageContinuousFocusMinutes || 0
    ).toFixed(1)} minutes, distractions ${report?.distractionCount || 0}, task switching rate ${(
      report?.taskSwitchingRate || 0
    ).toFixed(2)}/hour, peak window ${peakLabel}.`,
    `Example: ${insightFallback}`,
  ].join("\n");
};

const handleAnalyze = async (req, res, ctx) => {
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
    if (dayParam && !DAY_PARAM_REGEX.test(dayParam)) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_day" });
    }
    const dayDate = dayParam ? new Date(`${dayParam}T00:00:00`) : new Date();
    if (Number.isNaN(dayDate.getTime())) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_day" });
    }
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
  if (pathname === "/api/analyze/insight" && method === "GET") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    const dayParam = parsedUrl.searchParams.get("day");
    if (dayParam && !DAY_PARAM_REGEX.test(dayParam)) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_day" });
    }
    const dayDate = dayParam ? new Date(`${dayParam}T00:00:00`) : new Date();
    if (Number.isNaN(dayDate.getTime())) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_day" });
    }
    const dayStart = startOfDay(dayDate).getTime();
    const dayEnd = startOfDay(dayStart + 86400000).getTime();
    const analyses = store.listAnalyses(user.id) || [];
    const report = buildDailyReport(analyses, dayStart, dayEnd);
    const prompt = buildInsightPrompt(report);
    const aiInsight = await createInsight(prompt);
    const insight = aiInsight.ok ? aiInsight.content : computeInsightFallback(report);
    return ctx.sendJson(res, 200, {
      ok: true,
      data: {
        day: new Date(dayStart).toISOString().slice(0, 10),
        insight,
        source: aiInsight.ok ? "minimax" : "heuristic",
      },
    });
  }
  if (pathname === "/api/analyze/schedule-suggestions" && method === "POST") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    const task = req.body?.task;
    const description = task?.description || task?.title || "";
    if (!isNonEmptyString(description)) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_task" });
    }
    const prompt = buildSuggestionPrompt({
      description,
      type: task?.type,
      deadline: task?.deadline,
    });
    const aiResponse = await createScheduleSuggestions(prompt);
    let suggestions = null;
    let source = null;
    if (aiResponse.ok && aiResponse.content) {
      try {
        const cleaned = String(aiResponse.content)
          .trim()
          .replace(/^```(?:json)?/i, "")
          .replace(/```$/i, "")
          .trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          suggestions = parsed
            .map((item) => ({
              title: typeof item?.title === "string" ? item.title.trim() : "",
              start: typeof item?.start === "string" ? item.start.trim() : "",
              durationMin: Number(item?.durationMin),
            }))
            .filter(
              (item) =>
                item.title &&
                item.start &&
                Number.isFinite(item.durationMin) &&
                item.durationMin > 0
            );
          if (suggestions.length > 0) {
            source = "minimax";
          }
        }
      } catch {
        suggestions = null;
      }
    }
    if (!suggestions || suggestions.length === 0) {
      const apiResponse = await createScheduleSuggestionsViaApi({
        description,
        type: task?.type,
        deadline: task?.deadline,
      });
      if (apiResponse.ok && Array.isArray(apiResponse.suggestions) && apiResponse.suggestions.length > 0) {
        suggestions = apiResponse.suggestions
          .map((item) => ({
            title: typeof item?.title === "string" ? item.title.trim() : "",
            start: typeof item?.start === "string" ? item.start.trim() : "",
            durationMin: Number(item?.durationMin),
          }))
          .filter(
            (item) =>
              item.title &&
              item.start &&
              Number.isFinite(item.durationMin) &&
              item.durationMin > 0
          );
        if (suggestions.length > 0) {
          source = apiResponse.source || "api";
        }
      }
    }
    const fallback = buildFallbackSlots({ type: task?.type, deadline: task?.deadline });
    const finalSuggestions = suggestions && suggestions.length > 0 ? suggestions : fallback;
    return ctx.sendJson(res, 200, {
      ok: true,
      data: {
        suggestions: finalSuggestions,
        source: suggestions && suggestions.length > 0 ? source || "minimax" : "fallback",
      },
    });
  }
  return false;
};

module.exports = { handleAnalyze };
