# Team Spring Music Modernization

## Participants
- Jitesh Mhatre - jmhatre@deloitte.com (PM - The stories)
- Arjun - arjbhattacharjee@deloitte.com
- Hemalatha V - hv7@deloitte.com (Architect)
- Santhosh PL - sanpl@deloitte.com (Tester)
- Jitender
- Suyash Singh - suyassingh@deloitte.com
- Prasham Ashesh - pashesh@deloitte.com
- Pranshi Garg - pragarg@deloitte.com

## Scenario
Scenario 1: Code Modernization for Spring Music

## What We Built

We modernized the Spring Music monolith — a Spring Boot 2.4 + AngularJS 1.2 app — into a Node.js (Express) backend with a React (Vite) frontend. The full replacement lives in `Modernized/`, built alongside the untouched legacy in `Legacy/` using a strangler fig approach.

The backend is a Node.js/Express API on port 3001, backed by SQLite in-memory (equivalent to the legacy H2 default), with full CRUD for albums, an `/appinfo` endpoint, error simulation endpoints (`/errors/kill`, `/errors/throw`, `/errors/fill-heap`), and a `/actuator/health` endpoint — all matching the legacy API contract exactly, including unconventional PUT-for-create / POST-for-update semantics and `null` (not 404) for missing albums.

The frontend is a React 18 + Bootstrap 5 SPA with grid/list view toggle, 4-field sort with direction toggle, inline editing (click any field to edit in place), a modal form for add/edit, and a status alert bar — all wired to the new backend. Characterization tests (Vitest + Supertest) pin the API contract, and contract tests verify the shape the React frontend depends on.

## Challenges Attempted

| # | Challenge | Status | Notes |
|---|---|---|---|
| 1 | User Stories | done | Full catalog of user stories covering view, sort, add, edit, delete, environment info, health, errors |
| 2 | Architecture Decomposition | done | Decomposition map identifying 8 seams with extraction risk ratings |
| 3 | Anti-Corruption Layer | done | Strips `_class`, preserves camelCase, matches null-for-missing, PUT/POST semantics at API boundary |
| 4 | Characterization Tests | done | 12 tests pinning API behavior (albums CRUD, appinfo, health, errors) |
| 5 | Service Extraction | done | Full Node.js backend + React frontend in `Modernized/` — everything runs |
| 6 | Contract Tests | done | Contract tests verifying response shape, content-type, PUT/POST return values |

## Key Decisions

**Node.js + Express over another Spring Boot service** — dropping the JVM entirely removes the Cloud Foundry / CfEnv coupling that was baked into startup. SQLite in-memory mirrors H2 behavior without the JPA complexity.

**Preserve the unconventional PUT/POST semantics** — legacy uses PUT for create and POST for update. We matched this at the API boundary rather than fixing it, to avoid breaking the existing AngularJS frontend during any parallel-run period (strangler fig strategy).

**React + Vite over Next.js** — the legacy app is a pure SPA with no SSR needs. Vite keeps the dev loop fast and the output is a static bundle that can be served the same way as the legacy AngularJS assets.

**Bootstrap 5 over Bootstrap 3** — the legacy uses Bootstrap 3 (EOL). We ported the green navbar CSS and kept the same grid classes where they overlapped; Bootstrap 5 handles the rest without a jQuery dependency.

## How to Run It

Requires Node.js 18+. No Docker needed.

**Backend:**
```bash
cd Modernized/backend
npm install
npm start
# API running at http://localhost:3001
# curl http://localhost:3001/albums          → 30 seeded albums
# curl http://localhost:3001/actuator/health → { status: "UP" }
```

**Frontend:**
```bash
cd Modernized/frontend
npm install
npm run dev
# App running at http://localhost:5173
```

**Tests:**
```bash
cd Modernized/backend
npm test   # characterization + contract tests

cd Modernized/frontend
npm test   # component tests
```

**Legacy app (unchanged):**
```bash
cd Legacy/spring-music
./gradlew clean assemble
java -jar build/libs/spring-music.jar
# Runs at http://localhost:8080
```

## If We Had Another Day

1. **Auth** — no endpoint is protected, including `/errors/kill`. Add JWT middleware as the first hardening pass.
2. **Persistent storage** — swap SQLite in-memory for a file-backed or Postgres instance so data survives restarts.
3. **Dual-write / cutover runbook** — wire the new backend as a proxy in front of the legacy one, add dual-write for mutations, then drain traffic over.
4. **CI/CD pipelines** — independent GitHub Actions workflows for backend and frontend: lint → test → build → deploy.
5. **Error boundary + loading states** — the React frontend currently has minimal error handling for network failures.

## How We Used Claude Code

Claude Code generated the full implementation plan (`Modernized/plan.md`) in one shot — a detailed strangler fig decomposition mapping every legacy file to its replacement, with challenge annotations. This saved the most time: instead of spending the first hour arguing about architecture, we had a concrete file-by-file plan within minutes.

It scaffolded the entire `Modernized/` directory — backend routes, models, middleware, React components, hooks, and tests — matching the legacy API contract precisely, including edge cases like `null` returns for missing albums and the unconventional PUT/POST verb semantics. The characterization and contract tests were generated alongside the implementation, not as an afterthought.

Most surprising: it correctly identified the Cloud Foundry coupling in `SpringApplicationContextInitializer` as the highest-risk seam and proposed dropping it entirely rather than emulating it — which was the right call.
