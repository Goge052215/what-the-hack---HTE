# Person 3: Tab Monitoring Architecture

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ACTIVE WEB PAGE                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTENT SCRIPTS (injected)                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ contentScript.js │──│ pageExtractor.js │  │screenshotCapture.js│ │
│  │   (entry point)  │  │ (extracts data)  │  │ (visual capture)  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └─────────┬─────────┘  │
└───────────│─────────────────────│──────────────────────│────────────┘
            │                     │                      │
            └─────────────────────┼──────────────────────┘
                                  │ chrome.runtime.sendMessage()
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND (service worker)                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │   messaging.js   │──│    storage.js    │──│    alarms.js      │  │
│  │ (message router) │  │ (persist data)   │  │ (break timers)    │  │
│  └────────┬─────────┘  └────────┬─────────┘  └─────────┬─────────┘  │
└───────────│─────────────────────│──────────────────────│────────────┘
            │                     │                      │
            ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  serviceWorker.js (Person 5) → Backend API → AI Analysis            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## File Responsibilities

### 1. `extension/content/contentScript.js` — Entry Point

**Purpose:** Main script injected into every page. Coordinates extraction and communicates with background.

**Logic:**
1. On page load → import pageExtractor & screenshotCapture
2. Extract page data (URL, title, text)
3. Listen for messages from background (e.g., "capture now")
4. Send extracted data to background via messaging
5. Respond to focus check requests

**Connects to:**
- Imports `pageExtractor.js` and `screenshotCapture.js`
- Sends messages to `messaging.js` in background

---

### 2. `extension/content/pageExtractor.js` — Data Extraction

**Purpose:** Extract meaningful content from the current page for AI analysis.

**Logic:**
1. Get URL, title, meta description
2. Extract visible text (first ~500 chars for privacy)
3. Identify page category hints (video, social, docs, etc.)
4. Return structured object:
   ```js
   {
     url: string,
     title: string,
     text: string,       // truncated
     domain: string,
     timestamp: number
   }
   ```

**Connects to:**
- Called by `contentScript.js`
- Data sent to backend via `messaging.js` → `serviceWorker.js`

---

### 3. `extension/content/screenshotCapture.js` — Visual Capture

**Purpose:** Capture viewport screenshot for AI visual analysis (like No-Hooting-Around reference).

**Logic:**
1. Use `chrome.tabs.captureVisibleTab` (requires background)
2. Or use html2canvas for content script capture
3. Compress/resize image for API efficiency
4. Return base64 encoded image

**Connects to:**
- Called by `contentScript.js` on demand
- Screenshot sent to backend for AI image analysis

---

### 4. `extension/background/messaging.js` — Message Router

**Purpose:** Central hub for all message passing between content scripts, popup, and service worker.

**Logic:**
1. Define message types:
   - `TAB_DATA`: page info from content script
   - `FOCUS_CHECK`: request focus analysis
   - `SCREENSHOT`: capture request
   - `ALARM_TRIGGER`: break time notification

2. Route incoming messages to appropriate handlers
3. Broadcast responses back to senders

**Connects to:**
- Receives from `contentScript.js`
- Calls `storage.js` to persist data
- Triggers `alarms.js` for scheduling
- Interfaces with `serviceWorker.js` (Person 5)

---

### 5. `extension/background/storage.js` — Data Persistence

**Purpose:** Manage `chrome.storage` for tab history, sessions, and user state.

**Logic:**
1. Save tab activity logs:
   ```js
   { tabId, url, title, startTime, endTime, focused }
   ```

2. Store session data:
   - Current task, active tabs, focus score

3. Provide getters/setters:
   - `saveTabActivity(data)`
   - `getTabHistory(timeRange)`
   - `getCurrentSession()`
   - `clearOldData(daysToKeep)`

**Connects to:**
- Called by `messaging.js` to persist data
- Read by `alarms.js` for scheduling decisions
- Data used by Person 4 (habits) and Person 2 (AI analysis)

---

### 6. `extension/background/alarms.js` — Break Timer & Scheduling

**Purpose:** Manage Chrome alarms for periodic focus checks and break reminders.

**Logic:**
1. Create alarms:
   - `FOCUS_CHECK_ALARM`: every 1-5 mins
   - `BREAK_REMINDER`: based on schedule

2. On alarm fire:
   - Query active tab
   - Trigger content script extraction
   - Send data for AI analysis
   - Show notification if distracted

3. API:
   - `startFocusSession(durationMins)`
   - `scheduleBreak(delayMins)`
   - `cancelAllAlarms()`

**Connects to:**
- Uses `messaging.js` to trigger content scripts
- Uses `storage.js` to log check results
- Fires notifications (used by Person 4 for break logic)

---

## Data Flow Example

```
User opens YouTube while studying
        │
        ▼
contentScript.js detects page load
        │
        ▼
pageExtractor.js extracts: {url: "youtube.com/...", title: "Cat Video", text: "..."}
        │
        ▼
contentScript.js sends TAB_DATA message
        │
        ▼
messaging.js receives → calls storage.js to log activity
        │
        ▼
alarms.js fires FOCUS_CHECK → triggers analysis request
        │
        ▼
serviceWorker.js (Person 5) sends to backend API
        │
        ▼
Backend AI (Person 2) determines: "DISTRACTED"
        │
        ▼
Notification shown: "Looks like you're off-task!"
```

---

## Handoff Notes (Hour 6)

At hour 6, Person 3 hands off ownership of:
- `extension/content/*`
- `extension/background/alarms.js`

To **Person 5 (Integration & Polish)** for final integration and testing.
