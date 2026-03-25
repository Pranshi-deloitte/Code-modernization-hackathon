const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const rawAlbums = require('./albums.json');

function seed() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM albums').get().cnt;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO albums (id, title, artist, release_year, genre, track_count, album_id)
    VALUES (@id, @title, @artist, @releaseYear, @genre, @trackCount, @albumId)
  `);

  const insertMany = db.transaction((albums) => {
    for (const album of albums) {
      insert.run({
        id: uuidv4(),
        title: album.title || '',
        artist: album.artist || '',
        releaseYear: album.releaseYear || album.release_year || '',
        genre: album.genre || '',
        trackCount: album.trackCount || album.track_count || 0,
        albumId: album.albumId || album.album_id || ''
      });
    }
  });

  // Strip legacy Java _class field (ACL boundary — never expose in API)
  const albums = rawAlbums.map(({ _class, ...rest }) => rest);
  insertMany(albums);
  console.log(`Seeded ${albums.length} albums`);
}

module.exports = { seed };
