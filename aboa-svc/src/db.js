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

function initSqlite(db) {
  db.exec(`
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
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

async function query(sql, params = []) {
  const d = getDb();

  if (process.env.NODE_ENV === 'test') {
    const converted = sql.replace(/\$\d+/g, '?');
    if (sql.trim().toUpperCase().startsWith('SELECT') ||
        sql.trim().toUpperCase().startsWith('WITH')) {
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
