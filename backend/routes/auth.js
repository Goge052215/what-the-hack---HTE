const store = require("../storage");
const { setSessionCookie, clearSessionCookie } = require("../security/sessionCookies");
const { isNonEmptyString } = require("../../shared/utils/validation");

const handleAuth = (req, res, ctx) => {
  /*
  const { method, url } = req;
  if (url === "/api/auth/login" && method === "POST") {
    const userId = req.body?.userId;
    if (!isNonEmptyString(userId)) {
      return ctx.sendJson(res, 400, { ok: false, error: "invalid_user" });
    }
    const session = store.createSession(userId, ["user"]);
    setSessionCookie(res, session.sessionId, { secure: ctx.env.cookieSecure });
    return ctx.sendJson(res, 200, { ok: true, data: { userId } });
  }
  if (url === "/api/auth/logout" && method === "POST") {
    const sessionId = ctx.getSessionId(req);
    if (sessionId) store.deleteSession(sessionId);
    clearSessionCookie(res);
    return ctx.sendJson(res, 200, { ok: true });
  }
  if (url === "/api/auth/me" && method === "GET") {
    const user = ctx.requireAuth(req, res);
    if (!user) return true;
    return ctx.sendJson(res, 200, { ok: true, data: { userId: user.id, roles: user.roles } });
  }
  */
  return false;
};

module.exports = { handleAuth };
