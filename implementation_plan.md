# LearnQuest — AI-Powered Adaptive Learning Engine + Premium UI

## Background & Current State

After auditing every file in the codebase, here's what exists:

| Service | Status | What It Does |
|---------|--------|-------------|
| **auth-svc** | ✅ Solid | Register, login, JWT, refresh tokens, token blacklist |
| **user-svc** | ✅ Solid | Profiles, XP, badges, classes, leaderboard |
| **game-svc** | ⚠️ Basic | Sessions, questions, answers — but **random question selection** |
| **aboa-svc** | ⚠️ Basic | Engagement score computation — but **no knowledge graph, no skill model, no memory** |
| **analytics-svc** | ⚠️ Basic | Heatmap, trends, stats — but **no AI insights, no risk prediction** |
| **rt-svc** | ✅ Solid | Socket.io real-time events |
| **student-app** | ❌ Poor UI | Functional but flat/generic, CDN Tailwind, no animations |
| **educator-app** | ❌ Poor UI | Same issues as student-app |

### Critical Gaps vs Requirements

| Requirement | Current State | Gap |
|-------------|--------------|-----|
| Knowledge Graph | ❌ None | Need full topic→concept→prerequisite graph |
| Student Skill Model | ❌ None | Only XP/level exists, no mastery per topic |
| Smart Question Selection | ❌ Random | `candidates[Math.floor(Math.random())]` — literally random |
| Spaced Repetition | ❌ None | No memory of past mistakes, no re-introduction timing |
| Dynamic Difficulty | ⚠️ Basic | ABOA adjusts ±0.1 on accuracy, but no topic-awareness |
| Personalized Learning Paths | ❌ None | No quest generation, no skill trees |
| AI Educator Dashboard | ❌ None | Stub endpoint returns hardcoded data |
| Context Preservation | ❌ None | No long-term student memory |
| Gameplay Integration | ❌ None | Adaptation doesn't feel invisible/natural |

---

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND APPS                            │
│  student-app (Vite+React)          educator-app (Vite+React)    │
│  • Quest Map / Skill Tree          • AI Analytics Dashboard     │
│  • Adaptive GamePlay               • At-Risk Student Alerts     │
│  • XP/Level/Badge Animations       • Concept Mastery Heatmaps   │
│  • Premium Dark UI                 • Intervention Suggestions   │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
         ┌───▼───────────────────────────────▼───┐
         │           GATEWAY (port 3000)          │
         │   JWT Auth + Reverse Proxy + CORS      │
         └──┬────┬────┬────┬────┬────┬───────────┘
            │    │    │    │    │    │
   ┌────────▼┐ ┌▼────┐ ┌─▼──┐ ┌▼───┐ ┌▼─────────┐ ┌──────┐
   │auth-svc │ │user  │ │game│ │aboa│ │analytics  │ │rt-svc│
   │  3001   │ │-svc  │ │-svc│ │-svc│ │   -svc    │ │ 3006 │
   │         │ │ 3002 │ │3003│ │3004│ │   3005    │ │      │
   └─────────┘ └──────┘ └─┬──┘ └─┬──┘ └───────┬──┘ └──────┘
                           │      │             │
                    ┌──────▼──────▼─────────────▼──────┐
                    │         PostgreSQL (Neon)          │
                    │  + Knowledge Graph Tables          │
                    │  + Student Skill Model Tables      │
                    │  + Spaced Repetition Tables        │
                    │  + Question History Tables         │
                    └───────────────────────────────────┘
```

> [!IMPORTANT]
> **No new services needed.** Everything fits within the existing Node.js microservice architecture. No Python/FastAPI/Kafka required — the adaptive algorithms run as pure functions inside `aboa-svc`, and the data lives in PostgreSQL. This keeps the stack simple, deployable, and testable with the existing pg-mem setup.

---

## Proposed Changes

### Phase 1: Intelligent Backend (The Brain)

---

### 1. Knowledge Graph System — `aboa-svc`

#### [MODIFY] [aboa-svc/src/db.js](file:///c:/Users/abhis/Desktop/Poach/learnquest/aboa-svc/src/db.js)

Add new tables:

```sql
-- Knowledge graph: subjects → topics → concepts
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,          -- 'math', 'science', etc.
  topic TEXT NOT NULL,            -- 'algebra', 'biology', etc.
  concept TEXT NOT NULL,          -- 'linear_equations', 'photosynthesis'
  display_name TEXT NOT NULL,     -- 'Linear Equations'
  description TEXT,
  difficulty_tier REAL DEFAULT 0.5, -- baseline difficulty
  position_x REAL DEFAULT 0,     -- for skill tree UI positioning
  position_y REAL DEFAULT 0,
  icon TEXT DEFAULT '📘',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Prerequisite edges: "to learn X, you must know Y"
CREATE TABLE IF NOT EXISTS knowledge_edges (
  id TEXT PRIMARY KEY,
  from_node_id TEXT NOT NULL,     -- prerequisite
  to_node_id TEXT NOT NULL,       -- dependent concept
  weight REAL DEFAULT 1.0         -- strength of dependency
);

-- Student mastery per concept (the Skill Model)
CREATE TABLE IF NOT EXISTS student_mastery (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  node_id TEXT NOT NULL,          -- knowledge_nodes.id
  mastery_score REAL DEFAULT 0,   -- 0.0 to 1.0
  confidence REAL DEFAULT 0.5,    -- how confident we are in this score
  attempts INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0,
  avg_response_time REAL DEFAULT 0,
  last_seen TEXT,                 -- for spaced repetition
  next_review TEXT,               -- calculated review date
  ease_factor REAL DEFAULT 2.5,   -- SM-2 algorithm ease factor
  interval_days REAL DEFAULT 1,   -- current repetition interval
  streak INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, node_id)
);

-- Question-to-concept mapping
CREATE TABLE IF NOT EXISTS question_concepts (
  question_id TEXT NOT NULL,
  node_id TEXT NOT NULL,          -- knowledge_nodes.id
  PRIMARY KEY (question_id, node_id)
);

-- Extended student profile for AI context
CREATE TABLE IF NOT EXISTS student_profile (
  user_id TEXT PRIMARY KEY,
  learning_velocity REAL DEFAULT 0.5,    -- how fast they learn
  retention_score REAL DEFAULT 0.5,      -- how well they retain
  engagement_avg REAL DEFAULT 0.5,       -- rolling engagement
  consistency_score REAL DEFAULT 0.5,    -- day-over-day consistency
  preferred_difficulty REAL DEFAULT 0.5, -- comfort zone
  preferred_pace TEXT DEFAULT 'normal',  -- slow/normal/fast
  total_time_spent REAL DEFAULT 0,       -- cumulative minutes
  risk_level TEXT DEFAULT 'low',         -- low/medium/high/critical
  strengths TEXT DEFAULT '[]',           -- JSON array of node_ids
  weaknesses TEXT DEFAULT '[]',          -- JSON array of node_ids
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Learning path / quest definitions
CREATE TABLE IF NOT EXISTS learning_paths (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,             -- 'Fraction Master Quest'
  description TEXT,
  target_nodes TEXT NOT NULL,      -- JSON array of node_ids to master
  current_stage INTEGER DEFAULT 0,
  total_stages INTEGER DEFAULT 5,
  xp_reward INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',    -- active/completed/abandoned
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Seed with a real knowledge graph (math example):
```
Basic Arithmetic → Variables → Linear Equations → Quadratic Equations
                → Fractions → Percentages → Ratios
```

#### [MODIFY] [aboa-svc/src/aboa.js](file:///c:/Users/abhis/Desktop/Poach/learnquest/aboa-svc/src/aboa.js)

Completely rewrite with these modules:

1. **Engagement Score** (keep existing, refined)
2. **SM-2 Spaced Repetition** — calculates `next_review` date based on quality of response
3. **Topic Mastery Updater** — Bayesian update of mastery per concept after each answer
4. **Dynamic Difficulty Adjuster** — uses mastery scores + response time + streak to set difficulty
5. **Knowledge Graph Traversal** — when student fails, trace prerequisites and target weak spots
6. **Smart Question Scorer** — score each candidate question by: mastery gap, spaced repetition urgency, knowledge graph relevance, difficulty match, novelty
7. **Learning Path Generator** — detect weak areas, auto-generate personalized quests

#### [MODIFY] [aboa-svc/src/index.js](file:///c:/Users/abhis/Desktop/Poach/learnquest/aboa-svc/src/index.js)

New API endpoints:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/aboa/compute` | Enhanced — now returns topic mastery updates + spaced repetition schedule |
| GET | `/aboa/learner/:id/state` | Enhanced — returns full skill model |
| GET | `/aboa/learner/:id/mastery` | Per-topic mastery scores for skill tree |
| GET | `/aboa/learner/:id/skill-tree` | Knowledge graph + user mastery overlay |
| POST | `/aboa/recommend-question` | **NEW** — Smart question selection engine |
| GET | `/aboa/learner/:id/learning-paths` | Active quests/missions |
| POST | `/aboa/learner/:id/generate-path` | Auto-generate personalized quest |
| GET | `/aboa/learner/:id/spaced-review` | Questions due for review |

---

### 2. Intelligent Game Service

#### [MODIFY] [game-svc/src/routes/games.js](file:///c:/Users/abhis/Desktop/Poach/learnquest/game-svc/src/routes/games.js)

**Replace random question selection** in `GET /sessions/:id/next-question`:

```
BEFORE: candidates[Math.floor(Math.random() * candidates.length)]
AFTER:  call aboa-svc/aboa/recommend-question with full student context
```

The recommendation engine will:
1. Get student mastery state from `student_mastery`
2. Check spaced repetition queue for overdue reviews
3. Score all candidate questions using knowledge graph proximity
4. Factor in dynamic difficulty from ABOA
5. Return the single best question

**Add concept tagging** on answer submission:
- After each answer, update `student_mastery` for the question's concept
- Run SM-2 algorithm to set `next_review`
- If incorrect, trace knowledge graph for prerequisite gaps

#### [MODIFY] [game-svc/src/db.js](file:///c:/Users/abhis/Desktop/Poach/learnquest/game-svc/src/db.js)

- Add `concept_tags TEXT` column to questions table (JSON array of node_ids)
- Expand seed questions with concept mappings
- Add more questions (50+ across all subjects and difficulty levels)

---

### 3. AI-Enhanced Analytics

#### [MODIFY] [analytics-svc/src/index.js](file:///c:/Users/abhis/Desktop/Poach/learnquest/analytics-svc/src/index.js)

New educator-facing endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/class/:id/report` | **Fixed** — Real data instead of hardcoded stub |
| GET | `/analytics/class/:id/at-risk` | Students falling behind (risk_level = high/critical) |
| GET | `/analytics/class/:id/mastery-heatmap` | Concept mastery across all students |
| GET | `/analytics/class/:id/interventions` | Recommended actions for struggling students |
| GET | `/analytics/user/:id/difficulty-history` | How difficulty adapted over time |
| GET | `/analytics/user/:id/mastery-summary` | Topic-by-topic mastery for progress UI |
| GET | `/analytics/user/:id/attention-drops` | Detected engagement dips |

---

### 4. Gateway Route Updates

#### [MODIFY] [gateway/src/index.js](file:///c:/Users/abhis/Desktop/Poach/learnquest/gateway/src/index.js)

- Ensure new ABOA endpoints are proxied correctly (already covered by `app.use('/aboa', makeProxy(ABOA_URL))`)
- No structural changes needed

---

### Phase 2: Premium UI Overhaul (The Face)

---

### 5. Student App — Design System

#### [MODIFY] [student-app/index.html](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/index.html)
- Remove CDN Tailwind `<script>` tag
- Add Google Fonts (Inter + Space Grotesk)
- Add meta description, Open Graph tags

#### [MODIFY] [student-app/src/index.css](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/index.css)
Complete rewrite with premium design system:
- CSS custom properties (--color-primary, --color-surface, etc.)
- Dark theme with emerald/purple/amber accents
- Glassmorphism utilities (backdrop-blur, frosted glass cards)
- 15+ keyframe animations (fadeIn, slideUp, pulse, glow, shake, confetti, float, countUp)
- Component classes (cards, buttons, inputs, badges, progress rings)
- Custom scrollbar styling
- Responsive breakpoints

#### [DELETE] [student-app/src/App.css](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/App.css)
Remove leftover Vite scaffold styles

---

### 6. Student App — Components & Pages

#### [MODIFY] [Navbar.jsx](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/components/Navbar.jsx)
- Glassmorphic sticky nav with backdrop blur
- Animated logo with emerald glow
- Active page indicator with animated underline
- Circular XP progress ring (not flat bar)
- Level badge with pulse animation
- Mobile hamburger with slide-in drawer

#### [MODIFY] [Login.jsx](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/pages/Login.jsx)
- Full-screen split layout: animated branding left, form right
- Floating particle background with CSS animations
- Glassmorphic form card with gradient border
- Input focus glow animations
- Loading spinner on submit

#### [MODIFY] [Register.jsx](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/pages/Register.jsx)
- Same premium treatment as Login
- Animated role selector cards
- Password strength indicator bar

#### [MODIFY] [Dashboard.jsx](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/pages/Dashboard.jsx)
- Hero greeting with avatar and animated welcome
- Stat cards with gradient borders + count-up number animations
- GitHub-style heatmap with month labels and tooltip
- Engagement chart with gradient fill
- Badge showcase with hover glow + rarity colors
- Active Learning Paths section (quests from aboa-svc)
- "Weak spots to review" section from spaced repetition queue

#### [MODIFY] [Games.jsx](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/pages/Games.jsx)
- Game mode cards with 3D tilt hover effect
- Floating animated icons
- Recent high scores mini-display
- "Coming Soon" badge for locked modes

#### [MODIFY] [GamePlay.jsx](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/pages/GamePlay.jsx)
- Circular countdown timer with animated SVG ring
- Progress dots (not text counter)
- Answer option hover scale + selection animation
- **Correct:** confetti burst + green glow + XP float-up animation
- **Wrong:** shake + red flash + show prerequisite hint
- Streak flame counter with fire animation
- Question slide-in transition
- Game Over screen: confetti, star rating, XP summary, share button
- **Invisible AI:** difficulty adjusts mid-game, prerequisite reinforcement inserted seamlessly

#### [NEW] [SkillTree.jsx](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/pages/SkillTree.jsx)
- **Visual knowledge graph** (like the reference image with connected nodes)
- Nodes colored by mastery: red (weak) → amber (learning) → green (mastered) → gold (expert)
- Locked nodes (prerequisites not met) with lock icon
- Dashed path lines connecting prerequisites
- Click node → see mastery details, start targeted practice
- Treasure chest icons at milestones
- Animated node unlock transitions

#### [NEW] [Quests.jsx](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/pages/Quests.jsx)
- Active personalized learning paths
- Progress bar per quest
- XP rewards display
- Stage-by-stage breakdown
- "Start Quest" / "Continue Quest" buttons

#### [MODIFY] [Progress.jsx](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/pages/Progress.jsx)
- Topic mastery radar/spider chart
- Animated stat cards with progress rings
- Spaced repetition review queue section
- Charts with gradient fills

#### [MODIFY] [Leaderboard.jsx](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/pages/Leaderboard.jsx)
- Top 3 podium with gold/silver/bronze pedestals
- Current user highlighted with glow
- Rank change indicators (↑ ↓)
- Animated row entry

#### [MODIFY] [Profile.jsx](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/pages/Profile.jsx)
- Large avatar with edit overlay
- Level progress arc visualization
- Badge collection grid
- AI-generated learning summary
- Save animation with checkmark

#### [MODIFY] [App.jsx](file:///c:/Users/abhis/Desktop/Poach/learnquest/student-app/src/App.jsx)
- Add routes for `/skill-tree` and `/quests`

---

### 7. Educator App — AI Dashboard

#### [MODIFY] [educator-app/index.html](file:///c:/Users/abhis/Desktop/Poach/learnquest/educator-app/index.html)
- Same fixes (remove CDN Tailwind, add fonts, meta tags)

#### [MODIFY] [educator-app/src/index.css](file:///c:/Users/abhis/Desktop/Poach/learnquest/educator-app/src/index.css)
- Same design system as student-app (purple accent)

#### [DELETE] [educator-app/src/App.css](file:///c:/Users/abhis/Desktop/Poach/learnquest/educator-app/src/App.css)
- Remove Vite scaffold styles

#### [MODIFY] [educator-app/src/pages/Dashboard.jsx](file:///c:/Users/abhis/Desktop/Poach/learnquest/educator-app/src/pages/Dashboard.jsx)
- **At-Risk Students** panel with red/amber/green risk indicators
- Concept mastery heatmap (which concepts are students struggling with)
- Engagement trend charts with smooth gradients
- Intervention recommendations ("Student X needs help with Linear Equations")
- Class-level analytics

#### [MODIFY] All other educator-app pages
- Apply premium design system
- Glassmorphic cards, animations, transitions

---

### 8. Miscellaneous

#### [MODIFY] [README.md](file:///c:/Users/abhis/Desktop/Poach/learnquest/README.md)
- Rewrite in proper UTF-8 (currently UTF-16, renders as garbage)
- Update architecture diagram with new AI components
- Add section on adaptive learning system

---

## Smart Question Recommendation Algorithm

The core algorithm in `aboa-svc/src/aboa.js` will score each candidate question:

```
Score(Q) = w1 × MasteryGap(Q)           // prioritize topics student hasn't mastered
         + w2 × SpacedRepetitionUrgency(Q) // SM-2 review timing
         + w3 × DifficultyMatch(Q)        // match student's current level
         + w4 × PrerequisiteRelevance(Q)   // reinforce weak prerequisites
         + w5 × Novelty(Q)                 // avoid recently seen questions
         + w6 × EngagementPredictor(Q)     // predict engagement score

Best question = argmax(Score(Q)) for all eligible Q
```

**SM-2 Spaced Repetition** (per concept):
```
If quality ≥ 3 (correct):
  interval = interval × ease_factor
  ease_factor = max(1.3, ease_factor + 0.1 - (5-quality) × (0.08 + (5-quality) × 0.02))
If quality < 3 (wrong):
  interval = 1 day
  ease_factor = max(1.3, ease_factor - 0.2)
next_review = now + interval
```

**Topic Mastery Bayesian Update**:
```
mastery_new = mastery × (1 - learning_rate) + outcome × learning_rate
confidence = min(1.0, confidence + 0.05 × (1 - confidence))
// outcome = 1.0 for correct, 0.0 for wrong, weighted by difficulty
```

---

## Open Questions

> [!IMPORTANT]
> **Question pool size:** The current system has only 20 seed questions. For true adaptive learning, we need at least 100-200 questions across subjects, tagged with concepts. Should I generate a comprehensive seed set (~150 questions across math, science, english, general) covering the knowledge graph, or do you plan to add questions through the educator interface?

> [!NOTE]
> **No external AI/ML services needed.** The adaptive algorithms (SM-2, Bayesian mastery, knowledge graph traversal, weighted scoring) are pure math functions — they run fast in Node.js with no Python/TensorFlow dependency. This keeps your deployment simple (Docker Compose, no GPU needed).

> [!WARNING]
> **This is a large change.** It touches every service and both frontend apps. I recommend executing in two phases:
> - **Phase 1 (Backend):** Knowledge graph + skill model + smart question engine + spaced repetition
> - **Phase 2 (Frontend):** Premium UI + skill tree + quest map + animations
> 
> Should I proceed with both phases, or do Phase 1 first and then Phase 2?

---

## Verification Plan

### Automated Tests
- Run existing 36 tests to ensure no regressions: `npm test`
- Test ABOA recommendation engine with mock student profiles
- Test SM-2 spaced repetition interval calculations
- Test knowledge graph traversal for prerequisite detection
- Build both frontend apps: `npm run build --workspace=student-app && npm run build --workspace=educator-app`

### Browser Testing
- Start dev server and test complete flow:
  - Register → Dashboard → Skill Tree → Start Game → Play (verify adaptive difficulty) → End → Check Progress → Leaderboard
- Verify animations render smoothly on all pages
- Test responsive behavior at 375px / 768px / 1440px
- Verify skill tree node visualization with mastery colors

### Manual Verification
- Play multiple sessions with different accuracy levels → verify difficulty adapts
- Answer wrong on a topic → verify system introduces prerequisite reinforcement
- Check spaced repetition: wrong answer → concept reappears after calculated interval
- Verify educator dashboard shows real risk assessments
