# LearnQuest — API Contracts

> **Last Updated:** 2026-05-14  |  **Owner:** Backend Team  |  **Status:** Living Document

---

## Base URL

All requests go through the gateway at `http://localhost:3000`. Auth endpoints are public; everything else requires `Authorization: Bearer <token>`.

---

## Authentication (auth-svc → /auth)

### POST /auth/register
```json
// Request
{ "email": "test@example.com", "password": "secret123", "role": "student", "display_name": "Alex" }

// Response 201
{ "token": "eyJhbG...", "refreshToken": "uuid-timestamp", "user": { "id": "uuid", "email": "test@example.com", "role": "student", "display_name": "Alex" } }

// Error 409
{ "error": "Email already registered" }
```

### POST /auth/login
```json
// Request
{ "email": "test@example.com", "password": "secret123" }

// Response 200
{ "token": "eyJhbG...", "refreshToken": "uuid-timestamp", "user": { "id": "uuid", "email": "...", "role": "student", "display_name": "...", "xp": 150, "level": 2, "streak_days": 5 } }
```

### POST /auth/refresh
```json
// Request
{ "refreshToken": "uuid-timestamp" }
// Response 200
{ "token": "new-eyJhbG..." }
```

### POST /auth/logout
```json
// Request (Authorization header + body)
{ "refreshToken": "uuid-timestamp" }
// Response 200
{ "message": "Logged out successfully" }
```

---

## Users (user-svc → /users)

### GET /users/:id/profile
```json
// Response 200
{ "id": "uuid", "email": "...", "role": "student", "display_name": "Alex", "avatar_url": null, "lang": "en", "xp": 350, "level": 4, "streak_days": 7, "last_active": "2026-05-14T10:00:00Z" }
```

### PUT /users/:id/profile
```json
// Request
{ "display_name": "Alex Pro", "avatar_url": "https://...", "lang": "hi" }
// Response 200
{ "id": "uuid", "display_name": "Alex Pro", ... }
```

### POST /users/:id/xp
```json
// Request
{ "amount": 15 }
// Response 200
{ "xp": 365, "level": 4, "xp_gained": 15 }
```

### GET /users/:id/badges
```json
// Response 200
[{ "id": "badge-xp-100", "name": "Century Club", "description": "Earn 100 XP", "icon": "💯", "earned_at": "2026-05-10T..." }]
```

### GET /users/leaderboard
```json
// Response 200
[{ "id": "uuid", "display_name": "Alex", "avatar_url": null, "xp": 500, "level": 6, "role": "student" }, ...]
```

---

## Classes (user-svc → /classes)

### POST /classes
```json
// Request
{ "name": "Grade 9 Math", "subject": "math", "description": "..." }
// Response 201
{ "id": "uuid", "educator_id": "uuid", "name": "Grade 9 Math", "invite_code": "A3BX9K", "subject": "math" }
```

### POST /classes/join
```json
// Request
{ "invite_code": "A3BX9K" }
// Response 200
{ "class": { ... }, "message": "Joined successfully" }
```

### GET /classes — List educator's classes
### GET /classes/:id — Single class
### GET /classes/:id/members — Class member list with XP/level

---

## Games (game-svc → /games)

### POST /games/sessions/start
```json
// Request
{ "game_mode": "lightning_quiz", "subject": "math" }
// Response 201
{ "session_id": "uuid" }
```

### GET /games/sessions/:id/next-question
```json
// Response 200
{
  "id": "q5", "subject": "math", "difficulty": 0.5, "type": "mcq",
  "content": "Solve: 2x + 6 = 14. What is x?",
  "options": ["3", "4", "5", "6"],
  "hint_eliminated": [0, 2],
  "question_number": 3, "total_questions": 10
}
// Response 404 — no more questions
```

### POST /games/sessions/:id/answer
```json
// Request
{ "question_id": "q5", "answer": 1, "hint_used": false, "response_time_sec": 7.2 }
// Response 200
{
  "correct": true, "correct_option": 1,
  "explanation": "2x = 8, x = 4",
  "new_difficulty": 0.6, "xp_gained": 12, "engagement_score": 0.72
}
```

### POST /games/sessions/:id/end
```json
// Response 200 — full session object
{ "id": "uuid", "total_questions": 10, "correct_answers": 7, "xp_earned": 95, ... }
```

### GET /games/questions — All questions (educator content page)
### POST /games/questions — Create question (educator)

---

## ABOA Engine (aboa-svc → /aboa)

### POST /aboa/compute
```json
// Request
{ "user_id": "uuid", "session_id": "uuid", "response_time": 5, "accuracy": 0.7, "session_duration": 35, "hint_usage": 0.1, "engagement_trend": 0.2, "current_difficulty": 0.5 }
// Response 200
{ "engagement_score": 0.68, "new_difficulty": 0.6, "new_reward": 12, "guidance_level": 0.35, "new_pacing": 0.98 }
```

### POST /aboa/recommend-question *(NEW)*
```json
// Request
{ "user_id": "uuid", "session_id": "uuid", "subject": "math" }
// Response 200
{ "question_id": "q5", "reason": "spaced_repetition_due", "score": 0.87 }
```

### GET /aboa/learner/:id/state — Latest ABOA state
### GET /aboa/learner/:id/mastery — Per-concept mastery scores
### GET /aboa/learner/:id/skill-tree — Knowledge graph + mastery overlay
### GET /aboa/learner/:id/learning-paths — Active quests
### GET /aboa/learner/:id/spaced-review — Concepts due for review

---

## Analytics (analytics-svc → /analytics)

### POST /analytics/activity/record — Log session activity
### GET /analytics/user/:id/heatmap — 365-day activity heatmap
### GET /analytics/user/:id/trends — 30-day engagement/accuracy trends
### GET /analytics/user/:id/stats — Lifetime stats summary
### GET /analytics/user/:id/growth-tips — AI-generated growth tips
### GET /analytics/class/:id/report — Class-level analytics
### GET /analytics/class/:id/at-risk — At-risk student identification *(NEW)*
### GET /analytics/class/:id/mastery-heatmap — Concept mastery across class *(NEW)*

---

## Realtime (rt-svc → Socket.io)

### Events (Client → Server)
- `join-game` — `{ user_id, session_id }` — join game room
- `leave-game` — `{ session_id }` — leave room
- `leaderboard-subscribe` — `{ user_id }` — subscribe to leaderboard updates
- `xp-update` — `{ user_id, xp, level }` — broadcast XP change

### Events (Server → Client)
- `joined` — `{ session_id }` — confirmation
- `leaderboard-changed` — `{ user_id, xp, level }` — leaderboard update

### Internal HTTP
- `POST /rt/emit` — `{ user_id, event, data }` — push event to specific user
