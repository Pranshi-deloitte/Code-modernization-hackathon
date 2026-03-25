# Spring Music API Tests

Contract tests that verify the modernized API is functionally equivalent to the Legacy reference.
Both suites implement the same 11 test cases defined in [API_TEST_SPEC.md](./API_TEST_SPEC.md).

## Prerequisites

Start the target application before running either suite.

**Legacy (reference):**
```bash
cd Legacy/spring-music
./gradlew clean assemble
java -jar build/libs/spring-music.jar
```

**Modernized (target):**
```bash
# start however the modernized app is configured
```

Set `BASE_URL` to point at the app under test (defaults to `http://localhost:8080`).

---

## Java (REST Assured + JUnit 5)

```bash
cd Modernized/tests/java

# Run all tests
mvn test

# Run against a different host
BASE_URL=http://localhost:9090 mvn test

# Run a single test
mvn test -Dtest=AlbumApiTest#tc02_createAlbum
```

Requires: Java 11+, Maven 3.x

---

## Node.js (Jest + axios)

```bash
cd Modernized/tests/node

# Install dependencies (first time only)
npm install

# Run all tests
npm test

# Run against a different host
BASE_URL=http://localhost:9090 npm test

# Run a single test by name
npm test -- --testNamePattern="TC-02"

# Verbose output
npm run test:verbose
```

Requires: Node.js 18+

---

## Test Cases

| ID    | Endpoint              | What it verifies |
|-------|-----------------------|-----------------|
| TC-01 | GET /albums           | Seeded data present; each item has id/title/artist |
| TC-02 | PUT /albums           | Create returns 200 with generated id and echoed fields |
| TC-03 | GET /albums/:id       | Retrieve by id matches created album |
| TC-04 | POST /albums          | Update changes title, preserves id |
| TC-05 | GET /albums/:id       | Update persisted to storage |
| TC-06 | DELETE /albums/:id    | Delete returns 200 |
| TC-07 | GET /albums/:id       | Deleted album returns null or 404 |
| TC-08 | GET /albums           | Deleted album absent from list |
| TC-09 | PUT /albums           | All fields (incl. albumId) echoed correctly |
| TC-10 | GET /appinfo          | Response has `profiles` and `services` arrays |
| TC-11 | GET /errors/throw     | Returns 500; app still alive after |
