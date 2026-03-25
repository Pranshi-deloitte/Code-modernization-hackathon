# Spring Music — Modernized

Modernized version of the Spring Music application.
**Legacy stack:** Spring Boot 2.4 + AngularJS 1.2
**New stack:** Node.js + Express (backend) · React 18 + Vite (frontend)

---

## Project Structure

```
Modernized/
├── backend/                  ← Node.js + Express API (port 3001)
│   ├── src/
│   │   ├── index.js          # Express app entry point
│   │   ├── db/
│   │   │   ├── database.js   # SQLite in-memory setup + schema
│   │   │   ├── seed.js       # Seed 30 albums on first start
│   │   │   └── albums.json   # Seed data (copied from Legacy)
│   │   ├── routes/
│   │   │   ├── albums.js     # Album CRUD routes
│   │   │   ├── appinfo.js    # /appinfo + /service routes
│   │   │   └── errors.js     # Error simulation routes
│   │   ├── middleware/
│   │   │   └── validation.js # Request validation
│   │   └── models/
│   │       └── album.js      # Album DB queries
│   └── tests/
│       ├── albums.test.js    # Characterization tests
│       └── contract.test.js  # API contract tests
└── frontend/                 ← React 18 + Vite SPA (port 5173 dev)
    └── src/
        ├── App.jsx           # Router + layout
        ├── App.css           # Green navbar + grid styles
        ├── api/albums.js     # Fetch wrapper (all API calls)
        ├── hooks/
        │   ├── useAlbums.js  # Album CRUD state
        │   └── useStatus.js  # Status message state
        └── components/
            ├── Header.jsx
            ├── Footer.jsx
            ├── AlbumsPage.jsx
            ├── AlbumGrid.jsx
            ├── AlbumList.jsx
            ├── AlbumCard.jsx
            ├── AlbumForm.jsx
            ├── InPlaceEdit.jsx
            ├── ViewToggle.jsx
            ├── SortControls.jsx
            ├── StatusMessage.jsx
            └── ErrorsPage.jsx
```

---

## Running in Development

Requires Node.js 18+. Open two terminals:

**Terminal 1 — Backend API**
```bash
cd Modernized/backend
npm install
npm run dev          # nodemon, auto-restarts on change
# API on http://localhost:3001
```

**Terminal 2 — Frontend**
```bash
cd Modernized/frontend
npm install
npm run dev          # Vite dev server with HMR
# App on http://localhost:5173
```

The Vite proxy forwards all `/albums`, `/appinfo`, `/service`, `/errors`, `/actuator` requests to `localhost:3001`, so the frontend always uses the same URL paths in dev and production.

---

## Running in Production (single process)

```bash
cd Modernized/frontend && npm run build
cd Modernized/backend && npm start
# App + API on http://localhost:3001
```

Express serves the React build as static files and also exposes the API — no separate web server needed.

---

## Running Tests

**Backend (characterization + contract tests):**
```bash
cd Modernized/backend
npm test
# 21 tests — albums.test.js + contract.test.js
```

**Frontend (component tests):**
```bash
cd Modernized/frontend
npm test
# AlbumsPage.test.jsx — covers US-1 AC-1/2/3/4
```

---

## API Endpoints

Matches the legacy `AlbumController.java` + `InfoController.java` + `ErrorController.java` contract exactly.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/albums` | List all albums |
| `GET` | `/albums/:id` | Get album by ID (returns `null` if not found) |
| `PUT` | `/albums` | Create album (legacy convention: PUT = add) |
| `POST` | `/albums` | Update album (legacy convention: POST = update) |
| `DELETE` | `/albums/:id` | Delete album |
| `GET` | `/appinfo` | Active profiles + bound services |
| `GET` | `/service` | Service list (empty — no CF) |
| `GET` | `/actuator/health` | Health check (`{ status: "UP" }`) |
| `GET` | `/errors/kill` | Kills the process (`process.exit(1)`) |
| `GET` | `/errors/throw` | Returns HTTP 500 |
| `GET` | `/errors/fill-heap` | Exhausts Node.js heap |

---

## Anti-Corruption Layer

The following legacy Java artifacts are stripped at the boundary and never exposed in the API:

| Legacy artifact | Handling |
|----------------|----------|
| `_class` field in `albums.json` | Stripped during seed import (`seed.js`) |
| `release_year` / `track_count` / `album_id` (snake_case DB columns) | Mapped to `releaseYear` / `trackCount` / `albumId` in `album.js` `toJson()` |
| `PUT` = create, `POST` = update (unconventional) | Preserved at API boundary to maintain frontend contract |
| CF-specific profile/service data | Replaced with `{ profiles: ["node"], services: [] }` |

---

## Legacy → Modern Mapping

| Legacy Component | Modern Equivalent |
|-----------------|------------------|
| `Application.java` | `src/index.js` |
| `Album.java` (JPA entity) | `prisma/schema` / `src/models/album.js` |
| `AlbumRepositoryPopulator.java` | `src/db/seed.js` |
| `AlbumController.java` | `src/routes/albums.js` |
| `InfoController.java` | `src/routes/appinfo.js` |
| `ErrorController.java` | `src/routes/errors.js` |
| `app.js` (Angular module + routes) | `App.jsx` (React Router) |
| `albums.js` (3 controllers + directive + 3 factories) | 7 components + 2 hooks |
| `status.js` (factory + controller) | `useStatus.js` + `StatusMessage.jsx` |
| `albums.html` | `AlbumsPage.jsx` |
| `grid.html` | `AlbumGrid.jsx` + `AlbumCard.jsx` |
| `list.html` | `AlbumList.jsx` |
| `albumForm.html` | `AlbumForm.jsx` |
| `inPlaceEdit` directive | `InPlaceEdit.jsx` |
| `header.html` + `InfoController` | `Header.jsx` |
| `errors.html` + `ErrorsController` | `ErrorsPage.jsx` |
| `status.html` + `StatusController` | `StatusMessage.jsx` |
| Bootstrap 2 + jQuery + AngularJS | Bootstrap 5 + React 18 |
| H2 in-memory DB | SQLite in-memory (`better-sqlite3`) |

---

## User Stories Covered

| US | Title | Status |
|----|-------|--------|
| US-1 | View Album Catalog | ✅ 4-col grid, list view, 30 seeded albums |
| US-2 | Sort Album Catalog | ✅ Sort by title/artist/year/genre, asc/desc |
| US-3 | View a Single Album | ✅ `GET /albums/:id` returns album or null |
| US-4 | Add a New Album | ✅ Modal form, validation, persists |
| US-5 | Update an Existing Album | ✅ Inline edit + modal edit, cancel restores |
| US-6 | Delete an Album | ✅ Dropdown delete, immediate removal |
| US-7 | View Application Environment Info | ✅ Header dropdown shows profiles + services |
| US-8 | Access Health and Metrics Endpoints | ✅ `/actuator/health` returns `{ status: "UP" }` |
| US-11 | Simulate Application Failures | ✅ `/errors/kill`, `/errors/throw`, `/errors/fill-heap` |
