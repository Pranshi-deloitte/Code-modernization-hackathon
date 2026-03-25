# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This is a **Code Modernization Hackathon** repository. The `Legacy/` directory contains the original Spring Music application; the `Modernized/` directory is the target for the modernized version.

> **Do not make any changes inside `Legacy/`.**

## Project Goal

Spring Music is a Spring Boot sample app built for Cloud Foundry. It stores the same domain objects across relational, document, and key-value stores using bean profiles and Spring Cloud Connectors. It was never meant to be realistic — it was meant to demo persistence options. Which is exactly why it's a perfect stand-in for "someone built this to prove a point and then it accidentally became production."

The goal is to modernize this legacy monolith by picking a lane: write user stories, decompose the architecture, pin behavior with characterization tests, extract services with clean contracts, build anti-corruption layers, add contract tests, wire up independent CI/CD pipelines, and — if you're still standing — handle dual-write event-driven extraction and write the 3am cutover runbook. Pick a lane or pair up. Nobody finishes all ten — that's the point.

## Building and Running (Legacy App)

All commands run from `Legacy/spring-music/`:

```bash
# Build
./gradlew clean assemble

# Run with default (H2 in-memory) database
java -jar build/libs/spring-music.jar

# Run with a specific database profile
java -jar -Dspring.profiles.active=mysql build/libs/spring-music.jar
# Profiles: mysql, postgres, mongodb, redis (default: h2 in-memory)
```

## Architecture Diagram

A full visual architecture reference is available at `Documentation/architecture-diagram.html`. It covers:

1. **High-Level System Overview** — Frontend (React + Vite) ↔ Backend (Node.js + Express) ↔ Database
2. **Strangler Fig — Legacy vs Modernized** — Side-by-side view of both systems sharing the same API contract, traffic routed via DNS/load balancer
3. **Frontend Component Architecture** — React 18 component tree mapped 1:1 from legacy AngularJS pieces
4. **Frontend State & Data Flow** — Component → Hook → API Client → `fetch()` → Express backend (:3001)
5. **Backend Layer Architecture** — Middleware → Routes → Model, replacing JPA/Mongo/Redis repositories with a single Node.js adapter
6. **Anti-Corruption Layer (ACL)** — Boundaries preventing legacy data model artifacts from leaking into the modernized system
7. **Request Lifecycle** — Step-by-step trace of a PUT /albums request end-to-end
8. **Technology Stack Comparison** — Legacy (JVM / Spring Boot / AngularJS) vs Modernized (Node.js 18+ / Express 4 / React 18)

> Modernization target: **Node.js + Express** backend, **React 18 + Vite** frontend, strangler fig pattern.

## Architecture (Legacy)

**Spring Music** is a Spring Boot 2.4.0 app demonstrating polyglot persistence — the same `Album` domain object is stored/retrieved using interchangeable backends.

### Profile-based Repository Selection

The active Spring profile determines which repository implementation is loaded:

| Profile | Repository | Backend |
|---------|-----------|---------|
| _(none)_ | `JpaAlbumRepository` | H2 (in-memory) |
| `mysql` / `postgres` / `sqlserver` | `JpaAlbumRepository` | Relational DB |
| `mongodb` | `MongoAlbumRepository` | MongoDB |
| `redis` | `RedisAlbumRepository` | Redis |

Profile activation happens dynamically at startup: `SpringApplicationContextInitializer` inspects Cloud Foundry environment variables (via `CfEnv`) and activates the appropriate profile before the context loads.

### Key Components

- **`SpringApplicationContextInitializer`** — detects bound CF services and activates matching profiles; also excludes irrelevant Spring Boot auto-configurations
- **`AlbumRepositoryPopulator`** — seeds the database from `albums.json` on startup (`ApplicationListener<ContextRefreshedEvent>`)
- **`RedisAlbumRepository`** — manual CRUD implementation (Spring Data Redis lacks out-of-the-box CRUD)
- **`AlbumController`** — REST API (`GET/PUT/POST/DELETE /albums`)
- **`InfoController`** — exposes `/appinfo` and `/service` endpoints showing active profiles and CF service bindings

### Frontend

Single-page AngularJS 1.2.16 app served as static resources. Routes handled client-side; all data via REST calls to the backend controllers.

### Cloud Foundry Deployment

```bash
cf push
cf bind-service spring-music <service-instance>
cf restart spring-music
```

---

## Modernized Stack

The `Modernized/` directory contains the replacement app: **Node.js (Express) backend + React (Vite) frontend**, using a strangler fig approach.

> **Do not make any changes inside `Legacy/`.**

### Tech Stack

| Layer | Legacy | Modernized |
|-------|--------|------------|
| Backend | Spring Boot 2.4 (Java) | Node.js + Express 4 |
| Database | H2 / MySQL / Postgres / MongoDB / Redis | SQLite in-memory (better-sqlite3) |
| Frontend | AngularJS 1.2.16 | React 18 + Vite |
| CSS | Bootstrap 3 | Bootstrap 5 |
| Testing | JUnit | Vitest + Supertest |

### Building and Running (Modernized App)

**Backend** (runs on port 3001):

```bash
cd Modernized/backend
npm install
npm start          # production
npm run dev        # with nodemon hot-reload
```

**Frontend** (runs on port 5173):

```bash
cd Modernized/frontend
npm install
npm run dev        # dev server with proxy to backend
npm run build      # production build
```

**Tests:**

```bash
# Backend characterization + contract tests
cd Modernized/backend
npm test

# Frontend component tests
cd Modernized/frontend
npm test
```

### Architecture (Modernized)

**Backend** (`Modernized/backend/src/`):

| File | Role |
|------|------|
| `index.js` | Express app entry point — port 3001, CORS, JSON middleware, mounts all routes |
| `db/database.js` | SQLite in-memory setup + schema (replaces H2 + JPA DDL auto-gen) |
| `db/seed.js` | Loads `albums.json` on startup if table empty (replaces `AlbumRepositoryPopulator`) |
| `models/album.js` | Query functions: `findAll`, `findById`, `save`, `deleteById`, `count` |
| `routes/albums.js` | Album CRUD — `GET/PUT/POST/DELETE /albums` (mirrors `AlbumController.java`) |
| `routes/appinfo.js` | `GET /appinfo` + `GET /service` (replaces `InfoController.java`, CF logic dropped) |
| `routes/errors.js` | `GET /errors/kill|throw|fill-heap` (replaces `ErrorController.java`) |
| `middleware/validation.js` | Request validation — required fields, year pattern `^[1-2]\d{3}$` |

**Frontend** (`Modernized/frontend/src/`):

| File | Replaces |
|------|----------|
| `App.jsx` | `app.js` Angular module + `$routeProvider` |
| `api/albums.js` | All `$resource` factories (`Albums`, `Album`, `Errors`, `Info`) |
| `hooks/useAlbums.js` | Albums/Album factories + controller CRUD methods |
| `hooks/useStatus.js` | `Status` factory + `StatusController` |
| `components/AlbumsPage.jsx` | `AlbumsController` + `albums.html` |
| `components/AlbumGrid.jsx` | `grid.html` + `ng-repeat` |
| `components/AlbumList.jsx` | `list.html` table |
| `components/AlbumCard.jsx` | Single card in `grid.html` |
| `components/AlbumForm.jsx` | `AlbumModalController` + `albumForm.html` |
| `components/InPlaceEdit.jsx` | `inPlaceEdit` directive + `AlbumEditorController` |
| `components/Header.jsx` | `InfoController` + `header.html` |
| `components/ErrorsPage.jsx` | `ErrorsController` + `errors.html` |
| `components/StatusMessage.jsx` | `StatusController` + `status.html` |

### API Contract (Modernized — matches Legacy exactly)

| Endpoint | Method | Behavior |
|----------|--------|----------|
| `/albums` | GET | Return all albums as JSON array |
| `/albums/:id` | GET | Return album or `null` (not 404 — matches legacy `.orElse(null)`) |
| `/albums` | PUT | Create album — generates UUID, returns saved album |
| `/albums` | POST | Update album — returns updated album |
| `/albums/:id` | DELETE | Delete by ID — 200 even if not found (matches legacy) |
| `/appinfo` | GET | `{ profiles: ["node"], services: [] }` |
| `/actuator/health` | GET | `{ status: "UP", db: "SQLite (in-memory)" }` |
| `/errors/kill` | GET | `process.exit(1)` |
| `/errors/throw` | GET | Throws, returns 500 |
| `/errors/fill-heap` | GET | Memory allocation loop |
