# LearnQuest — Current State

> **Last Updated:** 2026-05-14  |  **Owner:** Engineering  |  **Status:** Update After Every Major Change

---

## Overview

LearnQuest is a working gamified education platform with 6 backend microservices, an API gateway, and 2 React frontend apps. The backend is functional with 36/36 tests passing. The frontend works but has poor UI quality. The AI adaptive learning engine exists but is rudimentary.

---

## What Works Today

### Backend Services (All Running)

| Service | Port | Status | Tests |
|---------|------|--------|-------|
| gateway | 3000 | ✅ Working | — |
| auth-svc | 3001 | ✅ Working | 7/7 |
| user-svc | 3002 | ✅ Working | 7/7 |
| game-svc | 3003 | ✅ Working | 6/6 |
| aboa-svc | 3004 | ✅ Working | 11/11 |
| analytics-svc | 3005 | ✅ Working | 5/5 |
| rt-svc | 3006 | ✅ Working | — |

### Functional Features

- ✅ User registration and login with JWT
- ✅ Token refresh and logout with blacklisting
- ✅ User profiles with display name, avatar, language
- ✅ XP system with auto-leveling (level = floor(xp/100) + 1)
- ✅ Badge system (5 badges: xp and streak based)
- ✅ Class creation with invite codes
- ✅ Class joining and member listing
- ✅ Global XP leaderboard
- ✅ Game session lifecycle (start, next-question, answer, end)
- ✅ 20 seed questions across math, science, english, general
- ✅ ABOA engagement scoring (5-factor weighted)
- ✅ Basic difficulty adjustment (±0.1 based on accuracy)
- ✅ 365-day activity heatmap
- ✅ 30-day engagement trend data
- ✅ Lifetime stats (sessions, accuracy, streak, subject)
- ✅ Growth tips generation
- ✅ Socket.io realtime service with room management
- ✅ Docker Compose for full-stack deployment

### Frontend Pages (Working but Basic UI)

- ✅ Login / Register
- ✅ Student Dashboard (stats, heatmap, charts, badges, tips)
- ✅ Game Lobby (6 game mode cards with subject filter)
- ✅ GamePlay (timer, options, feedback, hints, game over)
- ✅ Progress (subject accuracy, engagement chart, session history)
- ✅ Leaderboard (ranked list with user highlight)
- ✅ Profile (edit name, avatar, language)
- ✅ Educator Dashboard (metrics, top students, XP distribution, classes)
- ✅ Educator Classes (create, list, invite codes)
- ✅ Educator Content (create questions, filter, list)

---

## What's Broken or Missing

### Critical Gaps

| Gap | Details |
|-----|---------|
| **Random question selection** | `game-svc/next-question` uses `Math.floor(Math.random() * candidates.length)` — NO intelligence |
| **No knowledge graph** | No concept relationships, no prerequisite tracking |
| **No student skill model** | Only XP/level exists — no per-concept mastery |
| **No spaced repetition** | Concepts answered wrong are never strategically reintroduced |
| **No personalized paths** | No quest generation, no targeted reinforcement |
| **Stub class report** | `analytics-svc GET /analytics/class/:id/report` returns hardcoded data |
| **No at-risk detection** | No student risk assessment for educators |

### UI Issues

| Issue | Details |
|-------|---------|
| CDN Tailwind | `<script src="cdn.tailwindcss.com">` — not tree-shakeable, FOUC |
| Leftover Vite CSS | `App.css` contains `.hero`, `.ticks`, `.counter` scaffold styles |
| `#root` constraint | index.css constrains `#root` to 1126px with borders — breaks full-screen |
| No custom fonts | Uses `system-ui` — looks generic |
| No animations | Zero micro-interactions, celebrations, or transitions |
| No glassmorphism | Flat gray cards everywhere |
| No mobile nav | No hamburger menu on mobile |
| README encoding | UTF-16 with null bytes — renders as garbage on GitHub |
| No meta tags | No description, no OG tags, no proper SEO |

### Code Issues

| Issue | Details |
|-------|---------|
| Hardcoded API URL | Login/Register use `http://localhost:3000` directly instead of api.js |
| No input validation | Backend accepts any payload without schema validation |
| No TypeScript | All JavaScript — no type safety |
| `color-scheme: light dark` | CSS declares both but all components hardcode dark classes |

---

## File Counts

| Directory | Files | Purpose |
|-----------|-------|---------|
| auth-svc/src | 3 | index.js, db.js, routes/auth.js |
| user-svc/src | 4 | index.js, db.js, routes/users.js, routes/classes.js |
| game-svc/src | 3 | index.js, db.js, routes/games.js |
| aboa-svc/src | 4 | index.js, db.js, aboa.js, routes/ (empty) |
| analytics-svc/src | 3 | index.js, db.js, routes/ (empty) |
| rt-svc/src | 1 | index.js |
| gateway/src | 1 | index.js |
| student-app/src | 13 | App.jsx, main.jsx, api.js, index.css, App.css, Navbar.jsx, 8 pages |
| educator-app/src | 11 | App.jsx, main.jsx, api.js, index.css, App.css, Navbar.jsx, 6 pages |

**Total backend code:** ~1,500 lines across 19 source files
**Total frontend code:** ~1,200 lines across 24 source files
**Total tests:** 36 passing across 5 test files

---

## Database State

- **PostgreSQL:** Neon.tech serverless (free tier)
- **Tables:** 11 tables across services (auto-created on startup)
- **Seed data:** 20 questions, 5 badge definitions
- **Schema management:** CREATE TABLE IF NOT EXISTS (no migration tool)

---

## How to Run

```bash
# Install all dependencies
npm install --legacy-peer-deps

# Start everything (all 9 workspaces)
npm run dev

# Run all tests
npm test

# Docker (full stack including PostgreSQL)
docker compose up -d
```

**URLs:**
- Student app: http://localhost:5173
- Educator app: http://localhost:5174
- API Gateway: http://localhost:3000
