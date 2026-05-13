# LearnQuest — AI Learning Engine (ABOA)

> **Last Updated:** 2026-05-14  |  **Owner:** AI/ML & Architecture  |  **Status:** Core Differentiator

---

## What is ABOA?

**ABOA = Adaptive Behavioral Optimization Algorithm** — the intelligent brain of LearnQuest.

ABOA continuously analyzes student behavior to deliver personalized learning that evolves with every interaction. It runs as pure mathematical algorithms in Node.js — no Python, no GPUs, no ML infrastructure needed yet.

---

## 8 Modules

### Module 1: Engagement Scorer

Computes `Se ∈ [0,1]` from 5 behavioral signals:

| Signal | Normalization | Why |
|--------|--------------|-----|
| Response time | `exp(-rt/10)` | Fast = engaged |
| Accuracy | Raw [0,1] | Direct understanding measure |
| Session duration | `log(1+dur)/log(1+60)` | Diminishing returns for long sessions |
| Hint usage | `1-|hint-0.3|` | Some hints healthy, too many/zero = bad |
| Engagement trend | `(trend+1)/2` | Improving vs declining |

**Formula:** `Se = 0.2R + 0.2A + 0.2P + 0.2H + 0.2T` (equal weights, tunable later)

### Module 2: Dynamic Difficulty Adjustment

```
if accuracy > 0.75:           delta += 0.10
if accuracy < 0.45:           delta -= 0.10
if responseTime < 5 AND accurate: delta += 0.05
if responseTime > 25:         delta -= 0.05
if mastery > 0.8:             delta += 0.05
if mastery < 0.3:             delta -= 0.05

newDifficulty = clamp(current + delta, 0.1, 1.0)
```

**Max step: ±0.15** — prevents jarring swings. Maintains the Flow Zone between boredom and anxiety.

### Module 3: Knowledge Graph

Subjects → Topics → Concepts with prerequisite edges:

```
basic_arithmetic (0.2)
  ├──▶ variables (0.3) ──▶ linear_equations (0.5) ──▶ quadratic (0.7)
  ├──▶ fractions (0.3) ──▶ percentages (0.5) ──▶ ratios (0.6)
  └──▶ geometry_basics (0.3) ──▶ area_perimeter (0.5)
```

**Tables:** `knowledge_nodes` (id, subject, topic, concept, difficulty_tier, position_x/y) + `knowledge_edges` (from_node, to_node, weight)

**Prerequisite Detection:** When student fails concept X, BFS/DFS traversal finds all prerequisites with mastery < 0.5 and targets them for reinforcement.

### Module 4: Student Skill Model

Per-concept tracking in `student_mastery`:

| Field | Purpose |
|-------|---------|
| mastery_score [0..1] | Bayesian-updated mastery estimate |
| confidence [0..1] | How confident we are in this score |
| attempts / correct | Raw counts |
| avg_response_time | Speed indicator |
| ease_factor | SM-2 parameter |
| interval_days | Current repetition interval |
| next_review | When to resurface this concept |
| streak | Consecutive correct on this concept |

**Bayesian Update:** `mastery_new = mastery × (1-0.15) + outcome × 0.15` where outcome is weighted by question difficulty (correct on hard = stronger signal).

**Global Profile** in `student_profile`: learning_velocity, retention_score, engagement_avg, consistency_score, preferred_difficulty, risk_level (low/medium/high/critical), strengths/weaknesses (JSON arrays of node IDs).

### Module 5: SM-2 Spaced Repetition

SuperMemo 2 algorithm determines when to resurface concepts:

```
If quality ≥ 3 (correct):
  streak=1 → interval=1 day
  streak=2 → interval=6 days
  streak≥3 → interval = interval × ease_factor
  ease_factor = max(1.3, EF + 0.1 - (5-q)(0.08 + (5-q)×0.02))

If quality < 3 (wrong):
  interval = 1 day (reset)
  ease_factor = max(1.3, EF - 0.2)
```

Quality derived from: correct + responseTime + hintUsed (0-5 scale).

### Module 6: Smart Question Recommendation

**Core formula:**
```
Score(Q) = 0.25 × MasteryGap        // prioritize unmastered concepts
         + 0.25 × SpacedRepUrgency   // overdue reviews
         + 0.20 × DifficultyMatch    // match student level
         + 0.15 × PrerequisiteRel    // reinforce weak foundations
         + 0.10 × Novelty            // avoid repeats
         + 0.05 × EngagementPred     // preferred subjects
```

**Process:** Get all candidate questions → filter out already-answered-in-session → score each → return `argmax(Score)`.

**This replaces the current `Math.random()` selection.** Every question is purposeful.

### Module 7: Learning Path Generator

Auto-generates personalized quests when:
- `mastery < 0.40` on concept with `attempts ≥ 3`
- Same concept failed 3+ times in 7 days
- Prerequisite gap detected

**Quest structure:** Prerequisite reinforcement stages (5 questions each) → Boss battle on target concept (10 questions, adaptive). XP reward = stages × 40.

### Module 8: Context Preservation

Every answer, mastery update, ABOA log, and activity record persists indefinitely. When a student returns after 30 days:
1. SM-2 identifies forgotten concepts (overdue reviews)
2. First session prioritizes review questions
3. Difficulty starts slightly lower (accounts for rust)
4. The student feels: **"The game remembers me."**

---

## Future ML Upgrade Paths

| Current (Math) | Future (ML) |
|----------------|-------------|
| Weighted scoring formula | Collaborative filtering |
| Rule-based DDA | Reinforcement learning |
| 5-factor linear engagement | Neural network |
| Threshold-based risk | Gradient boosted classifier |
| Educator-created questions only | LLM-generated questions |

**Why math first?** No training data yet. Math is interpretable, debuggable, needs no GPU. Once we have 10K+ sessions, we train on real data.
