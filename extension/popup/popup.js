import { apiRequest, getApiBaseUrl, setApiBaseUrl } from "../ui/api/client.js";

const elements = {
  status: document.getElementById("status"),
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  saveApiBaseUrl: document.getElementById("saveApiBaseUrl"),
  taskInput: document.getElementById("taskInput"),
  splitTask: document.getElementById("splitTask"),
  subtasksContainer: document.getElementById("subtasksContainer"),
  subtasksStatus: document.getElementById("subtasksStatus"),
  subtasksList: document.getElementById("subtasksList"),
  analysisStatus: document.getElementById("analysisStatus"),
  analysisScore: document.getElementById("analysisScore"),
  analysisMeta: document.getElementById("analysisMeta"),
  analysisList: document.getElementById("analysisList"),
  themeToggle: document.getElementById("themeToggle"),
};

const loadTheme = () => {
  chrome.storage.local.get(["theme"], (result) => {
    const theme = result.theme || "light";
    applyTheme(theme);
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
};

const toggleTheme = () => {
  const isDark = document.body.classList.contains("dark-theme");
  const newTheme = isDark ? "light" : "dark";
  applyTheme(newTheme);
  chrome.storage.local.set({ theme: newTheme });
};

const renderStatus = () => {
  elements.status.textContent = "Guest mode";
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

const buildTabContext = async () => {
  const tabs = await chrome.tabs.query({});
  const entries = tabs
    .filter((tab) => tab?.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://"))
    .slice(0, 20)
    .map((tab) => ({ title: tab.title || "Untitled", url: tab.url }));
  const context = entries.map((tab) => `${tab.title} - ${tab.url}`).join(" | ");
  return { context, count: entries.length, entries };
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

const init = async () => {
  loadTheme();
  const baseUrl = await ensureApiBaseUrl();
  elements.apiBaseUrl.value = baseUrl;
  renderStatus();
  await analyzeTabs();
  setInterval(analyzeTabs, 30000);
};

const splitTask = async () => {
  const taskDescription = elements.taskInput.value.trim();
  if (!taskDescription) {
    elements.subtasksStatus.textContent = "Please enter a task description";
    elements.subtasksContainer.style.display = "block";
    return;
  }
  
  elements.subtasksContainer.style.display = "block";
  elements.subtasksStatus.textContent = "Splitting task...";
  elements.subtasksList.innerHTML = "";
  
  try {
    const response = await apiRequest("/api/tasks", {
      method: "POST",
      body: { description: taskDescription },
    });
    
    if (!response.ok) {
      elements.subtasksStatus.textContent = "Failed to split task. Using local split.";
      const localSubtasks = [
        `Research: ${taskDescription}`,
        `Outline: ${taskDescription}`,
        `Execute: ${taskDescription}`,
        `Review: ${taskDescription}`,
      ];
      renderSubtasks(localSubtasks);
      return;
    }
    
    const subtasks = response.data?.subtasks || [];
    if (subtasks.length === 0) {
      elements.subtasksStatus.textContent = "No subtasks generated";
      return;
    }
    
    elements.subtasksStatus.textContent = `Split into ${subtasks.length} subtasks:`;
    renderSubtasks(subtasks);
  } catch (error) {
    elements.subtasksStatus.textContent = "Error splitting task";
  }
};

const renderSubtasks = (subtasks) => {
  elements.subtasksList.innerHTML = subtasks
    .map(
      (subtask, index) =>
        `<li><input type="checkbox" id="subtask-${index}" /><label for="subtask-${index}">${subtask}</label></li>`
    )
    .join("");
};

elements.saveApiBaseUrl.addEventListener("click", async () => {
  const value = elements.apiBaseUrl.value.trim();
  if (!value) return;
  await setApiBaseUrl(value);
});

elements.splitTask.addEventListener("click", splitTask);

elements.taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    splitTask();
  }
});

elements.themeToggle.addEventListener("click", toggleTheme);

/*
elements.login.addEventListener("click", async () => {});
elements.logout.addEventListener("click", async () => {});
*/

init();
