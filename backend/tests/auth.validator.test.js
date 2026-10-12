const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  registerSchema,
  loginSchema,
  profileUpdateSchema,
} = require("../validators/auth.validator");
const validateSchema = require("../validators/schema.validator");

describe("Auth Validator - Business Validation Rules", () => {
  describe("Registration Schema", () => {
    it("should accept valid registration credentials", async () => {
      const validPayload = {
        body: {
          username: "tactician_01",
          email: "analyst@footballcopilot.com",
          password: "SecurePassword123",
        },
      };

      const parsed = await registerSchema.parseAsync(validPayload);
      assert.equal(parsed.body.username, "tactician_01");
      assert.equal(parsed.body.email, "analyst@footballcopilot.com");
    });

    it("should reject usernames shorter than 3 characters or with invalid symbols", async () => {
      const tooShort = {
        body: {
          username: "ab",
          email: "test@example.com",
          password: "SecurePassword123",
        },
      };

      await assert.rejects(
        async () => registerSchema.parseAsync(tooShort),
        (err) => {
          assert.ok(err.issues.some((i) => i.path.includes("username")));
          return true;
        }
      );

      const invalidSymbols = {
        body: {
          username: "user!@#$",
          email: "test@example.com",
          password: "SecurePassword123",
        },
      };

      await assert.rejects(
        async () => registerSchema.parseAsync(invalidSymbols),
        (err) => {
          assert.ok(err.issues.some((i) => i.path.includes("username")));
          return true;
        }
      );
    });

    it("should reject invalid email formats", async () => {
      const invalidEmail = {
        body: {
          username: "coach_mike",
          email: "not-an-email",
          password: "SecurePassword123",
        },
      };

      await assert.rejects(
        async () => registerSchema.parseAsync(invalidEmail),
        (err) => {
          assert.ok(err.issues.some((i) => i.path.includes("email")));
          return true;
        }
      );
    });

    it("should enforce strong password requirements (length, uppercase, lowercase, number)", async () => {
      const weakPasswords = [
        "short1A", // < 8 chars
        "alllowercase123", // missing uppercase
        "ALLUPPERCASE123", // missing lowercase
        "NoNumbersHere!", // missing number
      ];

      for (const pwd of weakPasswords) {
        const payload = {
          body: {
            username: "tactician",
            email: "coach@test.com",
            password: pwd,
          },
        };

        await assert.rejects(
          async () => registerSchema.parseAsync(payload),
          (err) => {
            assert.ok(err.issues.some((i) => i.path.includes("password")));
            return true;
          }
        );
      }
    });
  });

  describe("Login Schema", () => {
    it("should accept valid login payload", async () => {
      const valid = {
        body: {
          email: "gaffer@club.com",
          password: "MySecretPassword1",
        },
      };

      const parsed = await loginSchema.parseAsync(valid);
      assert.equal(parsed.body.email, "gaffer@club.com");
    });

    it("should reject missing password or invalid email", async () => {
      const missingPassword = {
        body: {
          email: "gaffer@club.com",
          password: "",
        },
      };

      await assert.rejects(
        async () => loginSchema.parseAsync(missingPassword),
        (err) => {
          assert.ok(err.issues.some((i) => i.path.includes("password")));
          return true;
        }
      );
    });
  });

  describe("Validate Schema Express Middleware", () => {
    it("should return HTTP 400 with structured errors on validation failure", async () => {
      const middleware = validateSchema(loginSchema);

      const req = {
        body: { email: "invalid-email", password: "" },
        params: {},
        query: {},
      };

      let statusCode = null;
      let jsonPayload = null;
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonPayload = data;
          return this;
        },
      };

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      await middleware(req, res, next);

      assert.equal(statusCode, 400);
      assert.equal(nextCalled, false);
      assert.equal(jsonPayload.success, false);
      assert.equal(jsonPayload.message, "Validation failed");
      assert.ok(Array.isArray(jsonPayload.errors));
      assert.ok(jsonPayload.errors.length >= 2);
    });

    it("should invoke next() when request data conforms to schema", async () => {
      const middleware = validateSchema(loginSchema);

      const req = {
        body: { email: "manager@team.com", password: "Password123" },
        params: {},
        query: {},
      };

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      await middleware(req, {}, next);
      assert.equal(nextCalled, true);
    });
  });
});
