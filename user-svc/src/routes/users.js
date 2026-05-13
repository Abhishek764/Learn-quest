const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');

const router = express.Router();

// GET /users/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, display_name, avatar_url, xp, level, role FROM users ORDER BY xp DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /users/:id/profile
router.get('/:id/profile', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, role, display_name, avatar_url, lang, xp, level, streak_days, last_active, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /users/:id/profile
router.put('/:id/profile', async (req, res) => {
  try {
    const { display_name, avatar_url, lang } = req.body;
    await query(
      'UPDATE users SET display_name = $1, avatar_url = $2, lang = $3 WHERE id = $4',
      [display_name, avatar_url, lang, req.params.id]
    );
    const result = await query(
      'SELECT id, email, role, display_name, avatar_url, lang, xp, level FROM users WHERE id = $1',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /users/:id/xp
router.post('/:id/xp', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 0) {
      return res.status(400).json({ error: 'Invalid XP amount' });
    }

    const result = await query('SELECT xp, level FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const newXp = (user.xp || 0) + amount;
    const newLevel = Math.floor(newXp / 100) + 1;

    await query(
      'UPDATE users SET xp = $1, level = $2 WHERE id = $3',
      [newXp, newLevel, req.params.id]
    );

    res.json({ xp: newXp, level: newLevel, xp_gained: amount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add XP' });
  }
});

// GET /users/:id/badges
router.get('/:id/badges', async (req, res) => {
  try {
    const result = await query(
      `SELECT b.id, b.name, b.description, b.icon, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// POST /users/badges/check/:userId
router.post('/badges/check/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    const badgesResult = await query('SELECT * FROM badges');
    const userBadgesResult = await query(
      'SELECT badge_id FROM user_badges WHERE user_id = $1', [userId]
    );
    const earnedIds = new Set(userBadgesResult.rows.map(r => r.badge_id));

    const newBadges = [];
    for (const badge of badgesResult.rows) {
      if (earnedIds.has(badge.id)) continue;

      let earned = false;
      if (badge.condition_type === 'xp' && user.xp >= badge.condition_value) earned = true;
      if (badge.condition_type === 'streak' && user.streak_days >= badge.condition_value) earned = true;

      if (earned) {
        await query(
          'INSERT INTO user_badges (id, user_id, badge_id, earned_at) VALUES ($1, $2, $3, $4)',
          [uuidv4(), userId, badge.id, new Date().toISOString()]
        );
        newBadges.push(badge);
      }
    }

    res.json({ new_badges: newBadges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Badge check failed' });
  }
});

module.exports = router;
