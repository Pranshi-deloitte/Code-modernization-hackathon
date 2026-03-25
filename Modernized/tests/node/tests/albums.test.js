/**
 * API contract tests for Spring Music — Node.js (Jest + axios)
 * Mirrors AlbumApiTest.java test-for-test.
 *
 * Target: set BASE_URL env var (default http://localhost:8080)
 * Run all:    npm test
 * Run one:    npm test -- --testNamePattern="TC-02"
 */

const axios = require("axios");

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";

const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true, // never throw on HTTP errors — we assert manually
});

// Shared state across ordered tests
let createdAlbumId;
let createdAlbum;

// -----------------------------------------------------------------------
// TC-01: GET /albums — seeded data is present
// -----------------------------------------------------------------------
test("TC-01: GET /albums returns non-empty list with expected fields", async () => {
  const res = await client.get("/albums");

  expect(res.status).toBe(200);
  expect(Array.isArray(res.data)).toBe(true);
  expect(res.data.length).toBeGreaterThan(0);

  const first = res.data[0];
  expect(first).toHaveProperty("id");
  expect(first).toHaveProperty("title");
  expect(first).toHaveProperty("artist");
});

// -----------------------------------------------------------------------
// TC-02: PUT /albums — create a new album
// -----------------------------------------------------------------------
test("TC-02: PUT /albums creates album and returns it with id", async () => {
  const payload = {
    title: "Test Album",
    artist: "Test Artist",
    releaseYear: "2024",
    genre: "Rock",
    trackCount: 10,
  };

  const res = await client.put("/albums", payload);

  expect(res.status).toBe(200);
  expect(res.data.id).toBeTruthy();
  expect(res.data.title).toBe("Test Album");
  expect(res.data.artist).toBe("Test Artist");
  expect(res.data.releaseYear).toBe("2024");
  expect(res.data.genre).toBe("Rock");
  expect(res.data.trackCount).toBe(10);

  createdAlbum = res.data;
  createdAlbumId = res.data.id;
});

// -----------------------------------------------------------------------
// TC-03: GET /albums/{id} — retrieve the created album
// -----------------------------------------------------------------------
test("TC-03: GET /albums/:id returns the created album", async () => {
  expect(createdAlbumId).toBeTruthy();

  const res = await client.get(`/albums/${createdAlbumId}`);

  expect(res.status).toBe(200);
  expect(res.data.id).toBe(createdAlbumId);
  expect(res.data.title).toBe("Test Album");
  expect(res.data.artist).toBe("Test Artist");
});

// -----------------------------------------------------------------------
// TC-04: POST /albums — update the album
// -----------------------------------------------------------------------
test("TC-04: POST /albums updates the album title", async () => {
  expect(createdAlbum).toBeTruthy();

  const updated = { ...createdAlbum, title: "Updated Album" };
  const res = await client.post("/albums", updated);

  expect(res.status).toBe(200);
  expect(res.data.id).toBe(createdAlbumId);
  expect(res.data.title).toBe("Updated Album");
});

// -----------------------------------------------------------------------
// TC-05: GET /albums/{id} — verify update persisted
// -----------------------------------------------------------------------
test("TC-05: GET /albums/:id reflects the title update", async () => {
  expect(createdAlbumId).toBeTruthy();

  const res = await client.get(`/albums/${createdAlbumId}`);

  expect(res.status).toBe(200);
  expect(res.data.title).toBe("Updated Album");
  expect(res.data.id).toBe(createdAlbumId);
});

// -----------------------------------------------------------------------
// TC-06: DELETE /albums/{id} — delete the album
// -----------------------------------------------------------------------
test("TC-06: DELETE /albums/:id returns 200", async () => {
  expect(createdAlbumId).toBeTruthy();

  const res = await client.delete(`/albums/${createdAlbumId}`);

  expect(res.status).toBe(200);
});

// -----------------------------------------------------------------------
// TC-07: GET /albums/{id} — confirm deletion (null or 404)
// -----------------------------------------------------------------------
test("TC-07: GET /albums/:id after delete returns null or 404", async () => {
  expect(createdAlbumId).toBeTruthy();

  const res = await client.get(`/albums/${createdAlbumId}`);

  // Legacy returns 200 with null body; modernized may return 404
  expect([200, 404]).toContain(res.status);
  if (res.status === 200) {
    const body = res.data;
    expect(body == null || body === "" || Object.keys(body).length === 0).toBe(true);
  }
});

// -----------------------------------------------------------------------
// TC-08: GET /albums — deleted album no longer in list
// -----------------------------------------------------------------------
test("TC-08: GET /albums does not contain the deleted album", async () => {
  expect(createdAlbumId).toBeTruthy();

  const res = await client.get("/albums");

  expect(res.status).toBe(200);
  const ids = res.data.map((a) => a.id);
  expect(ids).not.toContain(createdAlbumId);
});

// -----------------------------------------------------------------------
// TC-09: PUT /albums — album with all fields
// -----------------------------------------------------------------------
test("TC-09: PUT /albums with all fields echoes every field", async () => {
  const payload = {
    title: "Full Album",
    artist: "Full Artist",
    releaseYear: "1999",
    genre: "Jazz",
    trackCount: 12,
    albumId: "ext-ref-001",
  };

  const res = await client.put("/albums", payload);

  expect(res.status).toBe(200);
  expect(res.data.id).toBeTruthy();
  expect(res.data.title).toBe("Full Album");
  expect(res.data.artist).toBe("Full Artist");
  expect(res.data.releaseYear).toBe("1999");
  expect(res.data.genre).toBe("Jazz");
  expect(res.data.trackCount).toBe(12);
  expect(res.data.albumId).toBe("ext-ref-001");

  // Cleanup
  await client.delete(`/albums/${res.data.id}`);
});

// -----------------------------------------------------------------------
// TC-10: GET /appinfo — metadata endpoint
// -----------------------------------------------------------------------
test("TC-10: GET /appinfo returns profiles and services arrays", async () => {
  const res = await client.get("/appinfo");

  expect(res.status).toBe(200);
  expect(res.data).toHaveProperty("profiles");
  expect(res.data).toHaveProperty("services");
  expect(Array.isArray(res.data.profiles)).toBe(true);
  expect(Array.isArray(res.data.services)).toBe(true);
});

// -----------------------------------------------------------------------
// TC-11: GET /errors/throw — exception returns 500, app still alive
// -----------------------------------------------------------------------
test("TC-11: GET /errors/throw returns 500 and app stays alive", async () => {
  const errorRes = await client.get("/errors/throw");
  expect(errorRes.status).toBe(500);

  // App must still serve requests after the exception
  const albumsRes = await client.get("/albums");
  expect(albumsRes.status).toBe(200);
});
