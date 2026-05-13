require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { query } = require('./db');
const aboa = require('./aboa');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'aboa-svc' });
});

// POST /aboa/compute
app.post('/aboa/compute', async (req, res) => {
  try {
    const {
      user_id,
      session_id,
      response_time = 5,
      accuracy = 0.5,
      session_duration = 10,
      hint_usage = 0.3,
      engagement_trend = 0,
      current_difficulty = 0.5
    } = req.body;

    const result = aboa.compute({
      response_time,
      accuracy,
      session_duration,
      hint_usage,
      engagement_trend,
      current_difficulty
    });

    const logId = uuidv4();
    await query(
      `INSERT INTO aboa_logs (id, session_id, user_id, response_time, accuracy, session_duration,
       hint_usage, engagement_trend, engagement_score, new_difficulty, new_reward, guidance_level, new_pacing)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        logId, session_id || 'none', user_id || 'none',
        response_time, accuracy, session_duration, hint_usage, engagement_trend,
        result.engagement_score, result.new_difficulty, result.new_reward,
        result.guidance_level, result.new_pacing
      ]
    );

    res.json(result);
  } catch (err) {
    console.error('ABOA compute error:', err);
    res.status(500).json({ error: 'Computation failed' });
  }
});

// GET /aboa/learner/:id/state
app.get('/aboa/learner/:id/state', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM aboa_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.json({
        engagement_score: 0.5,
        new_difficulty: 0.5,
        new_reward: 10,
        guidance_level: 0.3,
        new_pacing: 1.0
      });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch learner state' });
  }
});

// GET /aboa/learner/:id/history
app.get('/aboa/learner/:id/history', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM aboa_logs WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch learner history' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`aboa-svc running on port ${PORT}`);
    if (process.env.NODE_ENV !== 'test') {
      const { query } = require('./db');
      query('SELECT 1').catch(() => {});
    }
  });
}

module.exports = app;
