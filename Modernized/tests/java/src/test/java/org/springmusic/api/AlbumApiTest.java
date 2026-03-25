package org.springmusic.api;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;

/**
 * API contract tests for Spring Music.
 * Target URL: set BASE_URL env var (default http://localhost:8080).
 * Run: mvn test
 * Run single: mvn test -Dtest=AlbumApiTest#tc02_createAlbum
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AlbumApiTest {

    private static String createdAlbumId;
    private static Map<String, Object> createdAlbum;

    @BeforeAll
    static void setup() {
        String baseUrl = System.getenv("BASE_URL");
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://localhost:8080";
        }
        RestAssured.baseURI = baseUrl;
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
    }

    // -----------------------------------------------------------------------
    // TC-01: GET /albums — seeded data is present
    // -----------------------------------------------------------------------
    @Test
    @Order(1)
    void tc01_getAllAlbums_returnsNonEmptyList() {
        List<Map<String, Object>> albums =
            given().accept(ContentType.JSON)
            .when().get("/albums")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("$", not(empty()))
                .extract().jsonPath().getList("$");

        assertThat(albums).isNotEmpty();
        Map<String, Object> first = albums.get(0);
        assertThat(first).containsKeys("id", "title", "artist");
    }

    // -----------------------------------------------------------------------
    // TC-02: PUT /albums — create a new album
    // -----------------------------------------------------------------------
    @Test
    @Order(2)
    void tc02_createAlbum_returnsAlbumWithId() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", "Test Album");
        payload.put("artist", "Test Artist");
        payload.put("releaseYear", "2024");
        payload.put("genre", "Rock");
        payload.put("trackCount", 10);

        Response response =
            given().contentType(ContentType.JSON).body(payload)
            .when().put("/albums")
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("id", not(emptyOrNullString()))
                .body("title", equalTo("Test Album"))
                .body("artist", equalTo("Test Artist"))
                .body("releaseYear", equalTo("2024"))
                .body("genre", equalTo("Rock"))
                .body("trackCount", equalTo(10))
                .extract().response();

        createdAlbum = response.jsonPath().getMap("$");
        createdAlbumId = (String) createdAlbum.get("id");
        assertThat(createdAlbumId).isNotBlank();
    }

    // -----------------------------------------------------------------------
    // TC-03: GET /albums/{id} — retrieve the created album
    // -----------------------------------------------------------------------
    @Test
    @Order(3)
    void tc03_getAlbumById_returnsCorrectAlbum() {
        assertThat(createdAlbumId).as("TC-02 must run first").isNotBlank();

        given().accept(ContentType.JSON)
        .when().get("/albums/{id}", createdAlbumId)
        .then()
            .statusCode(200)
            .body("id", equalTo(createdAlbumId))
            .body("title", equalTo("Test Album"))
            .body("artist", equalTo("Test Artist"));
    }

    // -----------------------------------------------------------------------
    // TC-04: POST /albums — update the album
    // -----------------------------------------------------------------------
    @Test
    @Order(4)
    void tc04_updateAlbum_titleChangePersists() {
        assertThat(createdAlbum).as("TC-02 must run first").isNotNull();

        Map<String, Object> updated = new HashMap<>(createdAlbum);
        updated.put("title", "Updated Album");

        given().contentType(ContentType.JSON).body(updated)
        .when().post("/albums")
        .then()
            .statusCode(200)
            .body("id", equalTo(createdAlbumId))
            .body("title", equalTo("Updated Album"));
    }

    // -----------------------------------------------------------------------
    // TC-05: GET /albums/{id} — verify update persisted
    // -----------------------------------------------------------------------
    @Test
    @Order(5)
    void tc05_getUpdatedAlbum_reflectsChange() {
        assertThat(createdAlbumId).as("TC-02 must run first").isNotBlank();

        given().accept(ContentType.JSON)
        .when().get("/albums/{id}", createdAlbumId)
        .then()
            .statusCode(200)
            .body("title", equalTo("Updated Album"))
            .body("id", equalTo(createdAlbumId));
    }

    // -----------------------------------------------------------------------
    // TC-06: DELETE /albums/{id} — delete the album
    // -----------------------------------------------------------------------
    @Test
    @Order(6)
    void tc06_deleteAlbum_returns200() {
        assertThat(createdAlbumId).as("TC-02 must run first").isNotBlank();

        when().delete("/albums/{id}", createdAlbumId)
        .then()
            .statusCode(200);
    }

    // -----------------------------------------------------------------------
    // TC-07: GET /albums/{id} — confirm deletion (null or 404)
    // -----------------------------------------------------------------------
    @Test
    @Order(7)
    void tc07_getDeletedAlbum_isNullOrNotFound() {
        assertThat(createdAlbumId).as("TC-02 must run first").isNotBlank();

        Response response =
            given().accept(ContentType.JSON)
            .when().get("/albums/{id}", createdAlbumId)
            .then()
                .statusCode(anyOf(is(200), is(404)))
                .extract().response();

        // Legacy returns 200 with null body; modernized may return 404
        if (response.statusCode() == 200) {
            String body = response.getBody().asString();
            assertThat(body).isIn("null", "", "{}");
        }
    }

    // -----------------------------------------------------------------------
    // TC-08: GET /albums — deleted album no longer in list
    // -----------------------------------------------------------------------
    @Test
    @Order(8)
    void tc08_listAlbums_deletedAlbumAbsent() {
        assertThat(createdAlbumId).as("TC-02 must run first").isNotBlank();

        List<Map<String, Object>> albums =
            given().accept(ContentType.JSON)
            .when().get("/albums")
            .then()
                .statusCode(200)
                .extract().jsonPath().getList("$");

        boolean found = albums.stream()
            .anyMatch(a -> createdAlbumId.equals(a.get("id")));
        assertThat(found).isFalse();
    }

    // -----------------------------------------------------------------------
    // TC-09: PUT /albums — album with all fields
    // -----------------------------------------------------------------------
    @Test
    @Order(9)
    void tc09_createAlbumWithAllFields_allFieldsReturned() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", "Full Album");
        payload.put("artist", "Full Artist");
        payload.put("releaseYear", "1999");
        payload.put("genre", "Jazz");
        payload.put("trackCount", 12);
        payload.put("albumId", "ext-ref-001");

        String newId =
            given().contentType(ContentType.JSON).body(payload)
            .when().put("/albums")
            .then()
                .statusCode(200)
                .body("id", not(emptyOrNullString()))
                .body("title", equalTo("Full Album"))
                .body("artist", equalTo("Full Artist"))
                .body("releaseYear", equalTo("1999"))
                .body("genre", equalTo("Jazz"))
                .body("trackCount", equalTo(12))
                .body("albumId", equalTo("ext-ref-001"))
                .extract().path("id");

        // Cleanup
        when().delete("/albums/{id}", newId).then().statusCode(200);
    }

    // -----------------------------------------------------------------------
    // TC-10: GET /appinfo — metadata endpoint
    // -----------------------------------------------------------------------
    @Test
    @Order(10)
    void tc10_appInfo_returnsProfilesAndServices() {
        given().accept(ContentType.JSON)
        .when().get("/appinfo")
        .then()
            .statusCode(200)
            .body("profiles", notNullValue())
            .body("services", notNullValue());
    }

    // -----------------------------------------------------------------------
    // TC-11: GET /errors/throw — exception returns 500, app still alive
    // -----------------------------------------------------------------------
    @Test
    @Order(11)
    void tc11_throwEndpoint_returns500AndAppStillAlive() {
        when().get("/errors/throw")
        .then()
            .statusCode(500);

        // App must still serve requests after the exception
        when().get("/albums")
        .then()
            .statusCode(200);
    }
}
