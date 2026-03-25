const Database = require('better-sqlite3');

// SQLite in-memory database — equivalent of legacy H2 in-memory
const db = new Database(':memory:');

db.exec(`
  CREATE TABLE IF NOT EXISTS albums (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    artist      TEXT NOT NULL,
    release_year TEXT,
    genre       TEXT,
    track_count  INTEGER DEFAULT 0,
    album_id    TEXT DEFAULT ''
  )
`);

module.exports = db;
