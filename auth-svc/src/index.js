require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-svc' });
});

app.use('/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`auth-svc running on port ${PORT}`);
    // pre-warm DB connection (Neon cold start)
    if (process.env.NODE_ENV !== 'test') {
      const { query } = require('./db');
      query('SELECT 1').catch(() => {});
    }
  });
}

module.exports = app;
