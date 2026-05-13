process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/index');
const { query, resetDb } = require('../src/db');

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await resetDb(); });

describe('Game Service', () => {
  const userId = 'test-user-123';

  test('POST /games/sessions/start creates session', async () => {
    const res = await request(app)
      .post('/games/sessions/start')
      .set('x-user-id', userId)
      .send({ game_mode: 'lightning_quiz', subject: 'math' });

    expect(res.status).toBe(201);
    expect(res.body.session_id).toBeDefined();
  });

  test('GET /games/sessions/:id/next-question returns a question', async () => {
    const startRes = await request(app)
      .post('/games/sessions/start')
      .set('x-user-id', userId)
      .send({ game_mode: 'lightning_quiz', subject: 'math' });

    const sessionId = startRes.body.session_id;
    const res = await request(app).get(`/games/sessions/${sessionId}/next-question`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.content).toBeDefined();
    expect(Array.isArray(res.body.options)).toBe(true);
  });

  test('POST /games/sessions/:id/answer with correct answer returns correct:true', async () => {
    const startRes = await request(app)
      .post('/games/sessions/start')
      .set('x-user-id', userId)
      .send({ game_mode: 'lightning_quiz', subject: 'math' });
    const sessionId = startRes.body.session_id;

    const qRes = await request(app).get(`/games/sessions/${sessionId}/next-question`);
    const question = qRes.body;

    // Fetch correct_option via query() instead of getDb()
    const dbRes = await query('SELECT correct_option FROM questions WHERE id = $1', [question.id]);
    const correctOption = dbRes.rows[0].correct_option;

    const res = await request(app)
      .post(`/games/sessions/${sessionId}/answer`)
      .send({ question_id: question.id, answer: correctOption, response_time_sec: 3 });

    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(true);
    expect(res.body.xp_gained).toBeGreaterThan(0);
  });

  test('POST /games/sessions/:id/answer with wrong answer returns correct:false', async () => {
    const startRes = await request(app)
      .post('/games/sessions/start')
      .set('x-user-id', userId)
      .send({ game_mode: 'lightning_quiz', subject: 'math' });
    const sessionId = startRes.body.session_id;

    const qRes = await request(app).get(`/games/sessions/${sessionId}/next-question`);
    const question = qRes.body;

    const dbRes = await query('SELECT correct_option FROM questions WHERE id = $1', [question.id]);
    const correctOption = dbRes.rows[0].correct_option;
    const wrongAnswer = (correctOption + 1) % 4;

    const res = await request(app)
      .post(`/games/sessions/${sessionId}/answer`)
      .send({ question_id: question.id, answer: wrongAnswer, response_time_sec: 5 });

    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(false);
    expect(res.body.xp_gained).toBe(0);
  });

  test('POST /games/sessions/:id/end finalizes session', async () => {
    const startRes = await request(app)
      .post('/games/sessions/start')
      .set('x-user-id', userId)
      .send({ game_mode: 'lightning_quiz', subject: 'general' });
    const sessionId = startRes.body.session_id;

    const res = await request(app).post(`/games/sessions/${sessionId}/end`);
    expect(res.status).toBe(200);
    expect(res.body.ended_at).toBeDefined();
  });

  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
