const elements = {
  historyList: document.getElementById("historyList"),
  themeToggle: document.getElementById("themeToggle"),
};

const TASK_HISTORY_RETENTION_DAYS = 30;
let tasks = [];
let currentPaletteId = "slate";

const palettes = {
  slate: {
    light: { accent: "#a8b5c8", accentHover: "#8fa3bc", study: "#7b9acc", entertainment: "#e09f9f",
      bgPrimary: "#fafafa", bgSecondary: "#f5f5f5", bgTertiary: "#ececec",
      textPrimary: "#4a4a4a", textSecondary: "#7a7a7a", textTertiary: "#9a9a9a" },
    dark: { accent: "#9ca8ba", accentHover: "#b4bfce", study: "#5a7ab0", entertainment: "#c07f7f",
      bgPrimary: "#2a2a2e", bgSecondary: "#35353a", bgTertiary: "#404046",
      textPrimary: "#d4d4d8", textSecondary: "#a8a8b0", textTertiary: "#7a7a82" },
  },
  ocean: {
    light: { accent: "#4f8bd6", accentHover: "#3b76c0", study: "#4f8bd6", entertainment: "#e09f9f",
      bgPrimary: "#f0f7ff", bgSecondary: "#e6f0fa", bgTertiary: "#dce9f5",
      textPrimary: "#1a3b5c", textSecondary: "#4a6fa5", textTertiary: "#7a95bd" },
    dark: { accent: "#6ea6e3", accentHover: "#88b6ea", study: "#6ea6e3", entertainment: "#c07f7f",
      bgPrimary: "#1a2634", bgSecondary: "#243242", bgTertiary: "#2e3e50",
      textPrimary: "#e0e9f5", textSecondary: "#a8c0d9", textTertiary: "#7a95bd" },
  },
  lavender: {
    light: { accent: "#9b7ad9", accentHover: "#8462c3", study: "#9b7ad9", entertainment: "#e09f9f",
      bgPrimary: "#fcfaff", bgSecondary: "#f5f0fa", bgTertiary: "#eee6f5",
      textPrimary: "#4a3b5c", textSecondary: "#7a6fa5", textTertiary: "#a895bd" },
    dark: { accent: "#b79cf0", accentHover: "#c9b1f5", study: "#b79cf0", entertainment: "#c07f7f",
      bgPrimary: "#2e2a36", bgSecondary: "#383244", bgTertiary: "#423b52",
      textPrimary: "#f0e9f5", textSecondary: "#c9b1d9", textTertiary: "#a895bd" },
  },
  mint: {
    light: { accent: "#3aa97a", accentHover: "#2e9468", study: "#3aa97a", entertainment: "#e09f9f",
      bgPrimary: "#f2fffa", bgSecondary: "#e6f5ef", bgTertiary: "#dcebe4",
      textPrimary: "#1a5c3b", textSecondary: "#4a856f", textTertiary: "#7aad95" },
    dark: { accent: "#59c892", accentHover: "#73d6a6", study: "#59c892", entertainment: "#c07f7f",
      bgPrimary: "#1c3329", bgSecondary: "#264236", bgTertiary: "#305143",
      textPrimary: "#e0f5e9", textSecondary: "#a8d9c0", textTertiary: "#7aad95" },
  },
  sunset: {
    light: { accent: "#e07b5f", accentHover: "#c9654d", study: "#7b9acc", entertainment: "#e07b5f",
      bgPrimary: "#fff8f5", bgSecondary: "#fcedea", bgTertiary: "#f5e2df",
      textPrimary: "#5c2e1a", textSecondary: "#a56f4a", textTertiary: "#bd957a" },
    dark: { accent: "#f2a08c", accentHover: "#f6b1a1", study: "#6ea6e3", entertainment: "#f2a08c",
      bgPrimary: "#362420", bgSecondary: "#442e29", bgTertiary: "#523832",
      textPrimary: "#f5e0d9", textSecondary: "#d9a8c0", textTertiary: "#bd7a95" },
  },
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
  
  root.style.setProperty("--text-primary", colors.textPrimary);
  root.style.setProperty("--text-secondary", colors.textSecondary);
  root.style.setProperty("--text-tertiary", colors.textTertiary);
};

const loadPalette = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["palette"], (result) => {
      const paletteId = result.palette || "slate";
      currentPaletteId = paletteId;
      applyPalette(paletteId);
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

const pruneHistory = (items) => {
  const cutoff = Date.now() - TASK_HISTORY_RETENTION_DAYS * 86400000;
  return items.filter((task) => {
    const stamp = new Date(task.completedAt || task.archivedAt || task.createdAt || Date.now()).getTime();
    return stamp >= cutoff;
  });
};

const loadTasks = () => {
  chrome.storage.local.get(["taskHistory"], (result) => {
    tasks = pruneHistory(Array.isArray(result.taskHistory) ? result.taskHistory : []);
    chrome.storage.local.set({ taskHistory: tasks });
    renderHistory();
  });
};

const formatDate = (isoString) => {
  if (!isoString) return "Unknown date";
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const renderHistory = () => {
  const completedTasks = tasks.slice().sort((a, b) => {
    const dateA = new Date(a.completedAt || a.archivedAt || a.createdAt);
    const dateB = new Date(b.completedAt || b.archivedAt || b.createdAt);
    return dateB - dateA;
  });

  if (completedTasks.length === 0) {
    elements.historyList.innerHTML = `
      <div class="empty-history">
        <p>No completed tasks yet. Keep focusing!</p>
      </div>
    `;
    return;
  }

  elements.historyList.innerHTML = completedTasks
    .map(
      (task) => `
      <li class="history-item">
        <span class="history-status">✓</span>
        <div class="history-content">
          <p class="history-title">${task.description}</p>
          <p class="history-meta">Completed on ${formatDate(task.completedAt || task.createdAt)}</p>
        </div>
      </li>
    `
    )
    .join("");
};

const init = async () => {
  await loadTheme();
  await loadPalette();
  loadTasks();
};

elements.themeToggle.addEventListener("click", toggleTheme);

init();
