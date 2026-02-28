var FocusPet = self.FocusPet || {};

FocusPet.AlarmNames = {
  FOCUS_CHECK: "FOCUS_CHECK_ALARM",
  BREAK_REMINDER: "BREAK_REMINDER_ALARM",
  DATA_CLEANUP: "DATA_CLEANUP_ALARM"
};

FocusPet.Alarms = {
  startFocusSession: function (durationMins) {
    durationMins = durationMins || 25;

    chrome.alarms.create(FocusPet.AlarmNames.FOCUS_CHECK, {
      delayInMinutes: 1,
      periodInMinutes: 2
    });

    chrome.alarms.create(FocusPet.AlarmNames.BREAK_REMINDER, {
      delayInMinutes: durationMins
    });
  },

  scheduleBreak: function (delayMins) {
    chrome.alarms.create(FocusPet.AlarmNames.BREAK_REMINDER, {
      delayInMinutes: delayMins || 5
    });
  },

  cancelAllAlarms: function () {
    chrome.alarms.clearAll();
  },

  cancelAlarm: function (name) {
    chrome.alarms.clear(name);
  },

  setupListeners: function () {
    var self = this;
    chrome.alarms.onAlarm.addListener(function (alarm) {
      if (alarm.name === FocusPet.AlarmNames.FOCUS_CHECK) {
        self.handleFocusCheck();
      }
      if (alarm.name === FocusPet.AlarmNames.BREAK_REMINDER) {
        self.handleBreakReminder();
      }
      if (alarm.name === FocusPet.AlarmNames.DATA_CLEANUP) {
        FocusPet.Storage.clearOldData(30);
      }
    });
  },

  handleFocusCheck: function () {
    var self = this;
    FocusPet.Storage.getCurrentSession().then(function (session) {
      if (!session || !session.active) return;

      FocusPet.Messaging.queryActiveTabData().then(function (pageData) {
        if (!pageData) return;

        FocusPet.Storage.saveTabActivity(pageData);

        self.getApiBaseUrl().then(function (apiBaseUrl) {
          fetch(apiBaseUrl + "/api/analyze/focus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pageData: pageData, task: session.taskName })
          })
            .then(function (response) {
              if (!response.ok) return null;
              return response.json();
            })
            .then(function (result) {
              if (!result) return;

              if (typeof result.score === "number") {
                FocusPet.Storage.updateFocusScore(result.score);
              }

              if (result.distracted) {
                FocusPet.Storage.getSettings().then(function (settings) {
                  if (settings.enableNotifications) {
                    chrome.notifications.create("focus_" + Date.now(), {
                      type: "basic",
                      iconUrl: "icons/icon48.png",
                      title: "FocusPet - Stay Focused!",
                      message: result.message || "You seem to be off-task. Time to refocus!"
                    });
                  }
                });
              }
            })
            .catch(function (err) {
              console.warn("[FocusPet] Focus check API call failed:", err.message);
            });
        });
      });
    });
  },

  handleBreakReminder: function () {
    var self = this;
    FocusPet.Storage.getCurrentSession().then(function (session) {
      FocusPet.Storage.getSettings().then(function (settings) {
        if (settings.enableNotifications) {
          chrome.notifications.create("break_" + Date.now(), {
            type: "basic",
            iconUrl: "icons/icon48.png",
            title: "FocusPet - Break Time!",
            message: session && session.taskName
              ? 'Great work on "' + session.taskName + '"! Take a short break.'
              : "Time for a break! Stand up, stretch, and rest your eyes.",
            priority: 2
          });
        }

        if (session) {
          session.active = false;
          session.endTime = Date.now();
          FocusPet.Storage.setCurrentSession(session);
        }

        self.cancelAlarm(FocusPet.AlarmNames.FOCUS_CHECK);
      });
    });
  },

  getApiBaseUrl: function () {
    return new Promise(function (resolve) {
      chrome.storage.local.get(["apiBaseUrl"], function (result) {
        resolve(result.apiBaseUrl || "http://localhost:5174");
      });
    });
  },

  scheduleDataCleanup: function () {
    chrome.alarms.create(FocusPet.AlarmNames.DATA_CLEANUP, {
      delayInMinutes: 60,
      periodInMinutes: 1440
    });
  },

  init: function () {
    this.setupListeners();
    this.scheduleDataCleanup();
  }
};

self.FocusPet = FocusPet;