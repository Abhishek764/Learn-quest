let pool = null;

async function getPool() {
  if (pool) return pool;

  if (process.env.NODE_ENV === 'test') {
    const { newDb } = require('pg-mem');
    const pgMem = newDb();
    const { Pool } = pgMem.adapters.createPg();
    pool = new Pool();
  } else {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
  }

  await initSchema(pool);
  return pool;
}

async function initSchema(p) {
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'student',
      display_name TEXT,
      avatar_url TEXT,
      lang TEXT DEFAULT 'en',
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak_days INTEGER DEFAULT 0,
      last_active TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      condition_type TEXT,
      condition_value INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      earned_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      educator_id TEXT NOT NULL,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      subject TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS class_members (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default badges
  const badges = [
    ['badge-first-session', 'First Steps', 'Complete your first game session', '🎯', 'sessions', 1],
    ['badge-ten-sessions', 'On a Roll', 'Complete 10 game sessions', '🔥', 'sessions', 10],
    ['badge-streak-7', 'Week Warrior', '7-day login streak', '📅', 'streak', 7],
    ['badge-xp-100', 'Century Club', 'Earn 100 XP', '💯', 'xp', 100],
    ['badge-xp-500', 'High Achiever', 'Earn 500 XP', '⭐', 'xp', 500],
  ];

  for (const b of badges) {
    await p.query(
      `INSERT INTO badges (id, name, description, icon, condition_type, condition_value)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      b
    );
  }
}

async function query(sql, params = []) {
  const p = await getPool();
  return p.query(sql, params);
}

async function resetDb() {
  if (pool) {
    try { await pool.end(); } catch {}
    pool = null;
  }
}

module.exports = { query, resetDb };
