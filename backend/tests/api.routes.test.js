const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../app");

describe("Critical API Routes & Middlewares Integration", () => {
  let server;
  let baseUrl;

  before((done) => {
    // Spin up server on an ephemeral port explicitly on 127.0.0.1
    server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    const redisClient = require("../config/redis");
    if (redisClient) {
      try {
        await redisClient.disconnect();
      } catch (_) {}
    }
  });

  describe("Global Route Handling & Security", () => {
    it("should return 404 with structured JSON for unknown routes", async () => {
      const res = await fetch(`${baseUrl}/api/v1/unknown-endpoint-404`);
      assert.equal(res.status, 404);

      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.message, "Route not found");
    });

    it("should include security headers applied via Helmet middleware", async () => {
      const res = await fetch(`${baseUrl}/api/v1/planner/templates`);
      assert.ok(
        res.headers.get("x-content-type-options") === "nosniff" ||
        res.headers.get("x-dns-prefetch-control") === "off" ||
        res.headers.get("x-download-options") === "noopen"
      );
    });

    it("should allow configured origins and set CORS headers", async () => {
      const res = await fetch(`${baseUrl}/api/v1/planner/templates`, {
        headers: {
          Origin: "http://localhost:5173",
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
      assert.equal(res.headers.get("access-control-allow-credentials"), "true");
    });

    it("should reject disallowed cross-origin requests with 403 Forbidden", async () => {
      const res = await fetch(`${baseUrl}/api/v1/planner/templates`, {
        headers: {
          Origin: "https://malicious-unauthorized-site.com",
        },
      });

      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.message.includes("CORS"));
    });
  });

  describe("Authentication Gate on Protected Routes", () => {
    it("should reject unauthenticated requests to /api/v1/football/competitions with 401", async () => {
      const res = await fetch(`${baseUrl}/api/v1/football/competitions`);
      assert.equal(res.status, 401);

      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.message.includes("Access denied") || body.message.includes("token"));
    });

    it("should reject unauthenticated requests to /api/v1/football/dashboard with 401", async () => {
      const res = await fetch(`${baseUrl}/api/v1/football/dashboard`);
      assert.equal(res.status, 401);

      const body = await res.json();
      assert.equal(body.success, false);
    });

    it("should reject unauthenticated requests to /api/v1/favorites with 401", async () => {
      const res = await fetch(`${baseUrl}/api/v1/favorites`);
      assert.equal(res.status, 401);

      const body = await res.json();
      assert.equal(body.success, false);
    });

    it("should reject unauthenticated requests to /api/v1/auth/me with 401", async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`);
      assert.equal(res.status, 401);

      const body = await res.json();
      assert.equal(body.success, false);
    });

    it("should reject requests with invalid/malformed token with 401", async () => {
      const res = await fetch(`${baseUrl}/api/v1/football/competitions`, {
        headers: {
          Authorization: "Bearer invalid.malformed.token",
        },
      });
      assert.equal(res.status, 401);

      const body = await res.json();
      assert.equal(body.success, false);
    });
  });

  describe("Auth Endpoint Request Validation", () => {
    it("should reject /api/v1/auth/register with empty body returning 400 Bad Request", async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.message, "Validation failed");
      assert.ok(Array.isArray(body.errors));
    });

    it("should reject /api/v1/auth/login with invalid email returning 400 Bad Request", async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email",
          password: "password123",
        }),
      });

      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.message, "Validation failed");
      assert.ok(body.errors.some((e) => e.field.includes("email")));
    });
  });

  describe("Planner Quick-Start Templates Endpoint", () => {
    it("should return 200 and list of tactical planner templates", async () => {
      const res = await fetch(`${baseUrl}/api/v1/planner/templates`);
      assert.equal(res.status, 200);

      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.data.length >= 4);

      const sample = body.data[0];
      assert.ok(sample.id);
      assert.ok(sample.title);
      assert.ok(sample.category);
      assert.ok(sample.examplePrompt);
    });
  });
});
