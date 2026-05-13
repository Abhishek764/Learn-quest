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
  // Original ABOA logs table
  await p.query(`
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

  // Knowledge Graph: subjects → topics → concepts
  await p.query(`
    CREATE TABLE IF NOT EXISTS knowledge_nodes (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      concept TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      difficulty_tier REAL DEFAULT 0.5,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      icon TEXT DEFAULT '📘',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Prerequisite edges
  await p.query(`
    CREATE TABLE IF NOT EXISTS knowledge_edges (
      id TEXT PRIMARY KEY,
      from_node_id TEXT NOT NULL,
      to_node_id TEXT NOT NULL,
      weight REAL DEFAULT 1.0
    )
  `);

  // Per-concept mastery tracking per student
  await p.query(`
    CREATE TABLE IF NOT EXISTS student_mastery (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      mastery_score REAL DEFAULT 0,
      confidence REAL DEFAULT 0.5,
      attempts INTEGER DEFAULT 0,
      correct INTEGER DEFAULT 0,
      avg_response_time REAL DEFAULT 0,
      last_seen TEXT,
      next_review TEXT,
      ease_factor REAL DEFAULT 2.5,
      interval_days REAL DEFAULT 1,
      streak INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Global student profile for AI context
  await p.query(`
    CREATE TABLE IF NOT EXISTS student_profile (
      user_id TEXT PRIMARY KEY,
      learning_velocity REAL DEFAULT 0.5,
      retention_score REAL DEFAULT 0.5,
      engagement_avg REAL DEFAULT 0.5,
      consistency_score REAL DEFAULT 0.5,
      preferred_difficulty REAL DEFAULT 0.5,
      preferred_pace TEXT DEFAULT 'normal',
      total_time_spent REAL DEFAULT 0,
      risk_level TEXT DEFAULT 'low',
      strengths TEXT DEFAULT '[]',
      weaknesses TEXT DEFAULT '[]',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Question → concept mapping
  await p.query(`
    CREATE TABLE IF NOT EXISTS question_concepts (
      question_id TEXT NOT NULL,
      node_id TEXT NOT NULL
    )
  `);

  // Personalized learning paths (quests)
  await p.query(`
    CREATE TABLE IF NOT EXISTS learning_paths (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_nodes TEXT NOT NULL,
      current_stage INTEGER DEFAULT 0,
      total_stages INTEGER DEFAULT 5,
      xp_reward INTEGER DEFAULT 100,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed knowledge graph
  await seedKnowledgeGraph(p);
}

async function seedKnowledgeGraph(p) {
  const check = await p.query('SELECT COUNT(*) AS c FROM knowledge_nodes');
  const count = parseInt(check.rows[0].c || check.rows[0].count || 0);
  if (count > 0) return;

  // ── MATH KNOWLEDGE GRAPH ──
  const mathNodes = [
    { id: 'math-arithmetic',       subject: 'math', topic: 'fundamentals',  concept: 'basic_arithmetic',      display_name: 'Basic Arithmetic',       difficulty_tier: 0.15, px: 0, py: 0, icon: '➕' },
    { id: 'math-variables',        subject: 'math', topic: 'algebra',       concept: 'variables',             display_name: 'Variables',              difficulty_tier: 0.25, px: -1, py: 1, icon: '🔤' },
    { id: 'math-fractions',        subject: 'math', topic: 'numbers',       concept: 'fractions',             display_name: 'Fractions',              difficulty_tier: 0.25, px: 1, py: 1, icon: '🔢' },
    { id: 'math-decimals',         subject: 'math', topic: 'numbers',       concept: 'decimals',              display_name: 'Decimals',               difficulty_tier: 0.3,  px: 2, py: 1.5, icon: '🔣' },
    { id: 'math-linear-eq',       subject: 'math', topic: 'algebra',       concept: 'linear_equations',      display_name: 'Linear Equations',       difficulty_tier: 0.45, px: -2, py: 2, icon: '📐' },
    { id: 'math-inequalities',    subject: 'math', topic: 'algebra',       concept: 'inequalities',          display_name: 'Inequalities',           difficulty_tier: 0.5,  px: -1, py: 2.5, icon: '⚖️' },
    { id: 'math-percentages',     subject: 'math', topic: 'numbers',       concept: 'percentages',           display_name: 'Percentages',            difficulty_tier: 0.4,  px: 1, py: 2, icon: '💯' },
    { id: 'math-ratios',          subject: 'math', topic: 'numbers',       concept: 'ratios',                display_name: 'Ratios & Proportions',   difficulty_tier: 0.5,  px: 2, py: 2.5, icon: '⚡' },
    { id: 'math-geometry-basics', subject: 'math', topic: 'geometry',      concept: 'geometry_basics',       display_name: 'Geometry Basics',        difficulty_tier: 0.3,  px: 3, py: 1, icon: '📏' },
    { id: 'math-area-perimeter',  subject: 'math', topic: 'geometry',      concept: 'area_perimeter',        display_name: 'Area & Perimeter',       difficulty_tier: 0.45, px: 3, py: 2, icon: '⬜' },
    { id: 'math-angles',          subject: 'math', topic: 'geometry',      concept: 'angles',                display_name: 'Angles',                 difficulty_tier: 0.45, px: 4, py: 2, icon: '📐' },
    { id: 'math-quadratic',       subject: 'math', topic: 'algebra',       concept: 'quadratic_equations',   display_name: 'Quadratic Equations',    difficulty_tier: 0.7,  px: -2, py: 3, icon: '📈' },
    { id: 'math-exponents',       subject: 'math', topic: 'algebra',       concept: 'exponents',             display_name: 'Exponents & Powers',     difficulty_tier: 0.5,  px: 0, py: 3, icon: '🔋' },
    { id: 'math-polynomials',     subject: 'math', topic: 'algebra',       concept: 'polynomials',           display_name: 'Polynomials',            difficulty_tier: 0.65, px: -1, py: 3.5, icon: '🧮' },
    { id: 'math-calculus-intro',  subject: 'math', topic: 'calculus',      concept: 'derivatives_intro',     display_name: 'Intro to Derivatives',   difficulty_tier: 0.8,  px: 0, py: 4, icon: '∫' },
  ];

  // ── SCIENCE KNOWLEDGE GRAPH ──
  const scienceNodes = [
    { id: 'sci-scientific-method', subject: 'science', topic: 'foundations',  concept: 'scientific_method',    display_name: 'Scientific Method',       difficulty_tier: 0.15, px: 0, py: 0, icon: '🔬' },
    { id: 'sci-matter',           subject: 'science', topic: 'chemistry',    concept: 'states_of_matter',     display_name: 'States of Matter',        difficulty_tier: 0.2,  px: -1, py: 1, icon: '🧊' },
    { id: 'sci-cells',            subject: 'science', topic: 'biology',      concept: 'cell_biology',         display_name: 'Cell Biology',            difficulty_tier: 0.3,  px: 1, py: 1, icon: '🦠' },
    { id: 'sci-solar-system',     subject: 'science', topic: 'astronomy',    concept: 'solar_system',         display_name: 'Solar System',            difficulty_tier: 0.2,  px: 2, py: 0.5, icon: '🪐' },
    { id: 'sci-elements',         subject: 'science', topic: 'chemistry',    concept: 'elements_compounds',   display_name: 'Elements & Compounds',    difficulty_tier: 0.4,  px: -2, py: 2, icon: '⚗️' },
    { id: 'sci-photosynthesis',   subject: 'science', topic: 'biology',      concept: 'photosynthesis',       display_name: 'Photosynthesis',          difficulty_tier: 0.4,  px: 1, py: 2, icon: '🌿' },
    { id: 'sci-human-body',       subject: 'science', topic: 'biology',      concept: 'human_body_systems',   display_name: 'Human Body Systems',      difficulty_tier: 0.45, px: 2, py: 2, icon: '🫀' },
    { id: 'sci-forces',           subject: 'science', topic: 'physics',      concept: 'forces_motion',        display_name: 'Forces & Motion',         difficulty_tier: 0.5,  px: -1, py: 2.5, icon: '🏎️' },
    { id: 'sci-energy',           subject: 'science', topic: 'physics',      concept: 'energy_types',         display_name: 'Types of Energy',         difficulty_tier: 0.45, px: 0, py: 2, icon: '⚡' },
    { id: 'sci-genetics',         subject: 'science', topic: 'biology',      concept: 'genetics_basics',      display_name: 'Genetics Basics',         difficulty_tier: 0.6,  px: 1, py: 3, icon: '🧬' },
    { id: 'sci-chemical-react',   subject: 'science', topic: 'chemistry',    concept: 'chemical_reactions',   display_name: 'Chemical Reactions',      difficulty_tier: 0.55, px: -2, py: 3, icon: '💥' },
    { id: 'sci-light-sound',      subject: 'science', topic: 'physics',      concept: 'light_and_sound',      display_name: 'Light & Sound',           difficulty_tier: 0.5,  px: -1, py: 3, icon: '💡' },
    { id: 'sci-electricity',      subject: 'science', topic: 'physics',      concept: 'electricity',          display_name: 'Electricity',             difficulty_tier: 0.55, px: 0, py: 3.5, icon: '🔌' },
  ];

  // ── ENGLISH KNOWLEDGE GRAPH ──
  const englishNodes = [
    { id: 'eng-parts-of-speech', subject: 'english', topic: 'grammar',      concept: 'parts_of_speech',      display_name: 'Parts of Speech',         difficulty_tier: 0.15, px: 0, py: 0, icon: '📝' },
    { id: 'eng-nouns-pronouns',  subject: 'english', topic: 'grammar',      concept: 'nouns_pronouns',       display_name: 'Nouns & Pronouns',        difficulty_tier: 0.2,  px: -1, py: 1, icon: '👤' },
    { id: 'eng-verbs-tenses',   subject: 'english', topic: 'grammar',      concept: 'verbs_tenses',         display_name: 'Verbs & Tenses',          difficulty_tier: 0.3,  px: 1, py: 1, icon: '🏃' },
    { id: 'eng-punctuation',    subject: 'english', topic: 'writing',      concept: 'punctuation',          display_name: 'Punctuation',             difficulty_tier: 0.25, px: 2, py: 0.5, icon: '❗' },
    { id: 'eng-vocabulary',     subject: 'english', topic: 'vocabulary',   concept: 'vocabulary_building',  display_name: 'Vocabulary Building',     difficulty_tier: 0.3,  px: -2, py: 1.5, icon: '📚' },
    { id: 'eng-sentence-struct', subject: 'english', topic: 'grammar',     concept: 'sentence_structure',   display_name: 'Sentence Structure',      difficulty_tier: 0.4,  px: 0, py: 2, icon: '📋' },
    { id: 'eng-comprehension',  subject: 'english', topic: 'reading',      concept: 'reading_comprehension', display_name: 'Reading Comprehension',  difficulty_tier: 0.5,  px: 1, py: 2.5, icon: '📖' },
    { id: 'eng-spelling',       subject: 'english', topic: 'writing',      concept: 'spelling_patterns',    display_name: 'Spelling Patterns',       difficulty_tier: 0.35, px: -1, py: 2, icon: '✏️' },
    { id: 'eng-synonyms-ant',   subject: 'english', topic: 'vocabulary',   concept: 'synonyms_antonyms',    display_name: 'Synonyms & Antonyms',     difficulty_tier: 0.35, px: -2, py: 2.5, icon: '🔄' },
    { id: 'eng-idioms',         subject: 'english', topic: 'vocabulary',   concept: 'idioms_phrases',       display_name: 'Idioms & Phrases',        difficulty_tier: 0.55, px: -1, py: 3, icon: '💬' },
  ];

  // ── GENERAL KNOWLEDGE GRAPH ──
  const generalNodes = [
    { id: 'gen-world-geography',  subject: 'general', topic: 'geography',    concept: 'world_geography',      display_name: 'World Geography',         difficulty_tier: 0.2,  px: 0, py: 0, icon: '🌍' },
    { id: 'gen-world-history',    subject: 'general', topic: 'history',      concept: 'world_history',        display_name: 'World History',           difficulty_tier: 0.3,  px: 1, py: 1, icon: '📜' },
    { id: 'gen-famous-people',    subject: 'general', topic: 'culture',      concept: 'famous_people',        display_name: 'Famous People',           difficulty_tier: 0.25, px: -1, py: 1, icon: '👑' },
    { id: 'gen-nature-animals',   subject: 'general', topic: 'nature',       concept: 'nature_animals',       display_name: 'Nature & Animals',        difficulty_tier: 0.2,  px: 2, py: 0.5, icon: '🐾' },
    { id: 'gen-arts-literature',  subject: 'general', topic: 'culture',      concept: 'arts_literature',      display_name: 'Arts & Literature',       difficulty_tier: 0.4,  px: 0, py: 2, icon: '🎨' },
    { id: 'gen-sports',           subject: 'general', topic: 'sports',       concept: 'sports_knowledge',     display_name: 'Sports',                  difficulty_tier: 0.25, px: -2, py: 1.5, icon: '⚽' },
    { id: 'gen-technology',       subject: 'general', topic: 'technology',   concept: 'technology_basics',    display_name: 'Technology & Computing',   difficulty_tier: 0.35, px: 1, py: 2, icon: '💻' },
    { id: 'gen-current-affairs',  subject: 'general', topic: 'current',      concept: 'current_affairs',      display_name: 'Current Affairs',         difficulty_tier: 0.5,  px: -1, py: 2.5, icon: '📰' },
  ];

  const allNodes = [...mathNodes, ...scienceNodes, ...englishNodes, ...generalNodes];

  for (const n of allNodes) {
    await p.query(
      `INSERT INTO knowledge_nodes (id, subject, topic, concept, display_name, difficulty_tier, position_x, position_y, icon)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [n.id, n.subject, n.topic, n.concept, n.display_name, n.difficulty_tier, n.px, n.py, n.icon]
    );
  }

  // ── EDGES (Prerequisites) ──
  const edges = [
    // Math
    { from: 'math-arithmetic',       to: 'math-variables' },
    { from: 'math-arithmetic',       to: 'math-fractions' },
    { from: 'math-arithmetic',       to: 'math-decimals' },
    { from: 'math-arithmetic',       to: 'math-geometry-basics' },
    { from: 'math-variables',        to: 'math-linear-eq' },
    { from: 'math-variables',        to: 'math-inequalities' },
    { from: 'math-variables',        to: 'math-exponents' },
    { from: 'math-fractions',        to: 'math-percentages' },
    { from: 'math-fractions',        to: 'math-decimals' },
    { from: 'math-percentages',      to: 'math-ratios' },
    { from: 'math-geometry-basics',  to: 'math-area-perimeter' },
    { from: 'math-geometry-basics',  to: 'math-angles' },
    { from: 'math-linear-eq',       to: 'math-quadratic' },
    { from: 'math-linear-eq',       to: 'math-polynomials' },
    { from: 'math-exponents',       to: 'math-polynomials' },
    { from: 'math-quadratic',       to: 'math-calculus-intro' },
    { from: 'math-polynomials',      to: 'math-calculus-intro' },
    // Science
    { from: 'sci-scientific-method', to: 'sci-matter' },
    { from: 'sci-scientific-method', to: 'sci-cells' },
    { from: 'sci-scientific-method', to: 'sci-solar-system' },
    { from: 'sci-scientific-method', to: 'sci-energy' },
    { from: 'sci-matter',           to: 'sci-elements' },
    { from: 'sci-matter',           to: 'sci-forces' },
    { from: 'sci-cells',            to: 'sci-photosynthesis' },
    { from: 'sci-cells',            to: 'sci-human-body' },
    { from: 'sci-cells',            to: 'sci-genetics' },
    { from: 'sci-elements',         to: 'sci-chemical-react' },
    { from: 'sci-energy',           to: 'sci-light-sound' },
    { from: 'sci-energy',           to: 'sci-electricity' },
    { from: 'sci-forces',           to: 'sci-light-sound' },
    // English
    { from: 'eng-parts-of-speech',  to: 'eng-nouns-pronouns' },
    { from: 'eng-parts-of-speech',  to: 'eng-verbs-tenses' },
    { from: 'eng-parts-of-speech',  to: 'eng-punctuation' },
    { from: 'eng-parts-of-speech',  to: 'eng-vocabulary' },
    { from: 'eng-nouns-pronouns',   to: 'eng-sentence-struct' },
    { from: 'eng-verbs-tenses',     to: 'eng-sentence-struct' },
    { from: 'eng-sentence-struct',  to: 'eng-comprehension' },
    { from: 'eng-vocabulary',       to: 'eng-synonyms-ant' },
    { from: 'eng-vocabulary',       to: 'eng-spelling' },
    { from: 'eng-synonyms-ant',     to: 'eng-idioms' },
    // General (lighter prerequisites)
    { from: 'gen-world-geography',  to: 'gen-world-history' },
    { from: 'gen-world-geography',  to: 'gen-nature-animals' },
    { from: 'gen-famous-people',    to: 'gen-arts-literature' },
    { from: 'gen-world-history',    to: 'gen-current-affairs' },
  ];

  let edgeIdx = 0;
  for (const e of edges) {
    await p.query(
      `INSERT INTO knowledge_edges (id, from_node_id, to_node_id, weight)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [`edge-${edgeIdx++}`, e.from, e.to, e.weight || 1.0]
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
