const env = {
  port: Number(process.env.PORT || 5174),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  cookieSecure: process.env.COOKIE_SECURE !== "false",
  sessionTtlMs: Number(process.env.SESSION_TTL_MS || 1000 * 60 * 60 * 24),
  minimaxKey: process.env.MINIMAX_API_KEY || process.env.MINIMAX_KEY || "",
  minimaxBaseUrl: process.env.MINIMAX_BASE_URL || "https://api.minimax.io",
  minimaxModel: process.env.MINIMAX_MODEL || "MiniMax-M2.5",
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.minimax.io/anthropic",
  anthropicModel: process.env.ANTHROPIC_MODEL || process.env.MINIMAX_MODEL || "MiniMax-M2.5",
  usePythonAnthropic: process.env.USE_PYTHON_ANTHROPIC !== "false",
  pythonPath: process.env.PYTHON_PATH || "python3",
};

module.exports = env;
