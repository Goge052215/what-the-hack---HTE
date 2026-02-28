const http = require("http");
const env = require("./config/env");
const { applyCors } = require("./middlewares/cors");
const { applyCspHeaders } = require("./security/cspHeaders");
const { rateLimit } = require("./security/rateLimit");
const { handleAuth } = require("./routes/auth");
const { handleTasks } = require("./routes/tasks");
const { handleHabits } = require("./routes/habits");
const { handleSchedule } = require("./routes/schedule");
const { handleAnalyze } = require("./routes/analyze");
const { requireAuth } = require("./middlewares/auth");
const { requireRole } = require("./middlewares/authorize");
const { getSessionId } = require("./security/sessionCookies");

const readBody = (req) =>
  new Promise((resolve) => {
    if (!["POST", "PUT", "PATCH"].includes(req.method || "")) {
      resolve(null);
      return;
    }
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("application/json")) {
      resolve(null);
      return;
    }
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(null);
      }
    });
  });

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
  return true;
};

const handler = async (req, res) => {
  applyCspHeaders(res);
  if (!applyCors(req, res)) return;
  if (!rateLimit(req, res)) return;
  req.body = await readBody(req);
  const ctx = {
    env,
    sendJson,
    requireAuth,
    requireRole,
    getSessionId,
  };

  if (req.url === "/health") {
    return sendJson(res, 200, { ok: true });
  }
  if (handleAuth(req, res, ctx)) return;
  if (handleTasks(req, res, ctx)) return;
  if (handleHabits(req, res, ctx)) return;
  if (handleSchedule(req, res, ctx)) return;
  if (handleAnalyze(req, res, ctx)) return;

  return sendJson(res, 404, { ok: false, error: "not_found" });
};

const server = http.createServer(handler);

server.listen(env.port, () => {
  process.stdout.write(`API listening on ${env.port}\n`);
});
