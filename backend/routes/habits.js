const habitModel = require("../services/habitModel");
const { isNonEmptyString, isObject } = require("../../shared/utils/validation");

const handleHabits = (req, res, ctx) => {
  const { method, url } = req;
  if (url === "/api/habits" && method === "GET") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    return ctx.sendJson(res, 200, { ok: true, data: habitModel.listHabits(user.id) });
  }
  if (url === "/api/habits" && method === "POST") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    const name = req.body?.name;
    if (!isNonEmptyString(name)) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_name" });
    }
    const habit = habitModel.addHabit(user.id, name.trim());
    return ctx.sendJson(res, 201, { ok: true, data: habit });
  }
  if (url === "/api/habits/sessions" && method === "POST") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    const habitId = req.body?.habitId;
    const session = req.body?.session;
    if (!isNonEmptyString(habitId) || !isObject(session)) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_session" });
    }
    const created = habitModel.recordSession(user.id, habitId, session);
    if (!created) {
      return ctx.sendJson(res, 404, { ok: false, error: "habit_not_found" });
    }
    return ctx.sendJson(res, 201, { ok: true, data: created });
  }
  return false;
};

module.exports = { handleHabits };
