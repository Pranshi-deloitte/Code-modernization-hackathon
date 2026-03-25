# Spring Music — Existing Functionality

This document captures the current behavior of the legacy Spring Music application as a reference baseline for modernization. Do not modify the Legacy app — treat this as the source of truth.

---

## Domain Model

### Album

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (UUID) | Auto-generated via `RandomIdGenerator`; max 40 chars |
| `title` | String | Album title |
| `artist` | String | Artist/performer name |
| `releaseYear` | String | Stored as string, not integer |
| `genre` | String | Music genre |
| `trackCount` | int | Number of tracks; defaults to 0 |
| `albumId` | String | External album identifier |

### ApplicationInfo

Returned by `/appinfo`. Contains `profiles` (String[]) and `services` (String[]).

---

## REST API

### Albums — `AlbumController`

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/albums` | List all albums | — | `Iterable<Album>` |
| PUT | `/albums` | Create a new album | `Album` (no id) | Saved `Album` with generated id |
| POST | `/albums` | Update an existing album | `Album` (with id) | Updated `Album` |
| GET | `/albums/{id}` | Get album by id | — | `Album` or null |
| DELETE | `/albums/{id}` | Delete album by id | — | 204 No Content |

> **Note:** PUT = create, POST = update. This is intentionally reversed from standard REST conventions and must be preserved in any new API contract.

### Info — `InfoController`

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/appinfo` | Active profiles + bound CF services | `{ profiles: [], services: [] }` |
| GET | `/service` | Raw Cloud Foundry service details | `List<CfService>` |

### Errors — `ErrorController`

Testing/diagnostic endpoints — not for production use.

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/errors/kill` | Calls `System.exit(1)` |
| GET | `/errors/throw` | Throws `NullPointerException` |
| GET | `/errors/fill-heap` | Infinite loop allocating memory until OOM |

---

## Persistence Backends

Backend is selected at startup via Spring profile. Only one can be active at a time.

| Profile | Repository | Backend |
|---------|-----------|---------|
| _(none / default)_ | `JpaAlbumRepository` | H2 in-memory |
| `mysql` | `JpaAlbumRepository` | MySQL |
| `postgres` | `JpaAlbumRepository` | PostgreSQL |
| `sqlserver` | `JpaAlbumRepository` | SQL Server |
| `oracle` | `JpaAlbumRepository` | Oracle |
| `mongodb` | `MongoAlbumRepository` | MongoDB |
| `redis` | `RedisAlbumRepository` | Redis |

### Redis Storage Structure

All albums are stored in a single Redis hash:
- Key: `"albums"`
- Fields: album IDs
- Values: JSON-serialized `Album` objects

### Profile Auto-Detection (Cloud Foundry)

`SpringApplicationContextInitializer` runs before context load:
1. Reads bound CF services from environment (`CfEnv`)
2. Maps service tags to profiles (`mongodb`, `postgres`, `mysql`, `redis`, etc.)
3. Activates the matching profile automatically
4. Throws `IllegalStateException` if more than one database service is bound
5. Excludes irrelevant Spring Boot auto-configurations based on active profile

---

## Data Seeding

`AlbumRepositoryPopulator` fires on `ApplicationReadyEvent`:
- Reads `classpath:albums.json`
- Seeds data **only if the repository is empty** (`count() == 0`)
- 28 pre-loaded albums across Rock, Pop, and Blues genres
- Skipped on subsequent starts if data already exists

---

## Frontend (AngularJS 1.2.16)

Single-page app served as static resources. All data fetched via REST.

### Routes

| Path | Controller | View |
|------|-----------|------|
| `/` (default) | `AlbumsController` | Album list (grid or table) |
| `/errors` | `ErrorsController` | Error testing page |

### Album List Features

- Toggle between **grid view** and **list view**
- Sort by: title, artist, releaseYear, genre (ascending/descending)
- **In-place editing**: click any field to edit inline; Enter to save, Escape to cancel
- **Add Album**: opens modal form; all fields required; year validated against `/^[1-2]\d{3}$/`
- **Edit Album**: opens same modal pre-populated
- **Delete Album**: immediate deletion with list refresh
- Status bar shows success/error messages after operations

### AngularJS Modules

| Module | Purpose |
|--------|---------|
| `albums` | Album CRUD, in-place editor directive, modal controller |
| `info` | Loads and displays `/appinfo` in navbar |
| `status` | Global message bus for success/error notifications |
| `errors` | Triggers diagnostic endpoints |

---

## Key Behaviors to Preserve

1. **PUT creates, POST updates** — reversed HTTP semantics must be maintained or explicitly mapped in ACL.
2. **UUID primary keys** — all IDs are UUIDs regardless of backend.
3. **Single backend at a time** — no multi-store writes; exactly one profile active.
4. **Idempotent seeding** — seed data loads once; never overwrites existing records.
5. **No server-side session** — all state is client-side (AngularJS scope).
6. **No explicit service layer** — controller calls repository directly; no business logic beyond CRUD.
7. **Validation is frontend-only** — backend applies `@Valid` but model has no JSR-380 constraints; year format enforced only in UI.
