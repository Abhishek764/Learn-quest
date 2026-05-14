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
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      difficulty REAL NOT NULL DEFAULT 0.5,
      type TEXT NOT NULL DEFAULT 'mcq',
      content_i18n TEXT NOT NULL DEFAULT '{}',
      options_i18n TEXT NOT NULL DEFAULT '{}',
      correct_option INTEGER NOT NULL DEFAULT 0,
      explanation_i18n TEXT DEFAULT '{}',
      concept_tags TEXT DEFAULT '[]',
      target_mode TEXT DEFAULT '',
      xp_reward INTEGER DEFAULT 10,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration for existing databases
  try {
    await p.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS target_mode TEXT DEFAULT ''`);
  } catch (e) { /* IF NOT EXISTS may be unsupported on older PG; ignore */ }
  try {
    await p.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 10`);
  } catch (e) { /* migration */ }

  await p.query(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      game_mode TEXT NOT NULL,
      subject TEXT,
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT,
      total_questions INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      final_difficulty REAL,
      final_se REAL
    )
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS session_answers (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      user_answer INTEGER,
      is_correct INTEGER DEFAULT 0,
      response_time_sec REAL DEFAULT 0,
      hint_used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await seedQuestions(p);
}

async function seedQuestions(p) {
  const check = await p.query('SELECT COUNT(*) AS c FROM questions');
  const count = parseInt(check.rows[0].c || check.rows[0].count || 0);
  if (count > 0) return;

  const questions = [
    { id: 'q1',  subject: 'math',    difficulty: 0.2, content: 'What is 5 + 3?',                                   options: ['6','7','8','9'],                                        correct: 2, explanation: '5 + 3 = 8', concepts: ['math-arithmetic'] },
    { id: 'q2',  subject: 'math',    difficulty: 0.2, content: 'What is 10 - 4?',                                  options: ['5','6','7','8'],                                        correct: 1, explanation: '10 - 4 = 6', concepts: ['math-arithmetic'] },
    { id: 'q3',  subject: 'math',    difficulty: 0.2, content: 'What is 3 × 4?',                                   options: ['10','11','12','13'],                                    correct: 2, explanation: '3 × 4 = 12', concepts: ['math-arithmetic'] },
    { id: 'q4',  subject: 'math',    difficulty: 0.5, content: 'What is 15% of 200?',                              options: ['20','25','30','35'],                                    correct: 2, explanation: '15/100 × 200 = 30', concepts: ['math-percentages'] },
    { id: 'q5',  subject: 'math',    difficulty: 0.5, content: 'Solve: 2x + 6 = 14. What is x?',                  options: ['3','4','5','6'],                                        correct: 1, explanation: '2x = 8, x = 4', concepts: ['math-linear-eq'] },
    { id: 'q6',  subject: 'math',    difficulty: 0.8, content: 'What is the derivative of x² + 3x?',              options: ['2x','2x+3','x+3','2x+3x'],                             correct: 1, explanation: 'd/dx(x²+3x) = 2x+3', concepts: ['math-calculus-intro'] },
    { id: 'q7',  subject: 'science', difficulty: 0.2, content: 'What planet is closest to the Sun?',              options: ['Venus','Earth','Mercury','Mars'],                       correct: 2, explanation: 'Mercury is the closest planet to the Sun', concepts: ['sci-solar-system'] },
    { id: 'q8',  subject: 'science', difficulty: 0.2, content: 'What gas do plants absorb?',                      options: ['Oxygen','Nitrogen','Carbon Dioxide','Hydrogen'],        correct: 2, explanation: 'Plants absorb CO2 for photosynthesis', concepts: ['sci-photosynthesis'] },
    { id: 'q9',  subject: 'science', difficulty: 0.5, content: 'What is the chemical symbol for water?',          options: ['WA','H2O','HO2','W2O'],                                correct: 1, explanation: 'Water is H2O', concepts: ['sci-elements'] },
    { id: 'q10', subject: 'science', difficulty: 0.5, content: 'How many bones in the adult human body?',         options: ['196','206','216','226'],                                correct: 1, explanation: 'Adult humans have 206 bones', concepts: ['sci-human-body'] },
    { id: 'q11', subject: 'science', difficulty: 0.8, content: 'What is the speed of light in a vacuum?',        options: ['3x10^8 m/s','3x10^6 m/s','3x10^10 m/s','3x10^4 m/s'], correct: 0, explanation: 'Speed of light = 3x10^8 m/s', concepts: ['sci-light-sound'] },
    { id: 'q12', subject: 'science', difficulty: 0.8, content: 'What is the powerhouse of the cell?',            options: ['Nucleus','Ribosome','Mitochondria','Vacuole'],           correct: 2, explanation: 'Mitochondria produce ATP energy', concepts: ['sci-cells'] },
    { id: 'q13', subject: 'english', difficulty: 0.2, content: 'Which word is a noun?',                          options: ['Run','Happy','Dog','Quickly'],                          correct: 2, explanation: '"Dog" is a noun', concepts: ['eng-nouns-pronouns'] },
    { id: 'q14', subject: 'english', difficulty: 0.2, content: 'What is the plural of "child"?',                 options: ['Childs','Childes','Children','Childrens'],              correct: 2, explanation: 'Irregular plural of child is children', concepts: ['eng-nouns-pronouns'] },
    { id: 'q15', subject: 'english', difficulty: 0.5, content: 'Which uses correct punctuation?',                options: ["Its raining","It's raining","Its' raining","It is' raining"], correct: 1, explanation: "It's = it is", concepts: ['eng-punctuation'] },
    { id: 'q16', subject: 'general', difficulty: 0.2, content: 'How many days are in a week?',                   options: ['5','6','7','8'],                                        correct: 2, explanation: 'A week has 7 days', concepts: ['gen-world-geography'] },
    { id: 'q17', subject: 'general', difficulty: 0.2, content: 'What color do you get mixing red and blue?',     options: ['Green','Orange','Purple','Brown'],                      correct: 2, explanation: 'Red + Blue = Purple', concepts: ['gen-nature-animals'] },
    { id: 'q18', subject: 'general', difficulty: 0.5, content: 'What is the capital of France?',                 options: ['London','Berlin','Madrid','Paris'],                     correct: 3, explanation: 'Paris is the capital of France', concepts: ['gen-world-geography'] },
    { id: 'q19', subject: 'general', difficulty: 0.5, content: 'Who wrote "Romeo and Juliet"?',                  options: ['Charles Dickens','William Shakespeare','Mark Twain','Jane Austen'], correct: 1, explanation: 'Shakespeare wrote Romeo and Juliet', concepts: ['gen-arts-literature'] },
    { id: 'q20', subject: 'general', difficulty: 0.8, content: 'In what year did World War II end?',             options: ['1943','1944','1945','1946'],                            correct: 2, explanation: 'WWII ended in 1945', concepts: ['gen-world-history'] },
  ];

  for (const q of questions) {
    await p.query(
      `INSERT INTO questions (id, subject, difficulty, type, content_i18n, options_i18n, correct_option, explanation_i18n, concept_tags)
       VALUES ($1, $2, $3, 'mcq', $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        q.id, q.subject, q.difficulty,
        JSON.stringify({ en: q.content }),
        JSON.stringify({ en: q.options }),
        q.correct,
        JSON.stringify({ en: q.explanation }),
        JSON.stringify(q.concepts || [])
      ]
    );
  }

  // Seed additional questions from expanded bank
  try {
    const extra = require('./seed-questions');
    for (const q of extra) {
      await p.query(
        `INSERT INTO questions (id, subject, difficulty, type, content_i18n, options_i18n, correct_option, explanation_i18n, concept_tags)
         VALUES ($1, $2, $3, 'mcq', $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [q.id, q.subject, q.difficulty,
         JSON.stringify({ en: q.content }), JSON.stringify({ en: q.options }),
         q.correct, JSON.stringify({ en: q.explanation }), JSON.stringify(q.concepts || [])]
      );
    }
  } catch (e) { /* seed-questions.js optional */ }
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
