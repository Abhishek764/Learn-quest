# LearnQuest — Current State

> **Last Updated:** 2026-05-14  |  **Owner:** Engineering  |  **Status:** Active Development

---

## Overview

LearnQuest is a world-class gamified education platform with 6 backend microservices, an API gateway, 2 React frontend apps, and an AI adaptive learning engine. The platform features **7 game modes** (including an Among Us-style multiplayer game called Crew Quest), a **46-node knowledge graph**, **120+ seeded questions**, and a **premium cinematic UI** inspired by Linear/Vercel/SOCius with Framer Motion animations and glassmorphism.

---

## What Works Today

### Backend Services (All Running)

| Service | Port | Status | Key Features |
|---------|------|--------|-------------|
| gateway | 3000 | ✅ Working | JWT auth middleware, rate limiting, service proxy |
| auth-svc | 3001 | ✅ Working | Register, login, token refresh, blacklisting |
| user-svc | 3002 | ✅ Working | Profiles, XP/leveling, badges, classes, leaderboard |
| game-svc | 3003 | ✅ Working | Game sessions, ABOA-scored questions, **Crew Quest rooms** |
| aboa-svc | 3004 | ✅ Working | 9-module AI engine, knowledge graph, mastery tracking |
| analytics-svc | 3005 | ✅ Working | Stats, trends, heatmap, growth tips |
| rt-svc | 3006 | ✅ Working | Socket.io rooms, real-time events |

### AI Adaptive Engine (ABOA)

- ✅ 46-node knowledge graph with 7 tables
- ✅ Bayesian mastery tracking per concept per student
- ✅ SM-2 spaced repetition scheduling
- ✅ Dynamic difficulty adjustment (DDA)
- ✅ Intelligent question recommendation scoring
- ✅ Learning path generation
- ✅ 120+ questions with concept tags across 4 subjects

### Game Modes (7 Total)

| Game | Type | Status |
|------|------|--------|
| Lightning Quiz | MCQ with adaptive AI | ✅ Working |
| Memory Match | Card-flip recall game | ✅ Working |
| Speed Type | Type-the-answer race | ✅ Working |
| True/False Blitz | Rapid-fire judgments | ✅ Working |
| Word Scramble | Unscramble letters | ✅ Working |
| Boss Battle | Progressive difficulty | 🔒 Locked (Lv.5) |
| **Crew Quest** | **Among Us multiplayer** | ✅ Working |

### Crew Quest — Among Us Multiplayer

- ✅ Room create/join with 6-digit codes
- ✅ 2-8 player lobby with ready system
- ✅ CSS crewmate characters (body, visor, backpack, legs)
- ✅ "SHHHHH!" start screen animation
- ✅ The Skeld-inspired SVG ship map with 10 labeled rooms
- ✅ Task assignment (questions as tasks at room locations)
- ✅ Real-time player progress tracking via polling
- ✅ Timer countdown, scoring with speed bonuses
- ✅ Victory screen with podium rankings
- Backend: `game-svc/src/routes/crew-quest.js`
- Frontend: `student-app/src/pages/CrewQuest.jsx` + `CrewQuest.css`

### Frontend — Premium Cinematic UI

- ✅ **Design System**: Deep black `#06060a`, indigo-purple gradient accents
- ✅ **Framer Motion**: Fade-up reveals, staggered cards, hover-lift, micro-animations
- ✅ **Animated Background**: Floating gradient orbs + particle canvas with connection lines
- ✅ **Glassmorphic Cards**: `backdrop-filter: blur(24px)`, top-light borders
- ✅ **Typography**: Inter, Space Grotesk, JetBrains Mono
- ✅ **Premium Transitions**: `cubic-bezier(0.22, 1, 0.36, 1)`

### Frontend Pages

| Page | Status | Key Features |
|------|--------|-------------|
| Login | ✅ Premium | Split layout, gradient orbs, animated button |
| Register | ✅ Premium | Role selection cards, password toggle |
| Dashboard | ✅ Premium | Stats grid, engagement chart, heatmap, quick actions |
| Games Arcade | ✅ Premium | 7 game cards with hover-lift, subject filter |
| GamePlay | ✅ Premium | Lives, timer, streak, 5 game mode renderers |
| Crew Quest | ✅ Among Us | Ship map, crewmates, SHHH screen, lobby |
| Progress | ✅ Premium | Dual-line chart, mastery bars by subject |
| Leaderboard | ✅ Premium | Medals, staggered row animation |
| Profile | ✅ Premium | Gradient avatar, inline edit, XP progress |
| Skill Tree | ✅ Working | Knowledge graph visualization |
| Quests | ✅ Working | AI-generated learning paths |

---

## File Structure

| Directory | Files | Purpose |
|-----------|-------|---------| 
| auth-svc/src | 3 | index.js, db.js, routes/auth.js |
| user-svc/src | 4 | index.js, db.js, routes/users.js, routes/classes.js |
| game-svc/src | 5 | index.js, db.js, seed-questions.js, routes/games.js, **routes/crew-quest.js** |
| aboa-svc/src | 3 | index.js, db.js, aboa.js (9 modules) |
| analytics-svc/src | 3 | index.js, db.js, routes/analytics.js |
| rt-svc/src | 1 | index.js |
| gateway/src | 1 | index.js |
| student-app/src | 17 | App.jsx, main.jsx, api.js, index.css, AnimatedBackground.jsx, Navbar.jsx, **12 pages** |
| educator-app/src | 11 | App.jsx, main.jsx, api.js, Navbar.jsx, 6 pages |

**Total backend code:** ~3,000 lines across 20 source files  
**Total frontend code:** ~3,500 lines across 28 source files  
**Total tests:** 36 passing across 5 test files

---

## Database State

- **PostgreSQL:** Neon.tech serverless
- **Tables:** 18+ tables across services (including knowledge graph tables)
- **Seed data:** 120+ questions, 46 knowledge nodes, 5 badge definitions
- **Schema management:** CREATE TABLE IF NOT EXISTS (auto-migration on startup)

---

## Key Dependencies

| Package | Version | Used In |
|---------|---------|---------|
| framer-motion | ^12.x | student-app (animations) |
| recharts | ^2.x | student-app (charts) |
| lucide-react | ^0.x | student-app (icons) |
| socket.io | ^4.x | rt-svc (real-time) |
| express | ^4.x | All backend services |
| pg | ^8.x | All backend services |
| jsonwebtoken | ^9.x | auth-svc, gateway |

---

## How to Run

```bash
# Install all dependencies
npm install --legacy-peer-deps

# Start everything (all 9 workspaces)
npm run dev

# Run all tests
npm test
```

**URLs:**
- Student app: http://localhost:5173
- Educator app: http://localhost:5174
- API Gateway: http://localhost:3000
