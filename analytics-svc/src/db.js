let db;

function getDb() {
  if (db) return db;

  if (process.env.NODE_ENV === 'test') {
    const Database = require('better-sqlite3');
    db = new Database(':memory:');
    initSqlite(db);
  } else {
    const { Pool } = require('pg');
    db = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  return db;
}

function initSqlite(sqliteDb) {
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS daily_activity (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      sessions_count INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      total_answers INTEGER DEFAULT 0,
      avg_engagement_score REAL DEFAULT 0
    );

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
      created_at TEXT DEFAULT (datetime('now'))
    );

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
    );
  `);
}

async function query(sql, params = []) {
  const d = getDb();

  if (process.env.NODE_ENV === 'test') {
    const converted = sql.replace(/\$\d+/g, '?');
    const upper = sql.trim().toUpperCase();
    if (upper.startsWith('SELECT') || upper.startsWith('WITH')) {
      const stmt = d.prepare(converted);
      const rows = stmt.all(...params);
      return { rows };
    } else {
      const stmt = d.prepare(converted);
      const info = stmt.run(...params);
      return { rows: [], rowCount: info.changes };
    }
  } else {
    return d.query(sql, params);
  }
}

function resetDb() {
  if (process.env.NODE_ENV === 'test' && db) {
    db.close();
    db = null;
  }
}

module.exports = { query, getDb, resetDb };
