const { getSessionId } = require("../security/sessionCookies");
const store = require("../storage");

const requireAuth = (req, res) => {
  /*
  const sessionId = getSessionId(req);
  const session = store.getSession(sessionId);
  if (!session) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "unauthorized" }));
    return null;
  }
  req.user = { id: session.userId, roles: session.roles };
  return req.user;
  */
  req.user = { id: "guest", roles: ["user"] };
  return req.user;
};

module.exports = { requireAuth };
