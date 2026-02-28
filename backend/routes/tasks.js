const store = require("../storage");
const { isNonEmptyString } = require("../../shared/utils/validation");
const { createInsight } = require("../services/llmClient");

const buildTaskSplitPrompt = (title) =>
  [
    "Create 3-5 short subtasks for the task below.",
    "Return a JSON array of strings with no extra text.",
    `Task: ${title}`,
  ].join("\n");

const parseSubtasks = (content) => {
  if (!content) return [];
  const trimmed = String(content).trim();
  let parsed = [];
  try {
    const json = JSON.parse(trimmed);
    if (Array.isArray(json)) parsed = json;
  } catch {
    parsed = [];
  }
  if (parsed.length === 0) {
    parsed = trimmed
      .split(/\n+/)
      .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
      .filter(Boolean);
  }
  return parsed.filter(isNonEmptyString).map((item) => item.trim()).slice(0, 6);
};

const handleTasks = async (req, res, ctx) => {
  const { method, url } = req;
  if (url === "/api/tasks" && method === "GET") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    return ctx.sendJson(res, 200, { ok: true, data: store.listTasks(user.id) });
  }
  if (url === "/api/tasks" && method === "POST") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    const title = req.body?.title || req.body?.description;
    if (!isNonEmptyString(title)) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_title" });
    }
    const cleaned = title.trim();
    const task = store.addTask(user.id, cleaned);
    let subtasks = [];
    try {
      const insight = await createInsight(buildTaskSplitPrompt(cleaned));
      if (insight.ok && insight.content) {
        subtasks = parseSubtasks(insight.content);
      }
    } catch {
      subtasks = [];
    }
    return ctx.sendJson(res, 201, { ok: true, data: { ...task, description: cleaned, subtasks } });
  }
  return false;
};

module.exports = { handleTasks };
