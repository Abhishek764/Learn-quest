const USER_SVC_URL = process.env.USER_SVC_URL || 'http://localhost:3002';
const USER_FETCH_TIMEOUT_MS = Number(process.env.USER_FETCH_TIMEOUT_MS) || 3000;

class UserFetchError extends Error {
  constructor(message) { super(message); this.name = 'UserFetchError'; }
}

async function fetchUserProfile(userId, authHeader) {
  if (!userId) throw new UserFetchError('userId required');

  const ctl = new AbortController();
  const to = setTimeout(() => ctl.abort(), USER_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${USER_SVC_URL}/users/${encodeURIComponent(userId)}/profile`, {
      headers: {
        'accept': 'application/json',
        ...(authHeader ? { authorization: authHeader } : {}),
        'x-user-id': userId,
      },
      signal: ctl.signal,
    });
    if (!res.ok) throw new UserFetchError(`user-svc ${res.status}`);
    const data = await res.json();
    return {
      id: data.id,
      xp: Number(data.xp) || 0,
      level: Number(data.level) || 1,
      role: data.role || 'student',
    };
  } catch (err) {
    if (err.name === 'AbortError') throw new UserFetchError('user-svc timeout');
    if (err instanceof UserFetchError) throw err;
    throw new UserFetchError(`user-svc fetch failed: ${err.message}`);
  } finally {
    clearTimeout(to);
  }
}

// Level → difficulty band.
// L1-2 (0-199 xp): easy ;  L3-5 (200-499): medium ;  L6+ (500+): hard
function difficultyForLevel(level, xp) {
  const lv = Number(level) || 1;
  const x = Number(xp) || 0;
  if (lv <= 2 || x < 200) return 'easy';
  if (lv <= 5 || x < 500) return 'medium';
  return 'hard';
}

function nextLevelXp(level) {
  // Mirrors user-svc rule: level = floor(xp/100)+1, so threshold = level*100
  const lv = Number(level) || 1;
  return lv * 100;
}

module.exports = {
  fetchUserProfile,
  difficultyForLevel,
  nextLevelXp,
  UserFetchError,
};
