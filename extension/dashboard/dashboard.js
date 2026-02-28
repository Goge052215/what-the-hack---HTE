import { apiRequest } from "../ui/api/client.js";

const summary = document.getElementById("summary");
const analysisStatus = document.getElementById("analysisStatus");
const analysisScore = document.getElementById("analysisScore");
const analysisMeta = document.getElementById("analysisMeta");
const reportDate = document.getElementById("reportDate");
const focusRatio = document.getElementById("focusRatio");
const averageFocus = document.getElementById("averageFocus");
const distractionCount = document.getElementById("distractionCount");
const switchRate = document.getElementById("switchRate");
const efficiencyList = document.getElementById("efficiencyList");

const loadTasks = async () => {
  const tasks = await apiRequest("/api/tasks");
  if (tasks.ok) {
    summary.textContent = `Tasks tracked: ${(tasks.data || []).length}`;
    return;
  }
  summary.textContent = "Connect to the API to see insights.";
};

const buildTabContext = async () => {
  const tabs = await chrome.tabs.query({});
  const entries = tabs
    .filter((tab) => tab?.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://"))
    .slice(0, 20)
    .map((tab) => `${tab.title || "Untitled"} - ${tab.url}`);
  return { context: entries.join(" | "), count: entries.length };
};

const analyzeTabs = async () => {
  const { context, count } = await buildTabContext();
  if (!context) {
    analysisStatus.textContent = "No tabs to analyze";
    analysisScore.textContent = "Focus score: --";
    analysisMeta.textContent = "Tabs analyzed: 0";
    return;
  }
  analysisStatus.textContent = "Analyzing...";
  const tasks = await apiRequest("/api/tasks");
  const latestTask =
    tasks.ok && Array.isArray(tasks.data)
      ? tasks.data.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
      : null;
  const goal = latestTask?.title ? String(latestTask.title) : "";
  const response = await apiRequest("/api/analyze", { method: "POST", body: { context, goal } });
  if (!response.ok) {
    analysisStatus.textContent = "Analyze failed";
    analysisScore.textContent = "Focus score: --";
    analysisMeta.textContent = `Tabs analyzed: ${count}`;
    return;
  }
  const score = response.data?.score;
  analysisStatus.textContent = "Analysis complete";
  analysisScore.textContent =
    typeof score === "number" ? `Focus score: ${score.toFixed(2)}` : "Focus score: --";
  analysisMeta.textContent = `Tabs analyzed: ${count}`;
};

const formatMinutes = (value) => `${Number(value || 0).toFixed(1)} min`;
const formatRatio = (value) => `${Math.round((value || 0) * 100)}%`;
const formatRate = (value) => `${Number(value || 0).toFixed(2)} / hour`;

const renderEfficiency = (distribution) => {
  if (!Array.isArray(distribution) || distribution.length === 0) {
    efficiencyList.innerHTML = "<li>No data yet</li>";
    return;
  }
  efficiencyList.innerHTML = distribution
    .slice(0, 4)
    .map(
      (entry) =>
        `<li>${String(entry.hour).padStart(2, "0")}:00 · ${formatRatio(
          entry.focusRatio
        )} · ${formatMinutes(entry.focusMinutes)}</li>`
    )
    .join("");
};

const loadReport = async () => {
  const response = await apiRequest("/api/analyze/report");
  if (!response.ok) {
    reportDate.textContent = "Date: --";
    focusRatio.textContent = "--";
    averageFocus.textContent = "--";
    distractionCount.textContent = "--";
    switchRate.textContent = "--";
    efficiencyList.innerHTML = "<li>API not connected</li>";
    return;
  }
  const report = response.data?.report;
  reportDate.textContent = `Date: ${response.data?.day || "--"}`;
  focusRatio.textContent = formatRatio(report?.focusRatio);
  averageFocus.textContent = formatMinutes(report?.averageContinuousFocusMinutes);
  distractionCount.textContent = String(report?.distractionCount ?? 0);
  switchRate.textContent = formatRate(report?.taskSwitchingRate);
  renderEfficiency(report?.efficiencyDistribution);
};

const init = async () => {
  await loadTasks();
  await analyzeTabs();
  await loadReport();
  setInterval(analyzeTabs, 30000);
  setInterval(loadReport, 60000);
};

init();
