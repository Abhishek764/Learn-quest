const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');

const router = express.Router();

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /classes — list classes for the authenticated educator
router.get('/', async (req, res) => {
  try {
    const educator_id = req.headers['x-user-id'];
    if (!educator_id) return res.status(400).json({ error: 'User ID required' });
    const result = await query(
      'SELECT * FROM classes WHERE educator_id = $1 ORDER BY created_at DESC',
      [educator_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// GET /classes/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM classes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Class not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// POST /classes
router.post('/', async (req, res) => {
  try {
    const { name, subject } = req.body;
    const educator_id = req.headers['x-user-id'] || req.body.educator_id;

    if (!name) return res.status(400).json({ error: 'Class name required' });
    if (!educator_id) return res.status(400).json({ error: 'Educator ID required' });

    const invite_code = generateInviteCode();
    const id = uuidv4();

    await query(
      'INSERT INTO classes (id, educator_id, name, invite_code, subject) VALUES ($1, $2, $3, $4, $5)',
      [id, educator_id, name, invite_code, subject]
    );

    const result = await query('SELECT * FROM classes WHERE id = $1', [id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// POST /classes/join
router.post('/join', async (req, res) => {
  try {
    const { invite_code } = req.body;
    const user_id = req.headers['x-user-id'] || req.body.user_id;

    if (!invite_code) return res.status(400).json({ error: 'Invite code required' });
    if (!user_id) return res.status(400).json({ error: 'User ID required' });

    const classResult = await query('SELECT * FROM classes WHERE invite_code = $1', [invite_code]);
    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const cls = classResult.rows[0];

    // Check already member
    const memberCheck = await query(
      'SELECT id FROM class_members WHERE class_id = $1 AND user_id = $2',
      [cls.id, user_id]
    );
    if (memberCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Already a member' });
    }

    await query(
      'INSERT INTO class_members (id, class_id, user_id, joined_at) VALUES ($1, $2, $3, $4)',
      [uuidv4(), cls.id, user_id, new Date().toISOString()]
    );

    res.json({ class: cls, message: 'Joined successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join class' });
  }
});

// GET /classes/:id/members
router.get('/:id/members', async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.display_name, u.avatar_url, u.xp, u.level, u.last_active, cm.joined_at
       FROM class_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.class_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

module.exports = router;
