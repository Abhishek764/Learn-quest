const express = require('express');
const { generateQuestions, SUPPORTED_FORMATS, errors } = require('../gemini');
const { fetchUserProfile, difficultyForLevel, nextLevelXp, UserFetchError } = require('../userClient');

const router = express.Router();

const ALLOWED_DIFFICULTY = new Set(['easy', 'medium', 'hard']);
const TOPIC_MAX = 200;
const GRADE_MAX = 64;
const STYLE_MAX = 64;

function statusForError(err) {
  if (err instanceof errors.AiConfigError) return 503;
  if (err instanceof errors.AiTimeoutError) return 504;
  if (err instanceof errors.AiParseError) return 502;
  if (err instanceof errors.AiValidationError) return 502;
  if (err instanceof errors.AiUpstreamError) return 502;
  if (err instanceof UserFetchError) return 502;
  return 500;
}

function validateFormats(formats) {
  if (formats == null) return null;
  if (!Array.isArray(formats)) return { error: 'formats must be array of strings' };
  if (formats.length === 0) return { error: 'formats cannot be empty' };
  for (const f of formats) {
    if (typeof f !== 'string' || !SUPPORTED_FORMATS.has(f)) {
      return { error: `unsupported format: ${f}. Allowed: ${[...SUPPORTED_FORMATS].join(', ')}` };
    }
  }
  return { ok: [...new Set(formats)] };
}

function validateTopic(topic) {
  if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
    return { error: 'topic is required (min 2 chars)' };
  }
  if (topic.length > TOPIC_MAX) {
    return { error: `topic too long (max ${TOPIC_MAX} chars)` };
  }
  return { ok: topic.trim() };
}

function validateCount(count) {
  const n = Number(count);
  if (!Number.isInteger(n) || n < 1 || n > 20) {
    return { error: 'count must be integer 1-20' };
  }
  return { ok: n };
}

function validateOptional(value, name, max) {
  if (value == null) return { ok: undefined };
  if (typeof value !== 'string' || value.length > max) {
    return { error: `${name} must be string up to ${max} chars` };
  }
  return { ok: value };
}

router.post('/generate-questions', async (req, res) => {
  const {
    topic,
    count = 5,
    difficulty = 'medium',
    gradeLevel,
    style,
    formats,
  } = req.body || {};

  const t = validateTopic(topic);
  if (t.error) return res.status(400).json({ error: t.error });
  const c = validateCount(count);
  if (c.error) return res.status(400).json({ error: c.error });
  if (!ALLOWED_DIFFICULTY.has(difficulty)) {
    return res.status(400).json({ error: 'difficulty must be easy|medium|hard' });
  }
  const g = validateOptional(gradeLevel, 'gradeLevel', GRADE_MAX);
  if (g.error) return res.status(400).json({ error: g.error });
  const s = validateOptional(style, 'style', STYLE_MAX);
  if (s.error) return res.status(400).json({ error: s.error });
  const f = validateFormats(formats);
  if (f && f.error) return res.status(400).json({ error: f.error });

  try {
    const questions = await generateQuestions({
      topic: t.ok,
      count: c.ok,
      difficulty,
      gradeLevel: g.ok,
      style: s.ok,
      formats: f ? f.ok : undefined,
    });
    res.json({ questions, source: 'gemini', difficulty });
  } catch (err) {
    const status = statusForError(err);
    res.status(status).json({ error: err.message, code: err.name });
  }
});

// Adaptive: derives difficulty from caller's user level/xp, then generates.
// Caller identity comes from x-user-id (gateway sets this from Clerk).
router.post('/generate-questions/adaptive', async (req, res) => {
  const userId = req.headers['x-user-id'] || req.body?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'x-user-id header required (gateway must authenticate)' });
  }

  const {
    topic,
    count = 5,
    gradeLevel,
    style,
    formats,
  } = req.body || {};

  const t = validateTopic(topic);
  if (t.error) return res.status(400).json({ error: t.error });
  const c = validateCount(count);
  if (c.error) return res.status(400).json({ error: c.error });
  const g = validateOptional(gradeLevel, 'gradeLevel', GRADE_MAX);
  if (g.error) return res.status(400).json({ error: g.error });
  const s = validateOptional(style, 'style', STYLE_MAX);
  if (s.error) return res.status(400).json({ error: s.error });
  const f = validateFormats(formats);
  if (f && f.error) return res.status(400).json({ error: f.error });

  let profile;
  try {
    profile = await fetchUserProfile(userId, req.headers['authorization']);
  } catch (err) {
    const status = statusForError(err);
    return res.status(status).json({ error: err.message, code: err.name });
  }

  const difficulty = difficultyForLevel(profile.level, profile.xp);

  try {
    const questions = await generateQuestions({
      topic: t.ok,
      count: c.ok,
      difficulty,
      gradeLevel: g.ok,
      style: s.ok,
      formats: f ? f.ok : undefined,
      levelContext: { level: profile.level, xp: profile.xp },
    });
    res.json({
      questions,
      source: 'gemini',
      difficulty,
      learner: {
        level: profile.level,
        xp: profile.xp,
        xp_to_next: Math.max(0, nextLevelXp(profile.level) - profile.xp),
      },
    });
  } catch (err) {
    const status = statusForError(err);
    res.status(status).json({ error: err.message, code: err.name });
  }
});

module.exports = router;
