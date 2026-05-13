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
    CREATE TABLE IF NOT EXISTS aboa_logs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
