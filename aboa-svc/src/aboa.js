// ABOA Algorithm Implementation

const MU_RT = 10;       // baseline response time seconds
const DUR_MAX = 60;     // max session duration
const H_OPT = 0.3;      // optimal hint usage
const TREND_MIN = -1;
const TREND_MAX = 1;
const WEIGHTS = [0.2, 0.2, 0.2, 0.2, 0.2]; // w1..w5
const BASE_REWARD = 10;
const BASE_PACING = 1.0;

// Step 2: Normalization functions
function normalizeRt(rt) {
  return Math.exp(-rt / MU_RT);
}

function normalizeAcc(acc) {
  return acc;
}

function normalizeDur(dur) {
  return Math.log(1 + dur) / Math.log(1 + DUR_MAX);
}

function normalizeHint(hint) {
  return 1 - Math.abs(hint - H_OPT);
}

function normalizeTrend(trend) {
  return (trend - TREND_MIN) / (TREND_MAX - TREND_MIN);
}

// Step 3: Engagement Score
function computeEngagementScore(rt, acc, dur, hint, trend) {
  const R = normalizeRt(rt);
  const A = normalizeAcc(acc);
  const P = normalizeDur(dur);
  const H = normalizeHint(hint);
  const T = normalizeTrend(trend);

  const Se = WEIGHTS[0] * R + WEIGHTS[1] * A + WEIGHTS[2] * P + WEIGHTS[3] * H + WEIGHTS[4] * T;
  return Math.max(0, Math.min(1, Se));
}

// Step 4: Difficulty Adjustment
function adjustDifficulty(currentDifficulty, acc) {
  let newDifficulty = currentDifficulty;
  if (acc > 0.75) {
    newDifficulty = currentDifficulty + 0.1;
  } else if (acc < 0.45) {
    newDifficulty = currentDifficulty - 0.1;
  }
  return Math.max(0.1, Math.min(1.0, newDifficulty));
}

// Step 5: Reward Adaptation
function computeReward(Se) {
  return BASE_REWARD * (1 + 0.5 * (1 - Se));
}

// Step 6: Guidance Optimization
function computeGuidance(acc, hintUsage) {
  return 0.6 * (1 - acc) + 0.4 * hintUsage;
}

// Step 7: Pacing Control
function computePacing(sessionDuration) {
  const deltaDur = sessionDuration / DUR_MAX;
  return BASE_PACING * (1 - 0.1 * deltaDur);
}

function compute(params) {
  const {
    response_time,
    accuracy,
    session_duration,
    hint_usage,
    engagement_trend,
    current_difficulty
  } = params;

  const engagement_score = computeEngagementScore(
    response_time, accuracy, session_duration, hint_usage, engagement_trend
  );
  const new_difficulty = adjustDifficulty(current_difficulty, accuracy);
  const new_reward = computeReward(engagement_score);
  const guidance_level = computeGuidance(accuracy, hint_usage);
  const new_pacing = computePacing(session_duration);

  return {
    engagement_score,
    new_difficulty,
    new_reward,
    guidance_level,
    new_pacing
  };
}

module.exports = {
  compute,
  normalizeRt,
  normalizeAcc,
  normalizeDur,
  normalizeHint,
  normalizeTrend,
  computeEngagementScore,
  adjustDifficulty,
  computeReward,
  computeGuidance,
  computePacing
};
