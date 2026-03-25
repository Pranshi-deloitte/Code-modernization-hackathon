const express = require('express');
const cors = require('cors');
const path = require('path');
const { seed } = require('./db/seed');

const albumsRouter = require('./routes/albums');
const appinfoRouter = require('./routes/appinfo');
const errorsRouter = require('./routes/errors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve React build in production
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API routes
app.use('/albums', albumsRouter);
app.use('/appinfo', appinfoRouter);
app.use('/service', (req, res) => res.json([]));
app.use('/errors', errorsRouter);

// Health endpoint — replaces Spring Boot Actuator GET /actuator/health
app.get('/actuator/health', (req, res) => {
  res.json({ status: 'UP', db: 'SQLite (in-memory)' });
});

// SPA fallback — serve index.html for all non-API GET routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Global error handler (replaces Spring's default 500 response)
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

// Seed data on startup
seed();

// Only start listening when not imported by the test runner
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Spring Music (Node.js) running on http://localhost:${PORT}`);
  });
}

module.exports = app;
