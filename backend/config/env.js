const env = {
  port: Number(process.env.PORT || 5174),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  cookieSecure: process.env.COOKIE_SECURE !== "false",
  sessionTtlMs: Number(process.env.SESSION_TTL_MS || 1000 * 60 * 60 * 24),
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.minimax.io/anthropic",
  anthropicModel: process.env.ANTHROPIC_MODEL || process.env.MINIMAX_MODEL || "MiniMax-M2.5",
};

module.exports = env;
