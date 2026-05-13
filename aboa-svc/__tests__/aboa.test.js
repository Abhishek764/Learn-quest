process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/index');
const { resetDb } = require('../src/db');
const {
  normalizeRt, normalizeAcc, normalizeDur, normalizeHint, normalizeTrend
} = require('../src/aboa');

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await resetDb(); });

describe('ABOA Service', () => {
  const basePayload = {
    user_id: 'user-1',
    session_id: 'session-1',
    response_time: 5,
    accuracy: 0.6,
    session_duration: 20,
    hint_usage: 0.3,
    engagement_trend: 0,
    current_difficulty: 0.5
  };

  test('POST /aboa/compute with high accuracy (0.9) increases difficulty', async () => {
    const res = await request(app)
      .post('/aboa/compute')
      .send({ ...basePayload, accuracy: 0.9, current_difficulty: 0.5 });

    expect(res.status).toBe(200);
    expect(res.body.new_difficulty).toBeCloseTo(0.6, 1);
  });

  test('POST /aboa/compute with low accuracy (0.3) decreases difficulty', async () => {
    const res = await request(app)
      .post('/aboa/compute')
      .send({ ...basePayload, accuracy: 0.3, current_difficulty: 0.5 });

    expect(res.status).toBe(200);
    expect(res.body.new_difficulty).toBeCloseTo(0.4, 1);
  });

  test('POST /aboa/compute with mid accuracy keeps difficulty same', async () => {
    const res = await request(app)
      .post('/aboa/compute')
      .send({ ...basePayload, accuracy: 0.6, current_difficulty: 0.5 });

    expect(res.status).toBe(200);
    expect(res.body.new_difficulty).toBeCloseTo(0.5, 1);
  });

  test('engagement_score is between 0 and 1', async () => {
    const res = await request(app).post('/aboa/compute').send(basePayload);

    expect(res.status).toBe(200);
    expect(res.body.engagement_score).toBeGreaterThanOrEqual(0);
    expect(res.body.engagement_score).toBeLessThanOrEqual(1);
  });

  test('new_reward is higher when Se is low (low accuracy)', async () => {
    const highRes = await request(app)
      .post('/aboa/compute')
      .send({ ...basePayload, accuracy: 1.0, response_time: 1, engagement_trend: 1 });

    await resetDb();

    const lowRes = await request(app)
      .post('/aboa/compute')
      .send({ ...basePayload, accuracy: 0.0, response_time: 30, engagement_trend: -1 });

    expect(lowRes.body.new_reward).toBeGreaterThan(highRes.body.new_reward);
  });

  test('GET /aboa/learner/:id/history returns array of logs', async () => {
    await request(app).post('/aboa/compute').send(basePayload);
    await request(app).post('/aboa/compute').send(basePayload);

    const res = await request(app).get('/aboa/learner/user-1/history');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  describe('Normalization functions produce values in [0,1]', () => {
    test('normalizeRt in [0,1]', () => {
      expect(normalizeRt(0)).toBeLessThanOrEqual(1);
      expect(normalizeRt(0)).toBeGreaterThanOrEqual(0);
      expect(normalizeRt(100)).toBeGreaterThanOrEqual(0);
    });

    test('normalizeAcc in [0,1]', () => {
      expect(normalizeAcc(0)).toBe(0);
      expect(normalizeAcc(1)).toBe(1);
      expect(normalizeAcc(0.5)).toBe(0.5);
    });

    test('normalizeDur in [0,1]', () => {
      expect(normalizeDur(0)).toBeGreaterThanOrEqual(0);
      expect(normalizeDur(60)).toBeLessThanOrEqual(1);
      expect(normalizeDur(30)).toBeGreaterThanOrEqual(0);
    });

    test('normalizeHint in [0,1]', () => {
      expect(normalizeHint(0.3)).toBe(1);
      expect(normalizeHint(0)).toBeGreaterThanOrEqual(0);
      expect(normalizeHint(1)).toBeGreaterThanOrEqual(0);
    });

    test('normalizeTrend in [0,1]', () => {
      expect(normalizeTrend(-1)).toBe(0);
      expect(normalizeTrend(1)).toBe(1);
      expect(normalizeTrend(0)).toBe(0.5);
    });
  });
});
