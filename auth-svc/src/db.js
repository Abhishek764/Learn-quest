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
      password_hash TEXT NOT NULL,
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
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      token TEXT PRIMARY KEY,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
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
