const defaultApiBaseUrl = "http://localhost:5174";

let focusStartTime = null;
let lastTabId = null;
let tabSwitchCount = 0;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["apiBaseUrl"], (result) => {
    if (!result.apiBaseUrl) {
      chrome.storage.local.set({ apiBaseUrl: defaultApiBaseUrl });
    }
  });
  
  // Set up alarms for periodic checks
  chrome.alarms.create("checkBreakReminder", { periodInMinutes: 1 });
  chrome.alarms.create("checkDeadlines", { periodInMinutes: 5 });
});

// Track tab switches for distraction detection
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const settings = await getNotificationSettings();
  
  if (!settings.enabled || !settings.distractionAlerts) return;
  
  if (lastTabId && lastTabId !== activeInfo.tabId) {
    tabSwitchCount++;
    
    // If user switches tabs 3+ times in 2 minutes, show distraction alert
    if (tabSwitchCount >= 3) {
      showNotification(
        "distraction",
        "🤔 Noticed you're switching tabs",
        "It seems you might be distracted. Consider returning to your task."
      );
      tabSwitchCount = 0;
    }
  }
  
  lastTabId = activeInfo.tabId;
  
  // Reset counter after 2 minutes
  setTimeout(() => {
    tabSwitchCount = 0;
  }, 120000);
});

// Handle alarms for break reminders and deadline checks
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const settings = await getNotificationSettings();
  
  if (!settings.enabled) return;
  
  if (alarm.name === "checkBreakReminder") {
    await checkBreakReminder(settings);
  } else if (alarm.name === "checkDeadlines") {
    await checkDeadlines(settings);
  }
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
  if (message?.type === "startFocusSession") {
    focusStartTime = Date.now();
    sendResponse({ ok: true });
  }
  if (message?.type === "endFocusSession") {
    focusStartTime = null;
    sendResponse({ ok: true });
  }
  return false;
});

// Helper functions
async function getNotificationSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["notificationSettings"], (result) => {
      resolve(result.notificationSettings || {
        enabled: true,
        distractionAlerts: true,
        breakReminders: true,
        deadlineReminders: true,
        taskNudges: true,
        focusDuration: 45
      });
    });
  });
}

async function getTasks() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["tasks"], (result) => {
      resolve(result.tasks || []);
    });
  });
}

function showNotification(id, title, message, buttons = []) {
  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: "../assets/icon128.png",
    title: title,
    message: message,
    buttons: buttons,
    priority: 2
  });
}

async function checkBreakReminder(settings) {
  if (!settings.breakReminders || !focusStartTime) return;
  
  const focusDurationMs = settings.focusDuration * 60 * 1000;
  const elapsed = Date.now() - focusStartTime;
  
  // Show break reminder when focus duration is reached
  if (elapsed >= focusDurationMs && elapsed < focusDurationMs + 60000) {
    showNotification(
      "break-reminder",
      "⏰ Time for a break!",
      `You've been focused for ${settings.focusDuration} minutes. Take a 5-minute break to recharge.`,
      [
        { title: "Take Break" },
        { title: "Keep Working" }
      ]
    );
  }
}

async function checkDeadlines(settings) {
  if (!settings.deadlineReminders) return;
  
  const tasks = await getTasks();
  const now = new Date();
  
  tasks.forEach((task) => {
    if (!task.deadline || task.completed) return;
    
    const deadline = new Date(task.deadline);
    const timeUntilDeadline = deadline - now;
    const hoursUntil = timeUntilDeadline / (1000 * 60 * 60);
    
    // Notify at 24 hours, 1 hour, and 15 minutes before deadline
    if (hoursUntil <= 24 && hoursUntil > 23.9) {
      showNotification(
        `deadline-24h-${task.id}`,
        "⚠️ Deadline Approaching",
        `${task.description} is due in 24 hours!`
      );
    } else if (hoursUntil <= 1 && hoursUntil > 0.95) {
      showNotification(
        `deadline-1h-${task.id}`,
        "⚠️ Deadline Soon!",
        `${task.description} is due in 1 hour!`
      );
    } else if (hoursUntil <= 0.25 && hoursUntil > 0.2) {
      showNotification(
        `deadline-15m-${task.id}`,
        "🚨 Deadline Imminent!",
        `${task.description} is due in 15 minutes!`
      );
    }
  });
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === "break-reminder") {
    if (buttonIndex === 0) {
      // Take Break
      focusStartTime = null;
      chrome.notifications.clear(notificationId);
    } else if (buttonIndex === 1) {
      // Keep Working - reset timer
      focusStartTime = Date.now();
      chrome.notifications.clear(notificationId);
    }
  }
});
