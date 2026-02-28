const getCookie = ({ url, name }) =>
  new Promise((resolve) => {
    chrome.cookies.get({ url, name }, (cookie) => {
      resolve(cookie || null);
    });
  });

const setCookie = ({ url, name, value, secure = true, sameSite = "no_restriction" }) =>
  new Promise((resolve) => {
    chrome.cookies.set(
      {
        url,
        name,
        value,
        secure,
        sameSite,
      },
      (cookie) => {
        resolve(cookie || null);
      }
    );
  });

module.exports = { getCookie, setCookie };
