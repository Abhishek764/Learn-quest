require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'game-svc' });
});

app.use('/games', require('./routes/games'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`game-svc running on port ${PORT}`);
    if (process.env.NODE_ENV !== 'test') {
      const { query } = require('./db');
      query('SELECT 1').catch(() => {});
    }
  });
}

module.exports = app;
