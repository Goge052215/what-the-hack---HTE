import { apiRequest, getApiBaseUrl, setApiBaseUrl } from "../api/client.js";

const elements = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  saveApiBaseUrl: document.getElementById("saveApiBaseUrl"),
  taskInput: document.getElementById("taskInput"),
  taskDeadlineDate: document.getElementById("taskDeadlineDate"),
  taskDeadlineTime: document.getElementById("taskDeadlineTime"),
  datePickerDropdown: document.getElementById("datePickerDropdown"),
  calendarDays: document.getElementById("calendarDays"),
  currentMonth: document.getElementById("currentMonth"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  timePickerDropdown: document.getElementById("timePickerDropdown"),
  hourScroll: document.getElementById("hourScroll"),
  minuteScroll: document.getElementById("minuteScroll"),
  periodScroll: document.getElementById("periodScroll"),
  // addToCalendar: document.getElementById("addToCalendar"), // Disabled until Chrome Web Store publish
  typeAssignment: document.getElementById("typeAssignment"),
  typeExam: document.getElementById("typeExam"),
  typeTask: document.getElementById("typeTask"),
  // Streak Elements
  popupStreak: document.getElementById("popupStreak"),
  popupStreakIcon: document.getElementById("popupStreakIcon"),
  popupStreakCount: document.getElementById("popupStreakCount"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  saveTaskBtn: document.getElementById("saveTaskBtn"),
  currentTaskDisplay: document.getElementById("currentTaskDisplay"),
  currentTaskTitle: document.getElementById("currentTaskTitle"),
  progressContainer: document.getElementById("progressContainer"),
  progressBar: document.getElementById("progressBar"),
  progressDetection: document.getElementById("progressDetection"),
  progressConfidence: document.getElementById("progressConfidence"),
  statusNotStarted: document.getElementById("statusNotStarted"),
  statusOngoing: document.getElementById("statusOngoing"),
  statusCompleted: document.getElementById("statusCompleted"),
  subtasksContainer: document.getElementById("subtasksContainer"),
  subtasksStatus: document.getElementById("subtasksStatus"),
  assignmentList: document.getElementById("assignmentList"),
  examList: document.getElementById("examList"),
  taskList: document.getElementById("taskList"),
  assignmentCount: document.getElementById("assignmentCount"),
  examCount: document.getElementById("examCount"),
  taskCountList: document.getElementById("taskCountList"),
  analysisStatus: document.getElementById("analysisStatus"),
  analysisScore: document.getElementById("analysisScore"),
  analysisMeta: document.getElementById("analysisMeta"),
  analysisList: document.getElementById("analysisList"),
  lightThemeBtn: document.getElementById("lightThemeBtn"),
  darkThemeBtn: document.getElementById("darkThemeBtn"),
  autoThemeBtn: document.getElementById("autoThemeBtn"),
  openDashboardBtn: document.getElementById("openDashboardBtn"),
  enableNotifications: document.getElementById("enableNotifications"),
  distractionAlerts: document.getElementById("distractionAlerts"),
  breakReminders: document.getElementById("breakReminders"),
  deadlineReminders: document.getElementById("deadlineReminders"),
  taskNudges: document.getElementById("taskNudges"),
  focusDuration: document.getElementById("focusDuration"),
  settingsBtn: document.getElementById("settingsBtn"),
  taskListBtn: document.getElementById("taskListBtn"),
  taskCount: document.getElementById("taskCount"),
  settingsPanel: document.getElementById("settingsPanel"),
  taskListPanel: document.getElementById("taskListPanel"),
  addTaskPanel: document.getElementById("addTaskPanel"),
  exportCalendarBtn: document.getElementById("exportCalendarBtn"),
  importCalendarBtn: document.getElementById("importCalendarBtn"),
  calendarSyncStatus: document.getElementById("calendarSyncStatus"),
  calendarSelect: document.getElementById("calendarSelect"),
  aiSuggestionPanel: document.getElementById("aiSuggestionPanel"),
  aiSuggestBtn: document.getElementById("aiSuggestBtn"),
  aiSuggestionList: document.getElementById("aiSuggestionList"),
  aiSuggestionStatus: document.getElementById("aiSuggestionStatus"),
  timerMode: document.getElementById("timerMode"),
  timerTime: document.getElementById("timerTime"),
  timerStartBtn: document.getElementById("timerStartBtn"),
  timerPauseBtn: document.getElementById("timerPauseBtn"),
  timerSkipBtn: document.getElementById("timerSkipBtn"),
  timerResetBtn: document.getElementById("timerResetBtn"),
  pomodoroModeBtn: document.getElementById("pomodoroModeBtn"),
  customModeBtn: document.getElementById("customModeBtn"),
  pomodoroSettings: document.getElementById("pomodoroSettings"),
  customSettings: document.getElementById("customSettings"),
  pomodoroFocus: document.getElementById("pomodoroFocus"),
  pomodoroBreak: document.getElementById("pomodoroBreak"),
  pomodoroLongBreak: document.getElementById("pomodoroLongBreak"),
  customFocus: document.getElementById("customFocus"),
  customBreak: document.getElementById("customBreak"),
  customColorBtn: document.getElementById("customColorBtn"),
  colorPickerPanel: document.getElementById("colorPickerPanel"),
  colorPicker: document.getElementById("colorPicker"),
  applyCustomColor: document.getElementById("applyCustomColor"),
};

let tasks = [];
let currentTaskIndex = 0;
let selectedTaskType = "assignment";
let currentPaletteId = "slate";
const TASK_HISTORY_RETENTION_DAYS = 30;
let taskHistory = [];
let notificationSettings = {
  enabled: true,
  distractionAlerts: true,
  breakReminders: true,
  deadlineReminders: true,
  taskNudges: true,
  focusDuration: 45
};
const CALENDAR_STORAGE_KEY = "calendarSyncCalendarId";

let streakData = {
  count: 0,
  lastActiveDate: null,
  isActive: false
};

let timerState = {
  mode: "pomodoro", // "pomodoro" or "custom"
  phase: "focus", // "focus" or "rest"
  isRunning: false,
  timeRemaining: 25 * 60, // seconds
  interval: null,
  startedAt: null,
  baseRemaining: null,
  pomodoroCount: 0,
  sessionHistory: []
};

let timerConfig = {
  pomodoro: {
    focus: 25,
    shortBreak: 5,
    longBreak: 15
  },
  custom: {
    focus: 45,
    break: 10
  }
};

const palettes = {
  slate: {
    light: { accent: "#a8b5c8", accentHover: "#8fa3bc", bgPrimary: "#fafafa", bgSecondary: "#f5f5f5", bgTertiary: "#ececec" },
    dark: { accent: "#9ca8ba", accentHover: "#b4bfce", bgPrimary: "#2a2a2e", bgSecondary: "#35353a", bgTertiary: "#404046" },
  },
  ocean: {
    light: { accent: "#4f8bd6", accentHover: "#3b76c0", bgPrimary: "#f0f7fc", bgSecondary: "#e6f2fa", bgTertiary: "#d9ebf7" },
    dark: { accent: "#6ea6e3", accentHover: "#88b6ea", bgPrimary: "#1a2633", bgSecondary: "#243140", bgTertiary: "#2e3d4d" },
  },
  lavender: {
    light: { accent: "#9b7ad9", accentHover: "#8462c3", bgPrimary: "#f8f5fc", bgSecondary: "#f2ecfa", bgTertiary: "#e9dff5" },
    dark: { accent: "#b79cf0", accentHover: "#c9b1f5", bgPrimary: "#2a2533", bgSecondary: "#352f40", bgTertiary: "#403a4d" },
  },
  mint: {
    light: { accent: "#3aa97a", accentHover: "#2e9468", bgPrimary: "#f3faf7", bgSecondary: "#e8f5ef", bgTertiary: "#daf0e5" },
    dark: { accent: "#59c892", accentHover: "#73d6a6", bgPrimary: "#1f2e28", bgSecondary: "#293933", bgTertiary: "#33443e" },
  },
  sunset: {
    light: { accent: "#e07b5f", accentHover: "#c9654d", bgPrimary: "#fcf6f4", bgSecondary: "#faf0ec", bgTertiary: "#f5e6e0" },
    dark: { accent: "#f2a08c", accentHover: "#f6b1a1", bgPrimary: "#2e2623", bgSecondary: "#39312d", bgTertiary: "#443c38" },
  },
  custom: {
    light: { accent: "#a8b5c8", accentHover: "#8fa3bc", bgPrimary: "#fafafa", bgSecondary: "#f5f5f5", bgTertiary: "#ececec" },
    dark: { accent: "#9ca8ba", accentHover: "#b4bfce", bgPrimary: "#2a2a2e", bgSecondary: "#35353a", bgTertiary: "#404046" },
  },
};

// Color manipulation functions
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToHex = (r, g, b) => {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join('');
};

const darkenColor = (hex, percent) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const factor = (100 - percent) / 100;
  return rgbToHex(
    Math.round(rgb.r * factor),
    Math.round(rgb.g * factor),
    Math.round(rgb.b * factor)
  );
};

const lightenColor = (hex, percent) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const factor = percent / 100;
  return rgbToHex(
    Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor)),
    Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor)),
    Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor))
  );
};

const generateCustomPalette = (baseColor) => {
  const accentHover = darkenColor(baseColor, 15);
  
  // Generate light theme backgrounds with subtle tint
  const rgb = hexToRgb(baseColor);
  const bgPrimaryLight = lightenColor(baseColor, 95);
  const bgSecondaryLight = lightenColor(baseColor, 90);
  const bgTertiaryLight = lightenColor(baseColor, 85);
  
  // Generate dark theme - darker versions of the base color
  const bgPrimaryDark = darkenColor(baseColor, 85);
  const bgSecondaryDark = darkenColor(baseColor, 80);
  const bgTertiaryDark = darkenColor(baseColor, 75);
  const accentDark = lightenColor(baseColor, 10);
  const accentHoverDark = lightenColor(baseColor, 20);
  
  palettes.custom = {
    light: {
      accent: baseColor,
      accentHover: accentHover,
      bgPrimary: bgPrimaryLight,
      bgSecondary: bgSecondaryLight,
      bgTertiary: bgTertiaryLight
    },
    dark: {
      accent: accentDark,
      accentHover: accentHoverDark,
      bgPrimary: bgPrimaryDark,
      bgSecondary: bgSecondaryDark,
      bgTertiary: bgTertiaryDark
    }
  };
};

const applyPalette = (paletteId) => {
  const palette = palettes[paletteId] || palettes.slate;
  const isDark = document.body.classList.contains("dark-theme");
  const colors = isDark ? palette.dark : palette.light;
  const root = document.documentElement;

  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--accent-hover", colors.accentHover);
  root.style.setProperty("--bg-primary", colors.bgPrimary);
  root.style.setProperty("--bg-secondary", colors.bgSecondary);
  root.style.setProperty("--bg-tertiary", colors.bgTertiary);
};

const setPalette = (paletteId) => {
  currentPaletteId = paletteId;
  applyPalette(paletteId);
  chrome.storage.local.set({ palette: paletteId });
  updatePaletteSelection();
};

const updatePaletteSelection = () => {
  const paletteOptions = document.querySelectorAll(".palette-dot-btn");
  paletteOptions.forEach((btn) => {
    const id = btn.getAttribute("data-palette");
    if (id === currentPaletteId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  
  // Handle custom color button
  if (currentPaletteId === "custom") {
    elements.customColorBtn.classList.add("active");
  } else {
    elements.customColorBtn.classList.remove("active");
  }
};

const loadPalette = () => {
  chrome.storage.local.get(["palette", "customColor"], (result) => {
    const paletteId = result.palette || "slate";
    currentPaletteId = paletteId;
    
    // If custom palette, load the custom color
    if (paletteId === "custom" && result.customColor) {
      generateCustomPalette(result.customColor);
      elements.customColorBtn.style.background = result.customColor;
      elements.colorPicker.value = result.customColor;
    }
    
    applyPalette(paletteId);
    updatePaletteSelection();
  });
};

// Timer Functions
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const updateTimerDisplay = () => {
  elements.timerTime.textContent = formatTime(timerState.timeRemaining);
  elements.timerMode.textContent = timerState.phase === "focus" ? "Focus" : "Rest";
  elements.timerMode.className = `timer-mode ${timerState.phase}`;
  elements.timerSkipBtn.style.display = timerState.phase === "rest" ? "flex" : "none";
};

const saveTimerState = () => {
  const payload = {
    mode: timerState.mode,
    phase: timerState.phase,
    isRunning: timerState.isRunning,
    timeRemaining: timerState.timeRemaining,
    startedAt: timerState.startedAt,
    baseRemaining: timerState.baseRemaining,
    pomodoroCount: timerState.pomodoroCount
  };
  chrome.storage.local.set({ timerState: payload });
};

const scheduleTimerAlarm = () => {
  if (!timerState.isRunning || timerState.timeRemaining <= 0) return;
  chrome.runtime.sendMessage({
    type: "scheduleTimerAlarm",
    remainingMs: timerState.timeRemaining * 1000,
    phase: timerState.phase,
  });
};

const clearTimerAlarm = () => {
  chrome.runtime.sendMessage({ type: "clearTimerAlarm" });
};

const applyTimerButtons = () => {
  if (timerState.isRunning) {
    elements.timerStartBtn.style.display = "none";
    elements.timerPauseBtn.style.display = "flex";
  } else {
    elements.timerStartBtn.style.display = "flex";
    elements.timerPauseBtn.style.display = "none";
  }
};

const applyTimerModeUI = () => {
  elements.pomodoroModeBtn.classList.remove("active");
  elements.customModeBtn.classList.remove("active");
  if (timerState.mode === "pomodoro") {
    elements.pomodoroModeBtn.classList.add("active");
    elements.pomodoroSettings.style.display = "flex";
    elements.customSettings.style.display = "none";
  } else {
    elements.customModeBtn.classList.add("active");
    elements.pomodoroSettings.style.display = "none";
    elements.customSettings.style.display = "flex";
  }
};

const syncRemainingFromStart = () => {
  if (!timerState.startedAt || timerState.baseRemaining == null) {
    return;
  }
  const elapsed = Math.floor((Date.now() - timerState.startedAt) / 1000);
  const remaining = timerState.baseRemaining - elapsed;
  timerState.timeRemaining = Math.max(0, remaining);
};

const runTimerInterval = () => {
  if (timerState.interval) {
    clearInterval(timerState.interval);
  }
  timerState.interval = setInterval(() => {
    syncRemainingFromStart();
    updateTimerDisplay();
    if (timerState.timeRemaining <= 0) {
      completeTimerPhase(timerState.startedAt || Date.now(), timerState.phase);
    }
  }, 1000);
};

const getActiveTaskName = () => {
  const activeTask = tasks.find((task) => !task.completed);
  if (activeTask) {
    return String(activeTask.description || activeTask.title || "Focus Session");
  }
  return "Focus Session";
};

const getFocusDurationMins = () => {
  if (timerState.mode === "pomodoro") {
    return timerConfig.pomodoro.focus || 25;
  }
  return timerConfig.custom.focus || 45;
};

const startFocusSessionTracking = () => {
  if (timerState.phase !== "focus") return;
  chrome.runtime.sendMessage({
    type: "START_SESSION",
    payload: {
      taskName: getActiveTaskName(),
      durationMins: getFocusDurationMins()
    }
  });
};

const endFocusSessionTracking = () => {
  if (timerState.phase !== "focus") return;
  chrome.runtime.sendMessage({ type: "END_SESSION" });
};

const startTimer = () => {
  if (timerState.isRunning) return;
  
  timerState.isRunning = true;
  timerState.startedAt = Date.now();
  timerState.baseRemaining = timerState.timeRemaining;
  applyTimerButtons();
  runTimerInterval();
  saveTimerState();
  scheduleTimerAlarm();
  startFocusSessionTracking();
};

const pauseTimer = () => {
  if (!timerState.isRunning) return;
  
  clearTimerAlarm();
  endFocusSessionTracking();
  syncRemainingFromStart();
  timerState.isRunning = false;
  timerState.startedAt = null;
  timerState.baseRemaining = null;
  applyTimerButtons();
  
  if (timerState.interval) {
    clearInterval(timerState.interval);
    timerState.interval = null;
  }
  updateTimerDisplay();
  saveTimerState();
};

const resetTimer = () => {
  pauseTimer();
  clearTimerAlarm();
  
  const duration = timerState.mode === "pomodoro" 
    ? timerConfig.pomodoro.focus 
    : timerConfig.custom.focus;
  
  timerState.timeRemaining = duration * 60;
  timerState.phase = "focus";
  timerState.startedAt = null;
  timerState.baseRemaining = null;
  updateTimerDisplay();
  saveTimerState();
};

const completeTimerPhase = (startTime, phase) => {
  clearTimerAlarm();
  pauseTimer();
  
  // Save session to history
  const actualMinutes = Math.max(0, Math.round((Date.now() - startTime) / 60000));
  const session = {
    mode: timerState.mode,
    phase: phase,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date().toISOString(),
    activeMinutes: actualMinutes,
    duration: phase === "focus" 
      ? (timerState.mode === "pomodoro" ? timerConfig.pomodoro.focus : timerConfig.custom.focus)
      : (timerState.mode === "pomodoro" ? timerConfig.pomodoro.shortBreak : timerConfig.custom.break)
  };
  
  timerState.sessionHistory.push(session);
  saveTimerHistory();
  
  // Show notification
  if (notificationSettings.enabled) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: phase === "focus" ? "Focus Session Complete!" : "Break Complete!",
      message: phase === "focus" ? "Time for a break!" : "Ready to focus again?",
      priority: 2,
      requireInteraction: true
    });
  }
  
  // Switch phase
  if (phase === "focus") {
    timerState.phase = "rest";
    timerState.pomodoroCount++;
    
    // Determine break duration
    const isLongBreak = timerState.mode === "pomodoro" && timerState.pomodoroCount % 4 === 0;
    const breakDuration = timerState.mode === "pomodoro"
      ? (isLongBreak ? timerConfig.pomodoro.longBreak : timerConfig.pomodoro.shortBreak)
      : timerConfig.custom.break;
    
    timerState.timeRemaining = breakDuration * 60;
  } else {
    timerState.phase = "focus";
    const focusDuration = timerState.mode === "pomodoro" 
      ? timerConfig.pomodoro.focus 
      : timerConfig.custom.focus;
    timerState.timeRemaining = focusDuration * 60;
  }
  
  updateTimerDisplay();
  timerState.startedAt = null;
  timerState.baseRemaining = null;
  timerState.isRunning = false;
  applyTimerButtons();
  saveTimerState();
};

const skipBreak = () => {
  if (timerState.phase !== "rest") return;
  clearTimerAlarm();
  pauseTimer();
  timerState.phase = "focus";
  const focusDuration = timerState.mode === "pomodoro" 
    ? timerConfig.pomodoro.focus 
    : timerConfig.custom.focus;
  timerState.timeRemaining = focusDuration * 60;
  timerState.startedAt = null;
  timerState.baseRemaining = null;
  timerState.isRunning = false;
  updateTimerDisplay();
  applyTimerButtons();
  saveTimerState();
};

const saveTimerHistory = () => {
  chrome.storage.local.set({ 
    timerHistory: timerState.sessionHistory.slice(-100) // Keep last 100 sessions
  });
};

const loadTimerHistory = () => {
  chrome.storage.local.get(["timerHistory"], (result) => {
    if (result.timerHistory) {
      timerState.sessionHistory = result.timerHistory;
    }
  });
};

const loadTimerConfig = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["timerConfig"], (result) => {
      if (result.timerConfig) {
        timerConfig = result.timerConfig;
        
        elements.pomodoroFocus.value = timerConfig.pomodoro.focus;
        elements.pomodoroBreak.value = timerConfig.pomodoro.shortBreak;
        elements.pomodoroLongBreak.value = timerConfig.pomodoro.longBreak;
        elements.customFocus.value = timerConfig.custom.focus;
        elements.customBreak.value = timerConfig.custom.break;
      }
      resolve();
    });
  });
};

const loadTimerState = () => {
  chrome.storage.local.get(["timerState"], (result) => {
    if (result.timerState) {
      const saved = result.timerState;
      timerState.mode = saved.mode || timerState.mode;
      timerState.phase = saved.phase || timerState.phase;
      timerState.isRunning = Boolean(saved.isRunning);
      timerState.timeRemaining = typeof saved.timeRemaining === "number" ? saved.timeRemaining : timerState.timeRemaining;
      timerState.startedAt = saved.startedAt || null;
      timerState.baseRemaining = typeof saved.baseRemaining === "number" ? saved.baseRemaining : null;
      timerState.pomodoroCount = typeof saved.pomodoroCount === "number" ? saved.pomodoroCount : timerState.pomodoroCount;
    } else {
      const duration = timerState.mode === "pomodoro" 
        ? timerConfig.pomodoro.focus 
        : timerConfig.custom.focus;
      timerState.timeRemaining = duration * 60;
      timerState.phase = "focus";
    }

    applyTimerModeUI();
    if (timerState.isRunning) {
      syncRemainingFromStart();
      if (timerState.timeRemaining <= 0) {
        completeTimerPhase(timerState.startedAt || Date.now(), timerState.phase);
        return;
      }
      scheduleTimerAlarm();
      applyTimerButtons();
      runTimerInterval();
    } else {
      applyTimerButtons();
      updateTimerDisplay();
      saveTimerState();
    }
  });
};

const saveTimerConfig = () => {
  timerConfig.pomodoro.focus = parseInt(elements.pomodoroFocus.value) || 25;
  timerConfig.pomodoro.shortBreak = parseInt(elements.pomodoroBreak.value) || 5;
  timerConfig.pomodoro.longBreak = parseInt(elements.pomodoroLongBreak.value) || 15;
  timerConfig.custom.focus = parseInt(elements.customFocus.value) || 45;
  timerConfig.custom.break = parseInt(elements.customBreak.value) || 10;
  
  chrome.storage.local.set({ timerConfig });
  resetTimer();
};

const setTimerMode = (mode) => {
  timerState.mode = mode;
  
  applyTimerModeUI();
  resetTimer();
};

const loadStreak = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["streakData"], (result) => {
      // Just load data for display, dashboard handles the logic update
      if (result.streakData) {
        streakData = result.streakData;
        updateStreakUI();
      }
      resolve();
    });
  });
};

const updateStreakUI = () => {
  if (!elements.popupStreak) return;
  
  const count = streakData.count;
  elements.popupStreakCount.textContent = count;
  
  if (count >= 3) {
    elements.popupStreak.classList.add("active");
    elements.popupStreak.title = `On fire! ${count} day streak!`;
  } else {
    elements.popupStreak.classList.remove("active");
    const daysLeft = 3 - count;
    elements.popupStreak.title = `${daysLeft} more day${daysLeft > 1 ? 's' : ''} to ignite!`;
  }
};

const loadTheme = () => {
  chrome.storage.local.get(["theme"], (result) => {
    const theme = result.theme || "light";
    applyTheme(theme);
  });
};

const getAutoTheme = () => {
  const hour = new Date().getHours();
  // Dark mode from 6pm (18:00) to 6am (6:00)
  return (hour >= 18 || hour < 6) ? "dark" : "light";
};

const applyTheme = (theme) => {
  let actualTheme = theme;
  
  // If auto mode, determine theme based on time
  if (theme === "auto") {
    actualTheme = getAutoTheme();
  }
  
  // Apply the theme
  if (actualTheme === "dark") {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.remove("dark-theme");
  }
  
  // Update button states
  elements.lightThemeBtn.classList.remove("active");
  elements.darkThemeBtn.classList.remove("active");
  elements.autoThemeBtn.classList.remove("active");
  
  if (theme === "light") {
    elements.lightThemeBtn.classList.add("active");
  } else if (theme === "dark") {
    elements.darkThemeBtn.classList.add("active");
  } else if (theme === "auto") {
    elements.autoThemeBtn.classList.add("active");
  }
  
  // Reapply palette colors for the new theme
  applyPalette(currentPaletteId);
};

const setTheme = (theme) => {
  applyTheme(theme);
  chrome.storage.local.set({ theme });
};

const togglePanel = (panelToShow) => {
  const panels = [elements.settingsPanel, elements.taskListPanel, elements.addTaskPanel];
  panels.forEach((panel) => {
    if (panel === panelToShow) {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    } else {
      panel.style.display = "none";
    }
  });
};

const normalizeTaskType = (type) => {
  if (type === "event") return "task";
  return type || "task";
};

const updateTaskCount = () => {
  const remaining = tasks.filter((task) => !task.completed).length;
  elements.taskCount.textContent = remaining;
};

const loadTasks = () => {
  chrome.storage.local.get(["tasks"], (result) => {
    let migrated = false;
    tasks = (result.tasks || []).map((task) => {
      const type = normalizeTaskType(task.type);
      if (type !== task.type) migrated = true;
      return { ...task, type };
    });
    if (migrated) {
      saveTasks();
    }
    renderTasks();
    updateTaskCount();
  });
};

const saveTasks = () => {
  chrome.storage.local.set({ tasks });
  updateTaskCount();
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
      resolve(taskHistory);
    });
  });

const saveTaskHistory = () => {
  chrome.storage.local.set({ taskHistory });
};

const archiveTask = (task) => {
  if (!task) return;
  const archivedAt = new Date().toISOString();
  taskHistory = pruneTaskHistory([{ ...task, archivedAt }, ...taskHistory]).slice(0, 200);
  saveTaskHistory();
};

const completeAndArchiveTask = (task) => {
  if (!task) return;
  const completedAt = task.completedAt || new Date().toISOString();
  const archived = { ...task, completed: true, completedAt };
  archiveTask(archived);
  tasks = tasks.filter((t) => t.id !== task.id);
  saveTasks();
  renderTasks();
  updateCurrentTask();
};

const addTask = async () => {
  const description = elements.taskInput.value.trim();
  if (!description) return;

  const deadlineDate = getDateValue();
  const deadlineTime = elements.taskDeadlineTime.value;
  
  let deadline = null;
  if (deadlineDate) {
    const timeStr = deadlineTime ? getTimeValue() : "23:59";
    deadline = `${deadlineDate}T${timeStr}`;
  }

  const taskType = normalizeTaskType(selectedTaskType);
  const newTask = {
    id: Date.now().toString(),
    description,
    type: taskType,
    deadline: deadline,
    status: "not-started",
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();
  updateCurrentTask();
  fetchAiSuggestions(newTask, true);
  
  // Google Calendar integration disabled until Chrome Web Store publication
  // Will be enabled when extension is published and OAuth is configured
  
  // Reset form
  elements.taskInput.value = "";
  elements.taskDeadlineDate.value = "";
  elements.taskDeadlineTime.value = "";
  elements.addTaskPanel.style.display = "none";
  
  // Optionally call API to split task
  try {
    const response = await apiRequest("/api/tasks", {
      method: "POST",
      body: { title: description, description, type: taskType, deadline },
    });
    if (response.ok && response.data?.subtasks) {
      const index = tasks.findIndex((task) => task.id === newTask.id);
      if (index >= 0) {
        tasks[index] = { ...tasks[index], subtasks: response.data.subtasks };
        saveTasks();
        renderTasks();
        updateCurrentTask();
      }
    }
  } catch (error) {
    // Silently fail, task is already added locally
  }
};

const setAiSuggestionStatus = (message) => {
  if (elements.aiSuggestionStatus) {
    elements.aiSuggestionStatus.textContent = message || "";
  }
};

const renderAiSuggestions = (task) => {
  if (!elements.aiSuggestionPanel || !elements.aiSuggestionList) return;
  if (!task) {
    elements.aiSuggestionPanel.style.display = "none";
    elements.aiSuggestionList.innerHTML = "";
    setAiSuggestionStatus("");
    return;
  }
  elements.aiSuggestionPanel.style.display = "block";
  const suggestions = Array.isArray(task.aiSuggestionSlots) ? task.aiSuggestionSlots : [];
  elements.aiSuggestionList.innerHTML = suggestions
    .map((item, index) => {
      const start = new Date(item.start);
      const timeLabel = Number.isNaN(start.getTime())
        ? "Time TBD"
        : `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`;
      const durationLabel = Number.isFinite(item.durationMin) ? `${item.durationMin} min` : "";
      const selected = task.aiSelectedSuggestionIndex === index;
      return `<li>
        <div>${item.title}</div>
        <div>${timeLabel}${durationLabel ? ` • ${durationLabel}` : ""}</div>
        <div class="ai-suggestion-actions">
          <button class="ai-suggestion-btn ai-suggestion-select ${selected ? "selected" : ""}" data-suggestion="${encodeURIComponent(
        String(index)
      )}">${selected ? "Selected" : "Select"}</button>
          <button class="ai-suggestion-btn ai-suggestion-calendar" data-suggestion="${encodeURIComponent(
            String(index)
          )}">Create Event</button>
        </div>
      </li>`;
    })
    .join("");
  if (suggestions.length === 0) {
    setAiSuggestionStatus("No suggestions yet.");
  } else {
    setAiSuggestionStatus("");
  }
  elements.aiSuggestionList.querySelectorAll(".ai-suggestion-select").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.getAttribute("data-suggestion") || "";
      const index = Number(decodeURIComponent(raw));
      if (!Number.isFinite(index)) return;
      task.aiSelectedSuggestionIndex = index;
      saveTasks();
      renderTasks();
      updateCurrentTask();
    });
  });
  elements.aiSuggestionList.querySelectorAll(".ai-suggestion-calendar").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const raw = btn.getAttribute("data-suggestion") || "";
      const index = Number(decodeURIComponent(raw));
      if (!Number.isFinite(index)) return;
      const slot = suggestions[index];
      if (!slot) return;
      await createSuggestionCalendarEvent(task, slot);
    });
  });
};

const createSuggestionCalendarEvent = async (task, suggestion) => {
  const token = await ensureCalendarToken(true, "Google Calendar sign-in required.");
  if (!token) return;
  const start = new Date(suggestion.start);
  if (Number.isNaN(start.getTime())) {
    setAiSuggestionStatus("Suggestion time is invalid.");
    return;
  }
  const durationMin = Number.isFinite(suggestion.durationMin) ? suggestion.durationMin : 60;
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  const eventData = {
    summary: `✨ ${suggestion.title || "Suggested slot"}`,
    description: `Suggested from task: ${task.description}`,
    start: {
      dateTime: start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };
  const calendarId = getSelectedCalendarId();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    }
  );
  if (response.ok) {
    setAiSuggestionStatus("Event created.");
    return;
  }
  if (response.status === 401 || response.status === 403) {
    await removeCalendarToken(token);
    return createSuggestionCalendarEvent(task, suggestion);
  }
  setAiSuggestionStatus("Unable to create event.");
};

const fetchAiSuggestions = async (task, force = false) => {
  if (!task) return;
  if (!force && task.aiSuggestionRequested) {
    renderAiSuggestions(task);
    return;
  }
  if (elements.aiSuggestBtn) {
    elements.aiSuggestBtn.disabled = true;
  }
  task.aiSuggestionRequested = true;
  saveTasks();
  setAiSuggestionStatus("Generating suggestions...");
  try {
    const response = await apiRequest("/api/analyze/schedule-suggestions", {
      method: "POST",
      body: {
        task: {
          description: task.description,
          type: task.type,
          deadline: task.deadline,
        },
      },
    });
    if (response.ok && Array.isArray(response.data?.suggestions)) {
      task.aiSuggestionSlots = response.data.suggestions.slice(0, 5);
      task.aiSuggestionSource = response.data?.source || "minimax";
      saveTasks();
      renderTasks();
      updateCurrentTask();
      setAiSuggestionStatus("Suggestions ready.");
    } else {
      setAiSuggestionStatus("Unable to get suggestions.");
    }
  } catch (error) {
    setAiSuggestionStatus("Unable to get suggestions.");
  }
  if (elements.aiSuggestBtn) {
    elements.aiSuggestBtn.disabled = false;
  }
};

const requestCalendarToken = (interactive = true) =>
  new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        resolve({ token: null, error: chrome.runtime.lastError });
      } else {
        resolve({ token, error: null });
      }
    });
  });

const removeCalendarToken = (token) =>
  new Promise((resolve) => {
    if (!token) {
      resolve();
      return;
    }
    chrome.identity.removeCachedAuthToken({ token }, () => resolve());
  });

const ensureCalendarToken = async (interactive = true, message) => {
  const { token, error } = await requestCalendarToken(interactive);
  if (!token || error) {
    if (message) {
      const details = error?.message ? ` (${error.message})` : "";
      setCalendarStatus(`${message}${details}`);
    }
    return null;
  }
  return token;
};

const getSelectedCalendarId = () => elements.calendarSelect?.value || "primary";

const populateCalendarSelect = (calendars = [], selectedId) => {
  if (!elements.calendarSelect) return;
  const select = elements.calendarSelect;
  select.innerHTML = "";
  const primaryOption = document.createElement("option");
  primaryOption.value = "primary";
  primaryOption.textContent = "Primary";
  select.appendChild(primaryOption);
  calendars.forEach((calendar) => {
    if (!calendar?.id || calendar.id === "primary") return;
    const option = document.createElement("option");
    option.value = calendar.id;
    option.textContent = calendar.summary || calendar.id;
    select.appendChild(option);
  });
  select.value = selectedId || "primary";
};

const loadCalendarSelection = () =>
  new Promise((resolve) => {
    chrome.storage.local.get([CALENDAR_STORAGE_KEY], (result) => {
      const selectedId = result[CALENDAR_STORAGE_KEY] || "primary";
      populateCalendarSelect([], selectedId);
      resolve(selectedId);
    });
  });

const loadCalendarList = async () => {
  try {
    const token = await ensureCalendarToken(false, "Sign in to load calendars.");
    if (!token) {
      return;
    }
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await removeCalendarToken(token);
        const retryToken = await ensureCalendarToken(true, "Google Calendar sign-in required.");
        if (!retryToken) return;
        return loadCalendarList();
      }
      setCalendarStatus("Unable to load calendar list.");
      return;
    }
    const payload = await response.json();
    const calendars = Array.isArray(payload.items) ? payload.items : [];
    chrome.storage.local.get([CALENDAR_STORAGE_KEY], (result) => {
      populateCalendarSelect(calendars, result[CALENDAR_STORAGE_KEY]);
    });
  } catch (error) {
    setCalendarStatus("Unable to load calendar list.");
  }
};

const addToGoogleCalendar = async (task) => {
  try {
    let token = await ensureCalendarToken(true, "Google Calendar sign-in required.");

    if (!token) {
      return null;
    }

    const deadline = new Date(task.deadline);
    const typeEmoji = task.type === "assignment" ? "📝" : task.type === "exam" ? "📝" : "📌";
    const eventData = {
      summary: `${typeEmoji} ${task.description}`,
      description: `Task Type: ${task.type}\nCreated from Focus Tutor Extension`,
      start: {
        dateTime: deadline.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(deadline.getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "popup", minutes: 1440 },
        ],
      },
    };

    const calendarId = getSelectedCalendarId();
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    }
    );

    if (response.status === 401 || response.status === 403) {
      await removeCalendarToken(token);
      token = await ensureCalendarToken(true, "Google Calendar sign-in required.");
      if (!token) return null;
      return addToGoogleCalendar(task);
    }
    if (response.ok) {
      const payload = await response.json();
      return payload?.id || null;
    } else {
      await response.text();
      return null;
    }
  } catch (error) {
    return null;
  }
};

const setCalendarStatus = (message) => {
  if (elements.calendarSyncStatus) {
    elements.calendarSyncStatus.textContent = message || "";
  }
};

const exportTasksToGoogleCalendar = async () => {
  if (!elements.exportCalendarBtn) return;
  elements.exportCalendarBtn.disabled = true;
  setCalendarStatus("Exporting tasks...");
  const candidates = tasks.filter((task) => task.deadline && !task.calendarEventId);
  if (candidates.length === 0) {
    setCalendarStatus("No new tasks with deadlines to export.");
    elements.exportCalendarBtn.disabled = false;
    return;
  }
  let exported = 0;
  for (const task of candidates) {
    const eventId = await addToGoogleCalendar(task);
    if (eventId) {
      task.calendarEventId = eventId;
      exported += 1;
    }
  }
  saveTasks();
  renderTasks();
  updateCurrentTask();
  setCalendarStatus(`Exported ${exported} task${exported === 1 ? "" : "s"}.`);
  elements.exportCalendarBtn.disabled = false;
};

const parseTaskTypeFromDescription = (description = "") => {
  const match = String(description).match(/Task Type:\s*(assignment|exam|task)/i);
  if (match) return normalizeTaskType(match[1].toLowerCase());
  return "task";
};

const buildTaskFromCalendarEvent = (event) => {
  const start = event?.start?.dateTime || event?.start?.date;
  if (!start) return null;
  const eventTime = event.start.dateTime
    ? new Date(event.start.dateTime)
    : new Date(`${event.start.date}T09:00:00`);
  const description = event.summary || "Untitled event";
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    description,
    type: parseTaskTypeFromDescription(event.description),
    deadline: eventTime.toISOString().slice(0, 16),
    status: "not-started",
    completed: false,
    createdAt: new Date().toISOString(),
    calendarEventId: event.id,
  };
};

const importTasksFromGoogleCalendar = async () => {
  if (!elements.importCalendarBtn) return;
  elements.importCalendarBtn.disabled = true;
  setCalendarStatus("Importing events...");
  try {
    let token = await ensureCalendarToken(true, "Google Calendar sign-in required.");
    if (!token) {
      elements.importCalendarBtn.disabled = false;
      return;
    }
    const timeMin = new Date().toISOString();
    const calendarId = getSelectedCalendarId();
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?timeMin=${encodeURIComponent(
        timeMin
      )}&singleEvents=true&orderBy=startTime&maxResults=20`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await removeCalendarToken(token);
        token = await ensureCalendarToken(true, "Google Calendar sign-in required.");
        if (!token) {
          elements.importCalendarBtn.disabled = false;
          return;
        }
        return importTasksFromGoogleCalendar();
      }
      setCalendarStatus("Failed to fetch calendar events.");
      elements.importCalendarBtn.disabled = false;
      return;
    }
    const payload = await response.json();
    const items = Array.isArray(payload.items) ? payload.items : [];
    const existingIds = new Set(tasks.map((task) => task.calendarEventId).filter(Boolean));
    const newTasks = items
      .filter((event) => event.id && !existingIds.has(event.id))
      .map(buildTaskFromCalendarEvent)
      .filter(Boolean);
    if (newTasks.length === 0) {
      setCalendarStatus("No new events to import.");
      elements.importCalendarBtn.disabled = false;
      return;
    }
    tasks = [...tasks, ...newTasks];
    saveTasks();
    renderTasks();
    updateCurrentTask();
    setCalendarStatus(`Imported ${newTasks.length} event${newTasks.length === 1 ? "" : "s"}.`);
  } catch (error) {
    setCalendarStatus("Calendar import failed.");
  }
  elements.importCalendarBtn.disabled = false;
};

const setTaskType = (type) => {
  selectedTaskType = normalizeTaskType(type);
  [elements.typeAssignment, elements.typeExam, elements.typeTask].forEach((btn) => {
    btn.classList.remove("active");
  });
  
  if (selectedTaskType === "assignment") {
    elements.typeAssignment.classList.add("active");
  } else if (selectedTaskType === "exam") {
    elements.typeExam.classList.add("active");
  } else {
    elements.typeTask.classList.add("active");
  }
};

const toggleTask = (taskId) => {
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    if (!task.completed) {
      const completedTask = {
        ...task,
        completed: true,
        status: task.status || "completed",
        completedAt: new Date().toISOString(),
      };
      completeAndArchiveTask(completedTask);
      return;
    }
    task.completed = false;
    task.completedAt = null;
    saveTasks();
    renderTasks();
    updateCurrentTask();
  }
};

const updateCurrentTask = () => {
  // Find first incomplete task
  const activeTask = tasks.find((t) => !t.completed);
  
  if (!activeTask) {
    elements.currentTaskTitle.textContent = "No active task";
    elements.progressContainer.style.display = "none";
    elements.currentTaskDisplay.classList.remove("compact");
    renderAiSuggestions(null);
    return;
  }

  currentTaskIndex = tasks.indexOf(activeTask);
  elements.currentTaskTitle.textContent = activeTask.description;
  elements.progressContainer.style.display = "block";
  elements.currentTaskDisplay.classList.add("compact");
  
  // Update progress bar and status buttons
  const status = activeTask.status || "not-started";
  updateProgressBar(status);
  updateStatusButtons(status);
  renderAiSuggestions(activeTask);
  fetchAiSuggestions(activeTask);
};

const updateProgressBar = (status) => {
  const widths = {
    "not-started": "0%",
    "ongoing": "50%",
    "completed": "100%",
  };
  elements.progressBar.style.width = widths[status] || "0%";
};

const updateStatusButtons = (status) => {
  [elements.statusNotStarted, elements.statusOngoing, elements.statusCompleted].forEach((btn) => {
    btn.classList.remove("active");
  });
  
  if (status === "not-started") {
    elements.statusNotStarted.classList.add("active");
  } else if (status === "ongoing") {
    elements.statusOngoing.classList.add("active");
  } else if (status === "completed") {
    elements.statusCompleted.classList.add("active");
  }
};

const setTaskStatus = (status) => {
  const activeTask = tasks.find((t) => !t.completed);
  if (!activeTask) return;
  
  activeTask.status = status;
  if (status === "completed") {
    const completedTask = {
      ...activeTask,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    completeAndArchiveTask(completedTask);
    return;
  }
  
  saveTasks();
  renderTasks();
  updateCurrentTask();
};

const detectTaskProgress = async () => {
  const activeTask = tasks.find((t) => !t.completed);
  if (!activeTask) return;

  // Show analyzing state
  elements.progressDetection.textContent = "🔍 Analyzing...";
  elements.progressDetection.classList.add("analyzing");
  elements.progressConfidence.textContent = "";
  
  // Clear detected badges
  [elements.statusNotStarted, elements.statusOngoing, elements.statusCompleted].forEach((btn) => {
    btn.classList.remove("detected");
  });

  try {
    // Get current tabs
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const context = buildContext(tabs);
    
    // Call API to analyze task progress
    const response = await apiRequest("/api/analysis/task-progress", {
      method: "POST",
      body: {
        task: activeTask.description,
        currentStatus: activeTask.status || "not-started",
        tabs: context.tabs.map((t) => ({
          title: t.title,
          url: t.url,
          active: t.active,
        })),
      },
    });

    if (response.ok && response.data) {
      const { detectedStatus, confidence, reasoning } = response.data;
      
      // Update UI with detection results
      elements.progressDetection.textContent = `📊 Detected: ${detectedStatus}`;
      elements.progressDetection.classList.remove("analyzing");
      
      // Show confidence level
      if (confidence) {
        const confidencePercent = Math.round(confidence * 100);
        elements.progressConfidence.textContent = `${confidencePercent}% confidence`;
        
        if (confidence >= 0.7) {
          elements.progressConfidence.className = "progress-confidence high";
        } else if (confidence >= 0.4) {
          elements.progressConfidence.className = "progress-confidence medium";
        } else {
          elements.progressConfidence.className = "progress-confidence low";
        }
      }
      
      // Mark detected status button
      if (detectedStatus === "not-started") {
        elements.statusNotStarted.classList.add("detected");
      } else if (detectedStatus === "ongoing") {
        elements.statusOngoing.classList.add("detected");
      } else if (detectedStatus === "completed") {
        elements.statusCompleted.classList.add("detected");
      }
      
      // Auto-update if confidence is high and status changed
      if (confidence >= 0.7 && detectedStatus !== activeTask.status) {
        // Wait a moment to show the detection, then update
        setTimeout(() => {
          setTaskStatus(detectedStatus);
        }, 1500);
      }
    } else {
      // Fallback to local analysis
      localProgressDetection(activeTask, context);
    }
  } catch (error) {
    // Fallback to local analysis
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const context = buildContext(tabs);
    localProgressDetection(activeTask, context);
  }
};

const localProgressDetection = (task, context) => {
  elements.progressDetection.textContent = "📊 Local analysis";
  elements.progressDetection.classList.remove("analyzing");
  
  // Simple heuristic: check if task keywords appear in tab titles
  const taskKeywords = task.description.toLowerCase().split(" ").filter((w) => w.length > 3);
  const tabTitles = context.tabs.map((t) => t.title.toLowerCase()).join(" ");
  
  const matchCount = taskKeywords.filter((keyword) => tabTitles.includes(keyword)).length;
  const matchRatio = taskKeywords.length > 0 ? matchCount / taskKeywords.length : 0;
  
  let detectedStatus = "not-started";
  if (matchRatio >= 0.5) {
    detectedStatus = "ongoing";
  }
  if (matchRatio >= 0.8 && context.tabs.length > 3) {
    detectedStatus = "completed";
  }
  
  elements.progressConfidence.textContent = `${Math.round(matchRatio * 100)}% match`;
  elements.progressConfidence.className = "progress-confidence medium";
  
  if (detectedStatus === "ongoing") {
    elements.statusOngoing.classList.add("detected");
  }
};

const deleteTask = (taskId) => {
  tasks = tasks.filter((t) => t.id !== taskId);
  saveTasks();
  renderTasks();
  updateCurrentTask();
};

const renderTaskList = (listEl, items) => {
  listEl.innerHTML = items
    .map(
      (task) => `
      <li>
        <input 
          type="checkbox" 
          ${task.completed ? "checked" : ""}
          data-task-id="${task.id}"
        />
        <label style="${task.completed ? "text-decoration: line-through; opacity: 0.6;" : ""}">
          ${task.description}
        </label>
        <button class="delete-task-btn" data-task-id="${task.id}" title="Delete task">🗑️</button>
      </li>
    `
    )
    .join("");
};

const renderTasks = () => {
  const assignments = tasks.filter((task) => task.type === "assignment");
  const exams = tasks.filter((task) => task.type === "exam");
  const misc = tasks.filter((task) => task.type === "task" || !task.type);

  elements.assignmentCount.textContent = assignments.length;
  elements.examCount.textContent = exams.length;
  elements.taskCountList.textContent = misc.length;

  renderTaskList(elements.assignmentList, assignments);
  renderTaskList(elements.examList, exams);
  renderTaskList(elements.taskList, misc);

  const total = assignments.length + exams.length + misc.length;
  if (total === 0) {
    elements.subtasksStatus.style.display = "block";
    elements.subtasksStatus.textContent = "No tasks yet";
  } else {
    elements.subtasksStatus.style.display = "none";
  }

  document.querySelectorAll('.task-list input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      toggleTask(e.target.dataset.taskId);
    });
  });
  
  document.querySelectorAll('.delete-task-btn').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      deleteTask(e.target.dataset.taskId);
    });
  });
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 2000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

const checkApiHealth = async (apiBaseUrl) => {
  try {
    const response = await fetchWithTimeout(`${apiBaseUrl}/health`, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
};

const ensureApiBaseUrl = async () => {
  const current = await getApiBaseUrl();
  const candidates = [current, "http://127.0.0.1:5174"];
  for (const apiBaseUrl of candidates) {
    if (!apiBaseUrl) continue;
    const ok = await checkApiHealth(apiBaseUrl);
    if (ok) {
      if (apiBaseUrl !== current) {
        await setApiBaseUrl(apiBaseUrl);
        elements.apiBaseUrl.value = apiBaseUrl;
      }
      return apiBaseUrl;
    }
  }
  return current;
};

const renderTabList = (entries) => {
  elements.analysisList.innerHTML = entries
    .slice(0, 5)
    .map((tab) => `<li><span>${tab.title}</span><small>${tab.url}</small></li>`)
    .join("");
};

const scoreContext = (context) => {
  const lower = context.toLowerCase();
  const focusWords = ["task", "study", "build", "learn"];
  const distractions = ["youtube", "netflix", "gaming", "social"];
  const focusScore = focusWords.some((word) => lower.includes(word)) ? 0.7 : 0.4;
  const distractionPenalty = distractions.some((word) => lower.includes(word)) ? 0.3 : 0;
  return Math.max(0, Math.min(1, focusScore - distractionPenalty));
};

const buildContext = (tabs) => {
  const entries = tabs
    .filter((tab) => tab?.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://"))
    .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0)) // Sort by most recently accessed
    .slice(0, 20) // Get last 20 accessed tabs
    .map((tab) => ({
      title: tab.title || "Untitled",
      url: tab.url,
      active: tab.active || false,
      lastAccessed: tab.lastAccessed,
    }));
  return { tabs: entries, count: entries.length };
};

const buildTabContext = async () => {
  const tabs = await chrome.tabs.query({});
  const { tabs: entries, count } = buildContext(tabs);
  const context = entries.map((tab) => `${tab.title} - ${tab.url}`).join(" | ");
  return { context, count, entries };
};

const analyzeTabs = async () => {
  const { context, count, entries } = await buildTabContext();
  if (!context) {
    elements.analysisStatus.textContent = "No tabs to analyze";
    elements.analysisScore.textContent = "Focus score: --";
    elements.analysisMeta.textContent = "Tabs analyzed: 0";
    elements.analysisList.innerHTML = "";
    return;
  }
  renderTabList(entries);
  elements.analysisStatus.textContent = "Analyzing...";
  elements.analysisMeta.textContent = `Tabs analyzed: ${count}`;
  try {
    const response = await apiRequest("/api/analyze", { method: "POST", body: { context } });
    if (!response.ok) {
      const score = scoreContext(context);
      elements.analysisStatus.textContent = "Local analysis";
      elements.analysisScore.textContent = `Focus score: ${score.toFixed(2)}`;
      return;
    }
    const score = response.data?.score;
    elements.analysisStatus.textContent = "Analysis complete";
    elements.analysisScore.textContent =
      typeof score === "number" ? `Focus score: ${score.toFixed(2)}` : "Focus score: --";
  } catch {
    const score = scoreContext(context);
    elements.analysisStatus.textContent = "Local analysis";
    elements.analysisScore.textContent = `Focus score: ${score.toFixed(2)}`;
  }
};

const loadNotificationSettings = () => {
  chrome.storage.local.get(["notificationSettings"], (result) => {
    if (result.notificationSettings) {
      notificationSettings = result.notificationSettings;
    }
    
    // Update UI
    elements.enableNotifications.checked = notificationSettings.enabled;
    elements.distractionAlerts.checked = notificationSettings.distractionAlerts;
    elements.breakReminders.checked = notificationSettings.breakReminders;
    elements.deadlineReminders.checked = notificationSettings.deadlineReminders;
    elements.taskNudges.checked = notificationSettings.taskNudges;
    elements.focusDuration.value = notificationSettings.focusDuration;
  });
};

const saveNotificationSettings = () => {
  notificationSettings = {
    enabled: elements.enableNotifications.checked,
    distractionAlerts: elements.distractionAlerts.checked,
    breakReminders: elements.breakReminders.checked,
    deadlineReminders: elements.deadlineReminders.checked,
    taskNudges: elements.taskNudges.checked,
    focusDuration: parseInt(elements.focusDuration.value) || 45,
  };
  
  chrome.storage.local.set({ notificationSettings });
  
  // Request notification permission if enabled
  if (notificationSettings.enabled) {
    chrome.permissions.request({ permissions: ['notifications'] });
  }
};

const initAccordion = () => {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const section = header.dataset.section;
      const content = document.querySelector(`.accordion-content[data-section="${section}"]`);
      const isActive = header.classList.contains('active');
      
      // Toggle current section
      if (isActive) {
        header.classList.remove('active');
        content.classList.remove('active');
      } else {
        header.classList.add('active');
        content.classList.add('active');
      }
    });
  });
};

const init = async () => {
  loadTheme();
  loadPalette();
  loadTasks();
  await loadTaskHistory();
  loadNotificationSettings();
  await loadTimerConfig();
  loadTimerState();
  loadTimerHistory();
  initAccordion();
  updateCurrentTask();
  await loadCalendarSelection();
  await loadCalendarList();
  const baseUrl = await ensureApiBaseUrl();
  elements.apiBaseUrl.value = baseUrl;
  await analyzeTabs();
  
  // Run tab analysis and progress detection every 30 seconds
  setInterval(async () => {
    await analyzeTabs();
    await detectTaskProgress();
  }, 30000);
  
  // Check theme every minute for auto mode
  setInterval(() => {
    chrome.storage.local.get(["theme"], (result) => {
      if (result.theme === "auto") {
        applyTheme("auto");
      }
    });
  }, 60000); // Check every minute
};


elements.saveApiBaseUrl.addEventListener("click", async () => {
  const value = elements.apiBaseUrl.value.trim();
  if (!value) return;
  await setApiBaseUrl(value);
});

elements.addTaskBtn.addEventListener("click", () => {
  togglePanel(elements.addTaskPanel);
});

elements.saveTaskBtn.addEventListener("click", addTask);

elements.taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTask();
  }
});

elements.lightThemeBtn.addEventListener("click", () => {
  setTheme("light");
});

elements.darkThemeBtn.addEventListener("click", () => {
  setTheme("dark");
});

elements.autoThemeBtn.addEventListener("click", () => {
  setTheme("auto");
});

elements.openDashboardBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("ui/dashboard/dashboard.html") });
});

if (elements.exportCalendarBtn) {
  elements.exportCalendarBtn.addEventListener("click", exportTasksToGoogleCalendar);
}
if (elements.importCalendarBtn) {
  elements.importCalendarBtn.addEventListener("click", importTasksFromGoogleCalendar);
}
if (elements.calendarSelect) {
  elements.calendarSelect.addEventListener("change", () => {
    const selectedId = getSelectedCalendarId();
    chrome.storage.local.set({ [CALENDAR_STORAGE_KEY]: selectedId });
    setCalendarStatus(`Selected calendar: ${elements.calendarSelect.options[elements.calendarSelect.selectedIndex]?.textContent || "Primary"}`);
  });
}
if (elements.aiSuggestBtn) {
  elements.aiSuggestBtn.addEventListener("click", () => {
    const activeTask = tasks.find((task) => !task.completed);
    if (!activeTask) return;
    fetchAiSuggestions(activeTask, true);
  });
}

elements.settingsBtn.addEventListener("click", () => {
  togglePanel(elements.settingsPanel);
});

elements.taskListBtn.addEventListener("click", () => {
  togglePanel(elements.taskListPanel);
});

elements.statusNotStarted.addEventListener("click", () => {
  setTaskStatus("not-started");
});

elements.statusOngoing.addEventListener("click", () => {
  setTaskStatus("ongoing");
});

elements.statusCompleted.addEventListener("click", () => {
  setTaskStatus("completed");
});

elements.typeAssignment.addEventListener("click", () => {
  setTaskType("assignment");
});

elements.typeExam.addEventListener("click", () => {
  setTaskType("exam");
});

elements.typeTask.addEventListener("click", () => {
  setTaskType("task");
});

// Notification settings event listeners
elements.enableNotifications.addEventListener("change", saveNotificationSettings);
elements.distractionAlerts.addEventListener("change", saveNotificationSettings);
elements.breakReminders.addEventListener("change", saveNotificationSettings);
elements.deadlineReminders.addEventListener("change", saveNotificationSettings);
elements.taskNudges.addEventListener("change", saveNotificationSettings);
elements.focusDuration.addEventListener("change", saveNotificationSettings);

// Palette selection event listeners
document.querySelectorAll(".palette-dot-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const paletteId = btn.getAttribute("data-palette");
    if (paletteId) {
      setPalette(paletteId);
    }
  });
});

// Timer event listeners
elements.timerStartBtn.addEventListener("click", startTimer);
elements.timerPauseBtn.addEventListener("click", pauseTimer);
elements.timerSkipBtn.addEventListener("click", skipBreak);
elements.timerResetBtn.addEventListener("click", resetTimer);

elements.pomodoroModeBtn.addEventListener("click", () => setTimerMode("pomodoro"));
elements.customModeBtn.addEventListener("click", () => setTimerMode("custom"));

// Timer config change listeners
elements.pomodoroFocus.addEventListener("change", saveTimerConfig);
elements.pomodoroBreak.addEventListener("change", saveTimerConfig);
elements.pomodoroLongBreak.addEventListener("change", saveTimerConfig);
elements.customFocus.addEventListener("change", saveTimerConfig);
elements.customBreak.addEventListener("change", saveTimerConfig);

// Custom color picker event listeners
elements.customColorBtn.addEventListener("click", () => {
  const isVisible = elements.colorPickerPanel.style.display === "flex";
  elements.colorPickerPanel.style.display = isVisible ? "none" : "flex";
});

elements.applyCustomColor.addEventListener("click", () => {
  const selectedColor = elements.colorPicker.value;
  generateCustomPalette(selectedColor);
  setPalette("custom");
  
  // Update custom color button to show selected color
  elements.customColorBtn.style.background = selectedColor;
  
  // Save custom color
  chrome.storage.local.set({ customColor: selectedColor });
  
  // Hide color picker panel
  elements.colorPickerPanel.style.display = "none";
});

// Custom Date Picker
let currentDate = new Date();
let selectedDate = null;

function initializeDatePicker() {
  renderCalendar();
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Update month display
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  elements.currentMonth.textContent = `${monthNames[month]} ${year}`;
  
  // Clear previous days
  elements.calendarDays.innerHTML = '';
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  
  // Add previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dayEl = createDayElement(day, true, false);
    elements.calendarDays.appendChild(dayEl);
  }
  
  // Add current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = isCurrentMonth && day === today.getDate();
    const isSelected = selectedDate && 
      selectedDate.getDate() === day && 
      selectedDate.getMonth() === month && 
      selectedDate.getFullYear() === year;
    const dayEl = createDayElement(day, false, isToday, isSelected);
    dayEl.addEventListener('click', () => selectDate(year, month, day));
    elements.calendarDays.appendChild(dayEl);
  }
  
  // Add next month's leading days
  const totalCells = elements.calendarDays.children.length;
  const remainingCells = 42 - totalCells; // 6 rows * 7 days
  for (let day = 1; day <= remainingCells; day++) {
    const dayEl = createDayElement(day, true, false);
    elements.calendarDays.appendChild(dayEl);
  }
}

function createDayElement(day, isOtherMonth, isToday, isSelected) {
  const dayEl = document.createElement('div');
  dayEl.className = 'calendar-day';
  if (isOtherMonth) dayEl.classList.add('other-month');
  if (isToday) dayEl.classList.add('today');
  if (isSelected) dayEl.classList.add('selected');
  dayEl.textContent = day;
  return dayEl;
}

function selectDate(year, month, day) {
  selectedDate = new Date(year, month, day);
  const monthStr = (month + 1).toString().padStart(2, '0');
  const dayStr = day.toString().padStart(2, '0');
  elements.taskDeadlineDate.value = `${monthStr}/${dayStr}/${year}`;
  renderCalendar();
  elements.datePickerDropdown.style.display = 'none';
}

function getDateValue() {
  if (!selectedDate) return '';
  const year = selectedDate.getFullYear();
  const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
  const day = selectedDate.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

elements.prevMonth.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

elements.nextMonth.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

elements.taskDeadlineDate.addEventListener('click', () => {
  const isVisible = elements.datePickerDropdown.style.display === 'block';
  elements.datePickerDropdown.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) {
    currentDate = selectedDate ? new Date(selectedDate) : new Date();
    renderCalendar();
  }
});

// Custom Time Picker
let selectedTime = { hour: 12, minute: 0, period: 'PM' };

function initializeTimePicker() {
  // Generate hours (1-12)
  for (let i = 1; i <= 12; i++) {
    const option = document.createElement('div');
    option.className = 'time-option';
    option.textContent = i.toString().padStart(2, '0');
    option.dataset.value = i;
    option.addEventListener('click', () => selectHour(i, option));
    elements.hourScroll.appendChild(option);
  }
  
  // Generate minutes (00-59)
  for (let i = 0; i < 60; i++) {
    const option = document.createElement('div');
    option.className = 'time-option';
    option.textContent = i.toString().padStart(2, '0');
    option.dataset.value = i;
    option.addEventListener('click', () => selectMinute(i, option));
    elements.minuteScroll.appendChild(option);
  }
  
  // Generate AM/PM
  ['AM', 'PM'].forEach(period => {
    const option = document.createElement('div');
    option.className = 'time-option';
    option.textContent = period;
    option.dataset.value = period;
    option.addEventListener('click', () => selectPeriod(period, option));
    elements.periodScroll.appendChild(option);
  });
}

function selectHour(hour, element) {
  selectedTime.hour = hour;
  elements.hourScroll.querySelectorAll('.time-option').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');
  element.scrollIntoView({ block: 'center' });
  updateTimeDisplay();
}

function selectMinute(minute, element) {
  selectedTime.minute = minute;
  elements.minuteScroll.querySelectorAll('.time-option').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');
  element.scrollIntoView({ block: 'center' });
  updateTimeDisplay();
}

function selectPeriod(period, element) {
  selectedTime.period = period;
  elements.periodScroll.querySelectorAll('.time-option').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');
  element.scrollIntoView({ block: 'center' });
  updateTimeDisplay();
}

function applyTimeSelection() {
  const hourOption = elements.hourScroll.querySelector(`[data-value="${selectedTime.hour}"]`);
  if (hourOption) {
    elements.hourScroll.querySelectorAll('.time-option').forEach(el => el.classList.remove('selected'));
    hourOption.classList.add('selected');
    hourOption.scrollIntoView({ block: 'center' });
  }
  const minuteOption = elements.minuteScroll.querySelector(`[data-value="${selectedTime.minute}"]`);
  if (minuteOption) {
    elements.minuteScroll.querySelectorAll('.time-option').forEach(el => el.classList.remove('selected'));
    minuteOption.classList.add('selected');
    minuteOption.scrollIntoView({ block: 'center' });
  }
  const periodOption = elements.periodScroll.querySelector(`[data-value="${selectedTime.period}"]`);
  if (periodOption) {
    elements.periodScroll.querySelectorAll('.time-option').forEach(el => el.classList.remove('selected'));
    periodOption.classList.add('selected');
    periodOption.scrollIntoView({ block: 'center' });
  }
}

function updateTimeDisplay() {
  const hourStr = selectedTime.hour.toString().padStart(2, '0');
  const minuteStr = selectedTime.minute.toString().padStart(2, '0');
  elements.taskDeadlineTime.value = `${hourStr}:${minuteStr} ${selectedTime.period}`;
}

function parseTimeInput(value) {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)?$/);
  if (!match) return null;
  const rawHour = Number(match[1]);
  const rawMinute = Number(match[2] || 0);
  const period = match[3];
  if (!Number.isFinite(rawHour) || !Number.isFinite(rawMinute)) return null;
  if (rawMinute < 0 || rawMinute > 59) return null;
  let hour = rawHour;
  let resolvedPeriod = period;
  if (period) {
    if (rawHour < 1 || rawHour > 12) return null;
    hour = rawHour;
  } else if (rawHour >= 0 && rawHour <= 23) {
    if (rawHour === 0) {
      hour = 12;
      resolvedPeriod = "AM";
    } else if (rawHour > 12) {
      hour = rawHour - 12;
      resolvedPeriod = "PM";
    } else {
      hour = rawHour;
      resolvedPeriod = rawHour === 12 ? "PM" : "AM";
    }
  } else {
    return null;
  }
  return { hour, minute: rawMinute, period: resolvedPeriod };
}

function getTimeValue() {
  // Convert to 24-hour format for storage
  let hour = selectedTime.hour;
  if (selectedTime.period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (selectedTime.period === 'AM' && hour === 12) {
    hour = 0;
  }
  return `${hour.toString().padStart(2, '0')}:${selectedTime.minute.toString().padStart(2, '0')}`;
}

elements.taskDeadlineTime.addEventListener('click', () => {
  const isVisible = elements.timePickerDropdown.style.display === 'flex';
  elements.timePickerDropdown.style.display = isVisible ? 'none' : 'flex';
  if (!isVisible) {
    applyTimeSelection();
  }
});

elements.taskDeadlineTime.addEventListener('input', () => {
  const parsed = parseTimeInput(elements.taskDeadlineTime.value);
  if (!parsed) return;
  selectedTime = parsed;
  applyTimeSelection();
});

elements.taskDeadlineTime.addEventListener('blur', () => {
  if (!elements.taskDeadlineTime.value) return;
  updateTimeDisplay();
});

// Close pickers when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-time-picker')) {
    elements.timePickerDropdown.style.display = 'none';
  }
  if (!e.target.closest('.custom-date-picker')) {
    elements.datePickerDropdown.style.display = 'none';
  }
});

initializeDatePicker();
initializeTimePicker();

/*
elements.login.addEventListener("click", async () => {});
elements.logout.addEventListener("click", async () => {});
*/

init();
