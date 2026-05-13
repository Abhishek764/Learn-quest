# LearnQuest — Security Architecture

> **Last Updated:** 2026-05-14  |  **Owner:** Security/Architecture  |  **Status:** Living Document

---

## Authentication

### JWT Token Strategy

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access token | 15 minutes | localStorage (client) | API authorization |
| Refresh token | 7 days | localStorage + DB | Token renewal |

**Access token payload:**
```json
{ "sub": "user-uuid", "email": "user@example.com", "role": "student", "iat": 1715000000, "exp": 1715000900 }
```

**Token flow:**
1. Login → receive access + refresh tokens
2. Every API call → `Authorization: Bearer <access_token>`
3. Access expires → POST /auth/refresh with refresh token → new access token
4. Logout → blacklist access token + delete refresh token from DB

### Password Security

- **Hashing:** bcrypt with 10 salt rounds
- **Minimum requirements:** Currently none enforced (future: 8+ chars, complexity rules)
- **Rate limiting:** 500 requests per 15 min per IP on all endpoints

### Token Blacklisting

On logout, the access token is stored in `token_blacklist` table. The auth verification endpoint checks this table before validating tokens.

**Note:** Gateway does NOT check blacklist (performance). Individual services check via `/auth/verify` when needed. This is a tradeoff: a logged-out user's token works for up to 15 minutes.

---

## Authorization

### Role-Based Access Control

| Role | Capabilities |
|------|-------------|
| `student` | Play games, view own progress, join classes, edit own profile |
| `educator` | All student caps + create classes, create questions, view class analytics |

### Enforcement Points

1. **Gateway:** Extracts `x-user-id` and `x-user-role` from JWT, forwards as headers
2. **Service level:** Each service checks `x-user-id` to scope data access

```javascript
// Example: educator-only endpoint
if (req.headers['x-user-role'] !== 'educator') {
  return res.status(403).json({ error: 'Educator access required' });
}
```

### Data Isolation

- Students can only access their own profile, mastery, sessions
- Educators can only access classes they created
- Leaderboard is public (by design — social feature)

---

## Input Validation & Injection Prevention

### SQL Injection
All database queries use parameterized statements:
```javascript
await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
// NEVER: `SELECT * FROM users WHERE id = '${id}'`
```

### XSS Prevention
- React auto-escapes all rendered content
- No `dangerouslySetInnerHTML` usage
- Content-Security-Policy headers (target)

### Request Validation
- Express `express.json()` parses body
- Manual validation in route handlers
- Future: Zod/class-validator schemas with NestJS migration

---

## CORS Configuration

```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
```

**Production:** Replace with actual domain origins. Never use `origin: '*'` with credentials.

---

## Rate Limiting

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 500,                    // 500 requests per window
  message: { error: 'Too many requests' }
});
```

**Future enhancements:**
- Per-user rate limiting (not just per-IP)
- Stricter limits on auth endpoints (prevent brute force)
- Redis-backed rate limiter for multi-instance gateway

---

## Data Privacy

| Data Type | Sensitivity | Protection |
|-----------|------------|------------|
| Email | PII | Stored, not exposed in leaderboard |
| Password | Critical | bcrypt hashed, never stored in plain text |
| Learning data | Educational record | Scoped to student + their educators |
| Session answers | Educational record | Never exposed to other students |

### GDPR Considerations (Future)

- Right to deletion: API to purge all student data
- Data export: API to download student's complete data
- Consent: Clear privacy policy before registration
- Data minimization: Only collect what's needed for learning

---

## Security Checklist

- [x] Passwords hashed with bcrypt (10 rounds)
- [x] JWT with short expiry (15 min)
- [x] Refresh token rotation
- [x] Token blacklisting on logout
- [x] Parameterized SQL queries everywhere
- [x] CORS restricted to known origins
- [x] Rate limiting on gateway
- [x] .env files gitignored
- [ ] HTTPS enforcement (production)
- [ ] Content-Security-Policy headers
- [ ] Helmet.js security headers
- [ ] Per-user rate limiting
- [ ] Input validation schemas
- [ ] Audit logging
- [ ] Password complexity requirements
