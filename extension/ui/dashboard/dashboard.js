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
};

let tasks = [];
let currentPaletteId = "slate";
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

// Color manipulation functions for custom palette
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
  const bgPrimaryLight = lightenColor(baseColor, 95);
  const bgSecondaryLight = lightenColor(baseColor, 90);
  const bgTertiaryLight = lightenColor(baseColor, 85);
  
  // Generate dark theme - darker versions of the base color
  const bgPrimaryDark = darkenColor(baseColor, 85);
  const bgSecondaryDark = darkenColor(baseColor, 80);
  const bgTertiaryDark = darkenColor(baseColor, 75);
  const accentDark = lightenColor(baseColor, 10);
  const accentHoverDark = lightenColor(baseColor, 20);
  
  // Use base color for study, slightly warmer tone for entertainment
  const studyColor = baseColor;
  const entertainmentRgb = hexToRgb(baseColor);
  const entertainmentColor = entertainmentRgb ? 
    rgbToHex(
      Math.min(255, entertainmentRgb.r + 30),
      Math.max(0, entertainmentRgb.g - 10),
      Math.max(0, entertainmentRgb.b - 10)
    ) : baseColor;
  
  palettes.custom = {
    light: {
      accent: baseColor,
      accentHover: accentHover,
      study: studyColor,
      entertainment: entertainmentColor,
      bgPrimary: bgPrimaryLight,
      bgSecondary: bgSecondaryLight,
      bgTertiary: bgTertiaryLight
    },
    dark: {
      accent: accentDark,
      accentHover: accentHoverDark,
      study: lightenColor(studyColor, 10),
      entertainment: darkenColor(entertainmentColor, 10),
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
      
      // If custom palette, load the custom color and regenerate palette
      if (paletteId === "custom" && result.customColor) {
        generateCustomPalette(result.customColor);
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
    tasks = response.data || [];
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
    tasks = result.tasks || [];
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
    body: { description },
  });

  if (response.ok && response.data) {
    tasks.push({ ...newTask, subtasks: response.data.subtasks || [] });
  } else {
    tasks.push(newTask);
  }

  saveLocalTasks();
  renderTasks();
  updateInsights();
  elements.newTaskInput.value = "";
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

const calculatePeakHour = () => {
  let maxScore = -1;
  let bestHour = null;
  for (const [hour, data] of Object.entries(dailyStats.hourlyScores)) {
    if (data.count < 2) continue; // Need at least 2 samples (1 min)
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

const toggleTask = (taskId) => {
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
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
            ${task.description}
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
  const completed = tasks.filter((t) => t.completed).length;
  elements.tasksCompleted.textContent = completed;
  
  const totalTasks = tasks.length;
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
  if (!response.ok) {
    score = scoreContext(context);
    elements.analysisStatus.textContent = "Local analysis";
  } else {
    score = response.data?.score ?? scoreContext(context);
    elements.analysisStatus.textContent = "Analysis complete";
  }
  
  elements.focusScoreValue.textContent = typeof score === "number" ? score.toFixed(2) : "--";
  elements.analysisMeta.textContent = `Tabs analyzed: ${count}`;
  elements.focusProgressBar.style.width = `${(score * 100).toFixed(0)}%`;
  
  // Behavioral Analysis Updates
  const isStudy = score >= 0.5;
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

const checkForAIInsights = (sessions) => {
  // Show AI insights if user has at least 5 focus sessions
  const focusSessions = sessions.filter(s => s.phase === "focus");
  
  if (focusSessions.length >= 5) {
    elements.aiInsights.style.display = "block";
    
    // Calculate patterns for AI analysis
    const patterns = analyzeSessionPatterns(focusSessions);
    
    // Generate insight text (placeholder for Person 2's AI integration)
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
    
    insightText += `\n💡 AI Feedback Integration Point: This data is ready for Person 2's learning style analysis to provide personalized recommendations.`;
    
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
  await loadTimerSessions();
  
  // Refresh timer stats every 30 seconds
  setInterval(loadTimerSessions, 30000);
};

init();

// Listen for storage changes to sync palette and theme from popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.palette) {
      const newPaletteId = changes.palette.newValue;
      if (newPaletteId && newPaletteId !== currentPaletteId) {
        currentPaletteId = newPaletteId;
        
        // If custom palette, also check for custom color
        if (newPaletteId === "custom") {
          chrome.storage.local.get(["customColor"], (result) => {
            if (result.customColor) {
              generateCustomPalette(result.customColor);
            }
            applyPalette(newPaletteId);
            updatePaletteMenuSelection();
          });
        } else {
          applyPalette(newPaletteId);
          updatePaletteMenuSelection();
        }
      }
    }
    
    if (changes.customColor && currentPaletteId === "custom") {
      const newColor = changes.customColor.newValue;
      if (newColor) {
        generateCustomPalette(newColor);
        applyPalette("custom");
      }
    }
    
    if (changes.theme) {
      const newTheme = changes.theme.newValue;
      if (newTheme) {
        applyTheme(newTheme);
        // Re-apply palette to update colors for new theme
        applyPalette(currentPaletteId);
      }
    }
  }
});

elements.addTaskBtn.addEventListener("click", addTask);
elements.newTaskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTask();
  }
});
elements.themeToggle.addEventListener("click", toggleTheme);
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
