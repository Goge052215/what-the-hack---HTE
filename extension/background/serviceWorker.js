const defaultApiBaseUrl = "http://localhost:5174";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["apiBaseUrl"], (result) => {
    if (!result.apiBaseUrl) {
      chrome.storage.local.set({ apiBaseUrl: defaultApiBaseUrl });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "getApiBaseUrl") {
    chrome.storage.local.get(["apiBaseUrl"], (result) => {
      sendResponse({ ok: true, apiBaseUrl: result.apiBaseUrl || defaultApiBaseUrl });
    });
    return true;
  }
  if (message?.type === "setApiBaseUrl") {
    const apiBaseUrl = message.apiBaseUrl || defaultApiBaseUrl;
    chrome.storage.local.set({ apiBaseUrl }, () => {
      sendResponse({ ok: true, apiBaseUrl });
    });
    return true;
  }
  if (message?.type === "ping") {
    sendResponse({ ok: true, pong: true });
  }
  return false;
});
