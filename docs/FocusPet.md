# 🐾 FocusPet — AI Adaptive Learning Companion

FocusPet is an AI-powered learning companion designed to help students improve focus, reduce procrastination, and build sustainable study habits through adaptive behavior modeling and intelligent task management.

---

## 📋 Team Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER ACTIVITY                                │
│              (Browser tabs, apps, study sessions)                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PERSON 3: Tab Monitoring                          │
│  • Tracks active tabs & applications                                 │
│  • Extracts page content & context                                   │
│  • Captures behavioral data in real-time                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
        ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
        │   PERSON 5:   │ │  PERSON 4:   │ │  PERSON 2:   │
        │   Backend     │ │   Habit      │ │   AI Core    │
        │   API Layer   │ │   Analysis   │ │   Engine     │
        └───────┬───────┘ └──────┬───────┘ └──────┬───────┘
                │                │                │
                └────────────────┼────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │     PERSON 2: AI Core   │
                    │  • Task decomposition   │
                    │  • Focus analysis       │
                    │  • Drift detection      │
                    │  • Learning insights    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
        ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
        │  Notifications│ │  Focus Score │ │  Task Plans  │
        │  & Reminders  │ │  Dashboard   │ │  & Insights  │
        └───────────────┘ └──────────────┘ └──────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     PERSON 1: UI/UX     │
                    │  • Visual feedback      │
                    │  • Interactive controls │
                    │  • Achievement display  │
                    └─────────────────────────┘
```

### Data Flow Example:
```
User opens YouTube
        │
        ▼
Person 3 detects tab change → extracts: {url, title, content}
        │
        ▼
Person 5 sends to backend API
        │
        ▼
Person 2 AI analyzes: "Entertainment - potential distraction"
        │
        ├──→ Person 4 logs behavior pattern
        │
        └──→ Person 1 shows gentle reminder: "Study session active"
```

---

## 🧠 1. Core AI Intelligence

FocusPet leverages AI to actively support learning, rather than passively tracking time.

### Key Features:
- **Intelligent Study Activation System**  
  Suggests entering study mode based on historical behavior patterns and recommends priority tasks.

- **AI Task Decomposition & Planning Engine**  
  Uses LLM to break down complex tasks, estimate completion time, and generate optimal execution order.

- **Adaptive Focus Monitoring (Cognitive Drift Detection)**  
  Analyzes current applications or webpages in real-time and gently reminds users when distraction is detected.

- **Cognitive Focus Score System**  
  Calculates a real-time focus score based on productive time, task completion rate, and time efficiency, with visual trend tracking.

---

## 📊 2. Behavioral Data & Adaptive Modeling

FocusPet builds a personalized behavioral model to optimize learning efficiency.

### Key Features:
- **Behavioral Time Analysis System**  
  Automatically categorizes study vs. entertainment usage and generates daily time distribution reports.

- **Peak Productivity Time Identification**  
  Detects personal high-efficiency study windows and prioritizes important tasks accordingly.

- **Adaptive Fatigue Detection System**  
  Identifies prolonged focus sessions and recommends restorative breaks to prevent burnout.

---

## 🌟 3. Expansion Layer (Motivation & Growth System)

This layer enhances long-term engagement and habit formation through gamification and AI-driven feedback loops.

### Key Features:
- **Achievement & Badge System**  
  Unlock milestones for consistent study streaks and task completion.

- **Peak Time Reward Mechanism**  
  Extra rewards for completing tasks during identified high-efficiency time windows.

- **AI Learning Reflection Summary**  
  Weekly AI-generated learning insights and personalized improvement suggestions.

---

## 🎯 Vision

FocusPet transforms productivity tracking into an adaptive learning experience — combining behavioral modeling, AI planning, cognitive drift detection, and emotional design into one intelligent study companion.