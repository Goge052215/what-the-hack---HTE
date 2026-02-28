const store = require("../storage");
const { isNonEmptyString } = require("../../shared/utils/validation");

const scoreContext = (context) => {
  const lower = context.toLowerCase();
  const focusWords = ["task", "study", "build", "learn"];
  const distractions = ["youtube", "netflix", "gaming", "social"];
  const focusScore = focusWords.some((word) => lower.includes(word)) ? 0.7 : 0.4;
  const distractionPenalty = distractions.some((word) => lower.includes(word)) ? 0.3 : 0;
  return Math.max(0, Math.min(1, focusScore - distractionPenalty));
};

const handleAnalyze = (req, res, ctx) => {
  const { method, url } = req;
  if (url === "/api/analyze" && method === "POST") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    const context = req.body?.context;
    if (!isNonEmptyString(context)) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_context" });
    }
    const result = { score: scoreContext(context), context };
    store.addAnalysis(user.id, result);
    return ctx.sendJson(res, 200, { ok: true, data: result });
  }
  return false;
};

module.exports = { handleAnalyze };
