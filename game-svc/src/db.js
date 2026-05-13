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
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      difficulty REAL NOT NULL DEFAULT 0.5,
      type TEXT NOT NULL DEFAULT 'mcq',
      content_i18n TEXT NOT NULL DEFAULT '{}',
      options_i18n TEXT NOT NULL DEFAULT '{}',
      correct_option INTEGER NOT NULL DEFAULT 0,
      explanation_i18n TEXT DEFAULT '{}',
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_mode TEXT NOT NULL,
      subject TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT,
      total_questions INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      final_difficulty REAL,
      final_se REAL
    );

    CREATE TABLE IF NOT EXISTS session_answers (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      user_answer INTEGER,
      is_correct INTEGER DEFAULT 0,
      response_time_sec REAL DEFAULT 0,
      hint_used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  seedQuestions(sqliteDb);
}

function seedQuestions(sqliteDb) {
  const count = sqliteDb.prepare('SELECT COUNT(*) as c FROM questions').get();
  if (count.c > 0) return;

  const questions = [
    // Math - easy (0.2)
    { id: 'q1', subject: 'math', difficulty: 0.2, content: 'What is 5 + 3?', options: ['6','7','8','9'], correct: 2, explanation: '5 + 3 = 8' },
    { id: 'q2', subject: 'math', difficulty: 0.2, content: 'What is 10 - 4?', options: ['5','6','7','8'], correct: 1, explanation: '10 - 4 = 6' },
    { id: 'q3', subject: 'math', difficulty: 0.2, content: 'What is 3 × 4?', options: ['10','11','12','13'], correct: 2, explanation: '3 × 4 = 12' },
    // Math - medium (0.5)
    { id: 'q4', subject: 'math', difficulty: 0.5, content: 'What is 15% of 200?', options: ['20','25','30','35'], correct: 2, explanation: '15/100 × 200 = 30' },
    { id: 'q5', subject: 'math', difficulty: 0.5, content: 'Solve: 2x + 6 = 14. What is x?', options: ['3','4','5','6'], correct: 1, explanation: '2x = 8, x = 4' },
    // Math - hard (0.8)
    { id: 'q6', subject: 'math', difficulty: 0.8, content: 'What is the derivative of x² + 3x?', options: ['2x','2x+3','x+3','2x+3x'], correct: 1, explanation: 'd/dx(x²+3x) = 2x+3' },
    // Science - easy (0.2)
    { id: 'q7', subject: 'science', difficulty: 0.2, content: 'What planet is closest to the Sun?', options: ['Venus','Earth','Mercury','Mars'], correct: 2, explanation: 'Mercury is the closest planet to the Sun' },
    { id: 'q8', subject: 'science', difficulty: 0.2, content: 'What gas do plants absorb?', options: ['Oxygen','Nitrogen','Carbon Dioxide','Hydrogen'], correct: 2, explanation: 'Plants absorb CO₂ for photosynthesis' },
    // Science - medium (0.5)
    { id: 'q9', subject: 'science', difficulty: 0.5, content: 'What is the chemical symbol for water?', options: ['WA','H2O','HO2','W2O'], correct: 1, explanation: 'Water is H₂O — two hydrogen, one oxygen' },
    { id: 'q10', subject: 'science', difficulty: 0.5, content: 'How many bones are in the adult human body?', options: ['196','206','216','226'], correct: 1, explanation: 'Adult humans have 206 bones' },
    // Science - hard (0.8)
    { id: 'q11', subject: 'science', difficulty: 0.8, content: 'What is the speed of light in a vacuum?', options: ['3×10⁸ m/s','3×10⁶ m/s','3×10¹⁰ m/s','3×10⁴ m/s'], correct: 0, explanation: 'Speed of light ≈ 3×10⁸ m/s' },
    { id: 'q12', subject: 'science', difficulty: 0.8, content: 'What is the powerhouse of the cell?', options: ['Nucleus','Ribosome','Mitochondria','Vacuole'], correct: 2, explanation: 'Mitochondria produce ATP energy' },
    // English - easy (0.2)
    { id: 'q13', subject: 'english', difficulty: 0.2, content: 'Which word is a noun?', options: ['Run','Happy','Dog','Quickly'], correct: 2, explanation: '"Dog" is a noun — a person, place, or thing' },
    { id: 'q14', subject: 'english', difficulty: 0.2, content: 'What is the plural of "child"?', options: ['Childs','Childes','Children','Childrens'], correct: 2, explanation: 'The irregular plural of child is children' },
    // English - medium (0.5)
    { id: 'q15', subject: 'english', difficulty: 0.5, content: 'Which sentence uses correct punctuation?', options: ["Its raining","It's raining","Its' raining","It is' raining"], correct: 1, explanation: '"It\'s" is the contraction of "it is"' },
    // General - easy (0.2)
    { id: 'q16', subject: 'general', difficulty: 0.2, content: 'How many days are in a week?', options: ['5','6','7','8'], correct: 2, explanation: 'A week has 7 days' },
    { id: 'q17', subject: 'general', difficulty: 0.2, content: 'What color do you get mixing red and blue?', options: ['Green','Orange','Purple','Brown'], correct: 2, explanation: 'Red + Blue = Purple' },
    // General - medium (0.5)
    { id: 'q18', subject: 'general', difficulty: 0.5, content: 'What is the capital of France?', options: ['London','Berlin','Madrid','Paris'], correct: 3, explanation: 'Paris is the capital of France' },
    { id: 'q19', subject: 'general', difficulty: 0.5, content: 'Who wrote "Romeo and Juliet"?', options: ['Charles Dickens','William Shakespeare','Mark Twain','Jane Austen'], correct: 1, explanation: 'Shakespeare wrote Romeo and Juliet around 1594' },
    // General - hard (0.8)
    { id: 'q20', subject: 'general', difficulty: 0.8, content: 'In what year did World War II end?', options: ['1943','1944','1945','1946'], correct: 2, explanation: 'World War II ended in 1945' },
  ];

  const insert = sqliteDb.prepare(
    `INSERT OR IGNORE INTO questions (id, subject, difficulty, type, content_i18n, options_i18n, correct_option, explanation_i18n)
     VALUES (?, ?, ?, 'mcq', ?, ?, ?, ?)`
  );

  for (const q of questions) {
    insert.run(
      q.id,
      q.subject,
      q.difficulty,
      JSON.stringify({ en: q.content }),
      JSON.stringify({ en: q.options }),
      q.correct,
      JSON.stringify({ en: q.explanation })
    );
  }
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
