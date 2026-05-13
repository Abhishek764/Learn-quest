const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');

// ═══════════════════════════════════════════════════════════════
// CREW QUEST — Among Us-style multiplayer room management
// In-memory rooms (no DB needed, rooms are ephemeral)
// ═══════════════════════════════════════════════════════════════

const rooms = new Map();

const AVATARS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚪', '🟤'];
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#e2e8f0', '#a16207'];
const CREW_NAMES = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'White', 'Brown'];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// POST /games/crew-quest/create — Create a new room
router.post('/create', async (req, res) => {
  try {
    const { host_id, host_name, subject, max_players = 8, rounds = 8, timer = 180 } = req.body;
    if (!host_id) return res.status(400).json({ error: 'host_id required' });

    let code;
    do { code = generateCode(); } while (rooms.has(code));

    const room = {
      code,
      host_id: host_id,
      subject: subject || 'all',
      status: 'lobby',
      max_players,
      rounds,
      timer,
      timer_remaining: timer,
      created_at: new Date().toISOString(),
      players: [{
        id: host_id,
        name: host_name || 'Host',
        avatar: AVATARS[0],
        color: COLORS[0],
        crew_name: CREW_NAMES[0],
        ready: false,
        tasks: [],
        tasks_completed: 0,
        score: 0,
        alive: true,
        is_host: true,
      }],
    };

    rooms.set(code, room);
    res.status(201).json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// POST /games/crew-quest/join — Join an existing room
router.post('/join', async (req, res) => {
  try {
    const { room_code, user_id, user_name } = req.body;
    if (!room_code || !user_id) return res.status(400).json({ error: 'room_code and user_id required' });

    const room = rooms.get(room_code.toUpperCase());
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status !== 'lobby') return res.status(400).json({ error: 'Game already started' });
    if (room.players.length >= room.max_players) return res.status(400).json({ error: 'Room is full' });
    if (room.players.find(p => p.id === user_id)) return res.json(room); // already in

    const idx = room.players.length;
    room.players.push({
      id: user_id,
      name: user_name || `Player ${idx + 1}`,
      avatar: AVATARS[idx % AVATARS.length],
      color: COLORS[idx % COLORS.length],
      crew_name: CREW_NAMES[idx % CREW_NAMES.length],
      ready: false,
      tasks: [],
      tasks_completed: 0,
      score: 0,
      alive: true,
      is_host: false,
    });

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// POST /games/crew-quest/ready — Toggle ready status
router.post('/ready', (req, res) => {
  const { room_code, user_id } = req.body;
  const room = rooms.get(room_code);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  const player = room.players.find(p => p.id === user_id);
  if (!player) return res.status(404).json({ error: 'Player not in room' });
  player.ready = !player.ready;
  res.json(room);
});

// POST /games/crew-quest/start — Host starts the game
router.post('/start', async (req, res) => {
  try {
    const { room_code, user_id } = req.body;
    const room = rooms.get(room_code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.host_id !== user_id) return res.status(403).json({ error: 'Only host can start' });
    if (room.players.length < 1) return res.status(400).json({ error: 'Need at least 1 player' });

    // Load questions for each player
    const subject = room.subject !== 'all' ? room.subject : null;
    let questionPool;
    if (subject) {
      questionPool = await query('SELECT * FROM questions WHERE subject = $1', [subject]);
    } else {
      questionPool = await query('SELECT * FROM questions');
    }
    const allQ = questionPool.rows;

    // Assign tasks to each player
    for (const player of room.players) {
      const shuffled = [...allQ].sort(() => Math.random() - 0.5);
      const assigned = shuffled.slice(0, room.rounds);
      player.tasks = assigned.map((q, i) => ({
        id: `task-${i}`,
        question_id: q.id,
        question: typeof q.content_i18n === 'string' ? JSON.parse(q.content_i18n).en : q.content_i18n?.en || '',
        options: typeof q.options_i18n === 'string' ? JSON.parse(q.options_i18n).en : q.options_i18n?.en || [],
        correct_option: q.correct_option,
        difficulty: q.difficulty,
        subject: q.subject,
        completed: false,
        correct: null,
        location: getTaskLocation(i),
      }));
      player.tasks_completed = 0;
    }

    room.status = 'playing';
    room.timer_remaining = room.timer;
    room.started_at = new Date().toISOString();

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// POST /games/crew-quest/complete-task — Complete a task
router.post('/complete-task', async (req, res) => {
  try {
    const { room_code, user_id, task_id, answer, response_time } = req.body;
    const room = rooms.get(room_code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status !== 'playing') return res.status(400).json({ error: 'Game not in progress' });

    const player = room.players.find(p => p.id === user_id);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const task = player.tasks.find(t => t.id === task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.completed) return res.status(400).json({ error: 'Task already completed' });

    const is_correct = parseInt(answer) === parseInt(task.correct_option);
    task.completed = true;
    task.correct = is_correct;

    if (is_correct) {
      const bonus = Math.max(1, Math.round((30 - (response_time || 10)) / 3));
      player.score += 10 + bonus;
      player.tasks_completed++;
    }

    // Check if all players finished
    const allDone = room.players.every(p => p.tasks.every(t => t.completed));
    if (allDone) {
      room.status = 'ended';
      room.ended_at = new Date().toISOString();
    }

    res.json({
      correct: is_correct,
      score: player.score,
      tasks_completed: player.tasks_completed,
      total_tasks: player.tasks.length,
      game_ended: room.status === 'ended',
      explanation: is_correct ? 'Correct! Task complete.' : `Wrong! The answer was option ${task.correct_option + 1}`,
      room,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// GET /games/crew-quest/room/:code — Get room state
router.get('/room/:code', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

// POST /games/crew-quest/end — End game
router.post('/end', (req, res) => {
  const { room_code } = req.body;
  const room = rooms.get(room_code);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.status = 'ended';
  room.ended_at = new Date().toISOString();
  // Sort by score
  room.players.sort((a, b) => b.score - a.score);
  res.json(room);
});

// POST /games/crew-quest/leave
router.post('/leave', (req, res) => {
  const { room_code, user_id } = req.body;
  const room = rooms.get(room_code);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.players = room.players.filter(p => p.id !== user_id);
  if (room.players.length === 0) rooms.delete(room_code);
  res.json({ left: true });
});

// Task locations on the "ship map"
function getTaskLocation(index) {
  const locations = [
    { name: 'Cafeteria', x: 50, y: 15 },
    { name: 'Navigation', x: 85, y: 20 },
    { name: 'Weapons', x: 80, y: 50 },
    { name: 'Shields', x: 70, y: 75 },
    { name: 'Communications', x: 55, y: 65 },
    { name: 'Storage', x: 35, y: 75 },
    { name: 'Electrical', x: 20, y: 55 },
    { name: 'Medbay', x: 25, y: 30 },
    { name: 'Admin', x: 50, y: 45 },
    { name: 'Reactor', x: 10, y: 40 },
  ];
  return locations[index % locations.length];
}

module.exports = router;
