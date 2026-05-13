# LearnQuest — Event-Driven Architecture

> **Last Updated:** 2026-05-14  |  **Owner:** Architecture  |  **Status:** Living Document

---

## Current State: Synchronous HTTP

All inter-service communication currently uses synchronous HTTP calls with 3-second timeouts and fallback defaults. This works for MVP but introduces coupling.

### Current Call Chain (Answer Submission)

```
Client → Gateway → game-svc
                      ├── HTTP → aboa-svc/compute (blocking, 3s timeout)
                      ├── HTTP → user-svc/xp (blocking, 3s timeout)
                      └── HTTP → analytics-svc/record (fire-and-forget)
```

**Problem:** If aboa-svc is slow, the entire answer response is slow. The student waits.

---

## Target State: Hybrid (HTTP + Event Bus)

### Critical Path (Synchronous HTTP)

Operations the client is waiting for — must be fast:

```
Client → Gateway → game-svc
                      └── HTTP → aboa-svc/recommend-question (< 200ms)
                      └── HTTP → aboa-svc/compute (< 100ms)
```

### Non-Critical Path (Asynchronous Events)

Operations that can happen after the response is sent:

```
game-svc publishes events to Redis Pub/Sub or RabbitMQ:

"answer.submitted"  →  analytics-svc (record activity)
"session.ended"     →  analytics-svc (daily activity update)
                    →  user-svc (check badges)
                    →  aboa-svc (update student profile)
"xp.awarded"        →  user-svc (update XP)
                    →  rt-svc (push leaderboard update)
"mastery.updated"   →  rt-svc (push skill tree update to client)
"risk.detected"     →  rt-svc (push alert to educator)
```

---

## Event Schema

```json
{
  "event": "answer.submitted",
  "timestamp": "2026-05-14T10:30:00Z",
  "data": {
    "user_id": "uuid",
    "session_id": "uuid",
    "question_id": "q5",
    "is_correct": true,
    "response_time_sec": 7.2,
    "hint_used": false,
    "concept_id": "linear_equations",
    "new_mastery": 0.72,
    "new_difficulty": 0.6,
    "xp_gained": 12
  }
}
```

---

## Technology Choice: Redis Pub/Sub (Phase 1) → RabbitMQ (Phase 2)

### Why Redis Pub/Sub First?

- Already planning Redis for caching — no new infrastructure
- Simple publish/subscribe semantics
- Sufficient for current event volume (< 100 events/sec)
- No message persistence needed (events are supplementary, not critical)

### Why RabbitMQ Later?

- Message persistence (survive service restarts)
- Dead letter queues (handle processing failures)
- Consumer groups (load balancing across instances)
- Back-pressure handling
- Message ordering guarantees

### Why NOT Kafka?

- Overkill for current scale (Kafka shines at 100K+ events/sec)
- Operational complexity (ZooKeeper/KRaft, partitions, consumer offsets)
- We don't need event replay/sourcing yet

---

## Event Consumers

| Event | Consumer | Action |
|-------|----------|--------|
| `answer.submitted` | analytics-svc | Update daily_activity aggregate |
| `answer.submitted` | aboa-svc | Update student_profile (rolling averages) |
| `session.ended` | user-svc | Check badge conditions |
| `session.ended` | aboa-svc | Detect learning path triggers |
| `xp.awarded` | rt-svc | Push leaderboard update to subscribed clients |
| `mastery.updated` | rt-svc | Push skill tree refresh to student |
| `risk.level.changed` | rt-svc | Push alert to educator dashboard |
| `learning_path.generated` | rt-svc | Push quest notification to student |

---

## Migration Plan

1. **Phase 1 (Current):** Direct HTTP calls with try/catch fallbacks
2. **Phase 2:** Add Redis Pub/Sub for non-critical events (analytics, badges, realtime)
3. **Phase 3:** Migrate to RabbitMQ if event volume exceeds Redis capacity
4. **Phase 4:** Consider event sourcing for audit trail (every student action stored as immutable event)

---

## Idempotency

All event handlers must be idempotent — processing the same event twice must produce the same result. This is critical for retry scenarios.

```javascript
// Example: idempotent activity recording
const existing = await query(
  'SELECT * FROM daily_activity WHERE user_id = $1 AND date = $2',
  [userId, today]
);
if (existing.rows.length > 0) {
  // Update (not duplicate insert)
  await query('UPDATE daily_activity SET sessions_count = sessions_count + 1 ...');
} else {
  await query('INSERT INTO daily_activity ...');
}
```
