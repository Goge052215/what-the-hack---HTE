const hostedApiBaseUrl = "https://api.focus-tutor.app";
const localApiBaseUrl = "http://localhost:5174";

export const getApiBaseUrl = () =>
  new Promise((resolve) => {
    chrome.storage.local.get(["apiBaseUrl"], (result) => {
      resolve(result.apiBaseUrl || hostedApiBaseUrl);
    });
  });

export const setApiBaseUrl = (apiBaseUrl) =>
  new Promise((resolve) => {
    chrome.storage.local.set({ apiBaseUrl }, () => resolve(apiBaseUrl));
  });

const fetchPayload = async (baseUrl, path, options = {}) => {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: "include",
    });
  } catch {
    return { ok: false, status: 0, error: "network_error" };
  }
  const payload = await response.json().catch(() => null);
  if (!payload) {
    return { ok: false, status: response.status, error: "invalid_response" };
  }
  return { ok: response.ok && payload.ok !== false, status: response.status, ...payload };
};

export const apiRequest = async (path, options = {}) => {
  const baseUrl = await getApiBaseUrl();
  const primary = await fetchPayload(baseUrl, path, options);
  if (!primary.ok && primary.error === "network_error" && baseUrl !== localApiBaseUrl) {
    return fetchPayload(localApiBaseUrl, path, options);
  }
  return primary;
};
