# AI Integration Points for Person 2

This document outlines where Person 2's AI context detection will integrate with the notification system.

---

## 🎯 Overview

The notification system (Person 1) is **ready to receive triggers** from Person 2's AI context detection system. All notification types are implemented and working - they just need to be triggered by the AI backend.

---

## 🔗 Integration Points

### **1. Distraction Detection**

**Current Implementation:**
- Triggers after 3+ tab switches in 2 minutes
- Location: `extension/background/serviceWorker.js` lines 19-45

**AI Integration Needed:**
Person 2 should replace the simple tab-switch counter with AI-powered context analysis:
- Analyze tab content (titles, URLs, page content)
- Detect when user switches from study-related to non-study content
- Send message to trigger distraction notification

**How to Trigger:**
```javascript
// From Person 2's AI backend or content script
chrome.runtime.sendMessage({
  type: 'showDistraction',
  context: {
    currentTask: 'Essay Assignment',
    distractingContent: 'YouTube Entertainment'
  }
});
```

**Background worker should add handler:**
```javascript
if (message?.type === "showDistraction") {
  showNotification(
    "distraction",
    "👋 Hey! Get back to your task",
    "You've been switching tabs a lot. Time to refocus on what matters!"
  );
}
```

---

### **2. Task Nudges (AI-Driven)**

**Current Implementation:**
- Test notification exists but not triggered automatically
- Location: Test in `extension/ui/popup/popup.js` lines 697-704

**AI Integration Needed:**
Person 2's AI should:
- Detect when user finishes watching a video, reading an article, etc.
- Analyze the content type and learning context
- Generate personalized nudge suggestions
- Trigger appropriate nudge notification

**How to Trigger:**
```javascript
// From Person 2's AI backend
chrome.runtime.sendMessage({
  type: 'showTaskNudge',
  suggestion: {
    title: '💡 Quick tip!',
    message: 'You just watched a lecture on Calculus. Take 2 minutes to solve a practice problem!',
    action: 'practice' // or 'summarize', 'review', etc.
  }
});
```

**Background worker should add handler:**
```javascript
if (message?.type === "showTaskNudge") {
  showNotification(
    "task-nudge-" + Date.now(),
    message.suggestion.title,
    message.suggestion.message
  );
}
```

---

### **3. Break Reminders (Enhanced with AI)**

**Current Implementation:**
- Simple timer-based (45 minutes default)
- Location: `extension/background/serviceWorker.js` lines 141-159

**AI Enhancement Needed:**
Person 2 can enhance this by:
- Detecting user's actual focus level (typing speed, mouse activity, etc.)
- Adjusting break timing based on fatigue detection
- Personalizing break duration based on task complexity

**How to Trigger Custom Break:**
```javascript
// From Person 2's AI backend
chrome.runtime.sendMessage({
  type: 'suggestBreak',
  reason: 'fatigue_detected',
  duration: 10 // minutes
});
```

---

### **4. Deadline Reminders (AI-Enhanced)**

**Current Implementation:**
- Checks task deadlines every 5 minutes
- Notifies at 24h, 1h, 15m before deadline
- Location: `extension/background/serviceWorker.js` lines 161-195

**AI Enhancement Needed:**
Person 2 can enhance by:
- Estimating time needed to complete task based on complexity
- Suggesting earlier start times if task is complex
- Detecting if user is behind schedule

**How to Trigger Smart Deadline Alert:**
```javascript
// From Person 2's AI backend
chrome.runtime.sendMessage({
  type: 'smartDeadlineAlert',
  task: {
    id: 'task-123',
    name: 'Essay Assignment',
    deadline: '2026-03-01T23:59:00',
    estimatedTimeNeeded: 180, // minutes
    currentProgress: 30 // percentage
  }
});
```

---

## 📡 API Endpoints for Person 2

### **Context Analysis Endpoint**
```
POST /api/analysis/context
```

**Request:**
```json
{
  "tabs": [
    {
      "title": "Introduction to Psychology - Lecture 5",
      "url": "https://youtube.com/watch?v=...",
      "active": true,
      "lastAccessed": 1234567890
    }
  ],
  "currentTask": {
    "id": "task-123",
    "description": "Psychology Essay",
    "type": "assignment"
  }
}
```

**Response:**
```json
{
  "isDistracted": false,
  "focusScore": 0.85,
  "suggestion": {
    "type": "nudge",
    "title": "💡 Quick tip!",
    "message": "You just finished a lecture. Take notes now!",
    "action": "take_notes"
  }
}
```

---

### **Fatigue Detection Endpoint**
```
POST /api/analysis/fatigue
```

**Request:**
```json
{
  "sessionDuration": 45,
  "activityMetrics": {
    "typingSpeed": 45,
    "mouseMovements": 120,
    "tabSwitches": 3
  }
}
```

**Response:**
```json
{
  "fatigueLevel": "moderate",
  "suggestBreak": true,
  "breakDuration": 5
}
```

---

## 🔧 Message Handlers to Add

Person 2 should work with the background service worker to add these message handlers:

```javascript
// In extension/background/serviceWorker.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  // AI-triggered distraction alert
  if (message?.type === "showDistraction") {
    const settings = await getNotificationSettings();
    if (settings.enabled && settings.distractionAlerts) {
      showNotification(
        "ai-distraction",
        message.title || "👋 Hey! Get back to your task",
        message.message || "You've been switching tabs a lot. Time to refocus!"
      );
    }
    sendResponse({ ok: true });
  }
  
  // AI-triggered task nudge
  if (message?.type === "showTaskNudge") {
    const settings = await getNotificationSettings();
    if (settings.enabled && settings.taskNudges) {
      showNotification(
        "ai-nudge-" + Date.now(),
        message.title,
        message.message
      );
    }
    sendResponse({ ok: true });
  }
  
  // AI-suggested break
  if (message?.type === "suggestBreak") {
    const settings = await getNotificationSettings();
    if (settings.enabled && settings.breakReminders) {
      showNotification(
        "ai-break",
        "☕ Take a break!",
        message.message || "You've been working hard. Time for a quick break!",
        [
          { title: "Take Break" },
          { title: "Keep Working" }
        ]
      );
    }
    sendResponse({ ok: true });
  }
  
  return true;
});
```

---

## 📋 Current Notification Settings

Users can toggle these notification types in Settings:
- ✅ **Enable Notifications** - Master toggle
- ✅ **Distraction Alerts** - AI should trigger these
- ✅ **Break Reminders** - AI can enhance timing
- ✅ **Deadline Reminders** - AI can make smarter
- ✅ **Task Nudges** - AI-driven suggestions
- ⚙️ **Focus Duration** - Customizable (15-120 minutes)

All settings are stored in `chrome.storage.local` under `notificationSettings`.

---

## 🚀 Next Steps for Person 2

1. **Implement context analysis API** (`/api/analysis/context`)
2. **Add content script** to extract page content and send to API
3. **Create message handlers** in background worker for AI triggers
4. **Test integration** with notification system
5. **Fine-tune AI models** based on user feedback

---

## 📝 Notes

- All notifications use the same `showNotification()` function in `serviceWorker.js`
- Notification IDs should be unique to prevent duplicates
- User preferences are checked before showing notifications
- Break duration is currently hardcoded to 5 minutes but can be made dynamic
- Return-to-work notification triggers automatically after break ends

---

**Person 1 (UI/UX)**: ✅ Notification system complete and ready  
**Person 2 (Backend/AI)**: 🔄 Needs to implement AI triggers and context detection
