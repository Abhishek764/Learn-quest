# LearnQuest — System Architecture

> **Last Updated:** 2026-05-14
> **Document Owner:** Architecture Team
> **Status:** Living Document

---

## Architecture Style: Microservices with Event-Driven Communication

### Why Microservices?

LearnQuest is composed of fundamentally different domains that evolve independently:

| Domain | Concern | Change Frequency |
|--------|---------|-----------------|
| Authentication | Security, tokens, identity | Rare |
| User Profiles | XP, levels, badges, classes | Medium |
| Game Engine | Sessions, questions, answers | High |
| Adaptive Learning (ABOA) | AI algorithms, knowledge graph | Very High |
| Analytics | Aggregation, reporting, predictions | High |
| Realtime | WebSocket events, live updates | Medium |

The AI learning engine (`aboa-svc`) will iterate rapidly with algorithm changes. It should NEVER be coupled to the auth system. Microservices allow independent deployment, scaling, and testing.

### Why NOT a Monolith?

A monolith would:
- Couple AI algorithm changes to auth/user code (deployment risk)
- Make it impossible to scale the ABOA engine independently (it's CPU-intensive)
- Create a single point of failure
- Make testing harder (36 tests already split across services)

### Why NOT Serverless?

- The adaptive learning engine maintains in-memory state per session
- WebSocket connections require persistent servers
- Cold starts would kill gameplay responsiveness (< 200ms target)
- PostgreSQL connection pooling works better with persistent processes

---

## Service Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             CLIENTS                                      │
│                                                                          │
│  ┌─────────────────────┐         ┌─────────────────────┐                 │
│  │   Student App        │         │   Educator App       │                │
│  │   (React + Vite)     │         │   (React + Vite)     │                │
│  │   Port 5173          │         │   Port 5174          │                │
│  └──────────┬───────────┘         └──────────┬───────────┘                │
└─────────────┼────────────────────────────────┼───────────────────────────┘
              │         HTTP / WebSocket        │
              └────────────────┬────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   API Gateway        │
                    │   Port 3000          │
                    │                      │
                    │   • JWT validation   │
                    │   • Rate limiting    │
                    │   • Route proxying   │
                    │   • CORS             │
                    └──┬──┬──┬──┬──┬──┬───┘
                       │  │  │  │  │  │
         ┌─────────────┘  │  │  │  │  └──────────────┐
         │     ┌──────────┘  │  │  └───────────┐     │
         │     │     ┌───────┘  └────────┐     │     │
         ▼     ▼     ▼                   ▼     ▼     ▼
      ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
      │auth  │ │user  │ │game  │ │aboa  │ │analy │ │rt    │
      │-svc  │ │-svc  │ │-svc  │ │-svc  │ │-svc  │ │-svc  │
      │3001  │ │3002  │ │3003  │ │3004  │ │3005  │ │3006  │
      └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──────┘
         │        │        │        │        │
         └────────┴────────┴────┬───┴────────┘
                                │
                    ┌───────────▼───────────┐
                    │     PostgreSQL         │
                    │     (Neon.tech)        │
                    │                        │
                    │  Shared database with  │
                    │  per-service schemas   │
                    └────────────────────────┘
```

---

## Service Responsibilities

### Gateway (Port 3000)

**Purpose:** Single entry point for all client requests.

| Responsibility | Implementation |
|---------------|---------------|
| JWT validation | Verify Bearer token, extract `sub` (user_id) and `role` |
| Header injection | Forward `x-user-id` and `x-user-role` to downstream services |
| Route proxying | `/auth/*` → auth-svc, `/users/*` → user-svc, `/games/*` → game-svc, etc. |
| Rate limiting | 500 requests per 15 minutes per IP |
| CORS | Allow `localhost:5173` and `localhost:5174` |
| Public paths | `/auth/register`, `/auth/login`, `/auth/refresh`, `/health` skip auth |

**Why a custom gateway instead of nginx/Kong?**
- The gateway needs to decode JWT and inject user context headers
- Custom logic for public path detection
- Lightweight — just Express + http-proxy, no overhead of a full API gateway

### auth-svc (Port 3001)

**Purpose:** Identity and authentication.

| Responsibility | Details |
|---------------|---------|
| Registration | Email/password, bcrypt hashing (10 rounds), UUID generation |
| Login | Credential validation, JWT issuance (15m access + 7d refresh) |
| Token refresh | Validate refresh token, issue new access token |
| Logout | Blacklist access token, delete refresh token |
| Token verification | Check blacklist, decode JWT, return user |

**Tables owned:** `users` (shared with user-svc), `refresh_tokens`, `token_blacklist`

### user-svc (Port 3002)

**Purpose:** Player profiles, progression, social features.

| Responsibility | Details |
|---------------|---------|
| Profile CRUD | Display name, avatar, language |
| XP system | Add XP, auto-level (level = floor(xp/100) + 1) |
| Badge system | Condition-based badges (XP thresholds, streak milestones) |
| Leaderboard | Global top 20 by XP |
| Class management | Create class, join with invite code, list members |

**Tables owned:** `users`, `badges`, `user_badges`, `classes`, `class_members`

### game-svc (Port 3003)

**Purpose:** Game session lifecycle and question delivery.

| Responsibility | Details |
|---------------|---------|
| Session management | Start, get-next-question, answer, end |
| Question storage | MCQ questions with i18n support, difficulty ratings |
| Question selection | **Calls aboa-svc for intelligent selection** (replaces random) |
| Answer processing | Validate, record, update session stats, call ABOA for difficulty update |
| XP calculation | Award XP based on ABOA reward computation |

**Tables owned:** `questions`, `game_sessions`, `session_answers`

**Critical flow:**
```
Student clicks "Play" → game-svc starts session
  → game-svc calls aboa-svc/recommend-question
    → aboa-svc analyzes mastery + spaced rep + difficulty
    → returns best question ID
  → game-svc fetches question, returns to client

Student answers → game-svc records answer
  → game-svc calls aboa-svc/compute (update difficulty, mastery)
  → game-svc calls user-svc/xp (add XP if correct)
  → game-svc calls analytics-svc/record (log activity)
```

### aboa-svc (Port 3004)

**Purpose:** The AI brain. Adaptive learning engine.

**ABOA = Adaptive Behavioral Optimization Algorithm**

| Responsibility | Details |
|---------------|---------|
| Engagement scoring | 5-factor weighted score: response time, accuracy, duration, hint usage, trend |
| Dynamic difficulty | Adjust difficulty based on accuracy, response time, mastery state |
| Knowledge graph | Maintain subject → topic → concept prerequisite graph |
| Student skill model | Per-concept mastery, confidence, velocity, retention |
| SM-2 spaced repetition | Calculate optimal review intervals per concept |
| Question recommendation | Score all candidates, return optimal next question |
| Learning path generation | Detect weak areas, generate personalized quests |
| Prerequisite detection | Graph traversal to find foundational gaps |

**Tables owned:** `aboa_logs`, `knowledge_nodes`, `knowledge_edges`, `student_mastery`, `student_profile`, `question_concepts`, `learning_paths`

**This is the most critical service. It differentiates LearnQuest from every other quiz app.**

### analytics-svc (Port 3005)

**Purpose:** Aggregation, reporting, and predictive analytics.

| Responsibility | Details |
|---------------|---------|
| Activity recording | Per-day session count, accuracy, engagement |
| 365-day heatmap | GitHub-style activity visualization data |
| 30-day trend data | Engagement score, accuracy, session count over time |
| Lifetime stats | Total sessions, avg accuracy, best streak, fav subject |
| Growth tips | AI-generated tips based on weak areas |
| Class reports | Per-class aggregated analytics |
| At-risk detection | Identify students with declining engagement/accuracy |
| Intervention suggestions | AI recommendations for educators |

**Tables owned:** `daily_activity`, `aboa_logs` (read replica), `game_sessions` (read replica)

### rt-svc (Port 3006)

**Purpose:** Real-time event distribution via WebSockets.

| Responsibility | Details |
|---------------|---------|
| Socket.io server | Manages client connections |
| User → socket mapping | Track which user is on which socket |
| Game room management | Join/leave game session rooms |
| Leaderboard updates | Broadcast XP changes to subscribed clients |
| Internal event push | Other services can POST to `/rt/emit` to push events |

---

## Inter-Service Communication

### Synchronous (HTTP)

Used for request/response flows where the client is waiting:

```
game-svc → aboa-svc: POST /aboa/recommend-question
game-svc → aboa-svc: POST /aboa/compute
game-svc → user-svc: POST /users/:id/xp
game-svc → analytics-svc: POST /analytics/activity/record
```

**Timeout:** 3 seconds. If downstream service is unavailable, use fallback defaults.

### Asynchronous (Future: Event Bus)

For non-blocking operations that don't need immediate response:

```
game-svc → [event-bus] → analytics-svc: "session.ended"
game-svc → [event-bus] → user-svc: "badge.check.needed"
aboa-svc → [event-bus] → rt-svc: "mastery.updated" → push to client
```

**Current state:** Direct HTTP calls with fire-and-forget pattern (errors swallowed).
**Target state:** RabbitMQ/Redis Pub-Sub for decoupled event processing.

---

## Database Strategy

**Shared PostgreSQL instance** (Neon.tech serverless) with **per-service table ownership**.

### Why shared DB instead of database-per-service?

1. **Operational simplicity:** One connection string, one backup strategy
2. **Cross-service queries:** analytics-svc needs to JOIN game_sessions with user data
3. **Transaction consistency:** XP updates and session updates should be atomic
4. **Cost:** Neon.tech free tier has one database

### Table Ownership Rules

Each service owns specific tables and is the **only writer**:

| Service | Owned Tables | Read Access |
|---------|-------------|-------------|
| auth-svc | users, refresh_tokens, token_blacklist | — |
| user-svc | users, badges, user_badges, classes, class_members | — |
| game-svc | questions, game_sessions, session_answers | — |
| aboa-svc | aboa_logs, knowledge_nodes, knowledge_edges, student_mastery, student_profile, question_concepts, learning_paths | — |
| analytics-svc | daily_activity | aboa_logs, game_sessions (read) |

**Rule:** If service A needs to write to service B's table, it must call service B's API. No direct cross-service writes.

---

## Deployment Architecture

### Local Development
```
npm run dev  →  concurrently runs all 8 services + frontends
```

### Docker
```
docker compose up -d  →  PostgreSQL + all services + frontends
```

### Production (Target)
```
Kubernetes cluster with:
- 1 replica per service (scale aboa-svc to 2-3 during peak)
- PostgreSQL managed (Neon.tech / AWS RDS)
- Redis for caching (ElastiCache)
- Ingress controller for gateway routing
- Horizontal Pod Autoscaler on aboa-svc
```

---

## Scalability Considerations

| Component | Bottleneck | Mitigation |
|-----------|-----------|------------|
| aboa-svc | CPU-intensive AI computations | Horizontal scaling, computation caching |
| PostgreSQL | Connection limits | Connection pooling (pgBouncer), read replicas |
| game-svc | High request volume during gameplay | Stateless design, easy to scale horizontally |
| rt-svc | WebSocket connection limits | Sticky sessions, Socket.io Redis adapter |
| Gateway | Rate limiting state | Redis-backed rate limiter |

---

## Failure Handling

Every inter-service call has a fallback:

| Call | Fallback |
|------|----------|
| game-svc → aboa-svc | Default difficulty (0.5), default reward (10 XP) |
| game-svc → user-svc (XP) | Queue and retry, XP eventually consistent |
| game-svc → analytics-svc | Fire and forget, analytics is non-critical |
| gateway → any service | 502 with "Service unavailable" message |
