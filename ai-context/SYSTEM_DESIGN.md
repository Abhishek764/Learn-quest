# LearnQuest — System Design (Deep Dive)

> **Last Updated:** 2026-05-14  |  **Owner:** Architecture  |  **Status:** Living Document

---

## Core Question: How Does a Question Get to a Student?

This is the most important system design question in LearnQuest. The answer defines the product.

### The Old Way (Current — BROKEN)

```
Student clicks "Next Question"
  → game-svc queries questions WHERE difficulty BETWEEN (d-0.2, d+0.2) AND subject=$1
  → filters out already-answered
  → picks candidates[Math.floor(Math.random() * candidates.length)]
  → returns to student
```

**This is random. This is what makes LearnQuest "just another quiz app."**

### The New Way (Target — INTELLIGENT)

```
Student clicks "Next Question"
  → game-svc calls POST /aboa/recommend-question { user_id, session_id, subject }
  → aboa-svc loads:
      • student_mastery (all concept mastery scores for this student)
      • student_profile (learning velocity, preferred difficulty, risk level)
      • session history (what's been answered in this session)
      • recent failures (last 5 sessions — what concepts failed?)
      • spaced_rep queue (what concepts are overdue for review?)
  → aboa-svc scores EVERY candidate question:
      • MasteryGap: how much does this concept need practice? (25%)
      • SpacedRepUrgency: is this concept due for review? (25%)
      • DifficultyMatch: does this question match the student's level? (20%)
      • PrerequisiteRel: is this a weak prerequisite of a recently failed concept? (15%)
      • Novelty: has the student seen this question recently? (10%)
      • EngagementPred: will this topic keep them engaged? (5%)
  → returns question_id with highest combined score
  → game-svc fetches question data and returns to student
```

**This is intelligent. This is what makes LearnQuest an adaptive learning engine.**

---

## Data Flow: Complete Game Session

```
Timeline ──────────────────────────────────────────────────────▶

Student              game-svc           aboa-svc          user-svc     analytics-svc
  │                     │                  │                 │              │
  │ POST /start         │                  │                 │              │
  │────────────────────▶│                  │                 │              │
  │    {session_id}     │                  │                 │              │
  │◀────────────────────│                  │                 │              │
  │                     │                  │                 │              │
  │ GET /next-question  │                  │                 │              │
  │────────────────────▶│ recommend-q      │                 │              │
  │                     │─────────────────▶│                 │              │
  │                     │  {question_id}   │                 │              │
  │                     │◀─────────────────│                 │              │
  │    {question}       │                  │                 │              │
  │◀────────────────────│                  │                 │              │
  │                     │                  │                 │              │
  │ POST /answer        │                  │                 │              │
  │────────────────────▶│ compute          │                 │              │
  │                     │─────────────────▶│ update mastery  │              │
  │                     │                  │ update SM-2     │              │
  │                     │ {difficulty,xp}  │ check prereqs   │              │
  │                     │◀─────────────────│                 │              │
  │                     │ POST /xp         │                 │              │
  │                     │─────────────────────────────────▶│              │
  │                     │                  │                 │              │
  │ {correct,xp}        │                  │                 │              │
  │◀────────────────────│                  │                 │              │
  │                     │                  │                 │              │
  │ ... (repeat 10x)    │                  │                 │              │
  │                     │                  │                 │              │
  │ POST /end           │                  │                 │              │
  │────────────────────▶│ record           │                 │              │
  │                     │───────────────────────────────────────────────▶│
  │   {session_data}    │                  │                 │              │
  │◀────────────────────│                  │                 │              │
```

---

## Concurrency & Race Conditions

### Problem: Two Tabs, Same User

If a student opens two game sessions simultaneously, mastery updates from both sessions could conflict.

**Solution:** `student_mastery` uses `UNIQUE(user_id, node_id)` constraint. Updates use `INSERT ... ON CONFLICT (user_id, node_id) DO UPDATE`. Last-write-wins semantics are acceptable since mastery converges over time.

### Problem: XP Update During Leaderboard Read

Leaderboard reads from `users.xp` while `POST /users/:id/xp` updates it.

**Solution:** PostgreSQL's MVCC handles this. Reads see a consistent snapshot. Future Redis cache adds 30-second eventual consistency, which is acceptable for leaderboards.

---

## Capacity Planning

### Storage Estimates (1 Year, 10K Students)

| Table | Rows/Year | Row Size | Total |
|-------|----------|----------|-------|
| session_answers | 10K × 300 sessions × 10 = 30M | ~200B | ~6 GB |
| aboa_logs | 30M (one per answer) | ~200B | ~6 GB |
| student_mastery | 10K × 50 concepts = 500K | ~300B | ~150 MB |
| daily_activity | 10K × 365 = 3.65M | ~100B | ~365 MB |
| game_sessions | 10K × 300 = 3M | ~200B | ~600 MB |

**Total:** ~13 GB/year. Well within Neon.tech Pro tier limits.

### Query Performance

Most critical queries:
1. `SELECT * FROM student_mastery WHERE user_id = $1` — indexed, < 5ms
2. `SELECT * FROM questions WHERE subject = $1 AND difficulty BETWEEN $2 AND $3` — indexed, < 10ms
3. Leaderboard: `SELECT ... FROM users ORDER BY xp DESC LIMIT 20` — needs index on xp
4. Heatmap: `SELECT date, count FROM daily_activity WHERE user_id = $1` — indexed, < 10ms

---

## Failure Scenarios

| Scenario | Impact | Recovery |
|----------|--------|----------|
| PostgreSQL down | All services fail | Automatic reconnect with retry. Neon.tech has 99.95% SLA |
| aboa-svc down | Questions become random, difficulty static | game-svc fallback: default difficulty, random selection |
| user-svc down | XP not awarded | game-svc continues, XP eventually consistent |
| analytics-svc down | No activity recording | game-svc still works, analytics catch up on restart |
| rt-svc down | No live updates | App fully functional, user refreshes for updates |
| Gateway down | Total outage | Load balancer failover (production) |
