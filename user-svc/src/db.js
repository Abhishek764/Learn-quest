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
      password_hash TEXT DEFAULT '',
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

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      condition_type TEXT,
      condition_value INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      earned_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      educator_id TEXT NOT NULL,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      subject TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS class_members (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default badges
  const badges = [
    ['badge-first-session', 'First Steps', 'Complete your first game session', '🎯', 'sessions', 1],
    ['badge-ten-sessions', 'On a Roll', 'Complete 10 game sessions', '🔥', 'sessions', 10],
    ['badge-streak-7', 'Week Warrior', '7-day login streak', '📅', 'streak', 7],
    ['badge-xp-100', 'Century Club', 'Earn 100 XP', '💯', 'xp', 100],
    ['badge-xp-500', 'High Achiever', 'Earn 500 XP', '⭐', 'xp', 500],
  ];

  const insertBadge = db.prepare(
    'INSERT OR IGNORE INTO badges (id, name, description, icon, condition_type, condition_value) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const b of badges) insertBadge.run(...b);
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
