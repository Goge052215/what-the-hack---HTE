importScripts("storage.js", "messaging.js", "alarms.js");

const hostedApiBaseUrl = "https://api.focus-tutor.app";
const localApiBaseUrl = "http://localhost:5174";
const notificationIcon = chrome.runtime.getURL("icons/icon48.png");

const getStored = (keys) =>
  new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => resolve(result || {}));
  });

const setStored = (values) =>
  new Promise((resolve) => {
    chrome.storage.local.set(values, () => resolve(values));
  });

const getApiBaseUrl = async () => {
  const result = await getStored(["apiBaseUrl"]);
  return result.apiBaseUrl || hostedApiBaseUrl;
};

const getLastFocusScore = async () => {
  const result = await getStored(["lastFocusScore"]);
  return typeof result.lastFocusScore === "number" ? result.lastFocusScore : null;
};

const fetchJson = async (url, options = {}) => {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    return { ok: false, data: null, error: "network_error" };
  }
  const data = await response.json().catch(() => null);
  return { ok: response.ok, data };
};

const fetchApiJson = async (path, options = {}) => {
  const baseUrl = await getApiBaseUrl();
  const primary = await fetchJson(`${baseUrl}${path}`, options);
  if (!primary.ok && primary.error === "network_error" && baseUrl !== localApiBaseUrl) {
    return fetchJson(`${localApiBaseUrl}${path}`, options);
  }
  return primary;
};

const notify = (title, message) => {
  chrome.notifications.create({
    type: "basic",
    iconUrl: notificationIcon,
    title,
    message,
    requireInteraction: true,
  });
};

const getActiveSchedule = async () => {
  const stored = await getStored(["activeSchedule"]);
  return stored.activeSchedule || null;
};

const getCurrentPhaseMessage = (blocks, now = Date.now()) => {
  const currentTime = new Date(now);
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const blockStart = new Date(`${new Date().toDateString()} ${block.start}`);
    const blockEnd = new Date(blockStart.getTime() + block.duration * 60000);
    if (currentTime >= blockStart && currentTime < blockEnd) {
      if (block.type === "focus") {
        return {
          type: "study",
          title: "Time to study",
          message: `Focus block started: ${block.task || "Task"} — ${block.duration} min`,
        };
      }
      return {
        type: "rest",
        title: "Time to rest",
        message: `Break time — ${block.duration} min`,
      };
    }
  }
  return { type: "idle-check", title: "Check focus", message: "Still on task?" };
};

const schedulePhaseNotifications = async (schedule) => {
  if (!schedule?.blocks?.length) return;
  await setStored({ activeSchedule: schedule });
  const alarms = await chrome.alarms.getAll();
  alarms
    .filter((alarm) => alarm.name.startsWith("phase-"))
    .forEach((alarm) => chrome.alarms.clear(alarm.name));
  const now = Date.now();
  schedule.blocks.forEach((block, index) => {
    const blockStart = new Date(`${new Date().toDateString()} ${block.start}`).getTime();
    const delayMinutes = Math.max(0.5, (blockStart - now) / 60000);
    chrome.alarms.create(`phase-${index}`, { delayInMinutes: delayMinutes });
  });
};

const resolveHabitId = async () => {
  const cached = await getStored(["activeHabitId"]);
  if (cached.activeHabitId) return cached.activeHabitId;
  const list = await fetchApiJson("/api/habits", { method: "GET" });
  if (list.ok && Array.isArray(list.data?.data) && list.data.data.length > 0) {
    const habitId = list.data.data[0].id;
    await setStored({ activeHabitId: habitId });
    return habitId;
  }
  const created = await fetchApiJson("/api/habits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Focus Sessions" }),
  });
  const habitId = created.data?.data?.id;
  if (habitId) await setStored({ activeHabitId: habitId });
  return habitId || null;
};

const recordSession = async ({ durationMin, breakTaken }) => {
  const habitId = await resolveHabitId();
  if (!habitId) return;
  const focusScore = await getLastFocusScore();
  const session = {
    timestamp: Date.now(),
    durationMin,
    focusScore,
    breakTaken,
  };
  await fetchApiJson("/api/habits/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ habitId, session }),
  });
};

const clearTimerAlarms = async () => {
  const alarms = await chrome.alarms.getAll();
  alarms
    .filter((alarm) => alarm.name.startsWith("timer-complete-"))
    .forEach((alarm) => chrome.alarms.clear(alarm.name));
};

let focusStartTime = null;
let lastTabId = null;
let tabSwitchCount = 0;
let breakStartTime = null;
let breakDuration = 5 * 60 * 1000; // 5 minutes in milliseconds

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["apiBaseUrl"], (result) => {
    if (!result.apiBaseUrl) {
      chrome.storage.local.set({ apiBaseUrl: hostedApiBaseUrl });
    }
  });

  chrome.alarms.create("checkBreakReminder", { periodInMinutes: 1 });
  chrome.alarms.create("checkDeadlines", { periodInMinutes: 5 });
});

// Track tab switches for distraction detection
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const settings = await getNotificationSettings();

  if (settings.enabled && settings.distractionAlerts) {
    if (lastTabId && lastTabId !== activeInfo.tabId) {
      tabSwitchCount += 1;

      if (tabSwitchCount >= 3) {
        showNotification(
          "distraction",
          "👋 Hey! Get back to your task",
          "You've been switching tabs a lot. Time to refocus on what matters!"
        );
        tabSwitchCount = 0;
      }
    }

    lastTabId = activeInfo.tabId;
    setTimeout(() => {
      tabSwitchCount = 0;
    }, 120000);
  }

  recordSession({ durationMin: 25, breakTaken: false });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "getApiBaseUrl") {
    chrome.storage.local.get(["apiBaseUrl"], (result) => {
      sendResponse({ ok: true, apiBaseUrl: result.apiBaseUrl || hostedApiBaseUrl });
    });
    return true;
  }
  if (message?.type === "setApiBaseUrl") {
    const apiBaseUrl = message.apiBaseUrl || hostedApiBaseUrl;
    chrome.storage.local.set({ apiBaseUrl }, () => {
      sendResponse({ ok: true, apiBaseUrl });
    });
    return true;
  }
  if (message?.type === "ping") {
    sendResponse({ ok: true, pong: true });
  }
  if (message?.type === "startScheduleNotifications") {
    schedulePhaseNotifications(message.schedule).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }
  if (message?.type === "fetchScheduleNotifications") {
    fetchApiJson("/api/schedule", { method: "GET" })
      .then((response) => {
        const schedules = response.data?.data;
        if (!Array.isArray(schedules) || schedules.length === 0) return null;
        const sorted = schedules
          .slice()
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const latest = sorted[0];
        if (!latest?.items) return null;
        return schedulePhaseNotifications({ blocks: latest.items });
      })
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
  if (message?.type === "startFocusSession") {
    focusStartTime = Date.now();
    sendResponse({ ok: true });
  }
  if (message?.type === "endFocusSession") {
    focusStartTime = null;
    sendResponse({ ok: true });
  }
  if (message?.type === "scheduleTimerAlarm") {
    const remainingMs = Number(message.remainingMs);
    const phase = message.phase === "rest" ? "rest" : "focus";
    if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
      sendResponse({ ok: false });
      return false;
    }
    clearTimerAlarms()
      .then(() => {
        chrome.alarms.create(`timer-complete-${phase}`, { when: Date.now() + remainingMs });
      })
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
  if (message?.type === "clearTimerAlarm") {
    clearTimerAlarms()
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
  return false;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab?.active) return;
  recordSession({ durationMin: 25, breakTaken: false });
});

chrome.idle.onStateChanged.addListener((state) => {
  if (state === "idle" || state === "locked") {
    recordSession({ durationMin: 5, breakTaken: true });
    getActiveSchedule().then((schedule) => {
      if (!schedule?.blocks?.length) return;
      const msg = getCurrentPhaseMessage(schedule.blocks);
      if (msg.type === "study") {
        notify("You've relaxed too long", "Back to work for this focus block.");
      }
    });
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm?.name && alarm.name.startsWith("timer-complete-")) {
    const settings = await getNotificationSettings();
    if (!settings.enabled) return;
    const phase = alarm.name.replace("timer-complete-", "");
    const state = await getStored(["timerState"]);
    const timerState = state.timerState;
    if (!timerState?.isRunning) return;
    if (timerState.phase !== phase) return;
    if (!timerState.startedAt || typeof timerState.baseRemaining !== "number") return;
    const remainingMs = timerState.baseRemaining * 1000 - (Date.now() - timerState.startedAt);
    if (remainingMs > 1000) {
      chrome.alarms.create(`timer-complete-${phase}`, { when: Date.now() + remainingMs });
      return;
    }
    showNotification(
      `timer-complete-${phase}`,
      phase === "focus" ? "Focus Session Complete!" : "Break Complete!",
      phase === "focus" ? "Time for a break!" : "Ready to focus again?"
    );
    return;
  }
  if (alarm?.name && alarm.name.startsWith("phase-")) {
    const schedule = await getActiveSchedule();
    if (!schedule?.blocks?.length) return;
    const index = Number(alarm.name.replace("phase-", ""));
    const block = schedule.blocks[index];
    if (!block) return;
    if (block.type === "focus") {
      notify(
        "Time to study",
        `Focus block started: ${block.task || "Task"} — ${block.duration} min`
      );
      return;
    }
    notify("Time to rest", `Take a ${block.duration}-minute break.`);
    return;
  }
  if (alarm?.name === "break-return") {
    if (!breakStartTime) return;
    showNotification(
      "return-to-work",
      "🎯 Break's over!",
      "Time to get back to work. You're refreshed and ready to focus!"
    );
    breakStartTime = null;
    return;
  }
  if (alarm?.name && alarm.name.startsWith("break")) {
    recordSession({ durationMin: 10, breakTaken: true });
    return;
  }

  const settings = await getNotificationSettings();
  if (!settings.enabled) return;
  if (alarm.name === "checkBreakReminder") {
    await checkBreakReminder(settings);
  } else if (alarm.name === "checkDeadlines") {
    await checkDeadlines(settings);
  }
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
  const response = await fetchApiJson("/api/tasks", { method: "GET" });
  if (response.ok && Array.isArray(response.data?.data)) {
    return response.data.data;
  }
  return new Promise((resolve) => {
    chrome.storage.local.get(["tasks"], (result) => {
      resolve(result.tasks || []);
    });
  });
}

function showNotification(id, title, message, buttons = []) {
  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: notificationIcon,
    title: title,
    message: message,
    buttons: buttons,
    priority: 2,
    requireInteraction: true
  }, () => {
    if (chrome.runtime.lastError) {
      return;
    }
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
      "☕ Take a break!",
      `You've been working hard for ${settings.focusDuration} minutes. Step away for 5 minutes to recharge your brain!`,
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
    const taskLabel = task.description || task.title || "Task";
    
    // Notify at 24 hours, 1 hour, and 15 minutes before deadline
    if (hoursUntil <= 24 && hoursUntil > 23.9) {
      showNotification(
        `deadline-24h-${task.id}`,
        "📅 Don't forget!",
        `Your ${taskLabel} is due tomorrow. Make sure you're on track!`
      );
    } else if (hoursUntil <= 1 && hoursUntil > 0.95) {
      showNotification(
        `deadline-1h-${task.id}`,
        "⏰ One hour left!",
        `${taskLabel} is due in 1 hour. Time to wrap up and submit!`
      );
    } else if (hoursUntil <= 0.25 && hoursUntil > 0.2) {
      showNotification(
        `deadline-15m-${task.id}`,
        "🚨 Final warning!",
        `${taskLabel} is due in 15 minutes! Submit now!`
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
      breakStartTime = Date.now();
      chrome.notifications.clear(notificationId);
      chrome.alarms.create("break-return", { delayInMinutes: breakDuration / 60000 });
    } else if (buttonIndex === 1) {
      // Keep Working - reset timer
      focusStartTime = Date.now();
      breakStartTime = null;
      chrome.notifications.clear(notificationId);
    }
  }
});
FocusPet.Messaging.init();
FocusPet.Alarms.init();
