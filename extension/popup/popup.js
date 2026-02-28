import { apiRequest, getApiBaseUrl, setApiBaseUrl } from "../ui/api/client.js";

const elements = {
  status: document.getElementById("status"),
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  saveApiBaseUrl: document.getElementById("saveApiBaseUrl"),
  analysisStatus: document.getElementById("analysisStatus"),
  analysisScore: document.getElementById("analysisScore"),
  analysisMeta: document.getElementById("analysisMeta"),
  analysisList: document.getElementById("analysisList"),
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

const saveLastFocusScore = (score) => {
  if (typeof score !== "number") return;
  chrome.storage.local.set({ lastFocusScore: score });
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

const loadCurrentGoal = async () => {
  const response = await apiRequest("/api/tasks");
  if (!response.ok || !Array.isArray(response.data)) return "";
  const latest = response.data.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
  return latest?.title ? String(latest.title) : "";
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
    const goal = await loadCurrentGoal();
    const response = await apiRequest("/api/analyze", { method: "POST", body: { context, goal } });
    if (!response.ok) {
      const score = scoreContext(context);
      elements.analysisStatus.textContent = "Local analysis";
      elements.analysisScore.textContent = `Focus score: ${score.toFixed(2)}`;
      saveLastFocusScore(score);
      return;
    }
    const score = response.data?.score;
    elements.analysisStatus.textContent = "Analysis complete";
    elements.analysisScore.textContent =
      typeof score === "number" ? `Focus score: ${score.toFixed(2)}` : "Focus score: --";
    saveLastFocusScore(score);
  } catch {
    const score = scoreContext(context);
    elements.analysisStatus.textContent = "Local analysis";
    elements.analysisScore.textContent = `Focus score: ${score.toFixed(2)}`;
    saveLastFocusScore(score);
  }
};

const init = async () => {
  const baseUrl = await ensureApiBaseUrl();
  elements.apiBaseUrl.value = baseUrl;
  renderStatus();
  await analyzeTabs();
  setInterval(analyzeTabs, 30000);
};

elements.saveApiBaseUrl.addEventListener("click", async () => {
  const value = elements.apiBaseUrl.value.trim();
  if (!value) return;
  await setApiBaseUrl(value);
});

/*
elements.login.addEventListener("click", async () => {});
elements.logout.addEventListener("click", async () => {});
*/

init();
