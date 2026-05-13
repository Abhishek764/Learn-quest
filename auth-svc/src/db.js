const path = require('path');

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
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS token_blacklist (
      token TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

async function query(sql, params = []) {
  const d = getDb();

  if (process.env.NODE_ENV === 'test') {
    // SQLite sync adapter
    if (sql.trim().toUpperCase().startsWith('SELECT') ||
        sql.trim().toUpperCase().startsWith('WITH')) {
      const stmt = d.prepare(convertToSqlite(sql));
      const rows = stmt.all(...params);
      return { rows };
    } else {
      const stmt = d.prepare(convertToSqlite(sql));
      const info = stmt.run(...params);
      return { rows: [], rowCount: info.changes };
    }
  } else {
    return d.query(sql, params);
  }
}

function convertToSqlite(sql) {
  // Convert $1, $2 placeholders to ?
  return sql.replace(/\$\d+/g, '?');
}

function resetDb() {
  if (process.env.NODE_ENV === 'test' && db) {
    db.close();
    db = null;
  }
}

module.exports = { query, getDb, resetDb };
