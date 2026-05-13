require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'learnquest-dev-secret';

const AUTH_URL = process.env.AUTH_SVC_URL || 'http://localhost:3001';
const USER_URL = process.env.USER_SVC_URL || 'http://localhost:3002';
const GAME_URL = process.env.GAME_SVC_URL || 'http://localhost:3003';
const ABOA_URL = process.env.ABOA_SVC_URL || 'http://localhost:3004';
const ANALYTICS_URL = process.env.ANALYTICS_SVC_URL || 'http://localhost:3005';

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests' }
});
app.use(limiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gateway' });
});

const PUBLIC_PATHS = ['/auth/register', '/auth/login', '/auth/google', '/auth/refresh', '/health'];

function authMiddleware(req, res, next) {
  const isPublic = PUBLIC_PATHS.some(p => req.path.startsWith(p));
  if (isPublic) return next();

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.headers['x-user-id'] = decoded.sub;
    req.headers['x-user-role'] = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
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

app.use('/auth', makeProxy(AUTH_URL));
app.use('/users', makeProxy(USER_URL));
app.use('/classes', makeProxy(USER_URL));
app.use('/games', makeProxy(GAME_URL));
app.use('/aboa', makeProxy(ABOA_URL));
app.use('/analytics', makeProxy(ANALYTICS_URL));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`gateway running on port ${PORT}`);
  });
}

module.exports = app;
