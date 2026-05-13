# LearnQuest — Product Requirements Document (PRD)

> **Last Updated:** 2026-05-14
> **Document Owner:** Product & Engineering
> **Status:** Living Document

---

## 1. Student Experience Requirements

### 1.1 Authentication & Onboarding

| Requirement | Priority | Details |
|-------------|----------|---------|
| Email/password registration | P0 | With display name, role selection (student/educator), language preference |
| JWT + refresh token auth | P0 | 15-minute access tokens, 7-day refresh tokens |
| Token blacklist on logout | P0 | Prevent use of revoked tokens |
| Onboarding flow | P1 | Subject interest selection, initial skill assessment quiz (5 questions) to calibrate starting difficulty |
| Social login (Google) | P2 | OAuth2 integration |
| Password reset | P1 | Email-based reset flow |

### 1.2 Dashboard

| Requirement | Priority | Details |
|-------------|----------|---------|
| Welcome greeting with avatar | P0 | Personalized: "Welcome back, {name} 👋" |
| Stats row (streak, accuracy, sessions, XP) | P0 | Live data from analytics-svc |
| 365-day activity heatmap | P0 | GitHub-style, shows session count per day |
| Engagement trend chart (14 days) | P1 | Line chart with gradient fill |
| Recent badges showcase | P0 | Last 6 earned badges with icons |
| Growth tips (AI-generated) | P1 | 3 tips based on weak areas from analytics |
| Quick play CTA | P0 | One-click start game |
| Active learning paths | P1 | Show personalized quests from ABOA engine |
| Spaced review reminder | P1 | "You have 5 concepts due for review" |

### 1.3 Game Lobby

| Requirement | Priority | Details |
|-------------|----------|---------|
| 6 game modes displayed as cards | P0 | Lightning Quiz, Word Builder, Quest Map, Battle Mode, Time Attack, Daily Challenge |
| Subject filter pills | P0 | All, Math, Science, English, General |
| Mode-specific descriptions and icons | P0 | Each mode has distinct visual identity |
| Recent high score on each card | P2 | Last session's accuracy |
| Locked modes with "Coming Soon" | P1 | Visual indicator for unavailable modes |

### 1.4 Gameplay (Core Loop)

| Requirement | Priority | Details |
|-------------|----------|---------|
| 10 questions per session (configurable) | P0 | Adaptive question count based on engagement |
| 30-second countdown timer per question | P0 | Animated circular ring, red when < 10s |
| 4-option MCQ display | P0 | Options A/B/C/D with tap/click selection |
| Instant feedback on answer | P0 | Green glow + XP animation for correct, red shake for wrong |
| Hint system (-5 XP) | P0 | Eliminates 2 wrong options |
| Difficulty display badge | P1 | Shows current question difficulty % |
| Subject badge per question | P1 | Shows which subject the question is from |
| XP counter (running total) | P0 | Visible throughout session |
| Progress indicator | P0 | Question X/10 with dots, not text |
| Streak flame counter | P1 | Consecutive correct answers with fire animation |
| Explanation on wrong answer | P0 | Shows correct answer + explanation text |
| Game Over summary | P0 | Score, accuracy %, XP earned, play again / back to lobby |
| Confetti on high scores | P1 | ≥ 80% accuracy triggers celebration |
| **AI question selection (NOT random)** | **P0** | **Every question chosen by recommendation engine** |
| **Invisible difficulty adjustment** | **P0** | **ABOA adjusts difficulty mid-session without UI indicator** |
| **Prerequisite reinforcement** | **P0** | **If student fails concept X, system inserts prerequisite Y** |

### 1.5 Skill Tree (Knowledge Graph Visualization)

| Requirement | Priority | Details |
|-------------|----------|---------|
| Visual node graph per subject | P0 | Connected nodes showing concept relationships |
| Mastery coloring per node | P0 | Red (0-25%) → Amber (25-50%) → Green (50-80%) → Gold (80-100%) |
| Locked nodes (prerequisites not met) | P0 | Lock icon, grayed out, tooltip shows required prerequisites |
| Dashed path lines between nodes | P0 | Visual prerequisite connections |
| Click node → mastery detail modal | P1 | Accuracy, attempts, last seen, next review date |
| Click node → "Practice this concept" | P1 | Starts targeted practice session |
| Treasure chest at milestones | P2 | Visual reward markers |
| Animated unlock transitions | P2 | Node transitions from locked → unlocked with animation |

### 1.6 Quests (Personalized Learning Paths)

| Requirement | Priority | Details |
|-------------|----------|---------|
| Auto-generated quests for weak areas | P0 | AI detects weakness → generates "Fraction Master Quest" |
| Quest progress bar | P0 | Stage X/Y with XP reward preview |
| Quest types: reinforcement, challenge, boss battle | P1 | Different quest structures |
| Quest completion → XP bonus + badge | P0 | Reward on completion |
| Active quests list on dashboard | P0 | Max 3 active quests at a time |

### 1.7 Progress Analytics (Student View)

| Requirement | Priority | Details |
|-------------|----------|---------|
| Per-subject accuracy bar chart | P0 | Recharts bar chart |
| 30-day engagement line chart | P0 | With gradient fill |
| Session history table | P0 | Date, mode, subject, accuracy, XP |
| Personal best stats | P0 | Total sessions, avg accuracy, best streak, fav subject |
| Topic mastery breakdown | P1 | Per-concept mastery percentages |

### 1.8 Leaderboard

| Requirement | Priority | Details |
|-------------|----------|---------|
| Global XP leaderboard (top 20) | P0 | All students ranked by XP |
| Top 3 podium visualization | P1 | Gold/silver/bronze visual display |
| Current user highlight | P0 | "You" badge with glow effect |
| Avatar + level display per player | P0 | Visual identity for each player |
| Class-specific leaderboard | P2 | Filter by classroom |

### 1.9 Profile

| Requirement | Priority | Details |
|-------------|----------|---------|
| Edit display name | P0 | Text input |
| Edit avatar URL | P0 | URL input (future: upload) |
| Language preference | P0 | en, hi, pa, es |
| Account info display | P0 | Email, role, level, XP (read-only) |
| Badge collection | P1 | All earned badges with dates |
| Save confirmation animation | P1 | Checkmark animation on save |

---

## 2. Educator Experience Requirements

### 2.1 Dashboard

| Requirement | Priority | Details |
|-------------|----------|---------|
| Total students count | P0 | Across all classes |
| Average XP across students | P0 | Engagement proxy |
| Active users count | P0 | Students with sessions in last 7 days |
| Class count | P0 | Number of classes created |
| Top 5 students table | P0 | Ranked by XP |
| XP distribution chart | P1 | Histogram of student engagement |
| Class cards with invite codes | P0 | Quick access to classes |
| **At-risk students panel** | **P0** | **AI-identified students falling behind** |
| **Concept mastery heatmap** | **P1** | **Which concepts are students struggling with** |
| **Intervention recommendations** | **P1** | **AI suggestions: "Student X needs help with Y"** |

### 2.2 Class Management

| Requirement | Priority | Details |
|-------------|----------|---------|
| Create class (name, subject, description) | P0 | Auto-generates 6-char invite code |
| Class list with invite codes | P0 | Copy-to-clipboard for codes |
| Class detail: member list | P0 | Student name, XP, level, last active |
| Student progress drill-down | P1 | Per-student mastery view |

### 2.3 Content Library

| Requirement | Priority | Details |
|-------------|----------|---------|
| Create MCQ questions | P0 | Question text, 4 options, correct answer, subject, difficulty |
| Question list with subject filter | P0 | Tabbed filter by subject |
| Correct answer highlighting | P0 | Green border on correct option |
| Difficulty label (Easy/Medium/Hard) | P0 | Color-coded |
| Bulk question import | P2 | CSV upload |
| Question analytics | P2 | Which questions have lowest accuracy |

---

## 3. AI/Adaptive Learning Requirements

| Requirement | Priority | Details |
|-------------|----------|---------|
| **Dynamic Difficulty Adjustment** | **P0** | Real-time, per-question, based on accuracy + speed + streak |
| **Knowledge Graph** | **P0** | Subject → Topic → Concept with prerequisite edges |
| **Student Skill Model** | **P0** | Per-concept mastery, confidence, velocity, retention |
| **SM-2 Spaced Repetition** | **P0** | Concepts reintroduced before predicted forgetting |
| **Smart Question Recommendation** | **P0** | Weighted scoring: mastery gap + spaced repetition + difficulty match + novelty |
| **Prerequisite Detection** | **P0** | Graph traversal to find weak foundations |
| **Learning Path Generation** | **P1** | Auto-create quests for weak areas |
| **At-Risk Prediction** | **P1** | Identify students likely to disengage |
| **Educator Interventions** | **P1** | AI-generated action items for teachers |
| **Long-term Context** | **P0** | Student model persists across all sessions indefinitely |

---

## 4. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page load time | < 2 seconds |
| API response time (p95) | < 500ms |
| ABOA computation time | < 100ms |
| Question recommendation | < 200ms |
| Uptime | 99.5% |
| Concurrent users | 1,000+ (initial) |
| Data retention | Indefinite for student models |
| Mobile responsive | Full support at 375px+ |
| Accessibility | WCAG 2.1 AA |
| Browser support | Chrome, Firefox, Safari, Edge (last 2 versions) |
