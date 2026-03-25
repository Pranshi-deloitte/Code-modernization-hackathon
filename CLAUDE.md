# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This is a **Code Modernization Hackathon** repository. The `Legacy/` directory contains the original Spring Music application; the `Modernized/` directory is the target for the modernized version.

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
