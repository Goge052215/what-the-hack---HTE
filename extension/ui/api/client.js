const defaultApiBaseUrl = "http://localhost:5174";

export const getApiBaseUrl = () =>
  new Promise((resolve) => {
    chrome.storage.local.get(["apiBaseUrl"], (result) => {
      resolve(result.apiBaseUrl || defaultApiBaseUrl);
    });
  });

export const setApiBaseUrl = (apiBaseUrl) =>
  new Promise((resolve) => {
    chrome.storage.local.set({ apiBaseUrl }, () => resolve(apiBaseUrl));
  });

export const apiRequest = async (path, options = {}) => {
  const baseUrl = await getApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });
  const payload = await response.json().catch(() => null);
  if (!payload) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }
  return { ok: response.ok && payload.ok !== false, status: response.status, ...payload };
};
