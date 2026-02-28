const defaultApiBaseUrl = "http://localhost:5174";
const notificationIcon =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' fill='%230f172a'/><text x='64' y='78' font-size='64' text-anchor='middle' fill='white'>F</text></svg>";

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
  return result.apiBaseUrl || defaultApiBaseUrl;
};

const getLastFocusScore = async () => {
  const result = await getStored(["lastFocusScore"]);
  return typeof result.lastFocusScore === "number" ? result.lastFocusScore : null;
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  return { ok: response.ok, data };
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

const resolveHabitId = async (apiBaseUrl) => {
  const cached = await getStored(["activeHabitId"]);
  if (cached.activeHabitId) return cached.activeHabitId;
  const list = await fetchJson(`${apiBaseUrl}/api/habits`, { method: "GET" });
  if (list.ok && Array.isArray(list.data?.data) && list.data.data.length > 0) {
    const habitId = list.data.data[0].id;
    await setStored({ activeHabitId: habitId });
    return habitId;
  }
  const created = await fetchJson(`${apiBaseUrl}/api/habits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Focus Sessions" }),
  });
  const habitId = created.data?.data?.id;
  if (habitId) await setStored({ activeHabitId: habitId });
  return habitId || null;
};

const recordSession = async ({ durationMin, breakTaken }) => {
  const apiBaseUrl = await getApiBaseUrl();
  const habitId = await resolveHabitId(apiBaseUrl);
  if (!habitId) return;
  const focusScore = await getLastFocusScore();
  const session = {
    timestamp: Date.now(),
    durationMin,
    focusScore,
    breakTaken,
  };
  await fetchJson(`${apiBaseUrl}/api/habits/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ habitId, session }),
  });
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["apiBaseUrl"], (result) => {
    if (!result.apiBaseUrl) {
      chrome.storage.local.set({ apiBaseUrl: defaultApiBaseUrl });
    }
  });
  chrome.idle.setDetectionInterval(300);
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
  if (message?.type === "startScheduleNotifications") {
    schedulePhaseNotifications(message.schedule).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }
  if (message?.type === "fetchScheduleNotifications") {
    getApiBaseUrl()
      .then((apiBaseUrl) => fetchJson(`${apiBaseUrl}/api/schedule`, { method: "GET" }))
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
  return false;
});

chrome.tabs.onActivated.addListener(() => {
  recordSession({ durationMin: 25, breakTaken: false });
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
        notify("You’ve relaxed too long", "Back to work for this focus block.");
      }
    });
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm?.name && alarm.name.startsWith("phase-")) {
    getActiveSchedule().then((schedule) => {
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
    });
    return;
  }
  if (alarm?.name && alarm.name.startsWith("break")) {
    recordSession({ durationMin: 10, breakTaken: true });
  }
});
