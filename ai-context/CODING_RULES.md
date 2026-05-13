# LearnQuest — Coding Rules & Standards

> **Last Updated:** 2026-05-14  |  **Owner:** Engineering  |  **Status:** Mandatory

---

## Language & Style

### Backend (Node.js)

| Rule | Standard |
|------|----------|
| Module system | CommonJS (`require`/`module.exports`) — migrate to ESM with TypeScript |
| Semicolons | Yes (consistent with existing codebase) |
| Quotes | Single quotes for strings |
| Indent | 2 spaces |
| Naming | camelCase for variables/functions, PascalCase for classes, UPPER_SNAKE for constants |
| Async | async/await (never raw callbacks) |
| Error handling | try/catch with fallback defaults for inter-service calls |
| SQL | Parameterized queries ONLY (`$1, $2, ...`) — NEVER string interpolation |

### Frontend (React)

| Rule | Standard |
|------|----------|
| Components | Functional components with hooks (no class components) |
| Export style | `export default function ComponentName()` |
| State | `useState` for local, `useEffect` for data fetching |
| Props | Destructured in function params |
| Files | PascalCase for components (Dashboard.jsx), camelCase for utilities (api.js) |
| CSS classes | kebab-case in CSS, className strings in JSX |

---

## File Organization Rules

### Backend Service Structure
```
<service>/
├── src/
│   ├── index.js        # App setup, middleware, server listen
│   ├── db.js           # Pool management, schema init, query helper
│   └── routes/         # Express routers (one per domain)
│       └── <domain>.js
├── __tests__/
│   └── <service>.test.js
├── package.json
├── .env
└── Dockerfile
```

### Frontend Page Structure
```
// Every page follows this pattern:
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import API from '../api'

export default function PageName() {
  // 1. State declarations
  // 2. Data fetching in useEffect
  // 3. Event handlers
  // 4. Return JSX

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        {/* Page content */}
      </div>
    </div>
  )
}
```

---

## API Design Rules

| Rule | Example |
|------|---------|
| RESTful naming | `GET /users/:id/profile`, `POST /games/sessions/start` |
| Response format | Always JSON: `{ data }` or `{ error: "message" }` |
| Status codes | 200 (ok), 201 (created), 400 (bad input), 401 (unauthorized), 404 (not found), 500 (server error) |
| Error format | `{ "error": "Human-readable message" }` |
| User context | Via `x-user-id` and `x-user-role` headers (set by gateway) |

---

## Database Rules

1. **IDs:** Always UUID v4 generated with `uuid.v4()` — never auto-increment
2. **Timestamps:** ISO 8601 strings in TEXT columns — avoid native TIMESTAMP for pg-mem compatibility
3. **JSON data:** Stored as TEXT, parsed with `JSON.parse()` — no JSONB (pg-mem limitation)
4. **Table ownership:** Each service writes only to its own tables
5. **Schema init:** `CREATE TABLE IF NOT EXISTS` in `db.js` — idempotent startup
6. **Migrations:** Currently schema-on-start. Future: proper migration tool (Prisma Migrate)

---

## Testing Rules

1. **Every service MUST have tests** passing before merge
2. **Use pg-mem** for database tests — no real database dependency
3. **Test the HTTP API** via Supertest (integration), not internal functions (unit)
4. **Reset database** between tests for isolation
5. **Mock external services** — don't call real aboa-svc from game-svc tests

```javascript
// Standard test pattern
const request = require('supertest');
const app = require('../src/index');

describe('POST /auth/register', () => {
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });
});
```

---

## Git Rules

| Rule | Standard |
|------|----------|
| Branch naming | `feature/<name>`, `fix/<name>`, `refactor/<name>` |
| Commit messages | Imperative mood: "Add knowledge graph tables" not "Added..." |
| PR requirement | All tests pass before merge |
| .gitignore | node_modules, .env, dist, .DS_Store |
| Never commit | Secrets, credentials, API keys, database URLs |

---

## Performance Rules

1. **Inter-service timeout:** 3 seconds max — always have fallback
2. **ABOA computation:** Target < 100ms
3. **Question recommendation:** Target < 200ms
4. **API response (p95):** Target < 500ms
5. **Frontend bundle:** Lazy-load pages (future)
6. **Database queries:** Always use indexes for user_id, session_id lookups

---

## Documentation Rules

1. **Every new API endpoint** must be added to API_CONTRACTS.md
2. **Every new table** must be added to DATABASE_DESIGN.md
3. **Every architecture decision** must be logged in DECISIONS_LOG.md
4. **CURRENT_STATE.md** must be updated after every major change
5. **ai-context/ is the source of truth** — future AI sessions read these files first
