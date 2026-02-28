const env = require("../config/env");

const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  if (env.allowedOrigins.length > 0) {
    return env.allowedOrigins.includes(origin);
  }
  return (
    origin.startsWith("chrome-extension://") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1")
  );
};

const applyCors = (req, res) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return false;
  }
  return true;
};

module.exports = { applyCors };
