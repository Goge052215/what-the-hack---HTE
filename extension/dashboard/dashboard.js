import { apiRequest } from "../ui/api/client.js";

const summary = document.getElementById("summary");
const analysisStatus = document.getElementById("analysisStatus");
const analysisScore = document.getElementById("analysisScore");
const analysisMeta = document.getElementById("analysisMeta");

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
  const response = await apiRequest("/api/analyze", { method: "POST", body: { context } });
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

const init = async () => {
  await loadTasks();
  await analyzeTabs();
  setInterval(analyzeTabs, 30000);
};

init();
