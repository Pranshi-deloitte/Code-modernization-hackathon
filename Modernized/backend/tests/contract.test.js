import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

let app;

beforeAll(async () => {
  app = (await import('../src/index.js')).default;
});

// Contract tests — verify the API shape that the React frontend depends on

describe('Album response contract', () => {
  it('GET /albums returns Content-Type application/json', async () => {
    const res = await request(app).get('/albums');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('GET /albums returns an array (frontend iterates with .map())', async () => {
    const res = await request(app).get('/albums');
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('Album object has exactly the legacy camelCase fields (no snake_case leakage)', async () => {
    const res = await request(app).get('/albums');
    const album = res.body[0];
    // Required fields
    expect(album).toHaveProperty('id');
    expect(album).toHaveProperty('title');
    expect(album).toHaveProperty('artist');
    expect(album).toHaveProperty('releaseYear');   // camelCase — not release_year
    expect(album).toHaveProperty('genre');
    expect(album).toHaveProperty('trackCount');    // camelCase — not track_count
    expect(album).toHaveProperty('albumId');       // camelCase — not album_id
    // No snake_case
    expect(album).not.toHaveProperty('release_year');
    expect(album).not.toHaveProperty('track_count');
    expect(album).not.toHaveProperty('album_id');
  });

  it('PUT /albums returns created album with a generated id (frontend uses id for optimistic update)', async () => {
    const res = await request(app).put('/albums').send({
      title: 'Contract Test Album',
      artist: 'Contract Artist',
      releaseYear: '2000',
      genre: 'Jazz'
    });
    expect(res.body.id).toBeTruthy();
    expect(typeof res.body.id).toBe('string');
  });

  it('POST /albums returns the updated album (frontend uses response for state refresh)', async () => {
    const list = await request(app).get('/albums');
    const original = list.body[0];
    const res = await request(app).post('/albums').send({
      ...original,
      genre: 'Updated Genre'
    });
    expect(res.body.id).toBe(original.id);
    expect(res.body.genre).toBe('Updated Genre');
  });

  it('GET /albums/:id returns object or null — never 404 (frontend checks for null)', async () => {
    const missing = await request(app).get('/albums/nonexistent-id');
    expect(missing.status).toBe(200);
    expect(missing.body).toBeNull();
  });
});

describe('GET /appinfo contract', () => {
  it('returns { profiles: string[], services: string[] }', async () => {
    const res = await request(app).get('/appinfo');
    expect(Array.isArray(res.body.profiles)).toBe(true);
    expect(Array.isArray(res.body.services)).toBe(true);
    res.body.profiles.forEach(p => expect(typeof p).toBe('string'));
  });
});
