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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_activity (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      sessions_count INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      total_answers INTEGER DEFAULT 0,
      avg_engagement_score REAL DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS aboa_logs (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      user_id TEXT,
      response_time REAL,
      accuracy REAL,
      session_duration REAL,
      hint_usage REAL,
      engagement_trend REAL,
      engagement_score REAL,
      new_difficulty REAL,
      new_reward REAL,
      guidance_level REAL,
      new_pacing REAL,
      subject TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_mode TEXT,
      subject TEXT,
      started_at TEXT,
      ended_at TEXT,
      total_questions INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      final_difficulty REAL,
      final_se REAL
    )
  `);

  return pool;
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
