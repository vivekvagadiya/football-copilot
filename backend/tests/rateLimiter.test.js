const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../app");
const { createRateLimiter } = require("../middleware/rateLimiter.middleware");
const upload = require("../controller/multer");

describe("Rate Limiting, Abuse Protection & Security Boundaries", () => {
  let server;
  let baseUrl;

  before((done) => {
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

  describe("1. Rate Limiter Middleware Unit Tests", () => {
    it("should allow requests within threshold and set RateLimit headers", async () => {
      const limiter = createRateLimiter({
        windowSeconds: 10,
        maxRequests: 3,
        keyPrefix: "test_allow",
        message: "Rate limit exceeded in test",
      });

      const req = {
        headers: {},
        ip: "192.168.1.100",
      };

      const headersSet = {};
      const res = {
        setHeader(name, val) {
          headersSet[name] = val;
        },
        status() {
          return this;
        },
        json() {
          return this;
        },
      };

      let nextCalled = false;
      await limiter(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(headersSet["X-RateLimit-Limit"], 3);
      assert.equal(headersSet["X-RateLimit-Remaining"], 2);
      assert.ok(headersSet["X-RateLimit-Reset"] > 0);
    });

    it("should reject requests with 429 when threshold is exceeded", async () => {
      const limiter = createRateLimiter({
        windowSeconds: 10,
        maxRequests: 2,
        keyPrefix: "test_reject",
        message: "Too many test requests",
      });

      const req = {
        headers: {},
        ip: "192.168.1.200",
      };

      let lastStatus = null;
      let lastJson = null;
      const headersSet = {};

      const createMockRes = () => ({
        setHeader(name, val) {
          headersSet[name] = val;
        },
        status(code) {
          lastStatus = code;
          return this;
        },
        json(payload) {
          lastJson = payload;
          return this;
        },
      });

      // Call 1 - Allowed
      await limiter(req, createMockRes(), () => {});
      assert.equal(headersSet["X-RateLimit-Remaining"], 1);

      // Call 2 - Allowed
      await limiter(req, createMockRes(), () => {});
      assert.equal(headersSet["X-RateLimit-Remaining"], 0);

      // Call 3 - Exceeded -> 429
      await limiter(req, createMockRes(), () => {});
      assert.equal(lastStatus, 429);
      assert.equal(lastJson.success, false);
      assert.equal(lastJson.message, "Too many test requests");
      assert.ok(headersSet["Retry-After"] > 0);
    });

    it("should key by authenticated user ID when user object is present", async () => {
      const limiter = createRateLimiter({
        windowSeconds: 10,
        maxRequests: 5,
        keyPrefix: "test_user",
      });

      const req = {
        user: { _id: "usr_789" },
        headers: {},
        ip: "10.0.0.1",
      };

      const headersSet = {};
      const res = {
        setHeader(name, val) {
          headersSet[name] = val;
        },
      };

      let nextCalled = false;
      await limiter(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
      assert.equal(headersSet["X-RateLimit-Remaining"], 4);
    });
  });

  describe("2. Request Body Size Limits", () => {
    it("should reject JSON payloads exceeding 1MB with 413 Payload Too Large", async () => {
      // Create a payload larger than 1MB (approx 1.2 MB string)
      const largeString = "x".repeat(1.2 * 1024 * 1024);
      const largePayload = JSON.stringify({ data: largeString });

      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: largePayload,
      });

      assert.equal(res.status, 413);
    });

    it("should accept normal JSON payloads within 1MB limit", async () => {
      const normalPayload = JSON.stringify({ email: "invalid", password: "short" });

      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: normalPayload,
      });

      // Passes body parser and fails validator with 400 (not 413)
      assert.equal(res.status, 400);
    });
  });

  describe("3. File Upload MIME Filter & Boundaries", () => {
    it("should reject non-image file uploads in multer avatar upload", (done) => {
      const mockFile = {
        mimetype: "application/pdf",
        originalname: "malicious.pdf",
      };

      upload.single("avatar")({ file: mockFile, body: {}, headers: {} }, {}, (err) => {
        assert.ok(err, "Should return an error for non-image file");
        assert.ok(err.message.includes("Only JPEG, PNG, and WebP images are allowed"));
        assert.equal(err.statusCode, 400);
        done();
      });
    });

    it("should accept valid image MIME types in multer avatar upload", (done) => {
      const mockFile = {
        mimetype: "image/png",
        originalname: "avatar.png",
      };

      upload.single("avatar")({ file: mockFile, body: {}, headers: {} }, {}, (err) => {
        assert.equal(err, undefined);
        done();
      });
    });
  });

  describe("4. Authentication Boundaries & Rate Limit Headers on Endpoints", () => {
    it("should return RateLimit headers on auth endpoints", async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: "pwd" }),
      });

      assert.ok(res.headers.get("x-ratelimit-limit"));
      assert.ok(res.headers.get("x-ratelimit-remaining"));
      assert.ok(res.headers.get("x-ratelimit-reset"));
    });

    it("should allow public access to planner templates without authentication", async () => {
      const res = await fetch(`${baseUrl}/api/v1/planner/templates`);
      assert.equal(res.status, 200);

      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
    });

    it("should enforce authentication boundary on planner plan generation", async () => {
      const res = await fetch(`${baseUrl}/api/v1/planner/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: "Win match" }),
      });

      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
    });

    it("should enforce authentication boundary on all football data endpoints", async () => {
      const endpoints = [
        "/api/v1/football/dashboard",
        "/api/v1/football/matches/live",
        "/api/v1/football/standings",
        "/api/v1/football/scorers",
      ];

      for (const endpoint of endpoints) {
        const res = await fetch(`${baseUrl}${endpoint}`);
        assert.equal(res.status, 401, `Expected 401 for unauthenticated ${endpoint}`);
      }
    });
  });
});
