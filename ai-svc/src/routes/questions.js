const express = require('express');
const { generateQuestions } = require('../gemini');

const router = express.Router();

const ALLOWED_DIFFICULTY = new Set(['easy', 'medium', 'hard']);

router.post('/generate-questions', async (req, res) => {
  const {
    topic,
    count = 5,
    difficulty = 'medium',
    gradeLevel,
    style,
  } = req.body || {};

  if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
    return res.status(400).json({ error: 'topic is required (min 2 chars)' });
  }
  const n = Number(count);
  if (!Number.isInteger(n) || n < 1 || n > 20) {
    return res.status(400).json({ error: 'count must be integer 1-20' });
  }
  if (!ALLOWED_DIFFICULTY.has(difficulty)) {
    return res.status(400).json({ error: 'difficulty must be easy|medium|hard' });
  }

  try {
    const questions = await generateQuestions({
      topic: topic.trim(),
      count: n,
      difficulty,
      gradeLevel,
      style,
    });
    res.json({ questions, source: 'gemini' });
  } catch (err) {
    const status = err.message === 'GEMINI_API_KEY not configured' ? 503 : 502;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
