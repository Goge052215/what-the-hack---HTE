const env = require("../config/env");
const { SESSION_COOKIE_NAME } = require("../config/constants");

const parseCookies = (req) => {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join("=") || "");
    return acc;
  }, {});
};

const getSessionId = (req) => {
  const cookies = parseCookies(req);
  return cookies[SESSION_COOKIE_NAME] || null;
};

const appendSetCookie = (res, value) => {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", value);
    return;
  }
  const next = Array.isArray(existing) ? existing.concat(value) : [existing, value];
  res.setHeader("Set-Cookie", next);
};

const setSessionCookie = (res, sessionId, options = {}) => {
  const secure = options.secure ?? env.cookieSecure;
  const maxAge = options.maxAge ?? Math.floor((env.sessionTtlMs || 0) / 1000);
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=None",
  ];
  if (secure) parts.push("Secure");
  if (maxAge > 0) parts.push(`Max-Age=${maxAge}`);
  appendSetCookie(res, parts.join("; "));
};

const clearSessionCookie = (res) => {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=None",
    "Max-Age=0",
  ];
  if (env.cookieSecure) parts.push("Secure");
  appendSetCookie(res, parts.join("; "));
};

module.exports = { parseCookies, getSessionId, setSessionCookie, clearSessionCookie };
