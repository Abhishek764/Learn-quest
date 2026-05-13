process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../src/index');
const { resetDb } = require('../src/db');

beforeEach(() => {
  resetDb();
});

afterAll(() => {
  resetDb();
});

describe('Auth Service', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    role: 'student',
    display_name: 'Test User'
  };

  test('POST /auth/register creates user and returns JWT', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.role).toBe('student');
  });

  test('POST /auth/register with duplicate email returns 409', async () => {
    await request(app).post('/auth/register').send(testUser);
    const res = await request(app).post('/auth/register').send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  test('POST /auth/login with correct credentials returns JWT', async () => {
    await request(app).post('/auth/register').send(testUser);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('POST /auth/login with wrong password returns 401', async () => {
    await request(app).post('/auth/register').send(testUser);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  test('POST /auth/refresh with valid refresh token returns new JWT', async () => {
    const registerRes = await request(app).post('/auth/register').send(testUser);
    const { refreshToken } = registerRes.body;

    const res = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('POST /auth/logout succeeds', async () => {
    const registerRes = await request(app).post('/auth/register').send(testUser);
    const { token, refreshToken } = registerRes.body;

    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('auth-svc');
  });
});
