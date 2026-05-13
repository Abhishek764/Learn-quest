# LearnQuest — Game Design Document

> **Last Updated:** 2026-05-14  |  **Owner:** Game Design & Product  |  **Status:** Living Document

---

## Core Game Loop

```
TRIGGER (streak reminder, CTA, quest)
    → ACTION (play game, answer questions)
    → REWARD (XP, badges, level up, confetti)
    → INVESTMENT (streak, mastery, progress)
    → TRIGGER (motivation to return)
```

This is the **Hook Model** — the same psychology that makes Duolingo, Instagram, and gaming platforms addictive.

---

## Game Modes

### 1. Lightning Quiz ⚡ (Core — Implemented)
10 questions, 30s each, adaptive difficulty. Base XP: 10/correct.

### 2. Quest Map 🗺️ (Planned)
Linear progression through 5-question levels. Boss battles every 5th level. Unlocks next level at ≥60% accuracy.

### 3. Time Attack ⏱️ (Planned)
120 seconds. Unlimited questions. +3s for correct, -5s for wrong. Tests speed + knowledge.

### 4. Daily Challenge ⭐ (Planned)
5 curated questions/day. Same for all students. 2x XP. Daily leaderboard.

### 5. Word Builder 📚 (Phase 2)
Fill-in-blank and vocabulary. Different question type.

### 6. Battle Mode ⚔️ (Phase 3)
Real-time 1v1 via WebSocket. Same question, fastest correct wins.

---

## Progression Systems

### XP: 10 base/correct + streak bonus (+2/consecutive) + speed bonus (+5 if <5s)
### Level: floor(XP/100) + 1
### Streaks: Daily login + 1 session. Badges at 3, 7, 14, 30, 100 days.
### Badges: 5 seeded (First Steps, On a Roll, Week Warrior, Century Club, High Achiever) + extensible.
### Skill Tree: Visual knowledge graph with mastery coloring per concept node.
### Quests: AI-generated learning paths targeting weak areas.

---

## Feedback Systems

**Correct:** Green glow → XP float-up → streak flame → auto-advance (500ms)
**Wrong:** Red shake → correct highlighted → explanation → streak reset (1s)
**Session Complete:** Star rating (⭐-⭐⭐⭐) + XP summary + confetti (≥80%) + play again
**Level Up:** Full-screen celebration + badge reveal + confetti

---

## Difficulty Curve (Flow Zone)

ABOA maintains challenge between boredom (too easy) and anxiety (too hard):
- Accuracy > 75% + fast → harder
- Accuracy < 45% or slow → easier
- Max step: ±0.15 per question
- Invisible to student

---

## Psychology Principles

| Principle | Implementation |
|-----------|---------------|
| Dopamine loops | Correct → XP animation → level up notification |
| Variable rewards | Occasional bonus XP, rare badges |
| Loss aversion | "Don't lose your 14-day streak!" |
| Social proof | Leaderboard rankings |
| Mastery motivation | Skill tree visualization |
| Autonomy | Player chooses mode, subject, pace |
| Progression | Visible level, world, skill advancement |
