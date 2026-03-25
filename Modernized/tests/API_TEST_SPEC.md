# API Test Specification

Language-agnostic contract tests for Spring Music API.
Both the Java (REST Assured) and Node.js (Jest + axios) test suites implement exactly these cases.

## Base URL

Default: `http://localhost:8080`
Override via environment variable: `BASE_URL`

---

## Album Model

```json
{
  "id":          "string (UUID, auto-generated)",
  "title":       "string",
  "artist":      "string",
  "releaseYear": "string",
  "genre":       "string",
  "trackCount":  "integer",
  "albumId":     "string"
}
```

---

## TC-01 · GET /albums — returns seeded albums

| Field        | Value |
|--------------|-------|
| Method       | GET |
| Path         | /albums |
| Request body | none |
| Expected status | 200 |
| Assertions   | Response is a non-empty JSON array; each item has `id`, `title`, `artist` |

---

## TC-02 · PUT /albums — create a new album

| Field        | Value |
|--------------|-------|
| Method       | PUT |
| Path         | /albums |
| Content-Type | application/json |
| Request body | `{ "title": "Test Album", "artist": "Test Artist", "releaseYear": "2024", "genre": "Rock", "trackCount": 10 }` |
| Expected status | 200 |
| Assertions   | Response contains `id` (non-null/non-empty); echoes back `title`, `artist`, `releaseYear`, `genre`, `trackCount` |

---

## TC-03 · GET /albums/{id} — retrieve created album

| Field        | Value |
|--------------|-------|
| Method       | GET |
| Path         | /albums/{id}  (id from TC-02) |
| Expected status | 200 |
| Assertions   | `id` matches, `title` = "Test Album", `artist` = "Test Artist" |

---

## TC-04 · POST /albums — update an album

| Field        | Value |
|--------------|-------|
| Method       | POST |
| Path         | /albums |
| Content-Type | application/json |
| Request body | Album from TC-02 with `title` changed to "Updated Album" |
| Expected status | 200 |
| Assertions   | Response `title` = "Updated Album"; `id` unchanged |

---

## TC-05 · GET /albums/{id} — verify update persisted

| Field        | Value |
|--------------|-------|
| Method       | GET |
| Path         | /albums/{id}  (same id) |
| Expected status | 200 |
| Assertions   | `title` = "Updated Album" |

---

## TC-06 · DELETE /albums/{id} — delete album

| Field        | Value |
|--------------|-------|
| Method       | DELETE |
| Path         | /albums/{id} |
| Expected status | 200 |
| Assertions   | Response is 200 (no body required) |

---

## TC-07 · GET /albums/{id} — confirm deletion

| Field        | Value |
|--------------|-------|
| Method       | GET |
| Path         | /albums/{id} |
| Expected status | 200 |
| Assertions   | Response body is null / empty (legacy returns null; modernized may return 404 — both are acceptable) |

---

## TC-08 · GET /albums — count unchanged after delete

| Field        | Value |
|--------------|-------|
| Method       | GET |
| Path         | /albums |
| Expected status | 200 |
| Assertions   | Deleted album `id` no longer appears in list |

---

## TC-09 · PUT /albums — album with all fields

| Field        | Value |
|--------------|-------|
| Method       | PUT |
| Path         | /albums |
| Request body | `{ "title": "Full Album", "artist": "Full Artist", "releaseYear": "1999", "genre": "Jazz", "trackCount": 12, "albumId": "ext-ref-001" }` |
| Expected status | 200 |
| Assertions   | All sent fields reflected in response; `id` present |

---

## TC-10 · GET /appinfo — application metadata

| Field        | Value |
|--------------|-------|
| Method       | GET |
| Path         | /appinfo |
| Expected status | 200 |
| Assertions   | Response contains `profiles` (array) and `services` (array) |

---

## TC-11 · GET /errors/throw — exception handling

| Field        | Value |
|--------------|-------|
| Method       | GET |
| Path         | /errors/throw |
| Expected status | 500 |
| Assertions   | Server returns 5xx; application continues to serve requests after |

---

## TC-12 · Full CRUD lifecycle (composite)

Sequential: TC-02 → TC-03 → TC-04 → TC-05 → TC-06 → TC-07
Validates that create/read/update/delete is consistent end-to-end.
