# LearnQuest — Development Roadmap

> **Last Updated:** 2026-05-14  |  **Owner:** Product/Engineering  |  **Status:** Living Document

---

## Phase 1: Intelligent Core (Current Priority)

**Goal:** Transform from basic quiz engine to AI-powered adaptive learning platform.

### 1A: Backend AI Engine

- [ ] Add knowledge graph tables (`knowledge_nodes`, `knowledge_edges`) to aboa-svc
- [ ] Seed math knowledge graph (15+ concepts with prerequisites)
- [ ] Seed science, english, general knowledge graphs
- [ ] Add `student_mastery` table with per-concept tracking
- [ ] Add `student_profile` table with learning velocity, risk level
- [ ] Add `question_concepts` mapping table
- [ ] Implement Bayesian mastery update algorithm
- [ ] Implement SM-2 spaced repetition scheduler
- [ ] Implement smart question recommendation engine (replace `Math.random()`)
- [ ] Implement prerequisite detection (graph traversal)
- [ ] Implement learning path generator
- [ ] Add concept tags to all seed questions
- [ ] Expand question bank from 20 to 150+ questions
- [ ] Add new ABOA API endpoints (recommend-question, skill-tree, mastery, etc.)
- [ ] Update game-svc to call recommendation engine instead of random selection
- [ ] Update game-svc answer handler to trigger mastery updates
- [ ] Write tests for all new ABOA modules

### 1B: Premium Student UI

- [ ] Remove CDN Tailwind from index.html
- [ ] Add Google Fonts (Inter, Space Grotesk)
- [ ] Add meta description and Open Graph tags
- [ ] Create design system in index.css (custom properties, animations)
- [ ] Delete leftover App.css (Vite scaffold)
- [ ] Redesign Navbar (glassmorphic, XP ring, mobile drawer)
- [ ] Redesign Login page (split layout, animated background)
- [ ] Redesign Register page (step form, role cards)
- [ ] Redesign Dashboard (stat cards, heatmap, badges, tips, quests)
- [ ] Redesign Games lobby (3D tilt cards, animated icons)
- [ ] Redesign GamePlay (circular timer, confetti, shake, streak flames)
- [ ] Build SkillTree page (knowledge graph visualization)
- [ ] Build Quests page (personalized learning paths)
- [ ] Redesign Progress page (mastery radar, gradient charts)
- [ ] Redesign Leaderboard (podium, animated rows)
- [ ] Redesign Profile (avatar, level arc, badge grid)
- [ ] Update App.jsx routes for new pages

### 1C: Enhanced Educator Experience

- [ ] Fix analytics-svc class report endpoint (currently stubbed)
- [ ] Add at-risk student detection endpoint
- [ ] Add concept mastery heatmap endpoint
- [ ] Add intervention recommendation endpoint
- [ ] Redesign educator Dashboard with AI analytics panels
- [ ] Apply design system to all educator pages
- [ ] Delete educator App.css (scaffold)

### 1D: Documentation & Quality

- [ ] Rewrite README.md in UTF-8 (currently UTF-16 garbage)
- [ ] Complete ai-context documentation system
- [ ] Ensure all 36+ tests pass with new changes
- [ ] Run production builds for both frontend apps

---

## Phase 2: Polish & Scale

**Goal:** Production-ready with real users.

- [ ] Add Redis caching (leaderboard, mastery reads)
- [ ] Add Redis Pub/Sub for async events
- [ ] Set up GitHub Actions CI/CD pipeline
- [ ] Add TypeScript to frontend (gradual migration)
- [ ] Add Zod validation schemas
- [ ] Connect Socket.io client in frontend for live updates
- [ ] Add more game modes (Time Attack fully implemented)
- [ ] Add Daily Challenge mode
- [ ] Add bulk question import (CSV) for educators
- [ ] Add question analytics (which questions have lowest accuracy)
- [ ] Add password complexity requirements
- [ ] Add Helmet.js security headers
- [ ] Performance audit and optimization

---

## Phase 3: Growth Features

**Goal:** Features that drive user acquisition and retention.

- [ ] Multiplayer Battle Mode (1v1 real-time quiz battles via WebSocket)
- [ ] World system (themed environments per subject)
- [ ] Migrate backend to NestJS + TypeScript
- [ ] Migrate frontend to Next.js
- [ ] Add Prometheus + Grafana monitoring
- [ ] Add OpenTelemetry distributed tracing
- [ ] Class-level leaderboards
- [ ] Student achievement sharing (social)
- [ ] Streak freeze feature (use earned currency to protect streak)

---

## Phase 4: Platform Expansion

**Goal:** Revenue and reach.

- [ ] Mobile apps (React Native or Flutter)
- [ ] Parent dashboard (progress reports, screen time)
- [ ] AI question generation (LLM creates questions from topics)
- [ ] Educator Pro subscription (advanced analytics, unlimited classes)
- [ ] School/district B2B licensing
- [ ] Kubernetes deployment with auto-scaling
- [ ] Multi-language content support (leverage existing i18n structure)
- [ ] GDPR compliance (data export, deletion APIs)
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## Priority Rules

1. **Phase 1 is the ONLY focus right now.** Do not jump ahead.
2. Within Phase 1: Backend AI (1A) should be done before or alongside UI (1B).
3. Never sacrifice test coverage for speed.
4. Every feature must serve learning OR motivation.
5. If unsure whether to build something, ask: "Does this make a student learn better or want to play more?"
