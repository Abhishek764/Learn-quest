require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const { verifyClerkToken } = require('./clerk');

const app = express();
const PORT = process.env.PORT || 3000;

const USER_URL = process.env.USER_SVC_URL || 'http://localhost:3002';
const GAME_URL = process.env.GAME_SVC_URL || 'http://localhost:3003';
const ABOA_URL = process.env.ABOA_SVC_URL || 'http://localhost:3004';
const ANALYTICS_URL = process.env.ANALYTICS_SVC_URL || 'http://localhost:3005';
const AI_URL = process.env.AI_SVC_URL || 'http://localhost:3007';

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 500 : 10000,
  message: { error: 'Too many requests' }
});
app.use(limiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gateway' });
});

const PUBLIC_PATHS = ['/health'];

async function authMiddleware(req, res, next) {
  if (PUBLIC_PATHS.some(p => req.path.startsWith(p))) return next();

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = await verifyClerkToken(token);
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-email'] = payload.email || '';
    req.headers['x-user-role'] = payload.role || payload['public_metadata']?.role || 'student';
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token', detail: err.message });
  }
}

app.use(authMiddleware);

function makeProxy(targetBase) {
  return async (req, res) => {
    try {
      const url = `${targetBase}${req.originalUrl}`;
      const response = await axios({
        method: req.method,
        url,
        headers: {
          'content-type': req.headers['content-type'] || 'application/json',
          'authorization': req.headers['authorization'] || '',
          'x-user-id': req.headers['x-user-id'] || '',
          'x-user-email': req.headers['x-user-email'] || '',
          'x-user-role': req.headers['x-user-role'] || '',
        },
        data: ['GET', 'DELETE', 'HEAD'].includes(req.method) ? undefined : req.body,
        timeout: 30000,
        validateStatus: () => true,
      });
      res.status(response.status).json(response.data);
    } catch (err) {
      res.status(502).json({ error: 'Service unavailable', detail: err.message });
    }
  };
}

app.use('/users', makeProxy(USER_URL));
app.use('/classes', makeProxy(USER_URL));
app.use('/games', makeProxy(GAME_URL));
app.use('/aboa', makeProxy(ABOA_URL));
app.use('/analytics', makeProxy(ANALYTICS_URL));
app.use('/ai', makeProxy(AI_URL));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`gateway running on port ${PORT}`);
  });
}

module.exports = app;
