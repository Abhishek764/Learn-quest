// ═══════════════════════════════════════════════════════════════════
// ABOA — Adaptive Behavioral Optimization Algorithm
// The intelligent brain of LearnQuest
// ═══════════════════════════════════════════════════════════════════

// ── Module 1: Normalization Constants ──
const MU_RT = 10;
const DUR_MAX = 60;
const H_OPT = 0.3;
const TREND_MIN = -1;
const TREND_MAX = 1;
const WEIGHTS = [0.2, 0.2, 0.2, 0.2, 0.2];
const BASE_REWARD = 10;
const BASE_PACING = 1.0;

// ── Module 1: Engagement Scoring ──
function normalizeRt(rt)     { return Math.exp(-rt / MU_RT); }
function normalizeAcc(acc)   { return acc; }
function normalizeDur(dur)   { return Math.log(1 + dur) / Math.log(1 + DUR_MAX); }
function normalizeHint(hint) { return 1 - Math.abs(hint - H_OPT); }
function normalizeTrend(trend) { return (trend - TREND_MIN) / (TREND_MAX - TREND_MIN); }

function computeEngagementScore(rt, acc, dur, hint, trend) {
  const R = normalizeRt(rt);
  const A = normalizeAcc(acc);
  const P = normalizeDur(dur);
  const H = normalizeHint(hint);
  const T = normalizeTrend(trend);
  const Se = WEIGHTS[0]*R + WEIGHTS[1]*A + WEIGHTS[2]*P + WEIGHTS[3]*H + WEIGHTS[4]*T;
  return Math.max(0, Math.min(1, Se));
}

// ── Module 2: Dynamic Difficulty Adjustment ──
function adjustDifficulty(currentDifficulty, accuracy, responseTime, mastery) {
  let delta = 0;

  // Accuracy-based
  if (accuracy > 0.75) delta += 0.10;
  else if (accuracy < 0.45) delta -= 0.10;

  // Speed-based micro-adjustment
  if (responseTime !== undefined) {
    if (responseTime < 5 && accuracy > 0.7) delta += 0.05;
    if (responseTime > 25) delta -= 0.05;
  }

  // Mastery-based
  if (mastery !== undefined) {
    if (mastery > 0.8) delta += 0.05;
    if (mastery < 0.3) delta -= 0.05;
  }

  const newDifficulty = currentDifficulty + delta;
  return Math.max(0.1, Math.min(1.0, newDifficulty));
}

// ── Module 3: Reward & Guidance (preserved) ──
function computeReward(Se) {
  return BASE_REWARD * (1 + 0.5 * (1 - Se));
}

function computeGuidance(acc, hintUsage) {
  return 0.6 * (1 - acc) + 0.4 * hintUsage;
}

function computePacing(sessionDuration) {
  const deltaDur = sessionDuration / DUR_MAX;
  return BASE_PACING * (1 - 0.1 * deltaDur);
}

// ── Module 4: Bayesian Mastery Update ──
function updateMastery(current, isCorrect, difficulty, responseTime) {
  const learningRate = 0.15;

  // Weight outcome by difficulty
  const diffWeight = isCorrect ? difficulty : (1 - difficulty);
  const outcome = isCorrect ? (0.7 + 0.3 * diffWeight) : (0.3 * diffWeight);

  // Bayesian update
  let newMastery = current.mastery_score * (1 - learningRate) + outcome * learningRate;

  // Speed bonus for fast correct
  if (isCorrect && responseTime < 8) newMastery += 0.02;

  // Confidence increases with data
  const newConfidence = Math.min(1.0, current.confidence + 0.03);

  const newAttempts = current.attempts + 1;
  const newCorrect = current.correct + (isCorrect ? 1 : 0);
  const newAvgRt = (current.avg_response_time * current.attempts + responseTime) / newAttempts;

  return {
    mastery_score: Math.max(0, Math.min(1, newMastery)),
    confidence: newConfidence,
    attempts: newAttempts,
    correct: newCorrect,
    avg_response_time: Math.round(newAvgRt * 100) / 100,
    streak: isCorrect ? current.streak + 1 : 0
  };
}

// ── Module 5: SM-2 Spaced Repetition ──
function deriveQuality(isCorrect, responseTimeSec, hintUsed) {
  if (!isCorrect) return hintUsed ? 0 : 1;
  if (hintUsed) return 3;
  if (responseTimeSec < 5) return 5;
  if (responseTimeSec < 15) return 4;
  return 3;
}

function updateSpacedRepetition(mastery, quality) {
  let ef = mastery.ease_factor || 2.5;
  let interval = mastery.interval_days || 1;
  const streak = mastery.streak || 0;

  if (quality >= 3) {
    if (streak <= 1) interval = 1;
    else if (streak === 2) interval = 6;
    else interval = interval * ef;

    ef = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  } else {
    interval = 1;
    ef = Math.max(1.3, ef - 0.2);
  }

  // Calculate next review date
  const now = new Date();
  const next = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    ease_factor: Math.round(ef * 100) / 100,
    interval_days: Math.round(interval * 100) / 100,
    next_review: next.toISOString(),
    last_seen: now.toISOString()
  };
}

// ── Module 6: Question Recommendation Scoring ──
const REC_WEIGHTS = {
  mastery_gap: 0.25,
  spaced_rep_urgency: 0.25,
  difficulty_match: 0.20,
  prerequisite_relevance: 0.15,
  novelty: 0.10,
  engagement_pred: 0.05
};

function scoreMasteryGap(conceptMastery) {
  return 1 - (conceptMastery || 0);
}

function scoreSpacedRepUrgency(nextReview) {
  if (!nextReview) return 0.5; // never reviewed = moderate urgency
  const now = new Date();
  const review = new Date(nextReview);
  const daysUntil = (review - now) / (1000 * 60 * 60 * 24);
  if (daysUntil < 0) return 1.0;    // overdue
  if (daysUntil < 1) return 0.8;    // due today
  if (daysUntil < 3) return 0.3;    // upcoming
  return 0.0;                        // not due
}

function scoreDifficultyMatch(questionDiff, studentPreferredDiff) {
  return 1 - Math.abs(questionDiff - (studentPreferredDiff || 0.5));
}

function scoreNovelty(questionId, answeredIds, recentSessionIds) {
  if (answeredIds.includes(questionId)) return 0.0;   // answered in this session
  if (recentSessionIds.includes(questionId)) return 0.3; // recent sessions
  return 1.0;
}

function scoreEngagementPred(questionSubject, preferredSubject) {
  if (questionSubject === preferredSubject) return 1.0;
  return 0.5;
}

function scoreQuestion(question, context) {
  const { masteryMap, spacedRepMap, studentProfile, answeredIds, recentQuestionIds, weakPrereqNodeIds } = context;

  // Get concept for this question
  const conceptId = question.concept_node_id || null;
  const conceptMastery = conceptId ? (masteryMap[conceptId] || 0) : 0.5;
  const nextReview = conceptId ? (spacedRepMap[conceptId] || null) : null;

  const mg = scoreMasteryGap(conceptMastery);
  const sr = scoreSpacedRepUrgency(nextReview);
  const dm = scoreDifficultyMatch(question.difficulty, studentProfile.preferred_difficulty);
  const novelty = scoreNovelty(question.id, answeredIds, recentQuestionIds);
  const ep = scoreEngagementPred(question.subject, studentProfile.most_played_subject);

  // Prerequisite relevance
  let pr = 0;
  if (conceptId && weakPrereqNodeIds && weakPrereqNodeIds.includes(conceptId)) {
    pr = 1.0;
  }

  const score = REC_WEIGHTS.mastery_gap * mg
    + REC_WEIGHTS.spaced_rep_urgency * sr
    + REC_WEIGHTS.difficulty_match * dm
    + REC_WEIGHTS.prerequisite_relevance * pr
    + REC_WEIGHTS.novelty * novelty
    + REC_WEIGHTS.engagement_pred * ep;

  return {
    question_id: question.id,
    score: Math.round(score * 1000) / 1000,
    reason: sr >= 0.8 ? 'spaced_repetition_due'
      : pr >= 0.8 ? 'prerequisite_reinforcement'
      : mg >= 0.7 ? 'mastery_gap'
      : 'optimal_challenge'
  };
}

// ── Module 7: Prerequisite Detection ──
function findWeakPrerequisites(failedNodeId, edges, masteryMap, visited = new Set()) {
  if (visited.has(failedNodeId)) return [];
  visited.add(failedNodeId);

  const prerequisites = edges
    .filter(e => e.to_node_id === failedNodeId)
    .map(e => e.from_node_id);

  const weakPrereqs = [];
  for (const prereqId of prerequisites) {
    const mastery = masteryMap[prereqId] || 0;
    if (mastery < 0.5) {
      weakPrereqs.push(prereqId);
      // Recurse deeper
      weakPrereqs.push(...findWeakPrerequisites(prereqId, edges, masteryMap, visited));
    }
  }

  return [...new Set(weakPrereqs)];
}

// ── Module 8: Learning Path Generator ──
function generateLearningPath(weakNodeId, nodeName, weakPrereqs, nodeNames) {
  const stages = [];

  for (const prereqId of weakPrereqs) {
    stages.push({
      concept: prereqId,
      name: nodeNames[prereqId] || prereqId,
      questions: 5,
      type: 'reinforcement'
    });
  }

  stages.push({
    concept: weakNodeId,
    name: nodeName,
    questions: 10,
    type: 'boss_battle'
  });

  return {
    title: `${nodeName} Master Quest`,
    description: `Master ${nodeName} through ${stages.length} stages of progressive challenges`,
    target_nodes: JSON.stringify([weakNodeId, ...weakPrereqs]),
    total_stages: stages.length,
    xp_reward: stages.length * 40,
    stages
  };
}

// ── Module 9: Risk Assessment ──
function calculateRiskLevel(profile, daysSinceLastActivity, accuracyTrend, engagementTrend) {
  let riskScore = 0;

  if (daysSinceLastActivity > 3) riskScore += 0.3;
  if (daysSinceLastActivity > 7) riskScore += 0.3;
  if (accuracyTrend < -0.1) riskScore += 0.2;
  if (engagementTrend < -0.15) riskScore += 0.2;
  if ((profile.consistency_score || 0.5) < 0.3) riskScore += 0.1;

  if (riskScore >= 0.7) return 'critical';
  if (riskScore >= 0.5) return 'high';
  if (riskScore >= 0.3) return 'medium';
  return 'low';
}

// ── Main Compute Function (backward compatible) ──
function compute(params) {
  const { response_time, accuracy, session_duration, hint_usage, engagement_trend, current_difficulty } = params;

  const engagement_score = computeEngagementScore(
    response_time, accuracy, session_duration, hint_usage, engagement_trend
  );
  const new_difficulty = adjustDifficulty(current_difficulty, accuracy, response_time);
  const new_reward = computeReward(engagement_score);
  const guidance_level = computeGuidance(accuracy, hint_usage);
  const new_pacing = computePacing(session_duration);

  return { engagement_score, new_difficulty, new_reward, guidance_level, new_pacing };
}

module.exports = {
  // Backward compatible
  compute,
  normalizeRt, normalizeAcc, normalizeDur, normalizeHint, normalizeTrend,
  computeEngagementScore, adjustDifficulty, computeReward, computeGuidance, computePacing,
  // New AI modules
  updateMastery,
  deriveQuality,
  updateSpacedRepetition,
  scoreQuestion,
  findWeakPrerequisites,
  generateLearningPath,
  calculateRiskLevel,
  scoreMasteryGap,
  scoreSpacedRepUrgency,
  scoreDifficultyMatch,
  scoreNovelty,
  scoreEngagementPred,
  REC_WEIGHTS
};
