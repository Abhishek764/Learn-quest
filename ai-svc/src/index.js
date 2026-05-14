require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(express.json({ limit: '256kb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-svc' });
});

app.use('/ai', require('./routes/questions'));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ai-svc running on port ${PORT}`);
  });
}

module.exports = app;
