# LearnQuest — Decisions Log

> **Last Updated:** 2026-05-14  |  **Owner:** Architecture  |  **Status:** Append-Only

---

## Purpose

This is an append-only log of significant architectural and product decisions. Every decision includes context, options considered, choice made, and reasoning. Future AI sessions and engineers MUST read this before proposing changes.

---

## Decision 001: Microservices Over Monolith

**Date:** 2026-05-13
**Context:** Initial architecture for the LearnQuest platform.
**Options:** (A) Monolith, (B) Microservices, (C) Modular monolith
**Decision:** B — Microservices with 6 backend services + gateway.
**Reasoning:**
- The AI learning engine (aboa-svc) evolves rapidly and independently
- aboa-svc is CPU-intensive and needs independent scaling
- Services have clear domain boundaries (auth, users, games, AI, analytics, realtime)
- Testing is isolated (pg-mem per service, no cross-service test coupling)
**Tradeoff:** More operational complexity, inter-service latency, distributed debugging.

---

## Decision 002: Shared PostgreSQL Over Database-Per-Service

**Date:** 2026-05-13
**Context:** Database strategy for microservices.
**Options:** (A) Database per service, (B) Shared database with table ownership
**Decision:** B — Shared Neon.tech PostgreSQL with per-service table ownership.
**Reasoning:**
- Single database simplifies operations (one backup, one connection string)
- analytics-svc needs cross-service data (JOINs with game_sessions + users)
- Neon.tech free tier provides one database
- Table ownership rules prevent write conflicts
**Tradeoff:** Tighter coupling than database-per-service. Acceptable at current scale.

---

## Decision 003: Mathematical Algorithms Over ML Models for Adaptive Learning

**Date:** 2026-05-13
**Context:** How to implement the adaptive learning engine.
**Options:** (A) Pre-trained ML models, (B) Mathematical algorithms (Bayesian, SM-2), (C) LLM-based
**Decision:** B — Pure mathematical algorithms in Node.js.
**Reasoning:**
- No training data exists yet (need 10K+ student sessions for meaningful ML)
- Math algorithms are interpretable and debuggable
- No GPU or ML infrastructure needed (keeps deployment simple)
- SM-2 has 30+ years of proven research
- Bayesian updates are well-understood and tunable
- Can A/B test formula weights without retraining models
**Future:** Migrate to ML when sufficient data exists (see AI_LEARNING_ENGINE.md)

---

## Decision 004: TEXT Columns for Timestamps Instead of TIMESTAMP

**Date:** 2026-05-13
**Context:** PostgreSQL column types for dates.
**Options:** (A) TIMESTAMP/TIMESTAMPTZ, (B) TEXT with ISO 8601 strings
**Decision:** B — TEXT columns storing ISO 8601 strings.
**Reasoning:**
- pg-mem (in-memory test database) has limited TIMESTAMP support
- ISO 8601 strings are portable and timezone-explicit
- Parsing is trivial (`new Date(isoString)`)
- All services use the same convention
**Tradeoff:** Lose database-level date operations (DATE_TRUNC, INTERVAL arithmetic). Acceptable since date operations happen in application code.

---

## Decision 005: UUID Strings Over Auto-Increment IDs

**Date:** 2026-05-13
**Context:** Primary key strategy.
**Decision:** UUID v4 strings for all primary keys.
**Reasoning:**
- No ID collisions across services (important with shared database)
- Client can generate IDs (useful for optimistic UI updates)
- No sequential information leakage (user can't enumerate entities)
- Compatible with pg-mem testing
**Tradeoff:** Larger storage than integers. 36 characters per ID. Acceptable.

---

## Decision 006: CDN Tailwind Replaced with Vanilla CSS

**Date:** 2026-05-14
**Context:** Frontend styling approach.
**Options:** (A) Keep CDN Tailwind, (B) Install Tailwind properly, (C) Vanilla CSS with custom properties
**Decision:** C — Vanilla CSS with CSS custom properties design system.
**Reasoning:**
- CDN Tailwind is not tree-shakeable (loads entire framework)
- CDN Tailwind causes FOUC (Flash of Unstyled Content)
- Vanilla CSS gives full control over animations and glassmorphism
- Custom properties enable theme consistency
- Proper Tailwind install planned for Phase 2 (with Next.js migration)
**Tradeoff:** More CSS to write manually. But better control over the premium aesthetic.

---

## Decision 007: Express Over NestJS (For Now)

**Date:** 2026-05-13
**Context:** Backend framework choice.
**Decision:** Express.js for MVP, NestJS for Phase 3 migration.
**Reasoning:**
- Express has minimal boilerplate — faster to iterate during MVP
- Each service is < 500 lines — NestJS overhead not justified yet
- The team is familiar with Express patterns
- NestJS migration path is clear (decorators, modules, DI)
**Trigger for migration:** When any service exceeds ~2,000 lines or when adding TypeScript.

---

## Decision 008: Socket.io Over Raw WebSockets

**Date:** 2026-05-13
**Context:** Realtime communication technology.
**Decision:** Socket.io for real-time events.
**Reasoning:**
- Auto-reconnection with exponential backoff (critical for mobile)
- Room-based broadcasting (game rooms, leaderboard room)
- Fallback to long-polling when WebSocket fails
- Redis adapter available for multi-instance scaling
**Tradeoff:** Slightly larger client bundle than raw WebSocket. Acceptable for reliability gains.

---

## Decision 009: Question Selection Must NEVER Be Random

**Date:** 2026-05-14
**Context:** Core product differentiation.
**Decision:** Every question presented to a student must be selected by the ABOA recommendation engine.
**Reasoning:**
- Random selection is the single biggest gap between LearnQuest and a "basic quiz app"
- Adaptive selection is the core product promise
- Random selection wastes student time on already-mastered concepts
- Random selection misses opportunities for spaced repetition
**Implementation:** `Math.random()` in game-svc/next-question replaced with call to aboa-svc/recommend-question.

---

## How to Add New Decisions

Append to this file with the next sequential number. Include:
- **Date**
- **Context** (what problem were you solving?)
- **Options** (what alternatives did you consider?)
- **Decision** (what did you choose?)
- **Reasoning** (WHY — this is the most important part)
- **Tradeoff** (what did you give up?)
