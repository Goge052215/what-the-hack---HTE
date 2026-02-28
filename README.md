# FocusPet — AI Adaptive Study Companion

> **Team What The Hack** — Buenaventura Irish Aves · Chen Xinyu · Guo Yihan · Huang Xu · Long Enjun

---

## Why We Built This

RevisionDojo asks: *what happens when content is no longer scarce, but intelligence is?*

We looked at that question and realized the answer isn't about generating more content. AI can already produce infinite practice sets, explanations, and flashcards. But none of that matters if the student never sits down to use them.

Here's the uncomfortable truth about education: **the vast majority of students are not geniuses, and they don't need to be.** What separates a "top student" from everyone else is almost never raw talent. It's habits. It's the accumulated hours of focused study. It's the ability to open a textbook instead of Instagram — and to *stay there*.

The students who struggle most aren't lacking intelligence or resources. They're lacking **self-regulation**. They sit down to study, open their browser, and within ten minutes they've drifted to social media, YouTube, or Reddit. The worst part? **They don't even notice it happening.** Forty minutes vanish before they realize they haven't read a single page. Then guilt sets in, motivation drops, and the cycle repeats.

Traditional productivity tools ask these students to track their own behavior — to self-report when they're distracted. But that's asking the fox to guard the henhouse. The students who need the most help are precisely the ones least equipped to monitor themselves.

So we asked: **what if the browser itself could watch for you?**

---

## What FocusPet Does

**FocusPet** is a Chrome extension — an AI study companion that lives right where procrastination happens. It doesn't block websites. It doesn't punish you. Instead, it quietly observes your browsing behavior in real time and gently nudges you back on track when you drift, like a study buddy tapping your shoulder.

### The Story of a Study Session

Imagine a student named Mei. She has a Linear Algebra midterm on Friday. She opens her laptop to study.

**Step 1: She tells FocusPet what she's working on.**
She clicks the extension icon and types: *"Study Linear Algebra — midterm Friday."* She picks "Exam" as the task type and sets the deadline.

Behind the scenes, this task is sent to the **MiniMax LLM**, which instantly breaks it into 3–5 concrete subtasks — things like *"Review eigenvalue definitions," "Practice matrix diagonalization problems," "Solve past paper Section B."* The overwhelming mountain of "study for the midterm" becomes a clear, actionable checklist. This is powered by our **Task Decomposition Engine** (`backend/routes/tasks.js`), which sends a structured prompt to MiniMax and parses the response into subtasks.

**Step 2: AI builds her a study schedule.**
FocusPet doesn't just list the subtasks — it suggests *when* to do them. The **Schedule Engine** (`backend/services/scheduleEngine.js`) looks at Mei's historical focus data to find her peak productivity hours. If she's consistently sharpest between 10 AM and noon, that's when the hardest subtasks get placed. The engine generates Pomodoro (25 min focus / 5 min break) or Ultradian (90 min focus / 20 min break) blocks, and inserts **revision sessions before the exam** and **rest blocks** to prevent burnout. These suggestions can be exported directly to **Google Calendar** with one click.

**Step 3: She starts the focus timer and begins studying.**
The built-in timer starts a Pomodoro cycle. She opens her lecture notes. Everything is going well.

**Step 4: Twenty minutes in, she "just checks" Instagram.**
She doesn't consciously decide to stop studying. She just… drifts. One tab switch becomes three. She's now scrolling through reels.

This is where FocusPet intervenes.

Our **Content Scripts** (`extension/content/pageExtractor.js`) are running on every page she visits. They extract the URL, page title, domain, and the first 500 characters of body text. This data flows to the **Background Service Worker** (`extension/background/serviceWorker.js`), which tracks every tab switch.

The **Relevance Scorer** (`backend/services/relevanceScorer.js`) compares the extracted page content against Mei's active task — "Study Linear Algebra." It uses a multi-signal scoring system: keyword matching against curated educational, entertainment, and social media word lists; semantic overlap between the page content and her task goal; and domain-level category detection (YouTube, Instagram, Reddit, Coursera, StackOverflow, etc.). Each page gets a relevance score from 0 to 1. Instagram scores near 0. Her lecture notes PDF scores near 1.

Meanwhile, the service worker counts tab switches. **Three switches within two minutes** triggers a distraction alert:

> *"Hey! You've been switching tabs a lot. Time to refocus on what matters!"*

Mei sees the notification, realizes she's been scrolling for five minutes, and switches back to her notes. Without FocusPet, those five minutes would have become forty.

**Step 5: She studies for 45 minutes straight. FocusPet reminds her to rest.**
The **Break Reminder System** tracks how long she's been in continuous focus. When her configured focus duration (default 45 minutes) elapses, a notification appears:

> *"You've been working hard for 45 minutes. Step away for 5 minutes to recharge your brain!"*

She can click "Take Break" to start a timed rest period, or "Keep Working" to reset the focus clock. This isn't arbitrary — research shows that sustained focus degrades after ~45 minutes, and short breaks restore cognitive performance.

**Step 6: Her deadline approaches. FocusPet escalates.**
At **24 hours** before Friday's exam, a gentle reminder: *"Your Linear Algebra midterm is due tomorrow. Make sure you're on track!"* At **1 hour**, urgency increases: *"One hour left! Time to wrap up."* At **15 minutes**, a final push. These graduated deadline alerts are managed by the alarm system (`chrome.alarms`) running checks every 5 minutes against all active tasks.

**Step 7: After the session, she checks her dashboard.**
The **Focus Quality Dashboard** (`extension/dashboard/`) shows her the day's analytics — all computed by the **Analyze Engine** (`backend/routes/analyze.js`):

- **Focus Time Ratio**: 72% of her tracked time was on-task
- **Average Continuous Focus**: 18.3 minutes before drifting
- **Distraction Count**: 4 transitions from study to entertainment
- **Task Switching Rate**: 2.1 switches per hour
- **Peak Efficiency Hours**: Her focus ratio was highest between 10:00–11:00

Then the AI delivers a personalized **Learning Insight**, generated by MiniMax from her actual behavioral data:

> *"You are most focused during 10–11, but distractions rise 35% after 15:00. Schedule high-effort tasks in the morning."*

This isn't a generic tip. It's feedback derived from *her* data, delivered in natural language. Over days and weeks, these insights teach Mei to understand her own patterns — building the metacognitive awareness that research identifies as the single strongest predictor of academic success.

**Step 8: Day after day, habits form.**
Every session Mei completes gets logged by the **Habit Model** (`backend/services/habitModel.js`). It tracks her streak (consecutive days with study activity), computes 7-day and 30-day consistency ratios, and calculates an **Automaticity Progress** score using the formula `1 - e^(-days/τ)` — a model grounded in habit formation research (Lally et al., 2010) showing that behaviors become automatic after roughly 66 days of repetition. Mei can see this progress bar grow, giving her a tangible, science-backed measure of how close she is to making studying a default behavior.

The habit model also records **focus scores by hour**, feeding data back into the schedule engine. Next week, when Mei adds a new task, FocusPet already knows her best hours and plans accordingly. The system adapts to *her* — not the other way around.

---

## How It Answers RevisionDojo's Challenge

RevisionDojo says: *"Build an AI-powered solution that transforms how people learn. Create something that helps both strong learners excel and struggling learners catch up."*

### For struggling learners:
These are students who *want* to study but can't sustain focus. They don't need more content — they need a system that catches them when they fall. FocusPet's **real-time distraction detection** and **gentle nudge notifications** act as an external metacognitive scaffold. The **habit tracking and streak system** gives them visible progress, turning the abstract goal of "study more" into a concrete daily practice. The **AI task decomposition** eliminates the paralysis of not knowing where to start.

### For strong learners:
High-performing students benefit from the **analytics dashboard** and **AI learning insights**, which reveal inefficiencies they might not notice — like the fact that their focus drops 35% after 3 PM, or that they switch tasks too frequently. The **adaptive schedule engine** optimizes their already-good habits by placing hard tasks in peak hours and embedding spaced revision automatically. The **Google Calendar integration** fits into workflows they already use.

### The key insight:
We're not reimagining content delivery. We're reimagining **the feedback loop around study behavior itself.** Traditional education gives you a grade weeks after you studied. FocusPet gives you feedback *while you're studying* — in real time, personalized, and actionable. That's the transformation.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                      │
│                    (Manifest V3)                         │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Popup UI  │  │  Dashboard   │  │   Options     │  │
│  │  Task mgmt  │  │  Analytics   │  │   Settings    │  │
│  │  Timer      │  │  Reports     │  │               │  │
│  │  Themes     │  │  AI Insights │  │               │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────────┘  │
│         │                │                              │
│  ┌──────┴────────────────┴──────────────────────────┐   │
│  │          Background Service Worker               │   │
│  │  Tab switch tracking · Distraction detection     │   │
│  │  Alarm-based reminders · Timer management        │   │
│  │  Session recording · AI suggestion refresh       │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────┴───────────────────────────┐   │
│  │              Content Scripts                      │   │
│  │  Page extraction (URL, title, text, domain)      │   │
│  │  Category detection (education/social/video/…)   │   │
│  │  Screenshot capture                              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                   Node.js Backend API                    │
│                                                         │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │  Analyze   │  │  Schedule   │  │     Habits       │  │
│  │  Focus     │  │  Pomodoro / │  │  Sessions        │  │
│  │  scoring   │  │  Ultradian  │  │  Streaks         │  │
│  │  Reports   │  │  LLM plan   │  │  Metrics         │  │
│  │  Insights  │  │  Calendar   │  │  Focus-by-hour   │  │
│  └─────┬──────┘  └──────┬──────┘  └──────────────────┘  │
│        │                │                               │
│  ┌─────┴────────────────┴───────────────────────────┐   │
│  │              AI Services Layer                    │   │
│  │  MiniMax LLM — task splitting, insights,         │   │
│  │  schedule planning, suggestion generation         │  │
│  │  Relevance Scorer — keyword + semantic analysis   │  │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack
- **Extension**: Chrome Manifest V3, vanilla JavaScript, modular service worker architecture
- **Backend**: Node.js (zero-dependency HTTP server)
- **AI**: MiniMax M2.5 LLM (task decomposition, schedule planning, learning insights, suggestion generation)
- **Integrations**: Google Calendar API (OAuth2), Chrome Notifications, Chrome Idle Detection
- **Data**: `chrome.storage.local` for all behavioral data (privacy-first — nothing leaves the browser unless the student explicitly uses AI features)

---

## Where AI Lives in This Project

AI isn't a gimmick in FocusPet — it's woven into every layer:

| What the student sees | What AI does behind the scenes |
|---|---|
| "Study Linear Algebra" becomes 5 subtasks | MiniMax LLM receives a structured prompt and returns a decomposed task list |
| A notification saying "Hey, refocus!" | The relevance scorer analyzed the active page against the task goal and classified it as off-task; the service worker counted 3+ tab switches in 2 minutes |
| "You're most focused at 10 AM" on the dashboard | MiniMax received the day's focus ratio, distraction count, and hourly efficiency data, and generated a natural-language insight |
| A suggested study schedule with revision blocks | The schedule engine analyzed historical focus-by-hour data, identified peak hours, and MiniMax generated optimal time blocks with spaced practice |
| An automaticity progress bar at 43% | The habit model computed `1 - e^(-days/18)` from consecutive study days — a formula grounded in behavioral science |

---

*The best study tool isn't one that blocks websites or generates flashcards. It's one that catches you drifting before you've lost an hour — and gently brings you back. That's FocusPet.*
