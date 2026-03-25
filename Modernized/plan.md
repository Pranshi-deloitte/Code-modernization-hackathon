# Spring Music Modernization Plan: Java/Spring Boot + AngularJS -> Node.js + React

## Context

The Spring Music application is a legacy Spring Boot 2.4 + AngularJS 1.2 app that manages an album catalog. It was built as a Cloud Foundry demo but has become a realistic stand-in for a production monolith. The goal is to modernize it to a **Node.js (Express) backend + React frontend** using a **strangler fig approach** — building the new system alongside the old, proving both work, then cutting over.

**Key legacy liabilities:**
- AngularJS 1.2 (EOL since 2018)
- Spring Boot 2.4 (EOL)
- No auth on any endpoint (including destructive `/errors/*`)
- Tight coupling between Cloud Foundry service detection and app startup

**Target stack:** Node.js + Express backend, React (Vite) frontend, SQLite in-memory (equivalent of H2), all in the `Modernized/` folder.

---

## Legacy Application — Full Inventory

### Backend (Java/Spring Boot)

| File | Role |
|------|------|
| `Application.java` | Entry point — registers `SpringApplicationContextInitializer` + `AlbumRepositoryPopulator` |
| `Album.java` | JPA entity — fields: `id`, `title`, `artist`, `releaseYear`, `genre`, `trackCount`, `albumId` |
| `ApplicationInfo.java` | DTO — `profiles[]` + `services[]` |
| `RandomIdGenerator.java` | Hibernate ID generator for string UUIDs |
| `AlbumController.java` | REST controller — `GET /albums`, `GET /albums/{id}`, `PUT /albums` (add), `POST /albums` (update), `DELETE /albums/{id}` |
| `InfoController.java` | REST controller — `GET /appinfo` (profiles + services), `GET /service` (CF service list) |
| `ErrorController.java` | REST controller — `GET /errors/kill`, `GET /errors/throw`, `GET /errors/fill-heap` |
| `SpringApplicationContextInitializer.java` | Auto-detects CF-bound DB services, activates Spring profiles, excludes unused auto-configs |
| `JpaAlbumRepository.java` | Spring Data JPA repo — active when NOT mongodb and NOT redis profiles |
| `MongoAlbumRepository.java` | Spring Data MongoDB repo — active on `mongodb` profile |
| `RedisAlbumRepository.java` | Manual `CrudRepository` impl using `HashOperations` — active on `redis` profile |
| `RedisConfig.java` | Redis template configuration |
| `AlbumRepositoryPopulator.java` | On `ApplicationReadyEvent`, loads `albums.json` into empty DB using `Jackson2ResourceReader` |
| `application.yml` | Config: JPA DDL auto-gen, actuator exposure, MySQL/Postgres profile datasources |
| `albums.json` | Seed data — 30 classic albums with `_class`, `artist`, `title`, `releaseYear`, `genre` fields |

### Frontend (AngularJS 1.2)

#### Modules & Routing (`app.js`)
- **Main module:** `SpringMusic` — depends on `albums`, `errors`, `status`, `info`, `ngRoute`, `ui.directives`
- **Routes:**
  - `/errors` → `ErrorsController` + `templates/errors.html`
  - Everything else → `AlbumsController` + `templates/albums.html`

#### AngularJS Factories (Services)

| Factory | Module | File | Purpose |
|---------|--------|------|---------|
| `Albums` | `albums` | `albums.js` | `$resource('albums')` — list/save albums |
| `Album` | `albums` | `albums.js` | `$resource('albums/:id')` — get/delete single album |
| `EditorStatus` | `albums` | `albums.js` | Tracks which field is being inline-edited: `enable(id, fieldName)`, `disable()`, `isEnabled(id, fieldName)` |
| `Errors` | `errors` | `errors.js` | `$resource('errors')` with custom `kill` and `throw` actions |
| `Info` | `info` | `info.js` | `$resource('appinfo')` — loads app info for header |
| `Status` | `status` | `status.js` | Shared status message service: `success(msg)`, `error(msg)`, `clear()` — used across all controllers |

#### AngularJS Controllers

| Controller | File | Behavior |
|------------|------|----------|
| `AlbumsController` | `albums.js` | Main page — calls `Albums.query()` to list, `Albums.save()` to add/update, `Album.delete()` to delete. Manages view toggle (`grid`/`list`), sort field (`title`/`artist`/`releaseYear`/`genre`), sort direction. Opens `$modal` for add/edit. |
| `AlbumModalController` | `albums.js` | Modal controller — receives `album` + `action` ('add'/'update'). Validates `yearPattern = /^[1-2]\d{3}$/`. Calls `$modalInstance.close(album)` on OK, `dismiss('cancel')` on cancel. |
| `AlbumEditorController` | `albums.js` | Inline editing — `enableEditor(album, fieldName)` stores current value, `save(album, fieldName)` calls `Albums.save()`, `disableEditor()` cancels. Used by `inPlaceEdit` directive. |
| `ErrorsController` | `errors.js` | Error page — `kill()` calls `Errors.kill()`, `throwException()` calls `Errors.throw()`. Displays appropriate status messages on success/failure. |
| `InfoController` | `info.js` | Header — `$scope.info = Info.get()` loads profiles and services for display. |
| `StatusController` | `status.js` | Status bar — `$watch`es `Status.status` for changes, exposes `clearStatus()`. |

#### AngularJS Directive

| Directive | File | Behavior |
|-----------|------|----------|
| `inPlaceEdit` | `albums.js` | Custom element `<in-place-edit>` — isolate scope with `fieldName`, `inputType`, `inputClass`, `pattern`, `model`. Shows text span (click to edit) or input field (with OK/cancel buttons). Keyboard: Enter saves, Esc cancels. Uses `AlbumEditorController`. |

#### HTML Templates

| Template | Purpose | Key Angular Bindings |
|----------|---------|---------------------|
| `index.html` | App shell — loads Bootstrap 3.1.1, AngularJS 1.2.16, jQuery 2.1.0, angular-ui, angular-ui-bootstrap. Contains `ng-include` for header/footer and `<ng-view>` for routing. |
| `header.html` | Green navbar with "Spring Music" brand. Info dropdown (gear icon) showing `{{info.profiles.join()}}` and `{{info.services.join()}}`. Uses `InfoController`. |
| `footer.html` | Empty div (placeholder). |
| `albums.html` | Albums page — view toggle links (grid icon / list icon), sort links (title/artist/year/genre + chevron toggle), "add an album" link. Includes `status.html` and dynamic `albumsView` template. Uses `ng-init="init()"`. |
| `grid.html` | 4-column responsive card grid (`col-xs-6 col-sm-3 col-md-3 col-lg-3`). Each card: `<in-place-edit>` for title, artist, releaseYear, genre. Dropdown cog menu with edit/delete. Uses `ng-repeat` with `orderBy:sortField:sortDescending`. |
| `list.html` | Striped table with columns: Title, Artist, Year, Genre, actions. Each cell uses `<in-place-edit>`. Dropdown cog menu with edit/delete. Same `ng-repeat` + `orderBy` pattern. |
| `albumForm.html` | Modal form — Title (required), Artist (required), Release Year (required, `ng-pattern=yearPattern`), Genre (required). Each field has validation feedback glyphicons (warning/ok). OK button disabled when `albumForm.$invalid`. Cancel dismisses modal. |
| `errors.html` | Error page with "Kill" button (`ng-click="kill()"`) and "Throw Exception" button (`ng-click="throwException()"`). Includes status bar. |
| `status.html` | Alert bar — green `alert-success` or red `alert-danger` based on `status.isError`. Close button calls `clearStatus()`. Shows `{{status.message}}`. |

#### CSS

| File | Key Styles |
|------|-----------|
| `app.css` | Green gradient navbar (`#008a00` → `#006b00`), white navbar brand text, white buttons, body padding |
| `multi-columns-row.css` | Multi-column responsive grid layout helper |

---

## Step-by-Step Implementation Plan

### Step 1: Project Scaffolding (Modernized/)

Create the Node.js + React project structure:

```
Modernized/
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── index.js              # Express app entry point
│   │   ├── db/
│   │   │   ├── database.js       # SQLite in-memory setup + schema
│   │   │   └── seed.js           # Load albums.json seed data
│   │   ├── routes/
│   │   │   ├── albums.js         # Album CRUD routes
│   │   │   ├── appinfo.js        # App info route
│   │   │   └── errors.js         # Error simulation routes
│   │   ├── middleware/
│   │   │   └── validation.js     # Request validation
│   │   └── models/
│   │       └── album.js          # Album model/queries
│   └── tests/
│       ├── albums.test.js        # Characterization tests
│       └── contract.test.js      # Contract tests
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css               # Green navbar + layout (from legacy app.css)
│       ├── api/
│       │   └── albums.js         # API client (fetch wrapper)
│       ├── components/
│       │   ├── AlbumsPage.jsx    # ← replaces AlbumsController + albums.html
│       │   ├── AlbumGrid.jsx     # ← replaces grid.html + ng-repeat
│       │   ├── AlbumList.jsx     # ← replaces list.html + ng-repeat table
│       │   ├── AlbumCard.jsx     # ← replaces single card in grid.html
│       │   ├── AlbumForm.jsx     # ← replaces AlbumModalController + albumForm.html
│       │   ├── InPlaceEdit.jsx   # ← replaces inPlaceEdit directive + AlbumEditorController
│       │   ├── SortControls.jsx  # ← replaces sort links in albums.html
│       │   ├── ViewToggle.jsx    # ← replaces view toggle links in albums.html
│       │   ├── StatusMessage.jsx # ← replaces StatusController + status.html
│       │   ├── Header.jsx        # ← replaces InfoController + header.html
│       │   ├── ErrorsPage.jsx    # ← replaces ErrorsController + errors.html
│       │   └── Footer.jsx        # ← replaces footer.html
│       └── hooks/
│           ├── useAlbums.js      # Album state + CRUD ops (replaces Albums/Album factories)
│           └── useStatus.js      # Status message state (replaces Status factory)
└── README.md
```

**Key dependencies:**
- Backend: `express`, `better-sqlite3`, `cors`, `uuid`, `express-validator`
- Frontend: `react`, `react-dom`, `react-router-dom`, `vite`, `@vitejs/plugin-react`, `bootstrap` (3.x or 5.x)
- Testing: `vitest`, `supertest`

---

### Step 2: Backend — Database & Seed Data

**File:** `Modernized/backend/src/db/database.js`
- Initialize SQLite in-memory with `better-sqlite3`
- Create `albums` table matching the legacy `Album.java` entity:
  ```sql
  CREATE TABLE albums (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    release_year TEXT,
    genre TEXT,
    track_count INTEGER DEFAULT 0,
    album_id TEXT
  )
  ```

**File:** `Modernized/backend/src/db/seed.js`
- Read seed data from a copy of `Legacy/spring-music/src/main/resources/albums.json`
- Strip `_class` field (Java serialization artifact — ACL boundary)
- Generate UUIDs for `id`, insert all 30 albums on startup if table is empty
- Mirrors behavior of legacy `AlbumRepositoryPopulator.java` (checks `count() == 0` before populating)

---

### Step 3: Backend — Album CRUD API (Matching Legacy Contract)

**File:** `Modernized/backend/src/routes/albums.js`

Map the exact legacy `AlbumController.java` contract to Express routes:

| Legacy (AlbumController.java) | New Express Route | Notes |
|-------------------------------|-------------------|-------|
| `@RequestMapping(method=GET)` on `/albums` | `GET /albums` | Return all albums as JSON array |
| `@RequestMapping(value="/{id}", method=GET)` | `GET /albums/:id` | Return album or `null` (legacy uses `.orElse(null)`) |
| `@RequestMapping(method=PUT)` | `PUT /albums` | Create album — legacy calls `repository.save()` which generates ID |
| `@RequestMapping(method=POST)` | `POST /albums` | Update album — legacy calls `repository.save()` with existing ID |
| `@RequestMapping(value="/{id}", method=DELETE)` | `DELETE /albums/:id` | Delete by ID — legacy calls `repository.deleteById()` |

**File:** `Modernized/backend/src/middleware/validation.js`
- Validate `releaseYear` against pattern `^[1-2]\d{3}$` (matches legacy `AlbumModalController`'s `$scope.yearPattern`)
- Require title, artist, releaseYear, genre on create/update

**File:** `Modernized/backend/src/models/album.js`
- Query functions wrapping `better-sqlite3` prepared statements
- `findAll()`, `findById(id)`, `save(album)`, `deleteById(id)`, `count()`
- Returns camelCase JSON to match legacy (releaseYear, trackCount, albumId)

---

### Step 4: Backend — Info & Error Endpoints

**File:** `Modernized/backend/src/routes/appinfo.js`
- `GET /appinfo` — Return `{ profiles: ["node"], services: [] }` (replaces legacy `InfoController.java` which reads from `CfEnv`)
- `GET /service` — Return `[]` (no CF services in Node.js — replaces `cfEnv.findAllServices()`)

**File:** `Modernized/backend/src/routes/errors.js`
Replaces legacy `ErrorController.java`:
- `GET /errors/kill` — `process.exit(1)` (matches `System.exit(1)`)
- `GET /errors/throw` — Throw error, return 500 (matches `throw new NullPointerException(...)`)
- `GET /errors/fill-heap` — Allocate memory in loop (matches `junk.add(new int[9999999])`)

---

### Step 5: Backend — Express Server Setup

**File:** `Modernized/backend/src/index.js`
- Create Express app on port 3001
- Enable CORS (for React dev server on different port)
- JSON body parser middleware
- Mount routes: `/albums`, `/appinfo`, `/service`, `/errors`
- Initialize database + run seed on startup
- Health endpoint: `GET /actuator/health` returning `{ status: "UP", db: "SQLite (in-memory)" }` (replaces Spring Actuator)

---

### Step 6: Frontend — React App Setup (replaces AngularJS app module + routing)

**Replaces:** `app.js` (Angular module + `$routeProvider` config) + `index.html` (app shell)

**File:** `Modernized/frontend/src/App.jsx`
- React Router replacing AngularJS `$routeProvider`:
  - `/` → `<AlbumsPage />` (replaces `AlbumsController` + `albums.html`)
  - `/errors` → `<ErrorsPage />` (replaces `ErrorsController` + `errors.html`)
- Layout: `<Header />` + `<Outlet />` + `<Footer />` (replaces `ng-include` pattern)

**File:** `Modernized/frontend/src/App.css`
- Port legacy `app.css` green navbar styles (`#008a00` gradient)
- Port `multi-columns-row.css` grid layout

**File:** `Modernized/frontend/src/api/albums.js`
Replaces all AngularJS `$resource` factories (`Albums`, `Album`, `Errors`, `Info`):
- `getAlbums()` — replaces `Albums.query()`
- `getAlbum(id)` — replaces `Album.get({id})`
- `addAlbum(album)` — replaces `Albums.save(album)` (PUT)
- `updateAlbum(album)` — replaces `Albums.save({}, album)` (POST)
- `deleteAlbum(id)` — replaces `Album.delete({id})`
- `getAppInfo()` — replaces `Info.get()`
- `killApp()` — replaces `Errors.kill()`
- `throwError()` — replaces `Errors.throw()`

---

### Step 7: Frontend — Albums Page (replaces AlbumsController + albums.html)

**File:** `Modernized/frontend/src/components/AlbumsPage.jsx`
Replaces `AlbumsController` function + `albums.html` template:
- State: `albums`, `albumsView` ('grid'/'list'), `sortField`, `sortDescending`
- On mount: fetch albums (replaces `$scope.init()` → `list()` → `Albums.query()`)
- Renders: `<ViewToggle>`, `<SortControls>`, add button, `<StatusMessage>`, and either `<AlbumGrid>` or `<AlbumList>`

**File:** `Modernized/frontend/src/hooks/useAlbums.js`
Replaces `Albums`/`Album` factories + controller CRUD methods:
- `albums` state + `fetchAlbums()`, `addAlbum()`, `updateAlbum()`, `deleteAlbum()`
- Calls API client, updates local state, triggers status messages

**File:** `Modernized/frontend/src/hooks/useStatus.js`
Replaces `Status` factory + `StatusController`:
- `status` state (null | `{ isError, message }`)
- `success(msg)`, `error(msg)`, `clear()` functions
- Replaces the `$watch` pattern with React state

---

### Step 8: Frontend — Album Views (replaces grid.html + list.html)

**File:** `Modernized/frontend/src/components/AlbumGrid.jsx`
Replaces `grid.html`:
- Maps over sorted albums (replaces `ng-repeat="album in albums | orderBy:sortField:sortDescending"`)
- 4-column responsive grid (`col-xs-6 col-sm-3 col-md-3 col-lg-3`)
- Renders `<AlbumCard>` for each album

**File:** `Modernized/frontend/src/components/AlbumCard.jsx`
Replaces single card `<div class="thumbnail">` in `grid.html`:
- `<InPlaceEdit>` for title, artist, releaseYear, genre (replaces `<in-place-edit>` directives)
- Dropdown cog menu with edit/delete (replaces Bootstrap dropdown with `ng-click="updateAlbum(album)"` / `ng-click="deleteAlbum(album)"`)

**File:** `Modernized/frontend/src/components/AlbumList.jsx`
Replaces `list.html`:
- Striped table with columns: Title, Artist, Year, Genre, actions
- Each cell uses `<InPlaceEdit>` (replaces `<in-place-edit>` in table cells)
- Same dropdown cog menu pattern

**File:** `Modernized/frontend/src/components/ViewToggle.jsx`
Replaces view toggle links in `albums.html`:
- Grid icon + list icon (replaces `ng-click="setAlbumsView('grid')"` / `setAlbumsView('list')`)

**File:** `Modernized/frontend/src/components/SortControls.jsx`
Replaces sort links in `albums.html`:
- Links for title/artist/year/genre (replaces `ng-click="sortField='title'"` etc.)
- Chevron up/down toggle (replaces `ng-class="{'glyphicon-chevron-up': !sortDescending, 'glyphicon-chevron-down': sortDescending}"`)

---

### Step 9: Frontend — CRUD UI (replaces AlbumModalController + AlbumEditorController)

**File:** `Modernized/frontend/src/components/AlbumForm.jsx`
Replaces `AlbumModalController` + `albumForm.html`:
- Modal dialog with fields: Title, Artist, Release Year, Genre
- All required (replaces `required` attribute on each input)
- Year validation: `^[1-2]\d{3}$` (replaces `ng-pattern=yearPattern`)
- Per-field validation feedback icons (replaces `ng-class="{'has-warning': albumForm.title.$invalid, 'has-success': albumForm.title.$valid}"`)
- OK button disabled when invalid (replaces `ng-disabled="albumForm.$invalid"`)
- Cancel dismisses (replaces `$modalInstance.dismiss('cancel')`)
- Dynamic header: "Add an album" / "Edit an album" (replaces `ng-show="albumAction === 'add'"`)

**File:** `Modernized/frontend/src/components/InPlaceEdit.jsx`
Replaces `inPlaceEdit` directive + `AlbumEditorController`:
- Click text to enter edit mode (replaces `ng-click="enableEditor(ipeModel, ipeFieldName)"`)
- Input field with OK/cancel buttons (replaces directive template)
- Enter key saves, Esc key cancels (replaces `ui-keyup="{enter: 'save(...)', esc: 'disableEditor()'}"`)
- Only one field editable at a time (replaces `EditorStatus` factory's singleton tracking)
- Props: `fieldName`, `inputType`, `inputClass`, `model`, `onSave`

**File:** `Modernized/frontend/src/components/StatusMessage.jsx`
Replaces `StatusController` + `status.html`:
- Renders alert (green success / red danger) based on status state
- Close button (replaces `ng-click="clearStatus()"`)
- Shows message text (replaces `{{status.message}}`)

---

### Step 10: Frontend — Header, Errors, Footer

**File:** `Modernized/frontend/src/components/Header.jsx`
Replaces `InfoController` + `header.html`:
- Green gradient navbar (replaces `.navbar .container` CSS)
- "Spring Music" brand with music glyphicon
- Info dropdown (replaces gear icon dropdown):
  - Shows `profiles.join()` and `services.join()` from `GET /appinfo`
- Navigation link to `/errors` page

**File:** `Modernized/frontend/src/components/ErrorsPage.jsx`
Replaces `ErrorsController` + `errors.html`:
- "Force Errors" heading
- "Kill" button (replaces `ng-click="kill()"`) — calls `killApp()` API
- "Throw Exception" button (replaces `ng-click="throwException()"`) — calls `throwError()` API
- Status messages for results (replaces error callback handling)

**File:** `Modernized/frontend/src/components/Footer.jsx`
Replaces `footer.html` — minimal footer component

---

### Step 11: Characterization Tests — Pin Legacy Behavior (Challenge 4)

**File:** `Modernized/backend/tests/albums.test.js`

Using `vitest` + `supertest`, pin the exact behavior matching legacy `AlbumController.java`:

```
- GET /albums → 200 + array of 30 seeded albums (matches Albums.query())
- GET /albums/:validId → 200 + album object with all 7 fields (matches Album.get())
- GET /albums/:invalidId → 200 + null body (matches repository.findById().orElse(null))
- PUT /albums + valid body → 200 + created album with generated id (matches Albums.save() for add)
- PUT /albums + missing title → 400 (validation, not in legacy but needed)
- PUT /albums + invalid releaseYear → 400 (matches yearPattern validation)
- POST /albums + existing album → 200 + updated album (matches Albums.save() for update)
- DELETE /albums/:id → 200 (matches Album.delete())
- DELETE /albums/:nonexistentId → 200 (matches legacy — no error on missing)
- GET /appinfo → 200 + { profiles: [...], services: [...] }
- GET /actuator/health → 200 + { status: "UP" }
- GET /errors/throw → 500
```

---

### Step 12: Contract Tests (Challenge 7)

**File:** `Modernized/backend/tests/contract.test.js`

Verify the API contract that the React frontend depends on:
- Response shape: `{ id, title, artist, releaseYear, genre, trackCount, albumId }` (matches legacy `Album.java` fields)
- Content-Type: `application/json`
- PUT returns the saved album with a generated `id` (frontend depends on this for optimistic updates)
- POST returns the updated album (frontend depends on this for state refresh)
- GET /albums returns an array (frontend iterates with `.map()`)
- GET /albums/:id returns object or null (not 404 — frontend checks for null)

---

## Decomposition Map (Challenge 3)

| Seam | Legacy Files | New Files | Extraction Risk |
|------|-------------|-----------|-----------------|
| **Album CRUD** | `AlbumController.java` + `JpaAlbumRepository.java` / `MongoAlbumRepository.java` / `RedisAlbumRepository.java` | `backend/src/routes/albums.js` + `backend/src/models/album.js` | Low — clean REST API, no shared state |
| **App Info** | `InfoController.java` + `ApplicationInfo.java` + `CfEnv` dependency | `backend/src/routes/appinfo.js` | Low — thin endpoint, CF-specific logic dropped |
| **Error Simulation** | `ErrorController.java` | `backend/src/routes/errors.js` | Low — isolated, no dependencies |
| **Database Abstraction** | `SpringApplicationContextInitializer.java` + 3 repo implementations + `application.yml` profiles | `backend/src/db/database.js` | Medium — simplified to single DB (SQLite in-memory) |
| **Seed Data** | `AlbumRepositoryPopulator.java` + `albums.json` | `backend/src/db/seed.js` + copied `albums.json` | Low — reuses same seed data |
| **Frontend App Shell** | `app.js` + `index.html` | `App.jsx` + `main.jsx` + `index.html` | Medium — full framework swap (AngularJS → React) |
| **Album UI** | `albums.js` (3 controllers + 1 directive + 3 factories) + 5 templates | 8 React components + 2 hooks | Medium — most complex piece, but behavior is fully specified |
| **Status System** | `status.js` (factory + controller) + `status.html` | `useStatus.js` hook + `StatusMessage.jsx` | Low — simple state pattern |

**Strategy:** Strangler fig — the new Node.js/React app in `Modernized/` runs independently alongside the legacy in `Legacy/`. Both expose the same REST API contract. The `albums.json` seed data is shared.

---

## Anti-Corruption Layer (Challenge 6)

The ACL ensures the legacy's data model doesn't leak into the new service:
- **`_class` field:** Legacy `albums.json` includes `"_class": "org.cloudfoundry.samples.music.domain.Album"` (Java serialization artifact) — strip during seed import, never expose in API
- **`albumId` vs `id`:** Legacy has both — preserve in schema for compatibility but `id` is the primary key in new system
- **Null for missing:** Legacy returns `null` for `GET /albums/:nonexistentId` (via `.orElse(null)`) — match at API boundary but use proper error handling internally
- **camelCase fields:** Legacy uses `releaseYear`, `trackCount`, `albumId` — maintain exact casing in JSON responses (no snake_case conversion)
- **PUT/POST semantics:** Legacy uses PUT for create and POST for update (unconventional) — match at API boundary to preserve frontend contract
- **CF-specific data:** Legacy `InfoController` returns Cloud Foundry service data — replace with Node.js equivalent (profile = "node", services = [])

---

## Verification Plan

### How to test end-to-end:

1. **Backend:**
   ```bash
   cd Modernized/backend
   npm install
   npm start          # Starts on port 3001
   # curl http://localhost:3001/albums          → 30 albums array
   # curl http://localhost:3001/albums/{id}     → single album or null
   # curl http://localhost:3001/appinfo         → { profiles, services }
   # curl http://localhost:3001/actuator/health → { status: "UP" }
   ```

2. **Frontend:**
   ```bash
   cd Modernized/frontend
   npm install
   npm run dev        # Starts on port 5173
   # Browser: see 30 albums in 4-column grid
   # Toggle to list view (table)
   # Sort by title → albums reorder alphabetically
   # Click "add an album" → modal opens → fill form → submit → new album in grid
   # Click album title → inline edit → type new value → Enter → saves
   # Click cog → delete → album disappears
   # Navigate to /errors → click Kill / Throw Exception buttons
   ```

3. **Tests:**
   ```bash
   cd Modernized/backend
   npm test           # Runs characterization + contract tests via vitest
   ```

4. **User Story Acceptance Checklist:**
   - US-1 (View Catalog): 30 albums in grid, all fields visible ✓
   - US-2 (Sort): Sort by 4 fields, toggle direction, visual indicator ✓
   - US-3 (View Single): GET /albums/:id returns album or null ✓
   - US-4 (Add): Modal form, all required, year validation, persists ✓
   - US-5 (Update): Inline edit + modal edit, cancel restores ✓
   - US-6 (Delete): Dropdown delete, immediate removal, persists ✓
   - US-7 (Environment): Header dropdown shows profile + services ✓
   - US-8 (Health): /actuator/health returns UP ✓
   - US-11 (Errors): Kill/throw/fill-heap endpoints work ✓

---

## Implementation Order

| # | Task | Challenge | What it replaces |
|---|------|-----------|-----------------|
| 1 | Backend scaffolding + SQLite + seed | Ch. 5 | `Application.java` + `AlbumRepositoryPopulator` + H2 |
| 2 | Album CRUD API routes + model | Ch. 5 | `AlbumController.java` + `JpaAlbumRepository` |
| 3 | Info + error + health routes | Ch. 5 | `InfoController.java` + `ErrorController.java` + Actuator |
| 4 | Characterization tests | Ch. 4 | Pin behavior before frontend work |
| 5 | React project setup + Vite + routing | Ch. 5 | `app.js` + `index.html` |
| 6 | Header + Footer + StatusMessage | Ch. 5 | `header.html` + `footer.html` + `status.html` + controllers |
| 7 | AlbumsPage + grid/list views + sorting | Ch. 5 | `albums.html` + `grid.html` + `list.html` + `AlbumsController` |
| 8 | AlbumForm modal + InPlaceEdit | Ch. 5 | `albumForm.html` + `inPlaceEdit` directive + controllers |
| 9 | ErrorsPage | Ch. 5 | `errors.html` + `ErrorsController` |
| 10 | Contract tests | Ch. 7 | Verify frontend-backend contract |
| 11 | Final verification against user stories | — | End-to-end validation |

---

## Key Legacy Files Reference

| Legacy File | What to extract | Used in Step |
|-------------|----------------|-------------|
| `Legacy/spring-music/src/main/resources/albums.json` | Seed data (copy, strip `_class`) | Step 2 |
| `Legacy/.../web/AlbumController.java` | API contract (5 endpoints) | Step 3 |
| `Legacy/.../domain/Album.java` | Domain model (7 fields) | Step 2, 3 |
| `Legacy/.../web/InfoController.java` | `/appinfo` + `/service` contract | Step 3 |
| `Legacy/.../web/ErrorController.java` | Error endpoint behavior | Step 3 |
| `Legacy/.../repositories/AlbumRepositoryPopulator.java` | Seed-on-empty logic | Step 2 |
| `Legacy/.../static/js/albums.js` | All frontend behavior (3 controllers, 1 directive, 3 factories) | Steps 7-8 |
| `Legacy/.../static/js/errors.js` | Error page behavior | Step 9 |
| `Legacy/.../static/js/status.js` | Status service pattern | Step 6 |
| `Legacy/.../static/js/info.js` | Header info loading | Step 6 |
| `Legacy/.../static/templates/grid.html` | Grid layout (4-col cards) | Step 7 |
| `Legacy/.../static/templates/list.html` | Table layout | Step 7 |
| `Legacy/.../static/templates/albumForm.html` | Modal form + validation | Step 8 |
| `Legacy/.../static/templates/header.html` | Navbar + info dropdown | Step 6 |
| `Legacy/.../static/templates/errors.html` | Error page buttons | Step 9 |
| `Legacy/.../static/templates/status.html` | Alert bar | Step 6 |
| `Legacy/.../static/css/app.css` | Green navbar styles | Step 5 |
