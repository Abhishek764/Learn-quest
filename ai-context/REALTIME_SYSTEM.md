# LearnQuest — Realtime System

> **Last Updated:** 2026-05-14  |  **Owner:** Backend  |  **Status:** Living Document

---

## Purpose

Real-time events make the platform feel alive. Without them, a student must refresh to see updated leaderboards, new badges, or quest notifications.

---

## Technology: Socket.io

**Why Socket.io over raw WebSockets?**
- Automatic reconnection with exponential backoff
- Fallback to long-polling when WebSocket fails
- Room-based broadcasting (game rooms, leaderboard room)
- Built-in heartbeat/ping for connection health
- Redis adapter available for multi-instance scaling

---

## Architecture

```
┌──────────────┐     WebSocket      ┌──────────────┐
│ Student App  │◄──────────────────▶│   rt-svc     │
│              │                    │   (3006)     │
│ Educator App │◄──────────────────▶│              │
└──────────────┘                    └──────┬───────┘
                                          │
                              POST /rt/emit│(internal)
                                          │
                                   ┌──────┴───────┐
                                   │ Other         │
                                   │ Services      │
                                   │ (game, aboa,  │
                                   │  analytics)   │
                                   └──────────────┘
```

---

## Connection Management

```javascript
// Server: user → socket mapping
const userSockets = new Map();  // userId → socketId

io.on('connection', (socket) => {
  socket.on('join-game', ({ user_id, session_id }) => {
    userSockets.set(user_id, socket.id);
    socket.join(`game:${session_id}`);
  });

  socket.on('disconnect', () => {
    // Clean up user mapping
    for (const [uid, sid] of userSockets.entries()) {
      if (sid === socket.id) userSockets.delete(uid);
    }
  });
});
```

---

## Events

### Client → Server

| Event | Payload | Purpose |
|-------|---------|---------|
| `join-game` | `{ user_id, session_id }` | Join game room for live updates |
| `leave-game` | `{ session_id }` | Leave game room |
| `leaderboard-subscribe` | `{ user_id }` | Subscribe to XP changes |
| `xp-update` | `{ user_id, xp, level }` | Broadcast XP change |

### Server → Client

| Event | Payload | Purpose |
|-------|---------|---------|
| `joined` | `{ session_id }` | Confirm room join |
| `leaderboard-changed` | `{ user_id, xp, level }` | Live leaderboard update |
| `badge-earned` | `{ badge }` | Badge notification (future) |
| `quest-available` | `{ quest }` | New quest generated (future) |
| `mastery-updated` | `{ node_id, mastery }` | Skill tree update (future) |

### Internal HTTP Push

Other services push events to specific users:

```
POST /rt/emit
{
  "user_id": "uuid",
  "event": "badge-earned",
  "data": { "name": "Century Club", "icon": "💯" }
}
```

---

## Scaling

### Single Instance (Current)
- In-memory `userSockets` Map
- Sufficient for ~1,000 concurrent connections

### Multi-Instance (Target)
- Socket.io Redis adapter for cross-instance event broadcasting
- Sticky sessions via load balancer (Kubernetes ingress)
- Connection limit: ~10,000 per instance

```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

---

## Client Integration

```javascript
// student-app: connect to rt-svc
import { io } from 'socket.io-client';

const socket = io('http://localhost:3006');

socket.emit('leaderboard-subscribe', { user_id: user.id });

socket.on('leaderboard-changed', (data) => {
  // Update leaderboard UI in real-time
  updateLeaderboard(data);
});
```

**Note:** Client-side Socket.io is listed in dependencies (`socket.io-client`) but not yet connected in the current frontend. This is a planned integration point.
