const { body, validationResult } = require('express-validator');

// Mirrors legacy AlbumModalController's yearPattern = /^[1-2]\d{3}$/
const albumValidationRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('artist').notEmpty().withMessage('Artist is required'),
  body('releaseYear')
    .notEmpty().withMessage('Release year is required')
    .matches(/^[1-2]\d{3}$/).withMessage('Release year must match pattern [1-2]XXX (e.g. 1969, 2024)'),
  body('genre').notEmpty().withMessage('Genre is required')
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = { albumValidationRules, validate };
