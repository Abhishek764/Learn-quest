require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    methods: ['GET', 'POST']
  }
});

// Map userId -> socketId for targeted emits
const userSockets = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rt-svc' });
});

app.get('/rt/health', (req, res) => {
  res.json({ status: 'ok', service: 'rt-svc', connections: io.engine.clientsCount });
});

// Internal endpoint to push events to users
app.post('/rt/emit', (req, res) => {
  const { user_id, event, data } = req.body;
  const socketId = userSockets.get(user_id);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
  res.json({ sent: !!socketId });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-game', ({ user_id, session_id }) => {
    if (user_id) userSockets.set(user_id, socket.id);
    socket.join(`game:${session_id}`);
    socket.emit('joined', { session_id });
  });

  socket.on('leave-game', ({ session_id }) => {
    socket.leave(`game:${session_id}`);
  });

  socket.on('leaderboard-subscribe', ({ user_id }) => {
    if (user_id) userSockets.set(user_id, socket.id);
    socket.join('leaderboard');
  });

  socket.on('xp-update', ({ user_id, xp, level }) => {
    io.to('leaderboard').emit('leaderboard-changed', { user_id, xp, level });
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of userSockets.entries()) {
      if (sid === socket.id) userSockets.delete(uid);
    }
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`rt-svc running on port ${PORT}`);
  });
}

module.exports = { app, server, io };
