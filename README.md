# Focus Tutor — AI-Powered Adaptive Learning Companion

> **Team What The Hack** · Buenaventura Irish Aves · Chen Xinyu · Guo Yihan · Huang Xu · Long Enjun
>
> Built at Hack The East 2026
> **Team ID** HTE-TEAM-19S0E4B2

---

## The Problem

Education has barely changed in decades. But the way students fail has evolved.

The bottleneck is no longer access to content — AI can generate infinite explanations, practice sets, and flashcards. The real problem is **focus**. Students open their browser to study and drift to social media without noticing. Forty minutes disappear. Guilt sets in. The cycle repeats.

Existing tools ask students to self-regulate. That doesn't work — especially for the students who need the most help. They're the ones least equipped to catch themselves drifting.

**The core gap:** no tool sits in the browser, watches what you actually do, and intervenes *in real time* when you go off-track.

---

## Our Solution: Focus Tutor

**Focus Tutor** is a Chrome extension that acts as an AI study companion — living directly where distraction happens.

### Thought Process

We identified three distinct failure modes in student focus:

1. **Task paralysis** — "Study for the exam" is too vague to start. Students need concrete, actionable steps.
2. **Unconscious drift** — Students don't decide to get distracted; they just drift. Real-time detection is the only fix.
3. **No feedback loop** — Students never know *when* they focus best or *how often* they drift. Without data, habits can't improve.

Our solution maps directly to each failure mode:

| Failure Mode | Our Fix |
|---|---|
| Task paralysis | MiniMax LLM breaks any task into 3–5 concrete subtasks instantly |
| Unconscious drift | Content scripts + service worker detect tab switches and off-task pages in real time |
| No feedback loop | Analytics dashboard + AI-generated personalized learning insights from behavioral data |

---

## Key Features

### 🧠 AI Task Decomposition
- Type any task (e.g. *"Prepare for biology midterm"*) and the MiniMax LLM instantly generates 3–5 concrete, actionable subtasks
- Structured prompts sent to `backend/routes/tasks.js` → MiniMax API → parsed subtask list returned to popup
- Eliminates task paralysis and cognitive load before a study session begins

### 🔍 Real-Time Distraction Detection
- Content scripts (`extension/content/contentScript.js`) extract URL, page title, domain, and body text on every page visit
- Background service worker (`extension/background/serviceWorker.js`) tracks tab switches continuously
- **3 tab switches within 2 minutes** → distraction notification fires immediately
- Relevance scorer (`backend/services/relevanceScorer.js`) compares active page against the user's task goal using keyword matching + domain category detection (social, entertainment, education, news, etc.)
- Scores pages 0–1; off-task pages trigger nudge notifications

### ⏱️ Adaptive Focus Timer
- Supports **Pomodoro** (25 min focus / 5 min break) and **Custom** modes
- Timer persists across popup closes using `chrome.storage.local` — sessions are never lost
- Break reminders fire automatically after sustained focus periods
- Timer state syncs across extension contexts (popup ↔ service worker) in real time

### 📅 AI Schedule Planning
- `backend/services/scheduleEngine.js` analyzes historical focus-by-hour data to find peak productivity windows
- MiniMax LLM generates an optimized daily study plan with Pomodoro/Ultradian blocks, revision sessions, and rest periods
- One-click export to **Google Calendar** via OAuth2

### 📊 Focus Analytics Dashboard
- Computed by `backend/routes/analyze.js` from logged session data:
  - Focus Time Ratio, Average Continuous Focus Duration, Distraction Count, Task Switching Rate, Peak Efficiency Hours
- Hourly heatmap of focus quality across the day
- Behavioral report generated and refreshed via MiniMax LLM from actual session data

### 💡 Personalized AI Learning Insights
- After each session, MiniMax LLM receives the user's real behavioral metrics and returns a natural-language insight
- Example output: *"You are most focused during 10–11 AM, but distractions rise 35% after 3 PM. Schedule high-effort tasks in the morning."*
- Insights are not generic — they are derived from the individual user's data

### 🔥 Habit Formation Tracking
- `backend/services/habitModel.js` tracks study streaks (consecutive active days), 7-day and 30-day consistency ratios
- **Automaticity Progress** score computed using `1 - e^(-days/τ)` — grounded in Lally et al. (2010) habit formation research (habits form at ~66 days)
- Visual progress bar showing how close a behavior is to becoming automatic

### 🎨 Customizable Themes & UI
- Multiple color palettes (default, warm, cool, forest, sunset, custom)
- Custom hex color picker generates full palette using HSL color math (lighten/darken algorithms)
- Dark mode support
- Real-time sync of theme changes between popup and dashboard via `chrome.storage.onChanged`

### ⏰ Graduated Deadline Alerts
- `chrome.alarms` checks active task deadlines every 5 minutes
- Escalating notifications at 24 hours, 1 hour, and 15 minutes before deadline

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                      │
│                    (Manifest V3)                         │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐                      │
│  │   Popup UI  │  │  Dashboard   │                      │
│  │  Task mgmt  │  │  Analytics   │                      │
│  │  Timer      │  │  AI Insights │                      │
│  │  Themes     │  │  Heatmap     │                      │
│  └──────┬──────┘  └──────┬───────┘                      │
│         │                │                              │
│  ┌──────┴────────────────┴──────────────────────────┐   │
│  │          Background Service Worker               │   │
│  │  Tab tracking · Distraction detection            │   │
│  │  Alarm-based reminders · Timer persistence       │   │
│  │  Session recording · Storage sync               │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────┴───────────────────────────┐   │
│  │              Content Scripts                      │   │
│  │  Page extraction (URL, title, text, domain)      │   │
│  │  Category detection (education/social/video/…)   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP (localhost:5174)
┌─────────────────────────┴───────────────────────────────┐
│                   Node.js Backend API                    │
│                                                         │
│  /tasks    /analyze    /schedule    /habits    /suggest  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              AI Services Layer                    │   │
│  │  MiniMax LLM — task splitting, insight gen,      │   │
│  │  schedule planning, suggestion generation         │   │
│  │  Relevance Scorer — keyword + domain analysis    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack
| Layer | Technology |
|---|---|
| Extension | Chrome Manifest V3, vanilla JS, modular service worker |
| Backend | Node.js (zero external dependencies) |
| AI | MiniMax M2.5 LLM |
| Integrations | Google Calendar API (OAuth2), Chrome Notifications, Chrome Alarms, Chrome Idle |
| Storage | `chrome.storage.local` — privacy-first, no data leaves the browser without user action |

---

## Challenge Criteria Coverage

### 🎓 RevisionDojo — Future of Learning

| Criterion | How We Address It |
|---|---|
| **Pedagogy & Learning Science** | Task decomposition reduces cognitive load (CLT). Break reminders are grounded in Pomodoro/Ultradian research. Automaticity tracking uses Lally et al. (2010) habit formation model (`1 - e^(-days/τ)`). Spaced revision blocks embedded in AI schedule. |
| **Technical Impressiveness** | Real-time tab monitoring via content scripts + service worker. MiniMax LLM integration across 4 distinct AI use cases. Persistent timer across popup lifecycle. `chrome.alarms`-driven deadline system. Google Calendar OAuth2 export. |
| **UI/UX & Ease of Use** | One-click extension install. Task input → AI subtasks in <2 seconds. Focus timer with mode switching. Dashboard with heatmap and behavioral reports. Fully themeable UI with real-time sync across extension contexts. |
| **Scale & Commercial Viability** | Works for any subject, task type, or student level. Freemium-ready architecture (local storage now, cloud sync later). B2B potential for schools and universities. No data collection — privacy compliance built in from day one. |

---

### 🤖 MiniMax — Creative AI Challenge

| Criterion | How We Address It |
|---|---|
| **Creative Usage of MiniMax API** | MiniMax LLM is used across 4 distinct tasks: (1) task decomposition, (2) schedule generation, (3) behavioral insight generation, (4) study suggestions. Each use case sends structured prompts and parses natural-language responses into actionable UI. This is not a chatbot — it's LLM-as-an-engine across an entire adaptive learning system. |
| **Technical Execution** | Full-stack Chrome extension + Node.js backend with modular route handlers. LLM calls are structured, error-handled, and fallback-safe. Service worker architecture handles persistent state across popup lifecycle. All AI features degrade gracefully when the API is unavailable. |
| **Video Demo Quality** | [Demo video link] |

#### MiniMax API Integration Points

| Feature | Endpoint/Service | MiniMax Use |
|---|---|---|
| Task splitting | `POST /tasks` → `backend/routes/tasks.js` | LLM receives task title + type, returns 3–5 subtasks |
| Study schedule | `POST /schedule` → `backend/services/scheduleEngine.js` | LLM receives focus history + task list, returns time-blocked schedule |
| Learning insights | `POST /analyze` → `backend/routes/analyze.js` | LLM receives session metrics, returns natural-language behavioral insight |
| Study suggestions | `POST /suggest` → `backend/services/llmClient.js` | LLM receives task context, returns adaptive study tips |

---

## Setup

### 1. Backend
```bash
cd backend
cp .env.example .env
# Add your MINIMAX_API_KEY to .env
npm install
node app.js
# Server starts on http://localhost:5174
```

### 2. Extension
1. Open Chrome → `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked** → select the `/extension` folder
4. Pin the FocusTutor extension and click to open

---

## Project Structure

```
/
├── backend/
│   ├── app.js                    # HTTP server entry point
│   ├── routes/
│   │   ├── tasks.js              # Task decomposition (MiniMax LLM)
│   │   ├── analyze.js            # Focus analytics + AI insights
│   │   └── schedule.js           # AI schedule generation
│   └── services/
│       ├── llmClient.js          # MiniMax API client
│       ├── relevanceScorer.js    # Real-time page relevance scoring
│       ├── scheduleEngine.js     # Adaptive schedule builder
│       └── habitModel.js         # Streak + automaticity tracking
├── extension/
│   ├── manifest.json
│   ├── background/
│   │   ├── serviceWorker.js      # Core event loop + tab tracking
│   │   ├── alarms.js             # Deadline + break reminder system
│   │   └── messaging.js          # Cross-context message routing
│   ├── content/
│   │   └── contentScript.js      # Page extraction + category detection
│   └── ui/
│       ├── popup/                # Main extension popup
│       └── dashboard/            # Analytics dashboard
└── README.md
```

---

> **Focus Tutor** — Built at the Hack The East Hackathon by Team What The Hack.
