var FocusPet = self.FocusPet || {};

FocusPet.Storage = {
  KEYS: {
    TAB_HISTORY: "tabHistory",
    CURRENT_SESSION: "currentSession",
    FOCUS_SCORE: "focusScore",
    SETTINGS: "focusPetSettings"
  },

  saveTabActivity: function (data) {
    return new Promise(function (resolve) {
      chrome.storage.local.get(["tabHistory"], function (result) {
        var history = result.tabHistory || [];
        history.push(
          Object.assign({}, data, {
            id: "tab_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
          })
        );
        if (history.length > 1000) {
          history.splice(0, history.length - 1000);
        }
        chrome.storage.local.set({ tabHistory: history }, function () {
          resolve(data);
        });
      });
    });
  },

  getTabHistory: function (timeRange) {
    timeRange = timeRange || {};
    return new Promise(function (resolve) {
      chrome.storage.local.get(["tabHistory"], function (result) {
        var history = result.tabHistory || [];
        if (timeRange.from) {
          history = history.filter(function (e) { return e.timestamp >= timeRange.from; });
        }
        if (timeRange.to) {
          history = history.filter(function (e) { return e.timestamp <= timeRange.to; });
        }
        resolve(history);
      });
    });
  },

  getCurrentSession: function () {
    return new Promise(function (resolve) {
      chrome.storage.local.get(["currentSession"], function (result) {
        resolve(result.currentSession || null);
      });
    });
  },

  setCurrentSession: function (session) {
    return new Promise(function (resolve) {
      chrome.storage.local.set({ currentSession: session }, function () {
        resolve(session);
      });
    });
  },

  updateFocusScore: function (score) {
    return new Promise(function (resolve) {
      chrome.storage.local.get(["focusScore"], function (result) {
        var scores = result.focusScore || [];
        scores.push({ score: score, timestamp: Date.now() });
        if (scores.length > 500) {
          scores.splice(0, scores.length - 500);
        }
        chrome.storage.local.set({ focusScore: scores }, function () {
          resolve(scores);
        });
      });
    });
  },

  getFocusScores: function (timeRange) {
    timeRange = timeRange || {};
    return new Promise(function (resolve) {
      chrome.storage.local.get(["focusScore"], function (result) {
        var scores = result.focusScore || [];
        if (timeRange.from) {
          scores = scores.filter(function (s) { return s.timestamp >= timeRange.from; });
        }
        if (timeRange.to) {
          scores = scores.filter(function (s) { return s.timestamp <= timeRange.to; });
        }
        resolve(scores);
      });
    });
  },

  clearOldData: function (daysToKeep) {
    daysToKeep = daysToKeep || 30;
    var cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    return new Promise(function (resolve) {
      chrome.storage.local.get(["tabHistory", "focusScore"], function (result) {
        var history = (result.tabHistory || []).filter(function (e) { return e.timestamp >= cutoff; });
        var scores = (result.focusScore || []).filter(function (s) { return s.timestamp >= cutoff; });
        chrome.storage.local.set({ tabHistory: history, focusScore: scores }, function () {
          resolve({ historyCount: history.length, scoresCount: scores.length });
        });
      });
    });
  },

  getSettings: function () {
    return new Promise(function (resolve) {
      chrome.storage.local.get(["focusPetSettings"], function (result) {
        resolve(
          result.focusPetSettings || {
            focusCheckIntervalMins: 2,
            breakReminderMins: 25,
            textExtractLength: 500,
            enableScreenshots: false,
            enableNotifications: true
          }
        );
      });
    });
  },

  saveSettings: function (settings) {
    var self = this;
    return self.getSettings().then(function (current) {
      var merged = Object.assign({}, current, settings);
      return new Promise(function (resolve) {
        chrome.storage.local.set({ focusPetSettings: merged }, function () {
          resolve(merged);
        });
      });
    });
  }
};

self.FocusPet = FocusPet;