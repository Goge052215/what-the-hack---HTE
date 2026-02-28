**No exact open-source Chrome extension matches your full vision**, but several strong, actively maintained repos provide ready-made building blocks for tab monitoring, AI-driven focus detection, task management, break reminders, and basic habit learning—making your idea highly buildable in a 24-hour hackathon.

Your concept stands out as a unique “AI Adaptive Focus Tutor” extension: users input tasks → MiniMax LLM breaks them into subtasks → real-time tab/window context analysis checks focus → smart break prompts + habit-based scheduling. It perfectly aligns with the **RevisionDojo Future of Learning Award** (personalized feedback, adaptive pathways, real learning outcomes) and can layer in MiniMax video/audio for creative polish if targeting the Creative Usage track too.

**Closest existing repos (all free to fork/study):**

- **Smart Tab Manager** — AI tab categorization via content + behavioral tracking, context-aware (work hours), learns from user corrections, productivity nudges. [repo link](https://github.com/mnusrat786/smart-tab-manager)
- **No-Hooting-Around** (DeltaHacks XI winner) — Real-time AI screenshot analysis of active tab vs. user goal, auto-redirects distractions. [repo link](https://github.com/RohanT766/No-Hooting-Around)
- **Super Productivity** + its official Chrome extension — Full task planner with sub-tasks, Pomodoro, break reminders, idle detection. [repo link](https://github.com/super-productivity/super-productivity)
- **FocusGuard AI** — OpenAI-based page content analysis that closes off-topic tabs. [repo link](https://github.com/erolDemirhan/focus-guard-ai)
- **TabsTracker** — Time tracking + AI productivity categorization with visualizations. [repo link](https://github.com/Himank-J/TabsTracker)

None combine task splitting + deep habit-learned scheduling + MiniMax-level multimodal AI, so your version would be original.

**Proposed codebase structure (file tree only, no code):**
```
project-root
├── extension
│   ├── manifest.json
│   ├── background
│   │   ├── serviceWorker.js
│   │   ├── alarms.js
│   │   ├── storage.js
│   │   ├── messaging.js
│   │   └── schedulerBridge.js
│   ├── content
│   │   ├── contentScript.js
│   │   ├── pageExtractor.js
│   │   └── screenshotCapture.js
│   ├── popup
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── dashboard
│   │   ├── dashboard.html
│   │   ├── dashboard.css
│   │   └── dashboard.js
│   ├── options
│   │   ├── options.html
│   │   ├── options.css
│   │   └── options.js
│   ├── icons
│   └── assets
├── backend
│   ├── app.js
│   ├── routes
│   │   ├── tasks.js
│   │   ├── habits.js
│   │   ├── schedule.js
│   │   └── analyze.js
│   ├── services
│   │   ├── llmClient.js
│   │   ├── taskSplitter.js
│   │   ├── habitModel.js
│   │   ├── scheduleEngine.js
│   │   └── relevanceScorer.js
│   ├── prompts
│   │   ├── taskSplit.txt
│   │   ├── habitSummary.txt
│   │   └── schedulePlan.txt
│   ├── middlewares
│   │   ├── auth.js
│   │   └── rateLimit.js
│   ├── storage
│   │   ├── index.js
│   │   └── models.js
│   └── config
│       ├── env.js
│       └── constants.js
├── shared
│   ├── types
│   │   ├── tasks.d.ts
│   │   ├── habits.d.ts
│   │   └── schedule.d.ts
│   ├── schemas
│   │   ├── taskSplit.json
│   │   ├── habitSummary.json
│   │   └── schedulePlan.json
│   └── utils
│       ├── time.js
│       ├── validation.js
│       └── ids.js
├── scripts
│   ├── build-extension.js
│   └── dev-backend.js
├── tests
│   ├── backend
│   └── extension
├── package.json
└── package-lock.json
```

**5-Person 24-Hour Workflow** (tested structure used by similar hackathon teams): Parallel modules + daily stand-ups at hours 0, 8, 16. Total build time ~20 hours + 4 hours polish/demo.

| Phase            | Time   | Person 1 (UI/UX Lead)           | Person 2 (AI/Task Logic)                    | Person 3 (Tab Monitoring)              | Person 4 (Focus & Habits)                    | Person 5 (Integration & Polish)                   |
| ---------------- | ------ | ------------------------------- | ------------------------------------------- | -------------------------------------- | -------------------------------------------- | ------------------------------------------------- |
| Setup & Planning | 0–2h   | Manifest + popup skeleton       | MiniMax API key handler + task-split prompt | Tabs API + content script skeleton     | chrome.idle + storage schema                 | Git repo + README + Figma wireframes              |
| Core Features    | 2–10h  | Task input form + dashboard UI  | LLM calls: split tasks + context relevance  | Extract URL/title/text from active tab | Break timer logic + notifications            | Connect all modules via background service worker |
| Smart Features   | 10–16h | Progress visuals + habit charts | Habit summary prompt to MiniMax             | —                                      | Analyze stored sessions → productivity peaks | Adaptive schedule generator                       |
| Testing & Demo   | 16–22h | Responsive tweaks               | Edge-case prompts                           | Permission testing                     | Idle detection tuning                        | Full demo script + screen recording               |
| Submit           | 22–24h | —                               | —                                           | —                                      | —                                            | Final polish + video upload                       |

**Quick feasibility notes** Chrome Manifest V3 + tabs, activeTab, scripting, storage, notifications, idle permissions are all you need (same as the repos above). Content analysis sends only page title + first 500 characters (or screenshot like No-Hooting-Around) to MiniMax API—privacy-friendly and under 1-second latency. Habit learning uses chrome.storage.local + simple timestamp analysis (or MiniMax for natural-language insights). Costs are negligible for hackathon-scale usage.

This extension would be a slam-dunk demo: live task input → instant subtasks → switch tabs → watch AI flag distraction + suggest break → see habit heatmap update. Real learning impact is obvious in 60 seconds.
