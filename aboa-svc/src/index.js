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

// ═══════════════════════════════════════════════════════════════
// POST /aboa/compute — Core engagement + difficulty computation
// (Backward compatible, now also updates mastery if concept provided)
// ═══════════════════════════════════════════════════════════════
app.post('/aboa/compute', async (req, res) => {
  try {
    const {
      user_id, session_id,
      response_time = 5, accuracy = 0.5, session_duration = 10,
      hint_usage = 0.3, engagement_trend = 0, current_difficulty = 0.5,
      question_id, concept_node_id, is_correct, hint_used
    } = req.body;

    const result = aboa.compute({
      response_time, accuracy, session_duration, hint_usage,
      engagement_trend, current_difficulty
    });

    // Log to aboa_logs
    const logId = uuidv4();
    await query(
      `INSERT INTO aboa_logs (id, session_id, user_id, response_time, accuracy, session_duration,
       hint_usage, engagement_trend, engagement_score, new_difficulty, new_reward, guidance_level, new_pacing)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [logId, session_id || 'none', user_id || 'none',
       response_time, accuracy, session_duration, hint_usage, engagement_trend,
       result.engagement_score, result.new_difficulty, result.new_reward,
       result.guidance_level, result.new_pacing]
    );

    // ── NEW: Update student mastery if concept info provided ──
    let mastery_update = null;
    let spaced_rep_update = null;

    if (user_id && concept_node_id && is_correct !== undefined) {
      // Get or create mastery record
      let masteryResult = await query(
        'SELECT * FROM student_mastery WHERE user_id = $1 AND node_id = $2',
        [user_id, concept_node_id]
      );

      let currentMastery;
      if (masteryResult.rows.length === 0) {
        const mId = uuidv4();
        await query(
          `INSERT INTO student_mastery (id, user_id, node_id, mastery_score, confidence, attempts, correct, avg_response_time, streak, ease_factor, interval_days)
           VALUES ($1, $2, $3, 0, 0.5, 0, 0, 0, 0, 2.5, 1)`,
          [mId, user_id, concept_node_id]
        );
        currentMastery = { mastery_score: 0, confidence: 0.5, attempts: 0, correct: 0, avg_response_time: 0, streak: 0, ease_factor: 2.5, interval_days: 1 };
      } else {
        currentMastery = masteryResult.rows[0];
      }

      // Bayesian mastery update
      mastery_update = aboa.updateMastery(currentMastery, is_correct, current_difficulty, response_time);

      // SM-2 spaced repetition
      const quality = aboa.deriveQuality(is_correct, response_time, hint_used || false);
      spaced_rep_update = aboa.updateSpacedRepetition(
        { ...currentMastery, streak: mastery_update.streak },
        quality
      );

      // Write updates
      await query(
        `UPDATE student_mastery SET
         mastery_score = $1, confidence = $2, attempts = $3, correct = $4,
         avg_response_time = $5, streak = $6, ease_factor = $7, interval_days = $8,
         next_review = $9, last_seen = $10, updated_at = $11
         WHERE user_id = $12 AND node_id = $13`,
        [mastery_update.mastery_score, mastery_update.confidence, mastery_update.attempts,
         mastery_update.correct, mastery_update.avg_response_time, mastery_update.streak,
         spaced_rep_update.ease_factor, spaced_rep_update.interval_days,
         spaced_rep_update.next_review, spaced_rep_update.last_seen,
         new Date().toISOString(), user_id, concept_node_id]
      );

      // Update student profile
      await ensureStudentProfile(user_id, result.engagement_score, mastery_update.mastery_score);
    }

    res.json({
      ...result,
      mastery_update,
      spaced_rep_update
    });
  } catch (err) {
    console.error('ABOA compute error:', err);
    res.status(500).json({ error: 'Computation failed' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /aboa/recommend-question — Smart question selection
// ═══════════════════════════════════════════════════════════════
app.post('/aboa/recommend-question', async (req, res) => {
  try {
    const { user_id, session_id, subject } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    // Load student mastery map
    const masteryResult = await query(
      'SELECT node_id, mastery_score, next_review FROM student_mastery WHERE user_id = $1',
      [user_id]
    );
    const masteryMap = {};
    const spacedRepMap = {};
    for (const r of masteryResult.rows) {
      masteryMap[r.node_id] = r.mastery_score;
      spacedRepMap[r.node_id] = r.next_review;
    }

    // Load student profile
    const profileResult = await query('SELECT * FROM student_profile WHERE user_id = $1', [user_id]);
    const studentProfile = profileResult.rows[0] || { preferred_difficulty: 0.5, most_played_subject: subject || 'general' };

    // Load answered question IDs in current session
    let answeredIds = [];
    if (session_id) {
      try {
        const GAME_URL = process.env.GAME_SVC_URL || 'http://localhost:3003';
        // We'll check session_answers directly if we have access, otherwise empty
        answeredIds = [];
      } catch { answeredIds = []; }
    }

    // Load recent failures for prerequisite detection
    const recentFailResult = await query(
      `SELECT DISTINCT qc.node_id FROM aboa_logs al
       JOIN question_concepts qc ON qc.question_id = al.session_id
       WHERE al.user_id = $1 AND al.accuracy < 0.5
       ORDER BY al.created_at DESC LIMIT 10`,
      [user_id]
    );
    // Load edges for prereq detection
    const edgesResult = await query('SELECT * FROM knowledge_edges');
    const edges = edgesResult.rows;

    let weakPrereqNodeIds = [];
    for (const row of recentFailResult.rows) {
      const weak = aboa.findWeakPrerequisites(row.node_id, edges, masteryMap);
      weakPrereqNodeIds.push(...weak);
    }
    weakPrereqNodeIds = [...new Set(weakPrereqNodeIds)];

    // Load question-concept mappings
    const qcResult = await query('SELECT * FROM question_concepts');
    const questionConceptMap = {};
    for (const r of qcResult.rows) {
      questionConceptMap[r.question_id] = r.node_id;
    }

    const context = {
      masteryMap, spacedRepMap, studentProfile,
      answeredIds, recentQuestionIds: [], weakPrereqNodeIds
    };

    res.json({
      context_summary: {
        total_concepts_tracked: Object.keys(masteryMap).length,
        weak_prerequisites: weakPrereqNodeIds.length,
        preferred_difficulty: studentProfile.preferred_difficulty,
        question_concept_map: questionConceptMap
      },
      scoring_context: context
    });
  } catch (err) {
    console.error('Recommend error:', err);
    res.status(500).json({ error: 'Recommendation failed' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /aboa/learner/:id/state — Latest ABOA state
// ═══════════════════════════════════════════════════════════════
app.get('/aboa/learner/:id/state', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM aboa_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.json({
        engagement_score: 0.5, new_difficulty: 0.5,
        new_reward: 10, guidance_level: 0.3, new_pacing: 1.0
      });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch learner state' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /aboa/learner/:id/mastery — Per-concept mastery scores
// ═══════════════════════════════════════════════════════════════
app.get('/aboa/learner/:id/mastery', async (req, res) => {
  try {
    const result = await query(
      `SELECT sm.*, kn.subject, kn.topic, kn.concept, kn.display_name, kn.icon
       FROM student_mastery sm
       JOIN knowledge_nodes kn ON kn.id = sm.node_id
       WHERE sm.user_id = $1
       ORDER BY kn.subject, sm.mastery_score DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch mastery data' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /aboa/learner/:id/skill-tree — Knowledge graph + mastery overlay
// ═══════════════════════════════════════════════════════════════
app.get('/aboa/learner/:id/skill-tree', async (req, res) => {
  try {
    const subject = req.query.subject;

    // Load nodes
    let nodesResult;
    if (subject && subject !== 'all') {
      nodesResult = await query('SELECT * FROM knowledge_nodes WHERE subject = $1', [subject]);
    } else {
      nodesResult = await query('SELECT * FROM knowledge_nodes');
    }

    // Load edges
    const edgesResult = await query('SELECT * FROM knowledge_edges');

    // Load student mastery
    const masteryResult = await query(
      'SELECT node_id, mastery_score, confidence, attempts, streak, next_review FROM student_mastery WHERE user_id = $1',
      [req.params.id]
    );
    const masteryMap = {};
    for (const r of masteryResult.rows) {
      masteryMap[r.node_id] = r;
    }

    // Build nodes with mastery overlay
    const nodes = nodesResult.rows.map(n => {
      const m = masteryMap[n.id] || null;
      const mastery_score = m ? m.mastery_score : 0;

      // Check if locked (all prerequisites must have mastery >= 0.5)
      const prereqEdges = edgesResult.rows.filter(e => e.to_node_id === n.id);
      const locked = prereqEdges.length > 0 && prereqEdges.some(e => {
        const pm = masteryMap[e.from_node_id];
        return !pm || pm.mastery_score < 0.4;
      });

      // Determine status
      let status = 'locked';
      if (!locked && prereqEdges.length === 0) status = mastery_score >= 0.8 ? 'mastered' : mastery_score > 0 ? 'learning' : 'available';
      else if (!locked) status = mastery_score >= 0.8 ? 'mastered' : mastery_score > 0 ? 'learning' : 'available';

      return {
        ...n,
        mastery_score,
        confidence: m ? m.confidence : 0,
        attempts: m ? m.attempts : 0,
        streak: m ? m.streak : 0,
        next_review: m ? m.next_review : null,
        status,
        locked
      };
    });

    // Filter edges to only include relevant ones
    const nodeIds = new Set(nodes.map(n => n.id));
    const edges = edgesResult.rows.filter(e => nodeIds.has(e.from_node_id) && nodeIds.has(e.to_node_id));

    res.json({ nodes, edges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch skill tree' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /aboa/learner/:id/spaced-review — Concepts due for review
// ═══════════════════════════════════════════════════════════════
app.get('/aboa/learner/:id/spaced-review', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const result = await query(
      `SELECT sm.*, kn.display_name, kn.subject, kn.icon
       FROM student_mastery sm
       JOIN knowledge_nodes kn ON kn.id = sm.node_id
       WHERE sm.user_id = $1 AND sm.next_review IS NOT NULL AND sm.next_review <= $2
       ORDER BY sm.next_review ASC`,
      [req.params.id, now]
    );
    res.json({
      due_count: result.rows.length,
      concepts: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch spaced review data' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /aboa/learner/:id/learning-paths — Active quests
// ═══════════════════════════════════════════════════════════════
app.get('/aboa/learner/:id/learning-paths', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM learning_paths WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC',
      [req.params.id, 'active']
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch learning paths' });
  }
});

// ═══════════════════════════════════════════════════════════════
// POST /aboa/learner/:id/generate-path — Auto-generate quest
// ═══════════════════════════════════════════════════════════════
app.post('/aboa/learner/:id/generate-path', async (req, res) => {
  try {
    const userId = req.params.id;
    const { node_id } = req.body;

    if (!node_id) return res.status(400).json({ error: 'node_id required' });

    // Get node info
    const nodeResult = await query('SELECT * FROM knowledge_nodes WHERE id = $1', [node_id]);
    if (nodeResult.rows.length === 0) return res.status(404).json({ error: 'Node not found' });
    const node = nodeResult.rows[0];

    // Get mastery map
    const masteryResult = await query('SELECT node_id, mastery_score FROM student_mastery WHERE user_id = $1', [userId]);
    const masteryMap = {};
    for (const r of masteryResult.rows) masteryMap[r.node_id] = r.mastery_score;

    // Get edges
    const edgesResult = await query('SELECT * FROM knowledge_edges');

    // Find weak prerequisites
    const weakPrereqs = aboa.findWeakPrerequisites(node_id, edgesResult.rows, masteryMap);

    // Get node names
    const allNodesResult = await query('SELECT id, display_name FROM knowledge_nodes');
    const nodeNames = {};
    for (const n of allNodesResult.rows) nodeNames[n.id] = n.display_name;

    // Generate path
    const path = aboa.generateLearningPath(node_id, node.display_name, weakPrereqs, nodeNames);

    // Save to database
    const pathId = uuidv4();
    await query(
      `INSERT INTO learning_paths (id, user_id, title, description, target_nodes, total_stages, xp_reward, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [pathId, userId, path.title, path.description, path.target_nodes, path.total_stages, path.xp_reward, 'active']
    );

    res.status(201).json({ id: pathId, ...path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /aboa/learner/:id/history — Full ABOA log history
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// GET /aboa/knowledge-graph — Full knowledge graph (for admin/debug)
// ═══════════════════════════════════════════════════════════════
app.get('/aboa/knowledge-graph', async (req, res) => {
  try {
    const nodes = await query('SELECT * FROM knowledge_nodes ORDER BY subject, difficulty_tier');
    const edges = await query('SELECT * FROM knowledge_edges');
    res.json({ nodes: nodes.rows, edges: edges.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch knowledge graph' });
  }
});

// ── Helper: ensure student_profile exists ──
async function ensureStudentProfile(userId, engagementScore, latestMastery) {
  try {
    const existing = await query('SELECT * FROM student_profile WHERE user_id = $1', [userId]);
    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO student_profile (user_id, engagement_avg, preferred_difficulty, updated_at)
         VALUES ($1, $2, $3, $4)`,
        [userId, engagementScore || 0.5, 0.5, new Date().toISOString()]
      );
    } else {
      const profile = existing.rows[0];
      const newEngAvg = profile.engagement_avg * 0.9 + (engagementScore || 0.5) * 0.1;
      await query(
        `UPDATE student_profile SET engagement_avg = $1, updated_at = $2 WHERE user_id = $3`,
        [newEngAvg, new Date().toISOString(), userId]
      );
    }
  } catch (err) {
    console.error('Profile update error:', err);
  }
}

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
