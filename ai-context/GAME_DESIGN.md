# LearnQuest — Game Design

> **Last Updated:** 2026-05-14  |  **Owner:** Game Design  |  **Status:** Active

---

## Game Philosophy

LearnQuest uses **real interactive game mechanics** — not just quiz wrappers. Every game mode is a distinct gameplay experience that tests different cognitive skills while reinforcing educational content through the ABOA adaptive engine.

---

## Game Modes

### 1. Lightning Quiz ⚡ (Classic)
- **Mechanic:** 10 MCQ questions, 30s timer per question
- **AI Integration:** ABOA scores and ranks questions by relevance to student's weak areas
- **Scoring:** Base XP + speed bonus + streak multiplier
- **Difficulty:** Adapts in real-time based on answers

### 2. Memory Match 🧠 (Memory)
- **Mechanic:** 12 cards (6 pairs) — flip to match questions with correct answers
- **Skills Tested:** Recall, association, visual memory
- **Scoring:** 25 XP per match, tracked by move count
- **Layout:** 4×3 card grid with flip animations

### 3. Speed Type ⌨️ (Speed)
- **Mechanic:** See question, type the correct answer before timer runs out
- **Skills Tested:** Knowledge recall + typing speed
- **Scoring:** 20 XP per correct, penalized for wrong answers
- **Timer:** 20 seconds per question

### 4. True/False Blitz 🎯 (Blitz)
- **Mechanic:** Rapid-fire statements — judge True or False
- **Skills Tested:** Quick reasoning, fact verification
- **Scoring:** 15 XP per correct
- **Timer:** 10 seconds per statement

### 5. Word Scramble 🔀 (Puzzle)
- **Mechanic:** Unscramble letters to spell the correct answer
- **Skills Tested:** Vocabulary, spelling, pattern recognition
- **Scoring:** 20 XP per correct
- **Timer:** 20 seconds per word

### 6. Boss Battle ⚔️ (Boss)
- **Mechanic:** Progressive difficulty — answer increasingly harder questions to "defeat" a concept boss
- **Status:** Locked until Level 5
- **Skills Tested:** Deep mastery of a single concept
- **Timer:** 5-8 minutes total

### 7. Crew Quest 🚀 (Multiplayer — Among Us Style)
- **Mechanic:** 2-8 players join a room, each assigned tasks (questions) at locations on a spaceship map
- **Visual Theme:** Authentic Among Us aesthetic with crewmate characters, The Skeld map, "SHHHHH!" screen
- **Flow:**
  1. Host creates room → gets 6-digit code
  2. Players join via code → lobby with ready system
  3. "SHHHHH!" animation → game starts
  4. Each player gets 5-8 tasks at different ship locations
  5. Click task node on map → answer question
  6. Real-time progress tracking of all players
  7. Timer countdown (3 min default)
  8. Victory screen with podium rankings
- **Backend:** `game-svc/src/routes/crew-quest.js` (in-memory rooms)
- **Locations:** Cafeteria, Navigation, Weapons, Shields, Communications, Storage, Electrical, Medbay, Admin, Reactor

---

## Shared Game Systems

### Lives System
- 3 lives (❤️❤️❤️) in solo modes
- Wrong answer = lose 1 life
- 0 lives = game over

### Streak Multiplier
- Consecutive correct answers build a streak (🔥)
- Visual pulse animation on streak milestones

### Timer
- Circular countdown with urgency states:
  - Green (>10s) → Yellow (5-10s) → Red (<5s, pulsing)

### XP & Scoring
- Base XP per correct answer
- Speed bonus (faster = more XP)
- Streak multiplier
- Difficulty bonus (harder = more XP)
- XP updates user level in real-time

### Game Over Screen
- Accuracy percentage
- XP earned
- Correct/Total count
- Play Again + Back to Arcade buttons

---

## Educator Game Assignment (Planned)

Educators will be able to:
- Assign specific game modes to classes
- Set subject/topic constraints
- Schedule Crew Quest sessions with pre-configured rooms
- View per-student game performance reports
