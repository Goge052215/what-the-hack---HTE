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
};

let tasks = [];

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

const init = async () => {
  loadTheme();
  await loadTasks();
  await analyzeTabs();
  setInterval(analyzeTabs, 30000);
};

elements.addTaskBtn.addEventListener("click", addTask);
elements.newTaskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTask();
  }
});
elements.themeToggle.addEventListener("click", toggleTheme);

init();
