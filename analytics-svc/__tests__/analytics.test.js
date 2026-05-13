process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/index');
const { query, resetDb } = require('../src/db');
const { v4: uuidv4 } = require('uuid');

const userId = 'analytics-test-user';

beforeEach(async () => {
  resetDb();
  // Seed some activity data
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  await query(
    `INSERT INTO daily_activity (id, user_id, date, sessions_count, correct_answers, total_answers, avg_engagement_score)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [uuidv4(), userId, today, 3, 8, 10, 0.72]
  );
  await query(
    `INSERT INTO daily_activity (id, user_id, date, sessions_count, correct_answers, total_answers, avg_engagement_score)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [uuidv4(), userId, yesterday, 2, 5, 8, 0.65]
  );

  // Seed game sessions for stats
  await query(
    `INSERT INTO game_sessions (id, user_id, game_mode, subject, started_at, ended_at, total_questions, correct_answers, xp_earned)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [uuidv4(), userId, 'lightning_quiz', 'math', today, today, 10, 7, 70]
  );

  // Seed aboa logs
  await query(
    `INSERT INTO aboa_logs (id, user_id, session_id, accuracy, engagement_score, subject, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [uuidv4(), userId, 'sess-1', 0.4, 0.6, 'science', new Date().toISOString()]
  );
});

afterAll(() => resetDb());

describe('Analytics Service', () => {
  test('GET /analytics/user/:id/heatmap returns 365 days of data', async () => {
    const res = await request(app).get(`/analytics/user/${userId}/heatmap`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(365);
    expect(res.body[0]).toHaveProperty('date');
    expect(res.body[0]).toHaveProperty('count');
  });

  test('GET /analytics/user/:id/trends returns 30 day array', async () => {
    const res = await request(app).get(`/analytics/user/${userId}/trends`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(30);
    expect(res.body[0]).toHaveProperty('date');
  });

  test('GET /analytics/user/:id/growth-tips returns array of 3 strings', async () => {
    const res = await request(app).get(`/analytics/user/${userId}/growth-tips`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    expect(typeof res.body[0]).toBe('string');
  });

  test('GET /analytics/user/:id/stats returns object with required fields', async () => {
    const res = await request(app).get(`/analytics/user/${userId}/stats`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total_sessions');
    expect(res.body).toHaveProperty('avg_accuracy');
    expect(res.body).toHaveProperty('best_streak');
    expect(res.body).toHaveProperty('total_xp');
    expect(res.body).toHaveProperty('most_played_subject');
  });

  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
