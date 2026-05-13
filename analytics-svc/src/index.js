require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { query } = require('./db');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'analytics-svc' });
});

// POST /analytics/activity/record
app.post('/analytics/activity/record', async (req, res) => {
  try {
    const { user_id, correct_answers = 0, total_answers = 0, engagement_score = 0.5 } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const today = new Date().toISOString().split('T')[0];

    const existing = await query(
      'SELECT * FROM daily_activity WHERE user_id = $1 AND date = $2',
      [user_id, today]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const newTotal = row.total_answers + total_answers;
      const newCorrect = row.correct_answers + correct_answers;
      const newAvgEng = (row.avg_engagement_score * row.sessions_count + engagement_score) / (row.sessions_count + 1);
      await query(
        `UPDATE daily_activity SET sessions_count = sessions_count + 1,
         correct_answers = $1, total_answers = $2, avg_engagement_score = $3
         WHERE user_id = $4 AND date = $5`,
        [newCorrect, newTotal, newAvgEng, user_id, today]
      );
    } else {
      await query(
        `INSERT INTO daily_activity (id, user_id, date, sessions_count, correct_answers, total_answers, avg_engagement_score)
         VALUES ($1, $2, $3, 1, $4, $5, $6)`,
        [uuidv4(), user_id, today, correct_answers, total_answers, engagement_score]
      );
    }

    res.json({ recorded: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record activity' });
  }
});

// GET /analytics/user/:id/heatmap
app.get('/analytics/user/:id/heatmap', async (req, res) => {
  try {
    const result = await query(
      'SELECT date, sessions_count as count FROM daily_activity WHERE user_id = $1 ORDER BY date ASC',
      [req.params.id]
    );

    // Build 365-day heatmap
    const activityMap = {};
    for (const row of result.rows) {
      activityMap[row.date] = row.count;
    }

    const days = [];
    const now = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: dateStr, count: activityMap[dateStr] || 0 });
    }

    res.json(days);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch heatmap' });
  }
});

// GET /analytics/user/:id/trends
app.get('/analytics/user/:id/trends', async (req, res) => {
  try {
    const result = await query(
      `SELECT date, avg_engagement_score as engagement_score,
       CASE WHEN total_answers > 0 THEN CAST(correct_answers AS FLOAT)/total_answers ELSE 0 END as accuracy,
       sessions_count
       FROM daily_activity
       WHERE user_id = $1
       ORDER BY date DESC LIMIT 30`,
      [req.params.id]
    );

    // pad to 30 days
    const dataMap = {};
    for (const row of result.rows) {
      dataMap[row.date] = row;
    }

    const days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push(dataMap[dateStr] || {
        date: dateStr,
        engagement_score: 0,
        accuracy: 0,
        sessions_count: 0
      });
    }

    res.json(days);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// GET /analytics/user/:id/stats
app.get('/analytics/user/:id/stats', async (req, res) => {
  try {
    const activityResult = await query(
      'SELECT * FROM daily_activity WHERE user_id = $1',
      [req.params.id]
    );

    const rows = activityResult.rows;
    const total_sessions = rows.reduce((s, r) => s + (r.sessions_count || 0), 0);
    const total_correct = rows.reduce((s, r) => s + (r.correct_answers || 0), 0);
    const total_answers = rows.reduce((s, r) => s + (r.total_answers || 0), 0);
    const avg_accuracy = total_answers > 0 ? total_correct / total_answers : 0;

    // streak calculation
    let best_streak = 0, cur_streak = 0;
    const sortedDates = rows.map(r => r.date).sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) { cur_streak = 1; }
      else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff === 1) cur_streak++;
        else cur_streak = 1;
      }
      best_streak = Math.max(best_streak, cur_streak);
    }

    // most played subject from game_sessions
    const subjectResult = await query(
      `SELECT subject, COUNT(*) as cnt FROM game_sessions
       WHERE user_id = $1 GROUP BY subject ORDER BY cnt DESC LIMIT 1`,
      [req.params.id]
    );
    const most_played_subject = subjectResult.rows.length > 0 ? subjectResult.rows[0].subject : 'general';

    // total xp approximation
    const xpResult = await query(
      'SELECT SUM(xp_earned) as total FROM game_sessions WHERE user_id = $1',
      [req.params.id]
    );
    const total_xp = xpResult.rows[0]?.total || 0;

    res.json({
      total_sessions,
      avg_accuracy: Math.round(avg_accuracy * 100) / 100,
      best_streak,
      total_xp,
      most_played_subject
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /analytics/user/:id/growth-tips
app.get('/analytics/user/:id/growth-tips', async (req, res) => {
  try {
    const result = await query(
      `SELECT subject, AVG(accuracy) as avg_acc
       FROM aboa_logs
       WHERE user_id = $1
       GROUP BY subject
       ORDER BY avg_acc ASC LIMIT 3`,
      [req.params.id]
    );

    const tips = [];
    const defaultTips = [
      'Practice daily for 15 minutes to build consistent habits and improve retention.',
      'Review questions you got wrong to identify patterns in your mistakes.',
      'Try harder difficulty questions once you feel confident at your current level.'
    ];

    if (result.rows.length === 0) {
      return res.json(defaultTips);
    }

    for (const row of result.rows) {
      const acc = Math.round((row.avg_acc || 0) * 100);
      tips.push(`Your ${row.subject || 'general'} accuracy is ${acc}% — focus on reviewing ${row.subject} fundamentals to improve.`);
    }

    // pad if needed
    while (tips.length < 3) {
      tips.push(defaultTips[tips.length]);
    }

    res.json(tips.slice(0, 3));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch growth tips' });
  }
});

// GET /analytics/class/:id/report
app.get('/analytics/class/:id/report', async (req, res) => {
  try {
    res.json({
      class_id: req.params.id,
      avg_engagement: 0.65,
      top_students: [],
      struggling_students: [],
      subject_breakdown: {}
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch class report' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`analytics-svc running on port ${PORT}`);
    if (process.env.NODE_ENV !== 'test') {
      const { query } = require('./db');
      query('SELECT 1').catch(() => {});
    }
  });
}

module.exports = app;
