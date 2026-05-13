# LearnQuest — Database Design

> **Last Updated:** 2026-05-14  |  **Owner:** Architecture  |  **Status:** Living Document

---

## Database: PostgreSQL (Neon.tech Serverless)

Single shared database with per-service table ownership. Each service is the sole writer to its tables.

---

## Schema Overview

### auth-svc Tables

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',    -- 'student' | 'educator'
  display_name TEXT,
  avatar_url TEXT,
  lang TEXT DEFAULT 'en',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_active TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE token_blacklist (
  token TEXT PRIMARY KEY,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### user-svc Tables

```sql
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,                               -- emoji or icon key
  condition_type TEXT,                     -- 'xp' | 'streak' | 'sessions' | 'mastery'
  condition_value INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  educator_id TEXT NOT NULL,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,        -- 6-char alphanumeric
  subject TEXT,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE class_members (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### game-svc Tables

```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  difficulty REAL NOT NULL DEFAULT 0.5,
  type TEXT NOT NULL DEFAULT 'mcq',
  content_i18n TEXT NOT NULL DEFAULT '{}',    -- JSON: {"en": "What is 5+3?"}
  options_i18n TEXT NOT NULL DEFAULT '{}',    -- JSON: {"en": ["6","7","8","9"]}
  correct_option INTEGER NOT NULL DEFAULT 0,
  explanation_i18n TEXT DEFAULT '{}',
  concept_tags TEXT DEFAULT '[]',             -- JSON array of knowledge_node IDs
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_sessions (
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
  final_se REAL                               -- final engagement score
);

CREATE TABLE session_answers (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  user_answer INTEGER,
  is_correct INTEGER DEFAULT 0,
  response_time_sec REAL DEFAULT 0,
  hint_used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### aboa-svc Tables

```sql
CREATE TABLE aboa_logs (
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
);

CREATE TABLE knowledge_nodes (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  concept TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  difficulty_tier REAL DEFAULT 0.5,
  position_x REAL DEFAULT 0,              -- skill tree UI positioning
  position_y REAL DEFAULT 0,
  icon TEXT DEFAULT '📘',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_edges (
  id TEXT PRIMARY KEY,
  from_node_id TEXT NOT NULL,              -- prerequisite concept
  to_node_id TEXT NOT NULL,                -- dependent concept
  weight REAL DEFAULT 1.0
);

CREATE TABLE student_mastery (
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
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, node_id)
);

CREATE TABLE student_profile (
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
);

CREATE TABLE question_concepts (
  question_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  PRIMARY KEY (question_id, node_id)
);

CREATE TABLE learning_paths (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_nodes TEXT NOT NULL,              -- JSON array of node IDs
  current_stage INTEGER DEFAULT 0,
  total_stages INTEGER DEFAULT 5,
  xp_reward INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### analytics-svc Tables

```sql
CREATE TABLE daily_activity (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  sessions_count INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  avg_engagement_score REAL DEFAULT 0
);
```

---

## Key Design Decisions

| Decision | Reasoning |
|----------|-----------|
| TEXT for all IDs (UUIDs) | Portable, no auto-increment conflicts across services |
| TEXT for timestamps | ISO 8601 strings, avoids timezone issues with pg-mem in tests |
| JSON-as-TEXT for i18n | Simple, no JSONB needed at current scale |
| Shared DB, separate tables | Operational simplicity, cross-service queries possible |
| No foreign keys | Services own their tables independently; referential integrity via app logic |
| REAL for scores | Float precision sufficient for 0-1 range scores |
| UNIQUE(user_id, node_id) on mastery | One mastery record per student per concept |

## Indexing Strategy (Production)

```sql
CREATE INDEX idx_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_answers_session ON session_answers(session_id);
CREATE INDEX idx_mastery_user ON student_mastery(user_id);
CREATE INDEX idx_mastery_review ON student_mastery(user_id, next_review);
CREATE INDEX idx_activity_user_date ON daily_activity(user_id, date);
CREATE INDEX idx_questions_subject_diff ON questions(subject, difficulty);
CREATE INDEX idx_aboa_user ON aboa_logs(user_id);
CREATE INDEX idx_edges_from ON knowledge_edges(from_node_id);
CREATE INDEX idx_edges_to ON knowledge_edges(to_node_id);
```
