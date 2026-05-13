# LearnQuest — Backend Architecture

> **Last Updated:** 2026-05-14  |  **Owner:** Backend Team  |  **Status:** Living Document

---

## Current Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22+ |
| Framework | Express.js |
| Language | JavaScript (CommonJS) |
| Database | PostgreSQL via `pg` driver |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| HTTP client | Axios (inter-service calls) |
| Testing | Jest + Supertest + pg-mem |
| Process manager | concurrently (dev) |

## Target Stack

| Layer | Target | When |
|-------|--------|------|
| Framework | NestJS | Phase 2 migration |
| Language | TypeScript | Phase 2 migration |
| Validation | class-validator / Zod | With NestJS |
| ORM | Prisma or Drizzle | With TypeScript |

**Current Express+JS works for MVP. Migrate when codebase complexity warrants it.**

---

## Service Architecture Pattern

Each backend service follows the same structure:

```
<service>/
├── .env                    # Service-specific env (DATABASE_URL, PORT, JWT_SECRET)
├── Dockerfile              # Multi-stage build
├── package.json            # Dependencies
├── __tests__/              # Jest test files
│   └── <service>.test.js
└── src/
    ├── index.js            # Express app setup, health endpoint, server listen
    ├── db.js               # Database connection + schema initialization
    └── routes/             # Express routers (if needed)
        └── <domain>.js
```

### Standard Patterns

**Health endpoint:** Every service exposes `GET /health → { status: 'ok', service: '<name>' }`

**Database initialization:** Each `db.js` auto-creates tables on first connection using `CREATE TABLE IF NOT EXISTS`. In test mode, uses `pg-mem` (in-memory PostgreSQL).

**Error handling:** Global error middleware catches unhandled errors and returns `{ error: 'Internal server error' }`.

**Module export:** Every service exports its Express app for testing with Supertest.

**Conditional listen:** `if (require.main === module) app.listen(...)` — only binds port when run directly, not when imported for tests.

---

## Inter-Service Communication

### HTTP Calls

Services call each other via HTTP with 3-second timeouts and fallback defaults:

```javascript
async function callAboa(data) {
  try {
    const res = await axios.post(`${ABOA_URL}/aboa/compute`, data, { timeout: 3000 });
    return res.data;
  } catch {
    return { engagement_score: 0.5, new_difficulty: 0.5, new_reward: 10 };
  }
}
```

**Key call chains:**
```
game-svc/answer → aboa-svc/compute (update difficulty)
game-svc/answer → user-svc/xp (award XP)
game-svc/end → analytics-svc/record (log activity)
game-svc/next-question → aboa-svc/recommend-question (smart selection)
```

### Failure Tolerance

Every inter-service call is wrapped in try/catch with sensible defaults. No service crash propagates. Analytics recording failures are silently swallowed (non-critical path).

---

## Gateway Deep Dive

The gateway at port 3000 is the single entry point:

```javascript
// JWT middleware extracts user context
function authMiddleware(req, res, next) {
  const isPublic = PUBLIC_PATHS.some(p => req.path.startsWith(p));
  if (isPublic) return next();

  const token = req.headers['authorization']?.slice(7);
  const decoded = jwt.verify(token, JWT_SECRET);
  req.headers['x-user-id'] = decoded.sub;
  req.headers['x-user-role'] = decoded.role;
  next();
}

// Route proxying
app.use('/auth', makeProxy(AUTH_URL));
app.use('/users', makeProxy(USER_URL));
app.use('/classes', makeProxy(USER_URL));
app.use('/games', makeProxy(GAME_URL));
app.use('/aboa', makeProxy(ABOA_URL));
app.use('/analytics', makeProxy(ANALYTICS_URL));
```

The proxy function forwards the full request (method, body, headers) to the target service and relays the response.

---

## Testing Strategy

### Current: 36 tests across 5 services

| Service | Tests | Framework |
|---------|-------|-----------|
| auth-svc | 7 | Jest + Supertest + pg-mem |
| user-svc | 7 | Jest + Supertest + pg-mem |
| game-svc | 6 | Jest + Supertest + pg-mem |
| aboa-svc | 11 | Jest + Supertest + pg-mem |
| analytics-svc | 5 | Jest + Supertest + pg-mem |

### pg-mem (In-Memory PostgreSQL)

Tests use `pg-mem` instead of a real database:
```javascript
if (process.env.NODE_ENV === 'test') {
  const { newDb } = require('pg-mem');
  pool = new Pool(newDb().adapters.createPg());
}
```

This enables: zero-config test setup, parallel test execution, fast CI, no Docker dependency for tests.

### Running Tests
```bash
npm test                    # All services sequentially
cd auth-svc && npm test     # Single service
```

---

## Environment Configuration

Root `.env` shared across all services:

```
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
JWT_SECRET=<64-char hex>
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000
AUTH_SVC_URL=http://localhost:3001
USER_SVC_URL=http://localhost:3002
GAME_SVC_URL=http://localhost:3003
ABOA_SVC_URL=http://localhost:3004
ANALYTICS_SVC_URL=http://localhost:3005
RT_SVC_URL=http://localhost:3006
```

Each service also has its own `.env` with `DATABASE_URL`, `PORT`, and `JWT_SECRET`.

---

## Workspace Configuration

Root `package.json` uses npm workspaces:

```json
{
  "workspaces": ["gateway", "auth-svc", "user-svc", "game-svc", "aboa-svc", "analytics-svc", "rt-svc", "student-app", "educator-app"],
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=gateway\" ... (all 9)",
    "test": "npm run test --workspace=auth-svc && ... (all 5 backend)"
  }
}
```

`npm run dev` starts everything with one command via `concurrently`.

---

## Docker Configuration

Each service has a Dockerfile:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src ./src
CMD ["node", "src/index.js"]
```

`docker-compose.yml` orchestrates: PostgreSQL + all 6 backend services + 2 frontend apps. Frontend apps use nginx to serve built assets.
