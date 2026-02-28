var FocusPet = self.FocusPet || {};

FocusPet.MessageTypes = {
  TAB_DATA: "TAB_DATA",
  FOCUS_CHECK: "FOCUS_CHECK",
  CAPTURE_SCREENSHOT: "CAPTURE_SCREENSHOT",
  SCREENSHOT_REQUEST: "SCREENSHOT_REQUEST",
  ALARM_TRIGGER: "ALARM_TRIGGER",
  START_SESSION: "START_SESSION",
  END_SESSION: "END_SESSION",
  GET_STATUS: "GET_STATUS",
  FOCUS_RESULT: "FOCUS_RESULT",
  WORK_RELAX_STATUS: "WORK_RELAX_STATUS"
};

FocusPet.Messaging = {
  _handlers: {},

  registerHandler: function (type, handler) {
    this._handlers[type] = handler;
  },

  setupListeners: function () {
    var self = this;
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      var type = message && message.type;

      if (["getApiBaseUrl", "setApiBaseUrl", "ping"].indexOf(type) !== -1) {
        return false;
      }

      var handler = self._handlers[type];
      if (!handler) return false;

      var result;
      try {
        result = handler(message, sender);
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
        return false;
      }

      if (result && typeof result.then === "function") {
        result
          .then(function (res) { sendResponse(Object.assign({ ok: true }, res)); })
          .catch(function (err) { sendResponse({ ok: false, error: err.message }); });
        return true;
      }

      sendResponse(Object.assign({ ok: true }, result || {}));
      return false;
    });
  },

  registerDefaultHandlers: function () {
    this.registerHandler(FocusPet.MessageTypes.TAB_DATA, function (message) {
      return FocusPet.Storage.saveTabActivity(message.payload).then(function () {
        return { saved: true };
      });
    });

    this.registerHandler(FocusPet.MessageTypes.SCREENSHOT_REQUEST, function (message, sender) {
      var tab = sender.tab;
      if (!tab) return Promise.resolve({ ok: false, error: "No tab context" });

      return new Promise(function (resolve) {
        chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 60 }, function (dataUrl) {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message });
          } else {
            resolve({ ok: true, dataUrl: dataUrl });
          }
        });
      });
    });

    this.registerHandler(FocusPet.MessageTypes.GET_STATUS, function () {
      return Promise.all([
        FocusPet.Storage.getCurrentSession(),
        FocusPet.Storage.getSettings()
      ]).then(function (results) {
        return { session: results[0], settings: results[1] };
      });
    });

    this.registerHandler(FocusPet.MessageTypes.START_SESSION, function (message) {
      var payload = message.payload || {};
      var session = {
        taskName: payload.taskName || "Unnamed Task",
        startTime: Date.now(),
        durationMins: payload.durationMins || 25,
        active: true
      };
      return FocusPet.Storage.setCurrentSession(session).then(function () {
        FocusPet.Alarms.startFocusSession(session.durationMins);
        FocusPet.Messaging.sendWorkRelaxStatus("work");
        return { session: session };
      });
    });

    this.registerHandler(FocusPet.MessageTypes.END_SESSION, function () {
      return FocusPet.Storage.getCurrentSession().then(function (session) {
        if (session) {
          session.active = false;
          session.endTime = Date.now();
          return FocusPet.Storage.setCurrentSession(session).then(function () {
            return FocusPet.Storage.getSettings().then(function (settings) {
              if (settings.enableNotifications) {
                chrome.notifications.create("session_end_" + Date.now(), {
                  type: "basic",
                  iconUrl: "icons/icon48.png",
                  title: "FocusPet - Session Ended",
                  message: session.taskName
                    ? 'Session ended for "' + session.taskName + '".'
                    : "Focus session ended.",
                  priority: 1
                });
              }
              FocusPet.Alarms.cancelAllAlarms();
              FocusPet.Messaging.sendWorkRelaxStatus("relax");
              return { session: session };
            });
          });
        }
        FocusPet.Alarms.cancelAllAlarms();
        FocusPet.Messaging.sendWorkRelaxStatus("relax");
        return { session: null };
      });
    });

    this.registerHandler(FocusPet.MessageTypes.FOCUS_RESULT, function (message) {
      var payload = message.payload || {};
      var tasks = [];

      if (typeof payload.score === "number") {
        tasks.push(FocusPet.Storage.updateFocusScore(payload.score));
      }

      return Promise.all(tasks).then(function () {
        if (payload.distracted) {
          return FocusPet.Storage.getSettings().then(function (settings) {
            if (settings.enableNotifications) {
              chrome.notifications.create("focus_" + Date.now(), {
                type: "basic",
                iconUrl: "icons/icon48.png",
                title: "FocusPet - Stay on Track!",
                message: "It looks like you might be distracted. Want to get back to your task?"
              });
            }
            return { recorded: true };
          });
        }
        return { recorded: true };
      });
    });
  },

  queryActiveTabData: function () {
    return new Promise(function (resolve) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var tab = tabs && tabs[0];
        if (!tab || !tab.id) {
          resolve(null);
          return;
        }
        chrome.tabs.sendMessage(tab.id, { type: "FOCUS_CHECK" }, function (response) {
          if (chrome.runtime.lastError || !response || !response.ok) {
            resolve(null);
            return;
          }
          resolve(response.payload);
        });
      });
    });
  },
  sendWorkRelaxStatus: function (state) {
    if (state !== "work" && state !== "relax") return;
    var payload = { state: state, timestamp: Date.now() };
    chrome.runtime.sendMessage({ type: FocusPet.MessageTypes.WORK_RELAX_STATUS, payload: payload });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs && tabs[0];
      if (!tab || !tab.id) return;
      chrome.tabs.sendMessage(tab.id, { type: FocusPet.MessageTypes.WORK_RELAX_STATUS, payload: payload });
    });
  },

  init: function () {
    this.registerDefaultHandlers();
    this.setupListeners();
  }
};

self.FocusPet = FocusPet;
