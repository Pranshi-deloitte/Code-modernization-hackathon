const db = require('../db/database');

// Map DB snake_case columns → camelCase JSON (matches legacy Album.java field names)
function toJson(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    releaseYear: row.release_year,
    genre: row.genre,
    trackCount: row.track_count,
    albumId: row.album_id
  };
}

const findAll = () =>
  db.prepare('SELECT * FROM albums ORDER BY title').all().map(toJson);

const findById = (id) =>
  toJson(db.prepare('SELECT * FROM albums WHERE id = ?').get(id));

const count = () =>
  db.prepare('SELECT COUNT(*) as cnt FROM albums').get().cnt;

// Upsert — legacy uses repository.save() for both add and update
const save = (album) => {
  const existing = album.id
    ? db.prepare('SELECT id FROM albums WHERE id = ?').get(album.id)
    : null;

  if (existing) {
    db.prepare(`
      UPDATE albums
      SET title = @title, artist = @artist, release_year = @releaseYear,
          genre = @genre, track_count = @trackCount, album_id = @albumId
      WHERE id = @id
    `).run({
      id: album.id,
      title: album.title || '',
      artist: album.artist || '',
      releaseYear: album.releaseYear || '',
      genre: album.genre || '',
      trackCount: album.trackCount || 0,
      albumId: album.albumId || ''
    });
  } else {
    const { v4: uuidv4 } = require('uuid');
    const id = album.id || uuidv4();
    db.prepare(`
      INSERT INTO albums (id, title, artist, release_year, genre, track_count, album_id)
      VALUES (@id, @title, @artist, @releaseYear, @genre, @trackCount, @albumId)
    `).run({
      id,
      title: album.title || '',
      artist: album.artist || '',
      releaseYear: album.releaseYear || '',
      genre: album.genre || '',
      trackCount: album.trackCount || 0,
      albumId: album.albumId || ''
    });
    album.id = id;
  }

  return findById(album.id);
};

const deleteById = (id) =>
  db.prepare('DELETE FROM albums WHERE id = ?').run(id);

module.exports = { findAll, findById, save, deleteById, count };
