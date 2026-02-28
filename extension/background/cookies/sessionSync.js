const { getCookie } = require("./cookieStore");

const syncSessionCookie = async ({ apiBaseUrl, cookieName }) => {
  if (!apiBaseUrl || !cookieName) return null;
  const cookie = await getCookie({ url: apiBaseUrl, name: cookieName });
  return cookie ? cookie.value : null;
};

module.exports = { syncSessionCookie };
