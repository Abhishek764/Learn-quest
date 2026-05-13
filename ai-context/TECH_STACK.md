# LearnQuest — Tech Stack

> **Last Updated:** 2026-05-14  |  **Owner:** Architecture  |  **Status:** Living Document

---

## Current Stack (Working Today)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Frontend** | React | 19.x | Functional components, hooks |
| **Build** | Vite | 8.x | Fast HMR, ES module bundling |
| **Routing** | react-router-dom | 6.x | Client-side routing |
| **HTTP** | Axios | 1.x | With JWT interceptors |
| **Icons** | lucide-react | 0.390+ | Tree-shakeable SVG icons |
| **Charts** | Recharts | 2.x | Line, Bar, Responsive charts |
| **Backend** | Express.js | 4.x | All 6 microservices + gateway |
| **Runtime** | Node.js | 22+ | LTS |
| **Auth** | jsonwebtoken + bcrypt | Latest | JWT + password hashing |
| **Database** | PostgreSQL | 16 | Via Neon.tech (serverless) |
| **DB Driver** | pg | Latest | Connection pooling |
| **Testing** | Jest + Supertest + pg-mem | Latest | In-memory PostgreSQL for tests |
| **IDs** | uuid | v4 | Collision-proof identifiers |
| **Realtime** | Socket.io | 4.x | WebSocket + fallback |
| **Process** | concurrently | 8.x | Run all services in parallel |
| **Containers** | Docker + Docker Compose | Latest | Development + deployment |
| **Styling** | Vanilla CSS | — | Custom properties, animations |

---

## Target Stack (Migration Path)

These technologies are planned but NOT yet implemented. Migrate only when the need arises.

| Layer | Target | When | Why |
|-------|--------|------|-----|
| **Frontend Framework** | Next.js 14+ | Phase 2 | SSR, file-based routing, SEO |
| **Frontend Language** | TypeScript | Phase 2 | Type safety, refactoring confidence |
| **State Management** | Zustand | Phase 2 | Lightweight, no boilerplate |
| **Data Fetching** | TanStack React Query | Phase 2 | Caching, stale-while-revalidate |
| **Animations** | Framer Motion | Phase 2 | Production-grade motion |
| **Styling** | Tailwind CSS (proper install) | Phase 2 | Utility-first, tree-shaking, not CDN |
| **Backend Framework** | NestJS | Phase 3 | Decorators, DI, modular architecture |
| **Backend Language** | TypeScript | Phase 3 | Type safety across stack |
| **ORM** | Prisma or Drizzle | Phase 3 | Type-safe queries, migrations |
| **Validation** | Zod | Phase 2-3 | Schema validation for API + forms |
| **Caching** | Redis | Phase 2 | Leaderboard, mastery cache, rate limiting |
| **Event Bus** | Redis Pub/Sub → RabbitMQ | Phase 2-3 | Async inter-service communication |
| **Monitoring** | Prometheus + Grafana | Phase 3 | Metrics, dashboards, alerts |
| **Tracing** | OpenTelemetry | Phase 3 | Distributed request tracing |
| **Logging** | Loki or ELK | Phase 3 | Centralized log aggregation |
| **Storage** | S3-compatible (MinIO/AWS) | Phase 3 | Avatar uploads, media |
| **Orchestration** | Kubernetes | Phase 4 | Auto-scaling, self-healing |
| **CI/CD** | GitHub Actions | Phase 2 | Automated testing + deployment |

---

## Why These Choices?

### React over Next.js (for now)
Next.js is the target, but the current Vite+React setup is simpler for rapid iteration. SSR isn't needed until SEO matters (public landing page). Migrate when adding marketing pages.

### Express over NestJS (for now)
Express is minimal and fast to iterate. NestJS adds decorators, dependency injection, and module boundaries — valuable at scale but overhead during MVP. Migrate when codebase exceeds ~5,000 lines per service.

### PostgreSQL over MongoDB
Relational data: users have sessions, sessions have answers, concepts have prerequisites. These are inherently relational. PostgreSQL handles this natively with JOINs. MongoDB would require denormalization and application-level joins.

### pg-mem over Docker-based test DB
Tests must run in CI without Docker. pg-mem provides a real PostgreSQL implementation in-memory. Tests run in < 5 seconds with zero setup.

### Vanilla CSS over Tailwind (for now)
The current frontend was started with CDN Tailwind (which is not tree-shakeable). Converting to vanilla CSS with custom properties provides full control. Proper Tailwind install is the target for Phase 2.

### Socket.io over raw WebSockets
Auto-reconnection, room broadcasting, and fallback to long-polling justify the library overhead. Raw WebSockets would require implementing all of this manually.

---

## Package Dependencies (Key)

### Backend (per service)
```json
{
  "express": "^4.x",
  "cors": "^2.x",
  "dotenv": "^16.x",
  "pg": "^8.x",
  "uuid": "^9.x",
  "jsonwebtoken": "^9.x",
  "bcrypt": "^5.x",
  "axios": "^1.x",
  "express-rate-limit": "^7.x"
}
```

### Frontend (both apps)
```json
{
  "react": "^19.x",
  "react-dom": "^19.x",
  "react-router-dom": "^6.x",
  "axios": "^1.x",
  "lucide-react": "^0.390",
  "recharts": "^2.x"
}
```

### Dev Dependencies
```json
{
  "vite": "^8.x",
  "@vitejs/plugin-react": "^6.x",
  "jest": "^29.x",
  "supertest": "^6.x",
  "pg-mem": "^2.x",
  "concurrently": "^8.x"
}
```
