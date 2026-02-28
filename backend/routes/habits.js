const store = require("../storage");
const { isNonEmptyString } = require("../../shared/utils/validation");

const handleHabits = (req, res, ctx) => {
  const { method, url } = req;
  if (url === "/api/habits" && method === "GET") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    return ctx.sendJson(res, 200, { ok: true, data: store.listHabits(user.id) });
  }
  if (url === "/api/habits" && method === "POST") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    const name = req.body?.name;
    if (!isNonEmptyString(name)) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_name" });
    }
    const habit = store.addHabit(user.id, name.trim());
    return ctx.sendJson(res, 201, { ok: true, data: habit });
  }
  return false;
};

module.exports = { handleHabits };
