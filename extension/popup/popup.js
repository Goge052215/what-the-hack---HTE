import { apiRequest, getApiBaseUrl, setApiBaseUrl } from "../ui/api/client.js";

const elements = {
  status: document.getElementById("status"),
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  saveApiBaseUrl: document.getElementById("saveApiBaseUrl"),
  analysisStatus: document.getElementById("analysisStatus"),
  analysisScore: document.getElementById("analysisScore"),
  analysisMeta: document.getElementById("analysisMeta"),
};

const renderStatus = () => {
  elements.status.textContent = "Guest mode";
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
    elements.analysisStatus.textContent = "No tabs to analyze";
    elements.analysisScore.textContent = "Focus score: --";
    elements.analysisMeta.textContent = "Tabs analyzed: 0";
    return;
  }
  elements.analysisStatus.textContent = "Analyzing...";
  const response = await apiRequest("/api/analyze", { method: "POST", body: { context } });
  if (!response.ok) {
    elements.analysisStatus.textContent = "Analyze failed";
    elements.analysisScore.textContent = "Focus score: --";
    elements.analysisMeta.textContent = `Tabs analyzed: ${count}`;
    return;
  }
  const score = response.data?.score;
  elements.analysisStatus.textContent = "Analysis complete";
  elements.analysisScore.textContent =
    typeof score === "number" ? `Focus score: ${score.toFixed(2)}` : "Focus score: --";
  elements.analysisMeta.textContent = `Tabs analyzed: ${count}`;
};

const init = async () => {
  const baseUrl = await getApiBaseUrl();
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
