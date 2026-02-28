import { apiRequest, getApiBaseUrl, setApiBaseUrl } from "../api/client.js";

const elements = {
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  saveApiBaseUrl: document.getElementById("saveApiBaseUrl"),
  taskInput: document.getElementById("taskInput"),
  taskDeadlineDate: document.getElementById("taskDeadlineDate"),
  taskDeadlineTime: document.getElementById("taskDeadlineTime"),
  // addToCalendar: document.getElementById("addToCalendar"), // Disabled until Chrome Web Store publish
  typeAssignment: document.getElementById("typeAssignment"),
  typeExam: document.getElementById("typeExam"),
  typeEvent: document.getElementById("typeEvent"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  saveTaskBtn: document.getElementById("saveTaskBtn"),
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
  subtasksList: document.getElementById("subtasksList"),
  analysisStatus: document.getElementById("analysisStatus"),
  analysisScore: document.getElementById("analysisScore"),
  analysisMeta: document.getElementById("analysisMeta"),
  analysisList: document.getElementById("analysisList"),
  lightThemeBtn: document.getElementById("lightThemeBtn"),
  darkThemeBtn: document.getElementById("darkThemeBtn"),
  openDashboardBtn: document.getElementById("openDashboardBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  taskListBtn: document.getElementById("taskListBtn"),
  taskCount: document.getElementById("taskCount"),
  settingsPanel: document.getElementById("settingsPanel"),
  taskListPanel: document.getElementById("taskListPanel"),
  addTaskPanel: document.getElementById("addTaskPanel"),
};

let tasks = [];
let currentTaskIndex = 0;
let selectedTaskType = "assignment";

const loadTheme = () => {
  chrome.storage.local.get(["theme"], (result) => {
    const theme = result.theme || "light";
    applyTheme(theme);
  });
};

const applyTheme = (theme) => {
  if (theme === "dark") {
    document.body.classList.add("dark-theme");
    elements.lightThemeBtn.classList.remove("active");
    elements.darkThemeBtn.classList.add("active");
  } else {
    document.body.classList.remove("dark-theme");
    elements.lightThemeBtn.classList.add("active");
    elements.darkThemeBtn.classList.remove("active");
  }
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

const updateTaskCount = () => {
  elements.taskCount.textContent = tasks.length;
};

const loadTasks = () => {
  chrome.storage.local.get(["tasks"], (result) => {
    tasks = result.tasks || [];
    renderTasks();
    updateTaskCount();
  });
};

const saveTasks = () => {
  chrome.storage.local.set({ tasks });
  updateTaskCount();
};

const addTask = async () => {
  const description = elements.taskInput.value.trim();
  if (!description) return;

  const deadlineDate = elements.taskDeadlineDate.value;
  const deadlineTime = elements.taskDeadlineTime.value;
  
  // Combine date and time into ISO string
  let deadline = null;
  if (deadlineDate) {
    const timeStr = deadlineTime || "23:59";
    deadline = `${deadlineDate}T${timeStr}`;
  }

  const newTask = {
    id: Date.now().toString(),
    description,
    type: selectedTaskType,
    deadline: deadline,
    status: "not-started",
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();
  updateCurrentTask();
  
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
      body: { description, type: selectedTaskType, deadline },
    });
    if (response.ok && response.data?.subtasks) {
      // Could update task with subtasks if needed
    }
  } catch (error) {
    // Silently fail, task is already added locally
  }
};

const addToGoogleCalendar = async (task) => {
  try {
    // Get OAuth token
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          console.error("OAuth error:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });

    if (!token) {
      console.error("No token received");
      return false;
    }

    // Prepare event data
    const deadline = new Date(task.deadline);
    const typeEmoji = task.type === "assignment" ? "📝" : task.type === "exam" ? "�" : "📅";
    const eventData = {
      summary: `${typeEmoji} ${task.description}`,
      description: `Task Type: ${task.type}\nCreated from Focus Tutor Extension`,
      start: {
        dateTime: deadline.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(deadline.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "popup", minutes: 1440 }, // 1 day before
        ],
      },
    };

    console.log("Creating calendar event:", eventData);

    // Create calendar event
    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Event added to Google Calendar successfully:", result);
      return true;
    } else {
      const error = await response.text();
      console.error("Failed to add event to Google Calendar:", error);
      return false;
    }
  } catch (error) {
    console.error("Error adding to Google Calendar:", error);
    return false;
  }
};

const setTaskType = (type) => {
  selectedTaskType = type;
  [elements.typeAssignment, elements.typeExam, elements.typeEvent].forEach((btn) => {
    btn.classList.remove("active");
  });
  
  if (type === "assignment") {
    elements.typeAssignment.classList.add("active");
  } else if (type === "exam") {
    elements.typeExam.classList.add("active");
  } else if (type === "event") {
    elements.typeEvent.classList.add("active");
  }
};

const toggleTask = (taskId) => {
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    if (task.completed && !task.status) {
      task.status = "completed";
    }
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
    return;
  }

  currentTaskIndex = tasks.indexOf(activeTask);
  elements.currentTaskTitle.textContent = activeTask.description;
  elements.progressContainer.style.display = "block";
  
  // Update progress bar and status buttons
  const status = activeTask.status || "not-started";
  updateProgressBar(status);
  updateStatusButtons(status);
  
  // Trigger progress detection
  detectTaskProgress();
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
    activeTask.completed = true;
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

const renderTasks = () => {
  if (tasks.length === 0) {
    elements.subtasksStatus.style.display = "block";
    elements.subtasksStatus.textContent = "No tasks yet";
    elements.subtasksList.innerHTML = "";
    return;
  }

  elements.subtasksStatus.style.display = "none";
  elements.subtasksList.innerHTML = tasks
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

const init = async () => {
  loadTheme();
  loadTasks();
  updateCurrentTask();
  const baseUrl = await ensureApiBaseUrl();
  elements.apiBaseUrl.value = baseUrl;
  await analyzeTabs();
  
  // Run tab analysis and progress detection every 30 seconds
  setInterval(async () => {
    await analyzeTabs();
    await detectTaskProgress();
  }, 30000);
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

elements.openDashboardBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("ui/dashboard/dashboard.html") });
});

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

elements.typeEvent.addEventListener("click", () => {
  setTaskType("event");
});

/*
elements.login.addEventListener("click", async () => {});
elements.logout.addEventListener("click", async () => {});
*/

init();
