# Spring Music — User Stories & Acceptance Criteria

## Priority 1 — Core Data Access

### US-1: View Album Catalog
**As a** catalog user, **I want to** view all albums in the system **so that** I can browse the music inventory.

| # | Acceptance Criteria |
|---|---|
| AC-1 | When I navigate to the application root (`/`), I see all albums displayed in a grid layout (4-column responsive cards). |
| AC-2 | Each album card shows: title, artist, release year, genre, and track count. |
| AC-3 | I can toggle between **grid view** and **list view** (table format) and the display changes immediately. |
| AC-4 | On first launch with an empty database, 30 pre-seeded classic albums are automatically loaded and visible. |
| AC-5 | The page loads within an acceptable time when displaying all albums. |

---

### US-2: Sort Album Catalog
**As a** catalog user, **I want to** sort albums by different fields **so that** I can find what I'm looking for faster.

| # | Acceptance Criteria |
|---|---|
| AC-1 | I can sort albums by **title**, **artist**, **release year**, or **genre**. |
| AC-2 | I can toggle sort direction between ascending and descending. |
| AC-3 | Sorting applies immediately without a full page reload. |
| AC-4 | The current sort field and direction are visually indicated in the UI. |

---

### US-3: View a Single Album
**As a** catalog user, **I want to** retrieve a specific album by its ID **so that** I can see its full details.

| # | Acceptance Criteria |
|---|---|
| AC-1 | A `GET /albums/{id}` request with a valid ID returns the album's full details (title, artist, releaseYear, genre, trackCount, albumId). |
| AC-2 | A `GET /albums/{id}` request with a non-existent ID returns a null/empty response (no server error). |

---

## Priority 2 — Data Management

### US-4: Add a New Album
**As a** catalog manager, **I want to** add a new album to the catalog **so that** newly acquired titles are tracked.

| # | Acceptance Criteria |
|---|---|
| AC-1 | Clicking "Add" opens a modal form with fields: Title, Artist, Release Year, and Genre. |
| AC-2 | All fields are required — the form cannot be submitted with any blank field. |
| AC-3 | Release Year is validated against the pattern `^[1-2]\d{3}$` (e.g., "2024" is valid, "abcd" or "999" is rejected). |
| AC-4 | On successful submission, the new album appears in the catalog list without a page refresh. |
| AC-5 | A success message is displayed after adding. |
| AC-6 | The album is persisted — it survives a page refresh. |

---

### US-5: Update an Existing Album
**As a** catalog manager, **I want to** edit album details **so that** I can correct errors or update information.

| # | Acceptance Criteria |
|---|---|
| AC-1 | I can click on an album field to edit it **inline** (in-place editing). |
| AC-2 | I can also edit an album via a **modal form** for full editing. |
| AC-3 | After confirming changes, the updated data is reflected immediately in the UI. |
| AC-4 | I can cancel an edit and the original values are restored. |
| AC-5 | Validation rules (e.g., release year format) apply on update as well. |
| AC-6 | Changes are persisted — they survive a page refresh. |

---

### US-6: Delete an Album
**As a** catalog manager, **I want to** remove an album from the catalog **so that** obsolete or incorrect entries are cleaned up.

| # | Acceptance Criteria |
|---|---|
| AC-1 | Each album has a dropdown menu containing a delete option. |
| AC-2 | Clicking delete removes the album from the displayed list immediately. |
| AC-3 | A `DELETE /albums/{id}` call removes the album from the database. |
| AC-4 | After deletion, the album no longer appears on page refresh. |
| AC-5 | Attempting to `GET /albums/{id}` for a deleted album returns null (no crash). |

---

## Priority 3 — Operational Visibility

### US-7: View Application Environment Info
**As an** operations team member, **I want to** see which database and services the application is connected to **so that** I can verify the deployment is correct.

| # | Acceptance Criteria |
|---|---|
| AC-1 | A dropdown in the application header shows the **active Spring profile** (e.g., "mysql", "postgres", or default). |
| AC-2 | The dropdown lists all **bound Cloud Foundry service names**. |
| AC-3 | `GET /appinfo` returns JSON with `profiles` (array of active profiles) and `services` (array of bound service names). |
| AC-4 | `GET /service` returns detailed information about each bound Cloud Foundry service. |

---

### US-8: Access Health and Metrics Endpoints
**As an** operations team member, **I want to** check application health and metrics **so that** I can monitor system status.

| # | Acceptance Criteria |
|---|---|
| AC-1 | `GET /actuator/health` returns a health status with detailed information (`"showDetails": "always"` is configured). |
| AC-2 | All Spring Boot Actuator endpoints are exposed under `/actuator/*`. |
| AC-3 | Health check includes database connectivity status. |

---

## Priority 4 — Data Persistence Flexibility

### US-9: Run Against Multiple Database Backends
**As a** platform engineer, **I want to** deploy the application against different databases (MySQL, PostgreSQL, MongoDB, Redis, Oracle, SQL Server, or in-memory H2) **so that** we can choose the best storage technology for our needs.

| # | Acceptance Criteria |
|---|---|
| AC-1 | With **no profile set**, the app starts with an in-memory H2 database and all CRUD operations work. |
| AC-2 | With the `mysql` profile and a MySQL service bound, all CRUD operations work against MySQL. |
| AC-3 | With the `postgres` profile and a PostgreSQL service bound, all CRUD operations work against PostgreSQL. |
| AC-4 | With the `mongodb` profile and a MongoDB service bound, all CRUD operations work against MongoDB. |
| AC-5 | With the `redis` profile and a Redis service bound, all CRUD operations work against Redis. |
| AC-6 | Binding **two different database services** simultaneously causes the application to throw an error at startup (single-database constraint enforced). |
| AC-7 | The 30 seed albums load correctly regardless of which database backend is active. |

---

### US-10: Automatic Database Detection on Cloud Foundry
**As a** platform engineer, **I want** the application to auto-detect which database service is bound in Cloud Foundry **so that** I don't have to manually configure profiles.

| # | Acceptance Criteria |
|---|---|
| AC-1 | When a MySQL service is bound in CF, the `mysql` profile activates automatically without manual configuration. |
| AC-2 | When a PostgreSQL service is bound, the `postgres` profile activates automatically. |
| AC-3 | When a MongoDB service is bound, the `mongodb` profile activates automatically. |
| AC-4 | When a Redis service is bound, the `redis` profile activates automatically. |
| AC-5 | The `/appinfo` endpoint confirms the auto-detected profile. |

---

## Priority 5 — Resilience Testing

### US-11: Simulate Application Failures for Testing
**As a** platform engineer, **I want to** trigger controlled application failures **so that** I can verify monitoring, alerting, and auto-recovery work correctly.

| # | Acceptance Criteria |
|---|---|
| AC-1 | `GET /errors/kill` causes the application process to exit (status code 1). |
| AC-2 | `GET /errors/throw` triggers a `NullPointerException` and the application returns an HTTP 500 error. |
| AC-3 | `GET /errors/fill-heap` causes the JVM to run out of memory (for testing OOM behavior). |
| AC-4 | These endpoints are accessible from the `/errors` page in the UI via buttons. |

---

## Summary — Priority Matrix

| Priority | User Story | Business Justification |
|----------|-----------|----------------------|
| **P1** | US-1: View Catalog | Without this, the system serves no purpose |
| **P1** | US-2: Sort Catalog | Core usability for finding albums |
| **P1** | US-3: View Single Album | API-level data access |
| **P2** | US-4: Add Album | Data entry is essential for a living catalog |
| **P2** | US-5: Update Album | Data accuracy depends on edit capability |
| **P2** | US-6: Delete Album | Data hygiene |
| **P3** | US-7: View Environment Info | Ops needs to verify deployments |
| **P3** | US-8: Health/Metrics | Monitoring and uptime |
| **P4** | US-9: Multi-DB Support | Key modernization lever — swap databases without code changes |
| **P4** | US-10: Auto-Detection | Cloud-native deployment automation |
| **P5** | US-11: Failure Simulation | Testing/chaos engineering — useful but not business-critical |

---

## Modernization Notes

- **Biggest asset:** Pluggable persistence layer (US-9/US-10) — already supports 6+ databases with no code changes.
- **Biggest liabilities:**
  - AngularJS 1.2 frontend (end-of-life since 2018)
  - Spring Boot 2.4 (end-of-life)
  - No authentication or authorization on any endpoint, including destructive error endpoints
