# Focus Tutor - AI-Driven Student Productivity Extension
## Comprehensive Implementation Plan

---

## 📋 Executive Summary

Focus Tutor is an AI-powered Chrome extension designed to enhance student productivity through intelligent context detection, adaptive notifications, and personalized learning support. The extension monitors user activity across educational platforms, provides timely interventions, and adapts to individual learning patterns while maintaining strict privacy standards.

---

## 🎯 Current Implementation Status

### ✅ Completed Features (Person 1 - UI/UX)
- **Task Management System**
  - Task creation with type selection (Assignment/Exam/Event)
  - Deadline tracking with date/time pickers
  - Task list with completion tracking
  - Delete task functionality
  - Current task display with progress bar

- **Theme System**
  - Light/Dark/Auto modes
  - Time-based automatic switching (8pm → dark mode)
  - Persistent theme preferences

- **UI Components**
  - Minimalistic popup interface (Quicksand font, pale aesthetic)
  - Settings panel (API configuration, theme selector, tab analysis)
  - Task list panel
  - Add task panel with type/deadline selection
  - Dashboard button (opens full-page view)

- **Progress Tracking**
  - Manual status buttons (Not Started/Ongoing/Completed)
  - Progress bar visualization
  - API integration ready for automatic detection

- **Tab Analysis**
  - Last 20 accessed tabs tracking
  - Tab context building for AI analysis
  - Real-time tab monitoring

- **Google Calendar Integration** (Ready for Chrome Web Store)
  - OAuth flow configured
  - Event creation with reminders
  - Disabled in development, works after publication

### 🔄 In Progress (Person 2 - Backend/AI)
- Context analysis API endpoints
- Task progress detection via AI
- Tab content analysis

---

## 🏗️ Technical Architecture

### 1. Extension Structure

```
extension/
├── manifest.json                 # Extension configuration
├── background/
│   └── serviceWorker.js         # Background processes, alarms, notifications
├── ui/
│   ├── popup/                   # Main extension popup (Person 1)
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── dashboard/               # Full-page dashboard (Person 1)
│   │   ├── dashboard.html
│   │   ├── dashboard.css
│   │   └── dashboard.js
│   ├── api/                     # API client utilities
│   │   └── client.js
│   ├── auth/                    # Authentication
│   └── router/                  # Navigation
├── content/                     # Content scripts (TO BE IMPLEMENTED)
│   ├── detector.js              # Context detection
│   ├── monitor.js               # Behavior monitoring
│   └── injector.js              # UI injection
└── assets/                      # Icons, images
```

### 2. Component Responsibilities

#### **Content Scripts** (TO BE IMPLEMENTED)
- **detector.js**: Analyzes page content (titles, headings, text)
- **monitor.js**: Tracks user engagement (typing, cursor, scrolling)
- **injector.js**: Injects side panels and overlays

#### **Background Service Worker**
- Manages alarms for periodic checks
- Handles notifications
- Coordinates between content scripts and popup
- Stores user data in chrome.storage

#### **API Integration**
- Backend server (Person 2): Port 5174
- Endpoints:
  - `POST /api/tasks` - Task management
  - `POST /api/analysis/task-progress` - Progress detection
  - `POST /api/analysis/context` - Context analysis (TO BE IMPLEMENTED)
  - `POST /api/analysis/distraction` - Distraction detection (TO BE IMPLEMENTED)

---

## 🎨 UI/UX Design Specifications

### 1. Current Popup Interface (Implemented)
**Dimensions**: Compact, readable (not too small, not too large)
**Layout**:
- Top bar: Task list button (left) + Settings button (right)
- Main area: Current task display with progress
- Panels: Settings, Task List, Add Task (toggle visibility)

### 2. Side Panel (TO BE IMPLEMENTED)
**Purpose**: Non-intrusive persistent interface
**Features**:
- Minimizable/expandable
- Shows current task context
- Quick action buttons
- Real-time progress updates

**Design**:
```
┌─────────────────────┐
│ 📚 Current Task     │
│ Assignment: Essay   │
│ ▓▓▓▓▓░░░░░ 50%     │
│                     │
│ 🎯 Focus Time: 45m  │
│ 🔔 Break in 15m     │
│                     │
│ [Take Break]        │
│ [Mark Complete]     │
└─────────────────────┘
```

### 3. Notification Types (TO BE IMPLEMENTED)

#### **Distraction Alerts**
- Trigger: Tab switching, prolonged inactivity
- Style: Gentle, non-blocking
- Example: "🤔 Noticed you switched tabs. Ready to refocus?"

#### **Break Reminders**
- Trigger: 45-50 minutes of continuous work
- Style: Encouraging, health-focused
- Example: "⏰ You've been focused for 50 minutes! Take a 5-minute break."

#### **Deadline Reminders**
- Trigger: Approaching deadlines (24h, 1h, 15m before)
- Style: Urgent but not alarming
- Example: "⚠️ Assignment due in 1 hour!"

#### **Task Nudges**
- Trigger: AI-detected completion opportunities
- Style: Helpful suggestions
- Example: "💡 You just finished a video. Want to summarize key points?"

### 4. Dashboard (Partially Implemented)
**Full-page view** for detailed analytics and management

**Sections** (TO BE IMPLEMENTED):
- **Overview**: Daily/weekly productivity stats
- **Task Timeline**: Visual calendar with deadlines
- **Focus Analytics**: Time spent per subject/task
- **Distraction Report**: Most common distractions
- **Learning Insights**: AI-generated study recommendations

---

## 🧠 Pedagogy-Backed Features

### 1. Spaced Repetition (TO BE IMPLEMENTED)
**Concept**: Review material at increasing intervals for better retention

**Implementation**:
- Track when user completes learning tasks
- Schedule review reminders (1 day, 3 days, 1 week, 2 weeks)
- Integrate with flashcard detection on platforms like Quizlet

**UI**:
```javascript
// Notification example
"📚 Time to review: Introduction to Psychology (learned 3 days ago)"
```

### 2. Active Recall Prompts (TO BE IMPLEMENTED)
**Concept**: Testing yourself improves memory better than re-reading

**Implementation**:
- Detect when user finishes reading/watching content
- Prompt with recall questions
- Track response accuracy over time

**UI**:
```javascript
// After watching lecture video
"🎓 Quick check: Can you summarize the 3 main points from this lecture?"
```

### 3. Pomodoro Technique Integration (TO BE IMPLEMENTED)
**Concept**: 25-minute focus sessions with 5-minute breaks

**Implementation**:
- Optional Pomodoro timer in side panel
- Auto-pause during breaks
- Track completed Pomodoros per task

### 4. Focus Session Analytics (TO BE IMPLEMENTED)
**Concept**: Understand productivity patterns

**Implementation**:
- Track focus time per subject
- Identify peak productivity hours
- Suggest optimal study times

---

## 🔧 Feature Implementation Roadmap

### Phase 1: Context Detection (Person 2 Backend + Person 1 UI)

#### **Backend (Person 2)**
- [ ] Content analysis API endpoint
- [ ] Platform-specific parsers (Google Docs, Canvas, YouTube)
- [ ] AI model for task classification

#### **Frontend (Person 1)**
- [ ] Content script injection system
- [ ] Page content extraction
- [ ] Context display in popup
- [ ] Real-time context updates

**Timeline**: 2-3 weeks

---

### Phase 2: Behavior Monitoring (Person 2 Backend + Person 1 UI)

#### **Backend (Person 2)**
- [ ] Engagement tracking API
- [ ] Distraction detection algorithm
- [ ] Activity pattern analysis

#### **Frontend (Person 1)**
- [ ] Event listeners (typing, mouse, scroll)
- [ ] Idle detection
- [ ] Tab switch tracking
- [ ] Engagement visualization

**Timeline**: 2-3 weeks

---

### Phase 3: Adaptive Notifications (Person 2 Backend + Person 1 UI)

#### **Backend (Person 2)**
- [ ] Notification scheduling logic
- [ ] User preference learning
- [ ] Feedback processing API

#### **Frontend (Person 1)**
- [ ] Notification UI components
- [ ] Feedback buttons (Helpful/Stop)
- [ ] Notification settings panel
- [ ] Custom notification frequency

**Timeline**: 2 weeks

---

### Phase 4: Pedagogy Features (Person 2 Backend + Person 1 UI)

#### **Backend (Person 2)**
- [ ] Spaced repetition scheduler
- [ ] Active recall question generator
- [ ] Learning analytics engine

#### **Frontend (Person 1)**
- [ ] Review reminder UI
- [ ] Quiz/recall prompt interface
- [ ] Analytics dashboard
- [ ] Progress visualization

**Timeline**: 3-4 weeks

---

### Phase 5: Advanced Features (Both)

#### **Backend (Person 2)**
- [ ] Multi-device sync
- [ ] Advanced AI recommendations
- [ ] Collaborative study features

#### **Frontend (Person 1)**
- [ ] Side panel implementation
- [ ] Advanced settings
- [ ] Export/import data
- [ ] Accessibility improvements

**Timeline**: 3-4 weeks

---

## 🔒 Privacy & Security

### Data Processing Strategy

#### **Local Processing (Priority)**
- Task data: Stored in `chrome.storage.local`
- User preferences: Local storage
- Basic analytics: Computed locally

#### **Server Processing (When Necessary)**
- AI context analysis: Sent to backend API
- Complex pattern detection: Server-side
- **Privacy Measures**:
  - No PII (Personally Identifiable Information) sent
  - Only page metadata (titles, headings) sent, not full content
  - User can opt-out of AI features
  - Data encrypted in transit (HTTPS)

#### **Data Retention**
- Local data: Indefinite (user-controlled)
- Server logs: 30 days maximum
- Analytics: Aggregated and anonymized

### Permissions Required
```json
{
  "permissions": [
    "storage",        // Save user data
    "tabs",           // Monitor tab activity
    "activeTab",      // Access current tab
    "alarms",         // Schedule notifications
    "notifications",  // Show alerts
    "identity"        // Google Calendar OAuth
  ],
  "host_permissions": [
    "http://localhost:5174/*",     // Development API
    "https://api.focustutor.com/*", // Production API
    "https://www.googleapis.com/*"  // Google Calendar
  ]
}
```

---

## 💰 Monetization Strategy

### Freemium Model

#### **Free Tier**
- ✅ Basic task management
- ✅ Manual progress tracking
- ✅ 3 active tasks limit
- ✅ Basic notifications
- ✅ Light/Dark themes

#### **Premium Tier ($4.99/month or $39.99/year)**
- ✅ Unlimited tasks
- ✅ AI-powered context detection
- ✅ Advanced analytics dashboard
- ✅ Spaced repetition system
- ✅ Custom notification rules
- ✅ Multi-device sync
- ✅ Priority support

#### **School/University License ($199/year per 100 students)**
- ✅ All Premium features
- ✅ Admin dashboard for educators
- ✅ Class-wide analytics
- ✅ Assignment integration with LMS
- ✅ Bulk deployment tools
- ✅ Dedicated support

### Revenue Projections (Year 1)
- **Individual Users**: 10,000 free → 500 premium (5% conversion) = $29,950/year
- **School Licenses**: 5 schools × 500 students = $4,975/year
- **Total Year 1**: ~$35,000

### Growth Strategy
1. **Launch**: Free tier only, build user base
2. **Month 3**: Introduce Premium tier
3. **Month 6**: Approach universities for pilot programs
4. **Month 12**: Scale to 50,000+ users

---

## 📊 Scalability Considerations

### Technical Scalability

#### **Backend Infrastructure**
- **Current**: Single Node.js server (localhost:5174)
- **Production**: 
  - Cloud hosting (AWS/GCP/Azure)
  - Load balancer
  - Auto-scaling based on demand
  - CDN for static assets

#### **Database**
- **Current**: Chrome storage (local)
- **Production**:
  - PostgreSQL for user data
  - Redis for caching
  - MongoDB for analytics logs

#### **AI Processing**
- **Current**: MiniMax LLM API
- **Production**:
  - Dedicated AI inference servers
  - Model optimization for speed
  - Batch processing for non-urgent tasks

### User Scalability

#### **Performance Targets**
- Popup load time: < 100ms
- Context detection: < 2s
- Notification delay: < 500ms
- API response: < 1s

#### **Capacity Planning**
- **10,000 users**: Single server
- **100,000 users**: 3-5 servers + load balancer
- **1,000,000 users**: Microservices architecture

---

## 🎯 Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Average session duration
- Tasks created per user
- Notification interaction rate

### Learning Outcomes
- Task completion rate
- Focus session duration
- Distraction reduction over time
- User-reported productivity improvement

### Business Metrics
- Free-to-Premium conversion rate
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)

### Target KPIs (Month 6)
- 5,000+ active users
- 70%+ task completion rate
- 5%+ premium conversion
- 4.5+ star rating on Chrome Web Store

---

## 🚀 Go-to-Market Strategy

### Phase 1: Soft Launch (Month 1-2)
- Beta testing with 50-100 students
- Gather feedback and iterate
- Fix critical bugs
- Prepare marketing materials

### Phase 2: Public Launch (Month 3)
- Submit to Chrome Web Store
- Launch on Product Hunt
- Social media campaign (Twitter, Reddit r/productivity)
- Blog post on Medium/Dev.to

### Phase 3: Growth (Month 4-6)
- Reach out to student influencers
- Partner with study YouTubers
- University campus ambassadors
- Content marketing (study tips blog)

### Phase 4: Enterprise (Month 7-12)
- Approach university IT departments
- Attend education technology conferences
- Create case studies from pilot schools
- B2B sales team

---

## 🛠️ Development Workflow

### Team Structure
- **Person 1 (UI/UX Lead)**: All frontend, popup, dashboard, styling
- **Person 2 (Backend/AI Lead)**: API, AI models, data processing

### Communication
- Daily standups (async via Slack/Discord)
- Weekly sprint planning
- Shared task board (Trello/Notion)
- Code reviews via GitHub PRs

### Tech Stack
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Node.js, Express
- **AI**: MiniMax LLM API (or OpenAI/Anthropic)
- **Database**: PostgreSQL + Redis
- **Hosting**: AWS/Vercel/Railway
- **Version Control**: Git + GitHub

---

## 📝 Next Steps (Immediate Actions)

### Person 1 (UI/UX) - Next 2 Weeks
1. ✅ Review this implementation plan
2. [ ] Design side panel mockups
3. [ ] Create notification UI components
4. [ ] Implement content script injection framework
5. [ ] Build settings panel for notification preferences

### Person 2 (Backend/AI) - Next 2 Weeks
1. [ ] Review this implementation plan
2. [ ] Design context analysis API endpoint
3. [ ] Implement page content parser
4. [ ] Create distraction detection algorithm
5. [ ] Set up production database schema

### Joint Tasks
1. [ ] Finalize API contract (request/response formats)
2. [ ] Set up shared development environment
3. [ ] Create testing protocol
4. [ ] Document code standards

---

## 📚 Resources & References

### Educational Psychology
- "Make It Stick" by Brown, Roediger, McDaniel (spaced repetition)
- "Deep Work" by Cal Newport (focus strategies)
- Pomodoro Technique research papers

### Chrome Extension Development
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Content Scripts Guide](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)

### AI Integration
- MiniMax API Documentation
- OpenAI API (alternative)
- Prompt engineering best practices

### Privacy & Compliance
- GDPR compliance for EU users
- COPPA compliance for under-13 users
- Chrome Web Store privacy policies

---

## 🎓 Conclusion

Focus Tutor is positioned to become a comprehensive AI-driven productivity tool for students. By combining intelligent context detection, adaptive notifications, and evidence-based learning techniques, the extension addresses real student needs while maintaining privacy and user control.

**Key Differentiators**:
1. **AI-Powered**: Smart context detection, not just timers
2. **Pedagogy-Backed**: Built on learning science principles
3. **Privacy-First**: Local processing where possible
4. **Non-Intrusive**: Gentle nudges, not aggressive interruptions
5. **Adaptive**: Learns from user behavior and feedback

**Success Factors**:
- Seamless user experience (Person 1's focus)
- Accurate AI detection (Person 2's focus)
- Continuous iteration based on user feedback
- Strong go-to-market execution

---

**Document Version**: 1.0  
**Last Updated**: February 28, 2026  
**Authors**: Person 1 (UI/UX), Person 2 (Backend/AI)  
**Status**: Ready for Implementation
