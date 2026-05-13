process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/index');
const { query, resetDb } = require('../src/db');

beforeEach(async () => {
  resetDb();
  await query(
    `INSERT INTO users (id, email, role, display_name, xp, level, streak_days) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    ['user-1', 'test@example.com', 'student', 'Test User', 50, 1, 3]
  );
  await query(
    `INSERT INTO users (id, email, role, display_name, xp, level) VALUES ($1, $2, $3, $4, $5, $6)`,
    ['educator-1', 'edu@example.com', 'educator', 'Educator', 200, 2]
  );
});

afterAll(() => resetDb());

describe('User Service', () => {
  test('GET /users/:id/profile returns user data', async () => {
    const res = await request(app).get('/users/user-1/profile');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('user-1');
    expect(res.body.xp).toBe(50);
  });

  test('PUT /users/:id/profile updates fields', async () => {
    const res = await request(app)
      .put('/users/user-1/profile')
      .send({ display_name: 'New Name', avatar_url: 'http://example.com/img.png', lang: 'hi' });
    expect(res.status).toBe(200);
    expect(res.body.display_name).toBe('New Name');
  });

  test('POST /users/:id/xp adds XP and levels up at 100 XP', async () => {
    const res = await request(app)
      .post('/users/user-1/xp')
      .send({ amount: 60 });
    expect(res.status).toBe(200);
    expect(res.body.xp).toBe(110);
    expect(res.body.level).toBe(2);
  });

  test('GET /users/leaderboard returns array sorted by XP', async () => {
    const res = await request(app).get('/users/leaderboard');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].xp).toBeGreaterThanOrEqual(res.body[1].xp);
  });

  test('POST /classes creates class with invite code', async () => {
    const res = await request(app)
      .post('/classes')
      .set('x-user-id', 'educator-1')
      .send({ name: 'Math 101', subject: 'math' });
    expect(res.status).toBe(201);
    expect(res.body.invite_code).toBeDefined();
    expect(res.body.invite_code.length).toBe(6);
  });

  test('POST /classes/join joins class with invite code', async () => {
    const createRes = await request(app)
      .post('/classes')
      .set('x-user-id', 'educator-1')
      .send({ name: 'Science 101', subject: 'science' });
    const invite_code = createRes.body.invite_code;
    const res = await request(app)
      .post('/classes/join')
      .set('x-user-id', 'user-1')
      .send({ invite_code });
    expect(res.status).toBe(200);
    expect(res.body.class.invite_code).toBe(invite_code);
  });

  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
