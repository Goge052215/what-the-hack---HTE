var FocusPet = window.FocusPet || {};

FocusPet.ScreenshotCapture = {
  capture() {
    return new Promise(function (resolve, reject) {
      chrome.runtime.sendMessage({ type: "SCREENSHOT_REQUEST" }, function (response) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && response.ok && response.dataUrl) {
          resolve(response.dataUrl);
        } else {
          reject(new Error((response && response.error) || "Screenshot capture failed"));
        }
      });
    });
  }
};

window.FocusPet = FocusPet;