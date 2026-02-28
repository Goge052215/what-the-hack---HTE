const store = require("../storage");
const { isNonEmptyString } = require("../../shared/utils/validation");

const handleTasks = (req, res, ctx) => {
  const { method, url } = req;
  if (url === "/api/tasks" && method === "GET") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    return ctx.sendJson(res, 200, { ok: true, data: store.listTasks(user.id) });
  }
  if (url === "/api/tasks" && method === "POST") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    const title = req.body?.title;
    if (!isNonEmptyString(title)) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_title" });
    }
    const task = store.addTask(user.id, title.trim());
    return ctx.sendJson(res, 201, { ok: true, data: task });
  }
  return false;
};

module.exports = { handleTasks };
