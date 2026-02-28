const store = require("../storage");
const scheduleEngine = require("../services/scheduleEngine");
const { isArray } = require("../../shared/utils/validation");

const handleSchedule = (req, res, ctx) => {
  const { method, url } = req;
  if (url === "/api/schedule" && method === "GET") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    return ctx.sendJson(res, 200, { ok: true, data: store.listSchedules(user.id) });
  }
  if (url === "/api/schedule" && method === "POST") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    if (req.body?.auto === true) {
      const tasks = req.body?.tasks;
      if (!isArray(tasks)) {
        return ctx.sendJson(res, 400, { ok: false, error: "invalid_tasks" });
      }
      const schedule = scheduleEngine.generateSchedule({
        tasks,
        focusHistory: isArray(req.body?.history) ? req.body.history : [],
        cycle: req.body?.cycle,
        startTime: req.body?.startTime,
      });
      const saved = store.addSchedule(user.id, schedule.blocks);
      return ctx.sendJson(res, 201, {
        ok: true,
        data: { id: saved.id, ...schedule },
      });
    }
    const items = req.body?.items;
    if (!isArray(items)) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_items" });
    }
    const schedule = store.addSchedule(user.id, items);
    return ctx.sendJson(res, 201, { ok: true, data: schedule });
  }
  return false;
};

module.exports = { handleSchedule };
