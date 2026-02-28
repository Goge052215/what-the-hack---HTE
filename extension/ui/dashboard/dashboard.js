import { apiRequest } from "../api/client.js";

const elements = {
  summary: document.getElementById("summary"),
  newTaskInput: document.getElementById("newTaskInput"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  tasksStatus: document.getElementById("tasksStatus"),
  tasksList: document.getElementById("tasksList"),
  focusScoreValue: document.getElementById("focusScoreValue"),
  analysisStatus: document.getElementById("analysisStatus"),
  analysisMeta: document.getElementById("analysisMeta"),
  focusProgressBar: document.getElementById("focusProgressBar"),
  tasksCompleted: document.getElementById("tasksCompleted"),
  focusTime: document.getElementById("focusTime"),
  breakTime: document.getElementById("breakTime"),
  productivityScore: document.getElementById("productivityScore"),
  themeToggle: document.getElementById("themeToggle"),
  // New Elements for Behavioral Analytics & Fatigue
  studyBar: document.getElementById("studyBar"),
  entertainmentBar: document.getElementById("entertainmentBar"),
  studyTime: document.getElementById("studyTime"),
  entertainmentTime: document.getElementById("entertainmentTime"),
  peakHours: document.getElementById("peakHours"),
  scheduleRecommendation: document.getElementById("scheduleRecommendation"),
  fatigueStatusIcon: document.getElementById("fatigueStatusIcon"),
  fatigueStatusText: document.getElementById("fatigueStatusText"),
  currentSessionTime: document.getElementById("currentSessionTime"),
  breakRecommendation: document.getElementById("breakRecommendation"),
  recoveryEfficiencyBar: document.getElementById("recoveryEfficiencyBar"),
  paletteToggle: document.getElementById("paletteToggle"),
  paletteMenu: document.getElementById("paletteMenu"),
  todayFocusTime: document.getElementById("todayFocusTime"),
  sessionsCompleted: document.getElementById("sessionsCompleted"),
  avgSessionLength: document.getElementById("avgSessionLength"),
  sessionHistory: document.getElementById("sessionHistory"),
  aiInsights: document.getElementById("aiInsights"),
  aiInsightText: document.getElementById("aiInsightText"),
  // Streak Elements
  streakDisplay: document.getElementById("streakDisplay"),
  streakIcon: document.getElementById("streakIcon"),
  streakCount: document.getElementById("streakCount"),
  streakMessage: document.getElementById("streakMessage"),
  taskHistoryList: document.getElementById("taskHistoryList"),
  achievementBadges: document.getElementById("achievementBadges"),
  libraryCount: document.getElementById("libraryCount"),
  libraryStatus: document.getElementById("libraryStatus"),
  libraryBarFill: document.getElementById("libraryBarFill"),
  customPaletteSwatch: document.getElementById("customPaletteSwatch"),
  exportTraitCsvBtn: document.getElementById("exportTraitCsvBtn"),
  exportTraitStatus: document.getElementById("exportTraitStatus"),
};

let tasks = [];
let currentPaletteId = "slate";
const TASK_HISTORY_RETENTION_DAYS = 30;
const LIBRARY_CAPACITY = 20;
let taskHistory = [];
let dailyStats = {
  date: new Date().toDateString(),
  studyMinutes: 0,
  entertainmentMinutes: 0,
  hourlyScores: {}, // Format: "14": { sum: 0, count: 0 }
};
let sessionState = {
  startTime: null,
  isFocused: false,
};
let streakData = {
  count: 0,
  lastActiveDate: null,
  isActive: false
};
let insightCache = null;
let insightRequest = null;

const palettes = {
  slate: {
    light: { 
      accent: "#a8b5c8", 
      accentHover: "#8fa3bc", 
      study: "#7b9acc", 
      entertainment: "#e09f9f",
      bgPrimary: "#fafafa",
      bgSecondary: "#f5f5f5",
      bgTertiary: "#ececec"
    },
    dark: { 
      accent: "#9ca8ba", 
      accentHover: "#b4bfce", 
      study: "#5a7ab0", 
      entertainment: "#c07f7f",
      bgPrimary: "#2a2a2e",
      bgSecondary: "#35353a",
      bgTertiary: "#404046"
    },
  },
  ocean: {
    light: { 
      accent: "#4f8bd6", 
      accentHover: "#3b76c0", 
      study: "#4f8bd6", 
      entertainment: "#e09f9f",
      bgPrimary: "#f0f7fc",
      bgSecondary: "#e6f2fa",
      bgTertiary: "#d9ebf7"
    },
    dark: { 
      accent: "#6ea6e3", 
      accentHover: "#88b6ea", 
      study: "#6ea6e3", 
      entertainment: "#c07f7f",
      bgPrimary: "#1a2633",
      bgSecondary: "#243140",
      bgTertiary: "#2e3d4d"
    },
  },
  lavender: {
    light: { 
      accent: "#9b7ad9", 
      accentHover: "#8462c3", 
      study: "#9b7ad9", 
      entertainment: "#e09f9f",
      bgPrimary: "#f8f5fc",
      bgSecondary: "#f2ecfa",
      bgTertiary: "#e9dff5"
    },
    dark: { 
      accent: "#b79cf0", 
      accentHover: "#c9b1f5", 
      study: "#b79cf0", 
      entertainment: "#c07f7f",
      bgPrimary: "#2a2533",
      bgSecondary: "#352f40",
      bgTertiary: "#403a4d"
    },
  },
  mint: {
    light: { 
      accent: "#3aa97a", 
      accentHover: "#2e9468", 
      study: "#3aa97a", 
      entertainment: "#e09f9f",
      bgPrimary: "#f3faf7",
      bgSecondary: "#e8f5ef",
      bgTertiary: "#daf0e5"
    },
    dark: { 
      accent: "#59c892", 
      accentHover: "#73d6a6", 
      study: "#59c892", 
      entertainment: "#c07f7f",
      bgPrimary: "#1f2e28",
      bgSecondary: "#293933",
      bgTertiary: "#33443e"
    },
  },
  sunset: {
    light: { 
      accent: "#e07b5f", 
      accentHover: "#c9654d", 
      study: "#7b9acc", 
      entertainment: "#e07b5f",
      bgPrimary: "#fcf6f4",
      bgSecondary: "#faf0ec",
      bgTertiary: "#f5e6e0"
    },
    dark: { 
      accent: "#f2a08c", 
      accentHover: "#f6b1a1", 
      study: "#6ea6e3", 
      entertainment: "#f2a08c",
      bgPrimary: "#2e2623",
      bgSecondary: "#39312d",
      bgTertiary: "#443c38"
    },
  },
  custom: {
    light: { 
      accent: "#a8b5c8", 
      accentHover: "#8fa3bc", 
      study: "#7b9acc", 
      entertainment: "#e09f9f",
      bgPrimary: "#fafafa",
      bgSecondary: "#f5f5f5",
      bgTertiary: "#ececec"
    },
    dark: { 
      accent: "#9ca8ba", 
      accentHover: "#b4bfce", 
      study: "#5a7ab0", 
      entertainment: "#c07f7f",
      bgPrimary: "#2a2a2e",
      bgSecondary: "#35353a",
      bgTertiary: "#404046"
    },
  },
};

const hexToRgb = (hex) => {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const bigint = parseInt(full, 16);
  if (Number.isNaN(bigint)) return null;
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const darkenColor = (hex, percent) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const factor = Math.max(0, 1 - percent / 100);
  const toHex = (value) => Math.round(value * factor).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

const lightenColor = (hex, percent) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const toHex = (value) => Math.round(value + (255 - value) * (percent / 100))
    .toString(16)
    .padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

const generateCustomPalette = (baseColor) => {
  const accentHover = darkenColor(baseColor, 15);
  const bgPrimaryLight = lightenColor(baseColor, 95);
  const bgSecondaryLight = lightenColor(baseColor, 90);
  const bgTertiaryLight = lightenColor(baseColor, 85);
  const bgPrimaryDark = darkenColor(baseColor, 85);
  const bgSecondaryDark = darkenColor(baseColor, 80);
  const bgTertiaryDark = darkenColor(baseColor, 75);
  const accentDark = lightenColor(baseColor, 10);
  const accentHoverDark = lightenColor(baseColor, 20);

  palettes.custom = {
    light: {
      accent: baseColor,
      accentHover: accentHover,
      study: baseColor,
      entertainment: "#e09f9f",
      bgPrimary: bgPrimaryLight,
      bgSecondary: bgSecondaryLight,
      bgTertiary: bgTertiaryLight,
    },
    dark: {
      accent: accentDark,
      accentHover: accentHoverDark,
      study: accentDark,
      entertainment: "#c07f7f",
      bgPrimary: bgPrimaryDark,
      bgSecondary: bgSecondaryDark,
      bgTertiary: bgTertiaryDark,
    },
  };
};

const applyPalette = (paletteId) => {
  const palette = palettes[paletteId] || palettes.slate;
  const isDark = document.body.classList.contains("dark-theme");
  const colors = isDark ? palette.dark : palette.light;
  const root = document.documentElement;

  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-hover", colors.accentHover);
  root.style.setProperty("--study-color", colors.study);
  root.style.setProperty("--entertainment-color", colors.entertainment);
  root.style.setProperty("--bg-primary", colors.bgPrimary);
  root.style.setProperty("--bg-secondary", colors.bgSecondary);
  root.style.setProperty("--bg-tertiary", colors.bgTertiary);

  if (elements.paletteToggle) {
    elements.paletteToggle.style.borderColor = colors.accent;
  }
};

const setPalette = async (paletteId) => {
  currentPaletteId = paletteId;
  applyPalette(paletteId);
  chrome.storage.local.set({ palette: paletteId });
  updatePaletteMenuSelection();
};

const updatePaletteMenuSelection = () => {
  if (!elements.paletteMenu) return;
  const swatches = elements.paletteMenu.querySelectorAll(".palette-swatch");
  swatches.forEach((btn) => {
    const id = btn.getAttribute("data-palette");
    if (id === currentPaletteId) {
      btn.setAttribute("aria-checked", "true");
    } else {
      btn.removeAttribute("aria-checked");
    }
  });
  if (elements.customPaletteSwatch) {
    const storedColor = elements.customPaletteSwatch.getAttribute("data-color");
    if (storedColor) {
      const dot = elements.customPaletteSwatch.querySelector(".swatch-dot");
      if (dot) dot.style.setProperty("--swatch", storedColor);
    }
  }
};

const closePaletteMenu = () => {
  if (!elements.paletteMenu || !elements.paletteToggle) return;
  elements.paletteMenu.hidden = true;
  elements.paletteToggle.setAttribute("aria-expanded", "false");
};

const togglePaletteMenu = () => {
  if (!elements.paletteMenu || !elements.paletteToggle) return;
  const nextHidden = !elements.paletteMenu.hidden;
  elements.paletteMenu.hidden = nextHidden;
  elements.paletteToggle.setAttribute("aria-expanded", nextHidden ? "false" : "true");
  if (!nextHidden) {
    updatePaletteMenuSelection();
  }
};

const loadPalette = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["palette", "customColor"], (result) => {
      const paletteId = result.palette || "slate";
      currentPaletteId = paletteId;
      if (result.customColor) {
        generateCustomPalette(result.customColor);
        if (elements.customPaletteSwatch) {
          elements.customPaletteSwatch.setAttribute("data-color", result.customColor);
          const dot = elements.customPaletteSwatch.querySelector(".swatch-dot");
          if (dot) dot.style.setProperty("--swatch", result.customColor);
        }
      }
      applyPalette(paletteId);
      updatePaletteMenuSelection();
      resolve(paletteId);
    });
  });
};

const loadTheme = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["theme"], (result) => {
      const theme = result.theme || "light";
      applyTheme(theme);
      resolve(theme);
    });
  });
};

const applyTheme = (theme) => {
  if (theme === "dark") {
    document.body.classList.add("dark-theme");
    elements.themeToggle.textContent = "🌙";
  } else {
    document.body.classList.remove("dark-theme");
    elements.themeToggle.textContent = "☀️";
  }
  applyPalette(currentPaletteId);
};

const toggleTheme = () => {
  const isDark = document.body.classList.contains("dark-theme");
  const newTheme = isDark ? "light" : "dark";
  applyTheme(newTheme);
  chrome.storage.local.set({ theme: newTheme });
};

const loadTasks = async () => {
  const response = await apiRequest("/api/tasks");
  if (response.ok) {
    tasks = (response.data || []).map((task) => ({
      ...task,
      description: task.description || task.title || "",
    }));
    elements.summary.textContent = `Tasks tracked: ${tasks.length}`;
    renderTasks();
    updateInsights();
    return;
  }
  elements.summary.textContent = "Connect to the API to see insights.";
  loadLocalTasks();
};

const loadLocalTasks = () => {
  chrome.storage.local.get(["tasks"], (result) => {
    tasks = (result.tasks || []).map((task) => ({
      ...task,
      description: task.description || task.title || "",
    }));
    renderTasks();
    updateInsights();
  });
};

const saveLocalTasks = () => {
  chrome.storage.local.set({ tasks });
};

const addTask = async () => {
  const description = elements.newTaskInput.value.trim();
  if (!description) return;

  const newTask = {
    id: Date.now().toString(),
    description,
    completed: false,
    subtasks: [],
    createdAt: new Date().toISOString(),
  };

  const response = await apiRequest("/api/tasks", {
    method: "POST",
    body: { title: description, description },
  });

  if (response.ok && response.data) {
    tasks.push({
      ...newTask,
      subtasks: response.data.subtasks || [],
      description: response.data.description || description,
    });
  } else {
    tasks.push(newTask);
  }

  saveLocalTasks();
  renderTasks();
  updateInsights();
  elements.newTaskInput.value = "";
};

const loadStreak = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["streakData"], (result) => {
      streakData = result.streakData || { count: 0, lastActiveDate: null, isActive: false };
      updateStreakUI();
      resolve();
    });
  });
};

const updateStreakForStudy = () => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (streakData.lastActiveDate === today) return;
  if (streakData.lastActiveDate === yesterday) {
    streakData.count += 1;
  } else {
    streakData.count = 1;
  }
  streakData.lastActiveDate = today;
  streakData.isActive = true;
  chrome.storage.local.set({ streakData });
  updateStreakUI();
  updateAchievements();
};

const updateStreakUI = () => {
  if (!elements.streakDisplay) return;

  const count = streakData.count;
  const isFire = count >= 3;
  
  if (isFire) {
    elements.streakIcon.textContent = "🔥";
    elements.streakIcon.style.filter = "none";
    elements.streakCount.textContent = `Streak: ${count} days`;
    elements.streakMessage.textContent = "You're on fire! Keep it up!";
  } else {
    elements.streakIcon.textContent = "🔥";
    elements.streakIcon.style.filter = "grayscale(100%)";
    elements.streakCount.textContent = `Streak: ${count} days`;
    const daysLeft = 3 - count;
    elements.streakMessage.textContent = `${daysLeft} more day${daysLeft > 1 ? 's' : ''} to ignite the spark!`;
  }
};

const loadDailyStats = () => {
  return new Promise((resolve) => {
    const today = new Date().toDateString();
    chrome.storage.local.get(["dailyStats"], (result) => {
      if (result.dailyStats && result.dailyStats.date === today) {
        dailyStats = result.dailyStats;
      } else {
        // Reset for new day
        dailyStats = {
          date: today,
          studyMinutes: 0,
          entertainmentMinutes: 0,
          hourlyScores: {},
        };
      }
      updateBehavioralUI();
      resolve();
    });
  });
};

const saveDailyStats = () => {
  chrome.storage.local.set({ dailyStats });
};

const pruneTaskHistory = (items) => {
  const cutoff = Date.now() - TASK_HISTORY_RETENTION_DAYS * 86400000;
  return items.filter((task) => {
    const stamp = new Date(task.completedAt || task.archivedAt || task.createdAt || Date.now()).getTime();
    return stamp >= cutoff;
  });
};

const loadTaskHistory = () =>
  new Promise((resolve) => {
    chrome.storage.local.get(["taskHistory"], (result) => {
      taskHistory = pruneTaskHistory(Array.isArray(result.taskHistory) ? result.taskHistory : []);
      chrome.storage.local.set({ taskHistory });
      renderTaskHistory();
      updateInsights();
      updateAchievements();
      resolve(taskHistory);
    });
  });

const csvEscape = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const pickTimestamp = (item) => {
  const candidate =
    item?.completedAt ||
    item?.archivedAt ||
    item?.createdAt ||
    item?.startTime ||
    item?.endTime ||
    item?.timestamp;
  if (!candidate) return "";
  const date = new Date(candidate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

const buildTraitSnapshot = async () => {
  const keys = [
    "tasks",
    "taskHistory",
    "dailyStats",
    "streakData",
    "timerHistory",
    "aiInsightCache",
    "tabHistory",
    "focusScore",
    "currentSession",
  ];
  const stored = await new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => resolve(result || {}));
  });
  return {
    generatedAt: new Date().toISOString(),
    tasks: stored.tasks || tasks,
    taskHistory: stored.taskHistory || taskHistory,
    dailyStats: stored.dailyStats || dailyStats,
    streakData: stored.streakData || streakData,
    timerHistory: stored.timerHistory || [],
    aiInsightCache: stored.aiInsightCache || null,
    tabHistory: stored.tabHistory || [],
    focusScore: stored.focusScore || [],
    currentSession: stored.currentSession || null,
  };
};

const buildTraitCsv = (snapshot) => {
  const rows = [["record_type", "record_id", "timestamp", "data_json"]];
  const addRow = (type, id, timestamp, data) => {
    rows.push([type, id || "", timestamp || "", JSON.stringify(data ?? null)]);
  };

  addRow("meta", "snapshot", snapshot.generatedAt, { generatedAt: snapshot.generatedAt });
  if (snapshot.dailyStats) {
    addRow("daily_stats", "daily_stats", snapshot.dailyStats.date || snapshot.generatedAt, snapshot.dailyStats);
  }
  if (snapshot.streakData) {
    addRow("streak", "streak", snapshot.streakData.lastActiveDate || snapshot.generatedAt, snapshot.streakData);
  }
  if (snapshot.aiInsightCache) {
    addRow("ai_insight", "ai_insight", snapshot.aiInsightCache.day || snapshot.generatedAt, snapshot.aiInsightCache);
  }
  if (snapshot.currentSession) {
    addRow(
      "current_session",
      snapshot.currentSession.id || "current_session",
      pickTimestamp(snapshot.currentSession) || snapshot.generatedAt,
      snapshot.currentSession
    );
  }

  (snapshot.tasks || []).forEach((task, index) => {
    addRow("task", task.id || `task_${index}`, pickTimestamp(task), task);
  });
  (snapshot.taskHistory || []).forEach((task, index) => {
    addRow("task_history", task.id || `task_history_${index}`, pickTimestamp(task), task);
  });
  (snapshot.timerHistory || []).forEach((session, index) => {
    addRow("timer_session", session.id || `timer_session_${index}`, pickTimestamp(session), session);
  });
  (snapshot.tabHistory || []).forEach((entry, index) => {
    addRow("tab_history", entry.id || `tab_history_${index}`, pickTimestamp(entry), entry);
  });
  (snapshot.focusScore || []).forEach((entry, index) => {
    addRow("focus_score", entry.id || `focus_score_${index}`, pickTimestamp(entry), entry);
  });

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
};

const updateTraitExportStatus = (meta) => {
  if (!elements.exportTraitStatus) return;
  if (!meta || (!meta.lastExportedAt && !meta.lastGeneratedAt)) {
    elements.exportTraitStatus.textContent = "No exports yet.";
    return;
  }
  const timestamp = meta.lastExportedAt || meta.lastGeneratedAt;
  const date = new Date(timestamp);
  const label = Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString();
  const recordCount = meta.recordCount || 0;
  elements.exportTraitStatus.textContent = `Last export: ${label} • ${recordCount} rows`;
};

const loadTraitExportMeta = () =>
  new Promise((resolve) => {
    chrome.storage.local.get(["traitAnalysisMeta"], (result) => {
      updateTraitExportStatus(result.traitAnalysisMeta);
      resolve(result.traitAnalysisMeta || null);
    });
  });

const saveTraitSnapshot = async () => {
  const snapshot = await buildTraitSnapshot();
  const csv = buildTraitCsv(snapshot);
  const recordCount = Math.max(0, csv.split("\n").length - 1);
  const meta = { lastGeneratedAt: snapshot.generatedAt, recordCount };
  chrome.storage.local.set({
    traitAnalysisSnapshot: snapshot,
    traitAnalysisCsv: csv,
    traitAnalysisMeta: meta,
  });
  updateTraitExportStatus(meta);
  return { csv, meta };
};

const exportTraitCsv = async () => {
  if (!elements.exportTraitCsvBtn) return;
  const originalText = elements.exportTraitCsvBtn.textContent;
  elements.exportTraitCsvBtn.disabled = true;
  elements.exportTraitCsvBtn.textContent = "Exporting...";
  if (elements.exportTraitStatus) {
    elements.exportTraitStatus.textContent = "Preparing export...";
  }

  try {
    const { csv, meta } = await saveTraitSnapshot();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const filename = `focus-tutor-trait-data-${new Date().toISOString().slice(0, 10)}.csv`;
    chrome.downloads.download({ url, filename, saveAs: true }, () => {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (chrome.runtime.lastError) {
        if (elements.exportTraitStatus) {
          elements.exportTraitStatus.textContent = "Export failed. Try again.";
        }
        return;
      }
      const updatedMeta = { ...meta, lastExportedAt: new Date().toISOString() };
      chrome.storage.local.set({ traitAnalysisMeta: updatedMeta });
      updateTraitExportStatus(updatedMeta);
    });
  } finally {
    elements.exportTraitCsvBtn.disabled = false;
    elements.exportTraitCsvBtn.textContent = originalText;
  }
};

const saveTaskHistory = () => {
  chrome.storage.local.set({ taskHistory });
};

const archiveTask = (task) => {
  if (!task) return;
  const archivedAt = new Date().toISOString();
  taskHistory = pruneTaskHistory([{ ...task, archivedAt }, ...taskHistory]).slice(0, 200);
  saveTaskHistory();
  renderTaskHistory();
  updateAchievements();
};

const completeAndArchiveTask = (task) => {
  if (!task) return;
  const completedAt = task.completedAt || new Date().toISOString();
  const archived = { ...task, completed: true, completedAt };
  archiveTask(archived);
  tasks = tasks.filter((t) => t.id !== task.id);
  saveLocalTasks();
  renderTasks();
  updateInsights();
};

const updateBehavioralUI = () => {
  // Time Distribution
  const total = dailyStats.studyMinutes + dailyStats.entertainmentMinutes;
  const studyPct = total > 0 ? (dailyStats.studyMinutes / total) * 100 : 50;
  const entPct = total > 0 ? (dailyStats.entertainmentMinutes / total) * 100 : 50;
  
  elements.studyBar.style.width = `${studyPct}%`;
  elements.entertainmentBar.style.width = `${entPct}%`;
  
  elements.studyTime.textContent = formatTime(dailyStats.studyMinutes);
  elements.entertainmentTime.textContent = formatTime(dailyStats.entertainmentMinutes);

  // Peak Hours
  const peakHour = calculatePeakHour();
  if (peakHour !== null) {
    const nextHour = (peakHour + 1) % 24;
    elements.peakHours.textContent = `${formatHour(peakHour)} - ${formatHour(nextHour)}`;
    elements.scheduleRecommendation.textContent = `High focus detected around ${formatHour(peakHour)}. Schedule complex tasks then.`;
  } else {
    elements.peakHours.textContent = "Gathering data...";
    elements.scheduleRecommendation.textContent = "Keep using the extension to identify your golden hours.";
  }
};

const loadInsightCache = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["aiInsightCache"], (result) => {
      resolve(result.aiInsightCache || null);
    });
  });
};

const storeInsightCache = (payload) => {
  chrome.storage.local.set({ aiInsightCache: payload });
};

const getInsightForToday = async () => {
  const day = new Date().toISOString().slice(0, 10);
  if (insightCache?.day === day && insightCache?.text) {
    return insightCache;
  }
  const stored = await loadInsightCache();
  if (stored?.day === day && stored?.text) {
    insightCache = stored;
    return stored;
  }
  if (insightRequest) {
    return insightRequest;
  }
  insightRequest = (async () => {
    try {
      const response = await apiRequest(`/api/analyze/insight?day=${day}`, { method: "GET" });
      if (response.ok && response.data?.insight) {
        const payload = { day, text: response.data.insight, source: response.data.source };
        insightCache = payload;
        storeInsightCache(payload);
        return payload;
      }
    } catch {
      return null;
    }
    return null;
  })();
  const result = await insightRequest;
  insightRequest = null;
  return result;
};

const calculatePeakHour = () => {
  let maxScore = -1;
  let bestHour = null;
  for (const [hour, data] of Object.entries(dailyStats.hourlyScores)) {
    const avg = data.sum / data.count;
    if (avg > maxScore) {
      maxScore = avg;
      bestHour = parseInt(hour);
    }
  }
  return bestHour;
};

const updateFatigue = (isFocused) => {
  const now = Date.now();
  
  if (isFocused) {
    if (!sessionState.isFocused) {
      sessionState.isFocused = true;
      sessionState.startTime = now;
    }
  } else {
    // If distraction or break, we reset session for this simple model
    // In a complex model, we'd allow short breaks without resetting
    sessionState.isFocused = false;
    sessionState.startTime = null;
  }

  if (sessionState.isFocused && sessionState.startTime) {
    const durationMinutes = (now - sessionState.startTime) / 60000;
    elements.currentSessionTime.textContent = `${Math.round(durationMinutes)}m`;

    if (durationMinutes > 45) {
      elements.fatigueStatusIcon.textContent = "⚠️";
      elements.fatigueStatusText.textContent = "Fatigue Risk";
      elements.breakRecommendation.textContent = "Over 45m focused. Time for a 5-10m break!";
      elements.recoveryEfficiencyBar.style.width = "40%";
      elements.recoveryEfficiencyBar.style.background = "var(--error)";
    } else if (durationMinutes > 25) {
      elements.fatigueStatusIcon.textContent = "⚡";
      elements.fatigueStatusText.textContent = "High Focus";
      elements.breakRecommendation.textContent = "You're doing great. A short break soon?";
      elements.recoveryEfficiencyBar.style.width = "80%";
      elements.recoveryEfficiencyBar.style.background = "var(--warning)";
    } else {
      elements.fatigueStatusIcon.textContent = "🟢";
      elements.fatigueStatusText.textContent = "Fresh & Ready";
      elements.breakRecommendation.textContent = "Optimal state for learning.";
      elements.recoveryEfficiencyBar.style.width = "100%";
      elements.recoveryEfficiencyBar.style.background = "var(--success)";
    }
  } else {
    elements.currentSessionTime.textContent = "0m";
    elements.fatigueStatusIcon.textContent = "💤";
    elements.fatigueStatusText.textContent = "Resting";
    elements.breakRecommendation.textContent = "Ready to start a new session.";
    elements.recoveryEfficiencyBar.style.width = "100%";
    elements.recoveryEfficiencyBar.style.background = "var(--success)";
  }
};

const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatHour = (hour) => {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}${period}`;
};

const buildHourlyScoresFromReport = (distribution) => {
  if (!Array.isArray(distribution)) return {};
  return distribution.reduce((acc, entry) => {
    if (!Number.isFinite(entry?.hour) || !Number.isFinite(entry?.focusRatio)) return acc;
    acc[entry.hour] = {
      sum: entry.focusRatio,
      count: 1,
    };
    return acc;
  }, {});
};

const refreshBehavioralReport = async () => {
  const day = new Date().toISOString().slice(0, 10);
  try {
    const response = await apiRequest(`/api/analyze/report?day=${day}`, { method: "GET" });
    const report = response.ok ? response.data?.report : null;
    if (!report || !Number.isFinite(report.trackedMinutes) || report.trackedMinutes <= 0) {
      return;
    }
    dailyStats.studyMinutes = Math.max(dailyStats.studyMinutes, report.focusMinutes || 0);
    dailyStats.entertainmentMinutes = Math.max(
      dailyStats.entertainmentMinutes,
      Math.max(0, report.trackedMinutes - (report.focusMinutes || 0))
    );
    dailyStats.hourlyScores = buildHourlyScoresFromReport(report.efficiencyDistribution);
    saveDailyStats();
    updateBehavioralUI();
  } catch {
    return;
  }
};

const toggleTask = (taskId) => {
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    if (!task.completed) {
      const completedTask = {
        ...task,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      completeAndArchiveTask(completedTask);
      return;
    }
    task.completed = false;
    task.completedAt = null;
    saveLocalTasks();
    renderTasks();
    updateInsights();
  }
};

const renderTasks = () => {
  if (tasks.length === 0) {
    elements.tasksStatus.style.display = "block";
    elements.tasksList.innerHTML = "";
    return;
  }

  elements.tasksStatus.style.display = "none";
  elements.tasksList.innerHTML = tasks
    .map(
      (task) => `
      <li class="task-item">
        <input 
          type="checkbox" 
          ${task.completed ? "checked" : ""}
          data-task-id="${task.id}"
        />
        <div class="task-item-content">
          <p class="task-title" style="${task.completed ? "text-decoration: line-through; opacity: 0.6;" : ""}">
            ${task.description || task.title || "Untitled task"}
          </p>
          <p class="task-meta">
            ${task.subtasks?.length ? `${task.subtasks.length} subtasks` : "No subtasks"}
          </p>
        </div>
        ${task.subtasks?.length ? `<span class="task-progress">${Math.round((task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100)}%</span>` : ""}
      </li>
    `
    )
    .join("");

  document.querySelectorAll('.task-item input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      toggleTask(e.target.dataset.taskId);
    });
  });
};

const updateInsights = () => {
  const completed = taskHistory.length;
  elements.tasksCompleted.textContent = completed;
  
  const totalTasks = tasks.length + completed;
  const productivity = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  elements.productivityScore.textContent = `${productivity}%`;
};

const buildTabContext = async () => {
  const tabs = await chrome.tabs.query({});
  const entries = tabs
    .filter((tab) => tab?.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://"))
    .slice(0, 20)
    .map((tab) => `${tab.title || "Untitled"} - ${tab.url}`);
  return { context: entries.join(" | "), count: entries.length };
};

const scoreContext = (context) => {
  const lower = context.toLowerCase();
  const focusWords = ["task", "study", "build", "learn", "work", "code", "research"];
  const distractions = ["youtube", "netflix", "gaming", "social", "twitter", "facebook", "instagram"];
  const focusScore = focusWords.some((word) => lower.includes(word)) ? 0.7 : 0.4;
  const distractionPenalty = distractions.some((word) => lower.includes(word)) ? 0.3 : 0;
  return Math.max(0, Math.min(1, focusScore - distractionPenalty));
};

const analyzeTabs = async () => {
  const { context, count } = await buildTabContext();
  if (!context) {
    elements.analysisStatus.textContent = "No tabs to analyze";
    elements.focusScoreValue.textContent = "--";
    elements.analysisMeta.textContent = "Tabs analyzed: 0";
    elements.focusProgressBar.style.width = "0%";
    return;
  }
  
  elements.analysisStatus.textContent = "Analyzing...";
  const response = await apiRequest("/api/analyze", { method: "POST", body: { context } });
  
  let score;
  let category = "neutral";
  if (!response.ok) {
    score = scoreContext(context);
    elements.analysisStatus.textContent = "Local analysis";
  } else {
    score = response.data?.score ?? scoreContext(context);
    elements.analysisStatus.textContent = "Analysis complete";
    category = response.data?.category || category;
  }
  
  elements.focusScoreValue.textContent = typeof score === "number" ? score.toFixed(2) : "--";
  elements.analysisMeta.textContent = `Tabs analyzed: ${count}`;
  elements.focusProgressBar.style.width = `${(score * 100).toFixed(0)}%`;
  
  // Behavioral Analysis Updates
  const isStudy = category === "study" || score >= 0.6;
  if (isStudy) {
    dailyStats.studyMinutes += 0.5; // Approx 30s interval
  } else {
    dailyStats.entertainmentMinutes += 0.5;
  }

  const currentHour = new Date().getHours();
  if (!dailyStats.hourlyScores[currentHour]) {
    dailyStats.hourlyScores[currentHour] = { sum: 0, count: 0 };
  }
  dailyStats.hourlyScores[currentHour].sum += score;
  dailyStats.hourlyScores[currentHour].count += 1;

  saveDailyStats();
  updateBehavioralUI();
  updateFatigue(isStudy);
  if (isStudy) {
    updateStreakForStudy();
  }

  const scoreCircle = document.querySelector(".score-circle");
  scoreCircle.classList.remove("score-high", "score-medium", "score-low");
  if (score >= 0.7) {
    scoreCircle.classList.add("score-high");
  } else if (score >= 0.4) {
    scoreCircle.classList.add("score-medium");
  } else if (score > 0) {
    scoreCircle.classList.add("score-low");
  }
};

// Timer Functions
const loadTimerSessions = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["timerHistory"], (result) => {
      const sessions = result.timerHistory || [];
      displayTimerStats(sessions);
      displaySessionHistory(sessions);
      checkForAIInsights(sessions);
      resolve(sessions);
    });
  });
};

const displayTimerStats = (sessions) => {
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.startTime).toDateString();
    return sessionDate === today && s.phase === "focus";
  });
  
  // Calculate total focus time today
  const totalMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  elements.todayFocusTime.textContent = `${hours}h ${mins}m`;
  
  // Sessions completed
  elements.sessionsCompleted.textContent = todaySessions.length;
  
  // Average session length
  if (todaySessions.length > 0) {
    const avgMins = Math.round(totalMinutes / todaySessions.length);
    elements.avgSessionLength.textContent = `${avgMins}m`;
  } else {
    elements.avgSessionLength.textContent = "--";
  }
};

const displaySessionHistory = (sessions) => {
  if (sessions.length === 0) {
    elements.sessionHistory.innerHTML = '<p class="placeholder-text">No sessions yet. Start a focus timer to track your productivity!</p>';
    return;
  }
  
  // Show last 10 sessions
  const recentSessions = sessions.slice(-10).reverse();
  
  elements.sessionHistory.innerHTML = recentSessions.map(session => {
    const startTime = new Date(session.startTime);
    const timeStr = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const phaseLabel = session.phase === "focus" ? "🎯 Focus" : "☕ Break";
    const modeLabel = session.mode === "pomodoro" ? "Pomodoro" : "Custom";
    
    return `
      <div class="session-item">
        <div class="session-info">
          <span class="session-type ${session.phase}">${phaseLabel} - ${modeLabel}</span>
          <span class="session-time">${dateStr} at ${timeStr}</span>
        </div>
        <span class="session-duration">${session.duration}m</span>
      </div>
    `;
  }).join('');
};

const formatHistoryDate = (isoString) => {
  if (!isoString) return "Unknown date";
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const renderTaskHistory = () => {
  if (!elements.taskHistoryList) return;
  if (!taskHistory.length) {
    elements.taskHistoryList.innerHTML = '<li class="history-item empty">No completed tasks yet.</li>';
    return;
  }
  const recent = taskHistory
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.completedAt || a.archivedAt || a.createdAt || 0);
      const dateB = new Date(b.completedAt || b.archivedAt || b.createdAt || 0);
      return dateB - dateA;
    })
    .slice(0, 6);
  elements.taskHistoryList.innerHTML = recent
    .map(
      (task) => `
      <li class="history-item">
        <span class="history-status">✓</span>
        <div class="history-content">
          <p class="history-title">${task.description || task.title || "Completed task"}</p>
          <p class="history-meta">Completed ${formatHistoryDate(task.completedAt || task.archivedAt || task.createdAt)}</p>
        </div>
      </li>
    `
    )
    .join("");
};

const updateAchievements = () => {
  const completedCount = taskHistory.length;
  if (elements.achievementBadges) {
    elements.achievementBadges.querySelectorAll(".achievement-badge").forEach((badge) => {
      const type = badge.getAttribute("data-type");
      const threshold = Number(badge.getAttribute("data-threshold"));
      const earned =
        (type === "streak" && streakData.count >= threshold) ||
        (type === "tasks" && completedCount >= threshold);
      badge.classList.toggle("earned", earned);
    });
  }
  if (elements.libraryBarFill && elements.libraryCount && elements.libraryStatus) {
    const donations = Math.floor(completedCount / LIBRARY_CAPACITY);
    const currentFill = completedCount % LIBRARY_CAPACITY;
    const percent = Math.min(100, Math.round((currentFill / LIBRARY_CAPACITY) * 100));
    elements.libraryBarFill.style.width = `${percent}%`;
    elements.libraryCount.textContent = `${currentFill}/${LIBRARY_CAPACITY} books`;
    if (currentFill === 0 && completedCount > 0) {
      elements.libraryStatus.textContent = donations === 1
        ? "Library full! Donated 1 library."
        : `Library full! Donated ${donations} libraries.`;
    } else {
      elements.libraryStatus.textContent = "Fill the library to donate books to children.";
    }
  }
};

const checkForAIInsights = async (sessions) => {
  const focusSessions = sessions.filter(s => s.phase === "focus");
  
  if (focusSessions.length >= 5) {
    elements.aiInsights.style.display = "block";
    
    const patterns = analyzeSessionPatterns(focusSessions);
    
    let insightText = "Based on your focus sessions:\n\n";
    
    if (patterns.preferredDuration) {
      insightText += `• You tend to focus best in ${patterns.preferredDuration}-minute sessions.\n`;
    }
    
    if (patterns.peakTime) {
      insightText += `• Your most productive time is around ${patterns.peakTime}.\n`;
    }
    
    if (patterns.consistency) {
      insightText += `• You maintain ${patterns.consistency} session consistency.\n`;
    }
    
    insightText += "\n💡 AI Feedback Integration Point: This data is ready for Person 2's learning style analysis to provide personalized recommendations.\n";
    
    const insight = await getInsightForToday();
    if (insight?.text) {
      const sourceLabel = insight.source === "minimax" ? "Minimax" : "Heuristic";
      insightText += `\nAI Insight (${sourceLabel}): ${insight.text}`;
    } else {
      insightText += "\nAI Insight: Retrieving your learning insight...";
    }
    
    elements.aiInsightText.textContent = insightText;
  }
};

const analyzeSessionPatterns = (sessions) => {
  // Calculate preferred session duration
  const durations = sessions.map(s => s.duration);
  const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  
  // Find peak productivity time
  const hours = sessions.map(s => new Date(s.startTime).getHours());
  const hourCounts = {};
  hours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
  const peakHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);
  
  // Calculate consistency (sessions in last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentSessions = sessions.filter(s => new Date(s.startTime) > weekAgo);
  const consistency = recentSessions.length >= 7 ? "high" : recentSessions.length >= 3 ? "moderate" : "low";
  
  return {
    preferredDuration: avgDuration,
    peakTime: `${peakHour}:00`,
    consistency: consistency
  };
};

const init = async () => {
  await loadPalette();
  await loadTheme();
  await loadTasks();
  await loadDailyStats();
  await loadStreak();
  await loadTaskHistory();
  await loadTimerSessions();
  await loadTraitExportMeta();
  await analyzeTabs();
  await refreshBehavioralReport();
  await saveTraitSnapshot();
  renderTaskHistory();
  updateAchievements();
  
  // Refresh timer stats every 30 seconds
  setInterval(loadTimerSessions, 30000);
  setInterval(analyzeTabs, 30000);
  setInterval(refreshBehavioralReport, 60000);
  setInterval(loadTaskHistory, 60000);
  setInterval(saveTraitSnapshot, 60000);
};


elements.addTaskBtn.addEventListener("click", addTask);
elements.newTaskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTask();
  }
});
elements.themeToggle.addEventListener("click", toggleTheme);
if (elements.exportTraitCsvBtn) {
  elements.exportTraitCsvBtn.addEventListener("click", exportTraitCsv);
}
if (elements.paletteToggle && elements.paletteMenu) {
  elements.paletteToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePaletteMenu();
  });

  elements.paletteMenu.querySelectorAll(".palette-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const paletteId = btn.getAttribute("data-palette");
      if (paletteId) {
        setPalette(paletteId);
        closePaletteMenu();
      }
    });
  });

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (elements.paletteMenu.contains(target) || elements.paletteToggle.contains(target)) return;
    closePaletteMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closePaletteMenu();
    }
  });
}

init();
