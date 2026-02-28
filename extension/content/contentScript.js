var FocusPet = window.FocusPet || {};

(function () {
  var PAGE_EXTRACT_DEBOUNCE_MS = 1000;
  var debounceTimer = null;
  var lastSentUrl = null;

  function sendPageData() {
    if (!FocusPet.PageExtractor) return;

    var data = FocusPet.PageExtractor.extract();

    if (data.url === lastSentUrl) return;
    lastSentUrl = data.url;

    chrome.runtime.sendMessage(
      { type: "TAB_DATA", payload: data },
      function () {
        if (chrome.runtime.lastError) {
          console.warn("[FocusPet] Failed to send tab data:", chrome.runtime.lastError.message);
        }
      }
    );
  }

  function debouncedSend() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(sendPageData, PAGE_EXTRACT_DEBOUNCE_MS);
  }

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || !message.type) return false;

    if (message.type === "FOCUS_CHECK") {
      var data = FocusPet.PageExtractor ? FocusPet.PageExtractor.extract() : null;
      sendResponse({ ok: true, payload: data });
      return false;
    }

    if (message.type === "CAPTURE_SCREENSHOT") {
      if (!FocusPet.ScreenshotCapture) {
        sendResponse({ ok: false, error: "ScreenshotCapture not available" });
        return false;
      }
      FocusPet.ScreenshotCapture.capture()
        .then(function (dataUrl) {
          sendResponse({ ok: true, dataUrl: dataUrl });
        })
        .catch(function (err) {
          sendResponse({ ok: false, error: err.message });
        });
      return true;
    }

    return false;
  });

  if (document.readyState === "complete" || document.readyState === "interactive") {
    debouncedSend();
  } else {
    document.addEventListener("DOMContentLoaded", debouncedSend);
  }

  var observer = new MutationObserver(function () {
    if (window.location.href !== lastSentUrl) {
      debouncedSend();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.addEventListener("popstate", debouncedSend);
})();