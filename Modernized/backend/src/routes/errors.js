const express = require('express');
const router = express.Router();

// GET /errors/kill — replaces ErrorController.kill() (System.exit(1))
router.get('/kill', (req, res) => {
  res.json({ message: 'Killing application' });
  process.exit(1);
});

// GET /errors/throw — replaces ErrorController.throwException() (throws NullPointerException → 500)
router.get('/throw', (req, res, next) => {
  next(new Error('NullPointerException equivalent — forced error for testing'));
});

// GET /errors/fill-heap — replaces ErrorController.fillHeap() (OOM simulation)
router.get('/fill-heap', (req, res) => {
  const junk = [];
  try {
    while (true) {
      junk.push(new Array(9999999).fill('x'));
    }
  } catch (e) {
    res.status(500).json({ error: 'Heap exhausted: ' + e.message });
  }
});

module.exports = router;
