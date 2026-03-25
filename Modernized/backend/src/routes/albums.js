const express = require('express');
const router = express.Router();
const Album = require('../models/album');
const { albumValidationRules, validate } = require('../middleware/validation');

// GET /albums — return all albums (replaces AlbumController @RequestMapping GET)
router.get('/', (req, res) => {
  res.json(Album.findAll());
});

// GET /albums/:id — return album or null (legacy: repository.findById().orElse(null))
router.get('/:id', (req, res) => {
  res.json(Album.findById(req.params.id));
});

// PUT /albums — create album (legacy uses PUT for add, POST for update)
router.put('/', albumValidationRules, validate, (req, res) => {
  const saved = Album.save({ ...req.body, id: undefined });
  res.json(saved);
});

// POST /albums — update album
router.post('/', albumValidationRules, validate, (req, res) => {
  const saved = Album.save(req.body);
  res.json(saved);
});

// DELETE /albums/:id — delete by id (no error if not found — matches legacy)
router.delete('/:id', (req, res) => {
  Album.deleteById(req.params.id);
  res.json({});
});

module.exports = router;
