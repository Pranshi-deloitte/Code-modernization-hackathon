# Spring Music — Modernized

A modernized rewrite of the Spring Music application, replacing the legacy Java/AngularJS stack with Node.js and React.

| | Legacy | Modernized |
|---|---|---|
| **Backend** | Spring Boot 2.4.0 (Java) | Node.js + Express 4 |
| **Frontend** | AngularJS 1.2.16 (EOL) | React 18 + Vite |
| **UI library** | Bootstrap 2 + jQuery | Bootstrap 5 |
| **Database** | H2 in-memory (JPA/Hibernate) | SQLite in-memory (`better-sqlite3`) |
| **Testing** | JUnit | Vitest + Supertest |

> **Note:** The `Legacy/` directory is untouched. All new code lives exclusively in `Modernized/`.

---

## Project Structure

```
Modernized/
├── README.md
├── plan.md                        # Full modernization plan
├── backend/                       # Node.js + Express API (port 3001)
│   ├── package.json
│   ├── vitest.config.js
│   ├── src/
│   │   ├── index.js               # Express app entry point; seeds DB on start
│   │   ├── db/
│   │   │   ├── database.js        # SQLite :memory: setup + albums table schema
│   │   │   ├── seed.js            # Seeds 29 albums from albums.json if table is empty
│   │   │   └── albums.json        # Seed data (copied verbatim from Legacy)
│   │   ├── models/
│   │   │   └── album.js           # DB queries + snake_case → camelCase mapping
│   │   ├── routes/
│   │   │   ├── albums.js          # GET/PUT/POST/DELETE /albums
│   │   │   ├── appinfo.js         # GET /appinfo, GET /service
│   │   │   └── errors.js          # GET /errors/kill|throw|fill-heap
│   │   └── middleware/
│   │       └── validation.js      # express-validator rules (title, artist, releaseYear, genre)
│   └── tests/
│       ├── albums.test.js         # Characterization tests (14 tests)
│       └── contract.test.js       # API contract tests (7 tests)
└── frontend/                      # React 18 + Vite SPA (port 5173 in dev)
    ├── package.json
    ├── vite.config.js             # Dev proxy: /albums /appinfo /errors /actuator → :3001
    ├── index.html
    └── src/
        ├── main.jsx               # ReactDOM.createRoot + Bootstrap imports
        ├── App.jsx                # BrowserRouter + routes (/ → AlbumsPage, /errors → ErrorsPage)
        ├── App.css                # Green navbar (#008a00) + multi-column grid styles
        ├── setupTests.js          # @testing-library/jest-dom setup
        ├── api/
        │   └── albums.js          # fetch wrapper for all API calls
        ├── hooks/
        │   ├── useAlbums.js       # Album CRUD state (fetchAlbums, addAlbum, updateAlbum, deleteAlbum)
        │   └── useStatus.js       # Status message state (success, error, clear)
        └── components/
            ├── AlbumsPage.jsx     # Main catalog page — sort, view toggle, CRUD
            ├── AlbumGrid.jsx      # 4-column responsive card grid
            ├── AlbumCard.jsx      # Single album card with inline edit + cog dropdown
            ├── AlbumList.jsx      # Table view with inline edit + cog dropdown
            ├── AlbumForm.jsx      # Add/Edit modal with validation
            ├── InPlaceEdit.jsx    # Click-to-edit field (Enter saves, Esc cancels)
            ├── ViewToggle.jsx     # Grid / list toggle buttons
            ├── SortControls.jsx   # Sort by title/artist/year/genre + asc/desc toggle
            ├── StatusMessage.jsx  # Success/error alert bar
            ├── Header.jsx         # Green navbar + /appinfo dropdown + nav to /errors
            ├── ErrorsPage.jsx     # Kill / Throw Exception buttons
            └── Footer.jsx         # Placeholder footer
```

---

## Prerequisites

- **Node.js 18+**
- No database installation required — SQLite runs in-memory inside the Node.js process

---

## Running in Development

Two terminals are needed; the Vite dev proxy bridges them so the frontend always calls `/albums` regardless of environment.

**Terminal 1 — Backend**
```bash
cd Modernized/backend
npm install
npm run dev
# → nodemon watches src/, restarts on change
# → API on http://localhost:3001
```

**Terminal 2 — Frontend**
```bash
cd Modernized/frontend
npm install
npm run dev
# → Vite dev server with HMR
# → App on http://localhost:5173
```

Open **http://localhost:5173** in a browser.

The Vite proxy (configured in `vite.config.js`) forwards these paths to `localhost:3001`:
`/albums` · `/appinfo` · `/service` · `/errors` · `/actuator`

---

## Running in Production (single process)

Build the React app, then start Express — it serves both the API and the static build.

```bash
cd Modernized/frontend && npm run build
cd Modernized/backend && npm start
# → App + API on http://localhost:3001
```

To use a custom port:
```bash
PORT=8080 npm start
```

---

## Running Tests

**Backend — 21 tests (characterization + contract)**
```bash
cd Modernized/backend
npm test
```

- `tests/albums.test.js` — 14 tests pinning the exact behavior of legacy `AlbumController.java`
- `tests/contract.test.js` — 7 tests verifying the JSON shape the React frontend depends on
- Each test file gets an isolated in-memory DB (`isolate: true, pool: 'forks'` in `vitest.config.js`)
- Server does not bind a port during tests (`NODE_ENV=test` guard in `index.js`)

**Frontend — component tests**
```bash
cd Modernized/frontend
npm test
```

- `components/AlbumsPage.test.jsx` — covers US-1 acceptance criteria AC-1 through AC-4

---

## API Reference

The Express API preserves the exact HTTP contract of the legacy `AlbumController.java`, `InfoController.java`, and `ErrorController.java`.

### Albums

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| `GET` | `/albums` | — | `Album[]` | Returns all albums ordered by title |
| `GET` | `/albums/:id` | — | `Album \| null` | `null` (not 404) when not found — matches legacy `.orElse(null)` |
| `PUT` | `/albums` | `Album` | `Album` | **Create** — legacy uses PUT for add |
| `POST` | `/albums` | `Album` | `Album` | **Update** — legacy uses POST for update |
| `DELETE` | `/albums/:id` | — | `{}` | No error if ID not found — matches legacy |

### Other endpoints

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/appinfo` | `{ profiles: ["node"], services: [] }` |
| `GET` | `/service` | `[]` |
| `GET` | `/actuator/health` | `{ status: "UP", db: "SQLite (in-memory)" }` |
| `GET` | `/errors/kill` | Calls `process.exit(1)` |
| `GET` | `/errors/throw` | HTTP 500 with error message |
| `GET` | `/errors/fill-heap` | Allocates memory until heap is exhausted |

### Album object shape

```json
{
  "id":          "550e8400-e29b-41d4-a716-446655440000",
  "title":       "Abbey Road",
  "artist":      "The Beatles",
  "releaseYear": "1969",
  "genre":       "Rock",
  "trackCount":  0,
  "albumId":     ""
}
```

All field names are **camelCase** — matching the legacy `Album.java` JSON serialization exactly. The underlying SQLite columns use `snake_case` (`release_year`, `track_count`, `album_id`); the mapping happens in `models/album.js` `toJson()`.

### Validation rules (applied on PUT and POST)

| Field | Rule |
|-------|------|
| `title` | Required, non-empty |
| `artist` | Required, non-empty |
| `releaseYear` | Required, must match `^[1-2]\d{3}$` (e.g. `1969`, `2024`) |
| `genre` | Required, non-empty |

Invalid requests return `400` with `{ errors: [{ msg, path }] }`.

---

## Key Design Decisions

### SQLite in-memory
Equivalent to the legacy H2 in-memory database. Data is lost when the process restarts — identical behaviour to the legacy app with no profile set. Swap to a file-based SQLite or PostgreSQL by changing the `better-sqlite3` connection string without touching any route code.

### Seed data
`seed.js` reads `albums.json` (29 classic albums, copied verbatim from `Legacy/`) and inserts them only when the table is empty — mirroring `AlbumRepositoryPopulator.java`'s `count() == 0` guard. The `_class` field (a Java serialization artifact) is stripped at import and never stored or returned.

### PUT = create, POST = update
The legacy `AlbumController.java` uses `PUT` for add and `POST` for update — the reverse of typical REST convention. This is preserved intentionally so the React frontend can call the same endpoints as the legacy AngularJS frontend without needing any contract changes.

### No server bind in tests
`index.js` checks `process.env.NODE_ENV !== 'test'` before calling `app.listen()`. Vitest sets `NODE_ENV=test` via `vitest.config.js`, so test files can `import` the app and use Supertest without port conflicts.

---

## Anti-Corruption Layer

| Legacy artifact | How it's handled |
|----------------|-----------------|
| `_class` in `albums.json` | Stripped in `seed.js` before insert; never stored or returned |
| DB snake_case columns | Mapped to camelCase in `models/album.js` `toJson()` |
| `PUT` = add / `POST` = update | Preserved at route boundary; documented above |
| Cloud Foundry profile/service detection | Replaced with static `{ profiles: ["node"], services: [] }` |
| Spring Actuator `/actuator/health` | Replicated as a plain Express route |

---

## Legacy → Modern Component Map

| Legacy | Modern |
|--------|--------|
| `Application.java` | `src/index.js` |
| `Album.java` (JPA entity) | `src/models/album.js` + `src/db/database.js` schema |
| `AlbumRepositoryPopulator.java` | `src/db/seed.js` |
| `AlbumController.java` | `src/routes/albums.js` |
| `InfoController.java` | `src/routes/appinfo.js` |
| `ErrorController.java` | `src/routes/errors.js` |
| `RandomIdGenerator.java` | `uuid` npm package (`v4`) |
| `app.js` (Angular module + `$routeProvider`) | `App.jsx` (React Router v6) |
| `Albums` / `Album` `$resource` factories | `src/api/albums.js` (fetch wrapper) |
| `Status` factory + `StatusController` | `useStatus.js` + `StatusMessage.jsx` |
| `AlbumsController` + `albums.html` | `AlbumsPage.jsx` + `useAlbums.js` |
| `grid.html` | `AlbumGrid.jsx` + `AlbumCard.jsx` |
| `list.html` | `AlbumList.jsx` |
| `albumForm.html` + `AlbumModalController` | `AlbumForm.jsx` |
| `inPlaceEdit` directive + `AlbumEditorController` | `InPlaceEdit.jsx` |
| `header.html` + `InfoController` (frontend) | `Header.jsx` |
| `errors.html` + `ErrorsController` | `ErrorsPage.jsx` |
| `status.html` | `StatusMessage.jsx` |
| `app.css` (green navbar) | `App.css` |
| Bootstrap 2 + jQuery + Glyphicons | Bootstrap 5 (no jQuery) |

---

## User Stories Covered

| # | Title | Acceptance Criteria Met |
|---|-------|------------------------|
| US-1 | View Album Catalog | Grid (4-col responsive) + list view; 29 seeded albums on first launch; title/artist/year/genre/trackCount displayed |
| US-2 | Sort Album Catalog | Sort by title/artist/releaseYear/genre; asc/desc toggle; active field visually indicated |
| US-3 | View a Single Album | `GET /albums/:id` returns full album object or `null` |
| US-4 | Add a New Album | Modal form; all fields required; year validated against `^[1-2]\d{3}$`; success message; persists in DB |
| US-5 | Update an Existing Album | Inline edit (click field) + modal edit; cancel restores original; persists |
| US-6 | Delete an Album | Cog dropdown → delete; immediate removal from UI; `DELETE /albums/:id` |
| US-7 | View Application Environment Info | Header dropdown shows active profiles + bound services from `/appinfo` |
| US-8 | Access Health and Metrics | `GET /actuator/health` → `{ status: "UP", db: "SQLite (in-memory)" }` |
| US-11 | Simulate Application Failures | `/errors/kill` (`process.exit`), `/errors/throw` (500), `/errors/fill-heap` (OOM) |
