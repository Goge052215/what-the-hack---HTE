const buckets = new Map();

const now = () => Date.now();

const rateLimit = (req, res, options = {}) => {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 120;
  const key = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const entry = buckets.get(key) || { count: 0, resetAt: now() + windowMs };
  if (entry.resetAt <= now()) {
    entry.count = 0;
    entry.resetAt = now() + windowMs;
  }
  entry.count += 1;
  buckets.set(key, entry);
  res.setHeader("X-RateLimit-Limit", String(max));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
  res.setHeader("X-RateLimit-Reset", String(entry.resetAt));
  if (entry.count > max) {
    res.statusCode = 429;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "rate_limited" }));
    return false;
  }
  return true;
};

module.exports = { rateLimit };
