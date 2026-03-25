const express = require('express');
const router = express.Router();

// GET /appinfo — replaces InfoController.java (profiles + services)
// CF-specific detection dropped; returns Node.js equivalent
router.get('/', (req, res) => {
  res.json({
    profiles: ['node'],
    services: []
  });
});

// GET /service — replaces InfoController.getServices() (cfEnv.findAllServices())
router.get('/service', (req, res) => {
  res.json([]);
});

module.exports = router;
