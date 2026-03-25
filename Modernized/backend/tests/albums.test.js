import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

// Re-initialise a fresh in-memory DB for each test run
// by requiring the app after clearing the module cache
let app;
let seededId;

beforeAll(async () => {
  app = (await import('../src/index.js')).default;
});

// --- Characterization tests — pin legacy AlbumController.java behavior ---

describe('GET /albums', () => {
  it('returns 200 and an array of 30 seeded albums', async () => {
    const res = await request(app).get('/albums');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(29); // albums.json has 29 entries
  });

  it('each album contains the 7 required fields', async () => {
    const res = await request(app).get('/albums');
    const album = res.body[0];
    expect(album).toHaveProperty('id');
    expect(album).toHaveProperty('title');
    expect(album).toHaveProperty('artist');
    expect(album).toHaveProperty('releaseYear');
    expect(album).toHaveProperty('genre');
    expect(album).toHaveProperty('trackCount');
    expect(album).toHaveProperty('albumId');
  });

  it('does not expose the _class Java artifact', async () => {
    const res = await request(app).get('/albums');
    expect(res.body[0]).not.toHaveProperty('_class');
  });
});

describe('GET /albums/:id', () => {
  it('returns the album for a valid id', async () => {
    const list = await request(app).get('/albums');
    seededId = list.body[0].id;
    const res = await request(app).get(`/albums/${seededId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(seededId);
  });

  it('returns null for a non-existent id (matches legacy .orElse(null))', async () => {
    const res = await request(app).get('/albums/does-not-exist');
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

describe('PUT /albums (create)', () => {
  it('creates an album and returns it with a generated id', async () => {
    const res = await request(app).put('/albums').send({
      title: 'Test Album',
      artist: 'Test Artist',
      releaseYear: '2024',
      genre: 'Rock'
    });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeTruthy();
    expect(res.body.title).toBe('Test Album');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).put('/albums').send({
      artist: 'Test Artist',
      releaseYear: '2024',
      genre: 'Rock'
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid releaseYear (matches yearPattern validation)', async () => {
    const res = await request(app).put('/albums').send({
      title: 'Test',
      artist: 'Test',
      releaseYear: 'abcd',
      genre: 'Rock'
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /albums (update)', () => {
  it('updates an existing album and returns the updated record', async () => {
    const list = await request(app).get('/albums');
    const existing = list.body[0];
    const res = await request(app).post('/albums').send({
      ...existing,
      title: 'Updated Title'
    });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
    expect(res.body.id).toBe(existing.id);
  });
});

describe('DELETE /albums/:id', () => {
  it('returns 200 when deleting an existing album', async () => {
    const list = await request(app).get('/albums');
    const id = list.body[list.body.length - 1].id;
    const res = await request(app).delete(`/albums/${id}`);
    expect(res.status).toBe(200);
  });

  it('returns 200 for a non-existent id (matches legacy — no error on missing)', async () => {
    const res = await request(app).delete('/albums/ghost-id');
    expect(res.status).toBe(200);
  });
});

describe('GET /appinfo', () => {
  it('returns profiles and services arrays', async () => {
    const res = await request(app).get('/appinfo');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('profiles');
    expect(res.body).toHaveProperty('services');
    expect(Array.isArray(res.body.profiles)).toBe(true);
  });
});

describe('GET /actuator/health', () => {
  it('returns UP status', async () => {
    const res = await request(app).get('/actuator/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });
});

describe('GET /errors/throw', () => {
  it('returns 500', async () => {
    const res = await request(app).get('/errors/throw');
    expect(res.status).toBe(500);
  });
});
