const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');

const router = express.Router();

const ABOA_URL = process.env.ABOA_SVC_URL || 'http://localhost:3004';
const USER_URL = process.env.USER_SVC_URL || 'http://localhost:3002';
const ANALYTICS_URL = process.env.ANALYTICS_SVC_URL || 'http://localhost:3005';

async function callAboa(data) {
  try {
    const axios = require('axios');
    const res = await axios.post(`${ABOA_URL}/aboa/compute`, data, { timeout: 3000 });
    return res.data;
  } catch {
    // fallback defaults when ABOA not available
    return {
      engagement_score: 0.5,
      new_difficulty: data.current_difficulty || 0.5,
      new_reward: 10,
      guidance_level: 0.5,
      new_pacing: 1.0
    };
  }
}

async function addXp(userId, amount) {
  try {
    const axios = require('axios');
    await axios.post(`${USER_URL}/users/${userId}/xp`, { amount }, { timeout: 3000 });
  } catch {
    // ignore if user svc not available
  }
}

// POST /games/sessions/start
router.post('/sessions/start', async (req, res) => {
  try {
    const { game_mode, subject } = req.body;
    const user_id = req.headers['x-user-id'] || req.body.user_id;

    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const id = uuidv4();
    await query(
      `INSERT INTO game_sessions (id, user_id, game_mode, subject, started_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, user_id, game_mode || 'lightning_quiz', subject || 'general', new Date().toISOString()]
    );

    res.status(201).json({ session_id: id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// GET /games/sessions/:id/next-question
router.get('/sessions/:id/next-question', async (req, res) => {
  try {
    const sessionResult = await query(
      'SELECT * FROM game_sessions WHERE id = $1', [req.params.id]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];
    const difficulty = session.final_difficulty || 0.5;
    const subject = session.subject;
    // mode filter: query param overrides session.game_mode, legacy questions (target_mode='') always match
    const mode = (req.query.mode || session.game_mode || '').toString();

    // answered question ids
    const answeredResult = await query(
      'SELECT question_id FROM session_answers WHERE session_id = $1', [req.params.id]
    );
    const answeredIds = answeredResult.rows.map(r => r.question_id);

    // find question near difficulty, not yet answered
    const minDiff = Math.max(0, difficulty - 0.2);
    const maxDiff = Math.min(1, difficulty + 0.2);

    // mode predicate keeps legacy/un-tagged questions ('' or NULL) available to every mode
    const modePredicate = `(target_mode = $MODE OR target_mode = '' OR target_mode IS NULL)`;

    let questionResult;
    if (subject && subject !== 'general') {
      const sql = `SELECT * FROM questions
                   WHERE subject = $1 AND difficulty BETWEEN $2 AND $3
                     AND ${modePredicate.replace('$MODE', '$4')}
                   LIMIT 50`;
      questionResult = await query(sql, [subject, minDiff, maxDiff, mode]);
    } else {
      const sql = `SELECT * FROM questions
                   WHERE difficulty BETWEEN $1 AND $2
                     AND ${modePredicate.replace('$MODE', '$3')}
                   LIMIT 50`;
      questionResult = await query(sql, [minDiff, maxDiff, mode]);
    }

    let candidates = questionResult.rows.filter(q => !answeredIds.includes(q.id));
    if (candidates.length === 0) {
      // fallback 1: any difficulty, mode-matching
      const broad = await query(
        `SELECT * FROM questions WHERE ${modePredicate.replace('$MODE', '$1')} LIMIT 100`,
        [mode]
      );
      candidates = broad.rows.filter(q => !answeredIds.includes(q.id));
    }
    if (candidates.length === 0) {
      // fallback 2: any question regardless of mode
      const allQ = await query('SELECT * FROM questions LIMIT 100');
      candidates = allQ.rows.filter(q => !answeredIds.includes(q.id));
    }

    if (candidates.length === 0) {
      return res.status(404).json({ error: 'No more questions available' });
    }

    // ── INTELLIGENT QUESTION SELECTION (ABOA) ──
    let q;
    try {
      const ABOA_URL = process.env.ABOA_SVC_URL || 'http://localhost:3004';
      const aboaRes = await axios.post(`${ABOA_URL}/aboa/recommend-question`, {
        user_id: session.user_id,
        session_id: req.params.id,
        subject: subject || undefined
      }, { timeout: 3000 });

      const { scoring_context, context_summary } = aboaRes.data;
      const qcMap = context_summary.question_concept_map || {};

      // Score each candidate using ABOA factors
      const aboa = require('../../../aboa-svc/src/aboa');
      const scored = candidates.map(c => {
        const conceptId = qcMap[c.id] || (JSON.parse(c.concept_tags || '[]'))[0] || null;
        return aboa.scoreQuestion(
          { ...c, concept_node_id: conceptId },
          { ...scoring_context, answeredIds }
        );
      }).sort((a, b) => b.score - a.score);

      q = candidates.find(c => c.id === scored[0].question_id) || candidates[0];
    } catch (err) {
      // Fallback to random if ABOA unavailable
      q = candidates[Math.floor(Math.random() * candidates.length)];
    }

    // parse JSON fields
    const content = typeof q.content_i18n === 'string' ? JSON.parse(q.content_i18n) : q.content_i18n;
    const options = typeof q.options_i18n === 'string' ? JSON.parse(q.options_i18n) : q.options_i18n;
    const explanation = typeof q.explanation_i18n === 'string' ? JSON.parse(q.explanation_i18n) : q.explanation_i18n;

    // hint: 2 wrong indices to eliminate (never includes correct_option)
    const wrongIndices = [0,1,2,3].filter(i => i !== q.correct_option);
    wrongIndices.sort(() => Math.random() - 0.5);
    const hint_eliminated = wrongIndices.slice(0, 2);

    res.json({
      id: q.id,
      subject: q.subject,
      difficulty: q.difficulty,
      type: q.type,
      content: content.en || content,
      options: options.en || options,
      hint_eliminated,
      question_number: answeredIds.length + 1,
      total_questions: 10
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get question' });
  }
});

// POST /games/sessions/:id/answer
router.post('/sessions/:id/answer', async (req, res) => {
  try {
    const { question_id, answer, hint_used = false, response_time_sec = 5 } = req.body;

    const sessionResult = await query(
      'SELECT * FROM game_sessions WHERE id = $1', [req.params.id]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const session = sessionResult.rows[0];

    const questionResult = await query(
      'SELECT * FROM questions WHERE id = $1', [question_id]
    );
    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    const question = questionResult.rows[0];

    const is_correct = parseInt(answer) === parseInt(question.correct_option);

    await query(
      `INSERT INTO session_answers (id, session_id, question_id, user_answer, is_correct, response_time_sec, hint_used, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), req.params.id, question_id, answer, is_correct ? 1 : 0, response_time_sec, hint_used ? 1 : 0, new Date().toISOString()]
    );

    // update session stats
    const answersResult = await query(
      'SELECT * FROM session_answers WHERE session_id = $1', [req.params.id]
    );
    const answers = answersResult.rows;
    const total = answers.length;
    const correct = answers.filter(a => a.is_correct === 1 || a.is_correct === true).length;
    const accuracy = total > 0 ? correct / total : 0;

    // call ABOA with concept info for mastery updates
    const conceptTags = JSON.parse(question.concept_tags || '[]');
    const aboaResult = await callAboa({
      user_id: session.user_id,
      session_id: req.params.id,
      response_time: response_time_sec,
      accuracy,
      session_duration: total * response_time_sec,
      hint_usage: hint_used ? 1 : 0,
      engagement_trend: 0,
      current_difficulty: session.final_difficulty || 0.5,
      question_id: question_id,
      concept_node_id: conceptTags[0] || null,
      is_correct,
      hint_used
    });

    // update session with new difficulty
    await query(
      'UPDATE game_sessions SET total_questions = $1, correct_answers = $2, final_difficulty = $3, final_se = $4 WHERE id = $5',
      [total, correct, aboaResult.new_difficulty, aboaResult.engagement_score, req.params.id]
    );

    const xp_gained = is_correct ? Math.round(aboaResult.new_reward || 10) : 0;

    if (is_correct && session.user_id) {
      await addXp(session.user_id, xp_gained);
      await query(
        'UPDATE game_sessions SET xp_earned = xp_earned + $1 WHERE id = $2',
        [xp_gained, req.params.id]
      );
    }

    const explanation = typeof question.explanation_i18n === 'string'
      ? JSON.parse(question.explanation_i18n)
      : question.explanation_i18n;

    res.json({
      correct: is_correct,
      correct_option: question.correct_option,
      explanation: explanation.en || explanation,
      new_difficulty: aboaResult.new_difficulty,
      xp_gained,
      engagement_score: aboaResult.engagement_score
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// POST /games/sessions/:id/end
router.post('/sessions/:id/end', async (req, res) => {
  try {
    await query(
      'UPDATE game_sessions SET ended_at = $1 WHERE id = $2',
      [new Date().toISOString(), req.params.id]
    );

    const result = await query(
      'SELECT * FROM game_sessions WHERE id = $1', [req.params.id]
    );

    const session = result.rows[0];

    // trigger analytics
    try {
      const axios = require('axios');
      await axios.post(`${ANALYTICS_URL}/analytics/activity/record`, {
        user_id: session.user_id,
        session_id: req.params.id,
        correct_answers: session.correct_answers,
        total_answers: session.total_questions,
        engagement_score: session.final_se || 0.5
      }, { timeout: 2000 });
    } catch {}

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// GET /games/sessions/:id
router.get('/sessions/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM game_sessions WHERE id = $1', [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// GET /games/sessions/user/:userId
router.get('/sessions/user/:userId', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM game_sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT 50',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// GET /games/questions — returns all questions in flat format for educator content page
router.get('/questions', async (req, res) => {
  try {
    const result = await query('SELECT * FROM questions ORDER BY created_at DESC');
    const LETTERS = ['A', 'B', 'C', 'D'];
    const rows = result.rows.map(q => {
      const content = typeof q.content_i18n === 'string' ? JSON.parse(q.content_i18n) : q.content_i18n;
      const options = typeof q.options_i18n === 'string' ? JSON.parse(q.options_i18n) : q.options_i18n;
      const opts = options.en || options;
      return {
        id: q.id,
        subject: q.subject,
        difficulty: q.difficulty,
        question_text: content.en || content,
        option_a: opts[0] || '',
        option_b: opts[1] || '',
        option_c: opts[2] || '',
        option_d: opts[3] || '',
        correct_option: LETTERS[q.correct_option] || 'A',
        target_mode: q.target_mode || '',
      };
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get questions' });
  }
});

// POST /games/questions (educator creates question — accepts flat format)
router.post('/questions', async (req, res) => {
  try {
    const {
      subject, difficulty, question_text, option_a, option_b, option_c, option_d,
      correct_option, // 'A'|'B'|'C'|'D' or 0-3
      target_mode,
      // legacy format
      content, options, explanation,
    } = req.body;
    const created_by = req.headers['x-user-id'] || req.body.created_by;

    const LETTER_MAP = { A: 0, B: 1, C: 2, D: 3 };
    const correctIdx = typeof correct_option === 'string'
      ? (LETTER_MAP[correct_option.toUpperCase()] ?? 0)
      : (correct_option || 0);

    const contentJson = JSON.stringify({ en: question_text || content || '' });
    const optionsArr = option_a
      ? [option_a, option_b || '', option_c || '', option_d || '']
      : (options || []);
    const optionsJson = JSON.stringify({ en: optionsArr });

    const id = uuidv4();
    await query(
      `INSERT INTO questions (id, subject, difficulty, type, content_i18n, options_i18n, correct_option, explanation_i18n, target_mode, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, subject, difficulty || 0.5, 'mcq', contentJson, optionsJson, correctIdx,
       JSON.stringify({ en: explanation || '' }), target_mode || '', created_by]
    );

    const LETTERS = ['A', 'B', 'C', 'D'];
    res.status(201).json({
      id, subject, difficulty: difficulty || 0.5,
      question_text: question_text || content || '',
      option_a: optionsArr[0], option_b: optionsArr[1],
      option_c: optionsArr[2], option_d: optionsArr[3],
      correct_option: LETTERS[correctIdx],
      target_mode: target_mode || '',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

module.exports = router;
