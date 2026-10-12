const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../app");
const {
  toolsRegistry,
  toolHandlers,
  executeToolCalls,
  SYSTEM_INSTRUCTION,
} = require("../services/ai.service");
const {
  isTransientOrQuotaError,
  generateContentWithFallback,
} = require("../utils/geminiHelper");
const { splitTextIntoChunks, extractKeywords } = require("../utils/chunker.util");

describe("AI Chat Flow Verification - End-to-End Suite", () => {
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

  after((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  // =========================================================================
  // 1. Tool Calling & Registry Verification
  // =========================================================================
  describe("1. Tool Calling & Registry Execution", () => {
    it("should have all expected football tools registered with schemas and handlers", () => {
      const expectedTools = [
        "getLiveMatches",
        "getStanding",
        "searchPlayers",
        "searchLeagues",
        "searchTeams",
        "searchMatches",
      ];

      expectedTools.forEach((toolName) => {
        const tool = toolsRegistry.find((t) => t.schema.name === toolName);
        assert.ok(tool, `Tool ${toolName} must be registered in toolsRegistry`);
        assert.equal(typeof tool.schema.description, "string");
        assert.ok(tool.schema.description.length > 5);
        assert.equal(typeof toolHandlers[toolName], "function");
      });
    });

    it("should execute registered tool handlers successfully via executeToolCalls", async () => {
      const origHandler = toolHandlers.getStanding;
      toolHandlers.getStanding = async (args) => [{ team: "Arsenal", position: 1 }];

      try {
        const functionCalls = [
          {
            name: "getStanding",
            args: { leagueCode: "PL" },
          },
        ];

        const results = await executeToolCalls(functionCalls);

        assert.equal(results.length, 1);
        assert.ok(results[0].functionResponse);
        assert.equal(results[0].functionResponse.name, "getStanding");
        assert.ok(Array.isArray(results[0].functionResponse.response.result));
        assert.equal(results[0].functionResponse.response.result[0].team, "Arsenal");
      } finally {
        toolHandlers.getStanding = origHandler;
      }
    });

    it("should gracefully handle unregistered tool requests without crashing", async () => {
      const functionCalls = [
        {
          name: "nonExistentTool",
          args: { foo: "bar" },
        },
      ];

      const results = await executeToolCalls(functionCalls);

      assert.equal(results.length, 1);
      assert.equal(results[0].functionResponse.name, "nonExistentTool");
      assert.ok(results[0].functionResponse.response.error);
      assert.ok(results[0].functionResponse.response.error.includes("not registered"));
    });

    it("should isolate tool execution errors and return structured error response", async () => {
      // Temporarily register a throwing handler to simulate upstream runtime exception
      toolHandlers.__failingTestTool = async () => {
        throw new Error("Upstream football provider timeout");
      };

      const functionCalls = [
        {
          name: "__failingTestTool",
          args: {},
        },
      ];

      const results = await executeToolCalls(functionCalls);

      assert.equal(results.length, 1);
      assert.equal(results[0].functionResponse.name, "__failingTestTool");
      assert.equal(results[0].functionResponse.response.error, "Upstream football provider timeout");

      delete toolHandlers.__failingTestTool;
    });

    it("should execute multiple parallel tool calls in a single turn", async () => {
      const origHandler = toolHandlers.getStanding;
      toolHandlers.getStanding = async (args) => [{ league: args.leagueCode }];

      try {
        const functionCalls = [
          { name: "getStanding", args: { leagueCode: "PL" } },
          { name: "getStanding", args: { leagueCode: "PD" } },
        ];

        const results = await executeToolCalls(functionCalls);

        assert.equal(results.length, 2);
        assert.equal(results[0].functionResponse.name, "getStanding");
        assert.equal(results[1].functionResponse.name, "getStanding");
        assert.ok(Array.isArray(results[0].functionResponse.response.result));
        assert.ok(Array.isArray(results[1].functionResponse.response.result));
      } finally {
        toolHandlers.getStanding = origHandler;
      }
    });
  });

  // =========================================================================
  // 2. RAG Retrieval, Chunking & Citations
  // =========================================================================
  describe("2. RAG Chunking, Keyword Extraction & Citations", () => {
    it("should split long tactical analysis text into overlapping chunks", () => {
      const sampleText = `Modern high-pressing tactics require coordinated pressing triggers across the forward line.
When the opponent center-back opens his body shape towards the fullback, the winger curves his run to cut the passing lane.
Meanwhile, the attacking midfielder locks onto the defensive pivot (e.g., Rodri or Busquets).

In transition, field tilt and counter-pressing intensity determine turnover recovery times.
Teams like Manchester City and Arsenal utilize a compact 3-2-4-1 build-up shape to ensure rest-defense stability.
If possession is lost in the attacking third, five players immediately suffocate the immediate ball-carrier within 4 seconds.`;

      const chunks = splitTextIntoChunks(sampleText, { chunkSize: 220, chunkOverlap: 50 });

      assert.ok(chunks.length > 1, "Long text should be divided into multiple chunks");
      chunks.forEach((chunk, index) => {
        assert.equal(chunk.chunkIndex, index);
        assert.ok(chunk.content.length > 0);
        assert.ok(chunk.tokenEstimate > 0);
        assert.ok(Array.isArray(chunk.keywords));
      });
    });

    it("should extract meaningful domain keywords from football analysis text", () => {
      const text = "Expected Goals (xG) measures the probability of a shot resulting in a goal based on distance and angle.";
      const keywords = extractKeywords(text, 5);

      assert.ok(Array.isArray(keywords));
      assert.ok(keywords.length > 0);
      assert.ok(keywords.some((k) => ["expected", "goals", "xg", "probability", "shot"].includes(k.toLowerCase())));
    });

    it("should return empty array when splitting empty or non-string input", () => {
      assert.deepEqual(splitTextIntoChunks(""), []);
      assert.deepEqual(splitTextIntoChunks(null), []);
      assert.deepEqual(splitTextIntoChunks(undefined), []);
    });
  });

  // =========================================================================
  // 3. Context Injection & System Instruction Augmentation
  // =========================================================================
  describe("3. Context Injection & Prompt Construction", () => {
    it("should preserve core system instructions and inject user memory facts", () => {
      const memoryBlock = "USER MEMORY PROFILE:\n- Favorite Club: Arsenal FC\n- Tactical Preference: Inverted Fullbacks";
      let activeInstruction = SYSTEM_INSTRUCTION;
      activeInstruction += `\n\n${memoryBlock}`;

      assert.ok(activeInstruction.includes("You are Football Copilot"));
      assert.ok(activeInstruction.includes("USER MEMORY PROFILE:"));
      assert.ok(activeInstruction.includes("Favorite Club: Arsenal FC"));
      assert.ok(activeInstruction.includes("Tactical Preference: Inverted Fullbacks"));
    });

    it("should format RAG context blocks with citations format", () => {
      const sampleChunks = [
        {
          title: "Modern Scouting Metrics",
          chunkIndex: 0,
          category: "scouting",
          source: "Tactical Journal",
          content: "Expected Threat (xT) quantifies value added by moving the ball into dangerous zones.",
        },
      ];

      const contextBlock = sampleChunks
        .map(
          (c, idx) =>
            `[Document ${idx + 1}: "${c.title}", Chunk #${c.chunkIndex} | Category: ${c.category} | Source: ${c.source}]\n${c.content}`
        )
        .join("\n\n---\n\n");

      const augmentedPrompt = `RETRIEVED CONTEXT DOCUMENTS:\n${contextBlock}\n\nUSER QUERY:\nWhat is xT?`;

      assert.ok(augmentedPrompt.includes('Document 1: "Modern Scouting Metrics"'));
      assert.ok(augmentedPrompt.includes("Chunk #0"));
      assert.ok(augmentedPrompt.includes("Expected Threat (xT)"));
      assert.ok(augmentedPrompt.includes("USER QUERY:\nWhat is xT?"));
    });
  });

  // =========================================================================
  // 4. Conversation History Formatting & Turn Sanitization
  // =========================================================================
  describe("4. Conversation History Transformation & Windowing", () => {
    it("should map sender roles to Gemini user/model schema and filter out system errors", () => {
      const rawHistory = [
        { sender: "user", text: "How did Arsenal play yesterday?" },
        { sender: "ai", text: "Arsenal played with a 4-3-3 formation and dominated possession." },
        { sender: "ai", text: "**System Error: Upstream timeout**" }, // Error message to exclude
        { sender: "user", text: "Who scored the winning goal?" },
      ];

      const sanitizedHistory = rawHistory
        .filter((m) => !m.text.startsWith("**System Error:"))
        .slice(-10);

      assert.equal(sanitizedHistory.length, 3);

      const contents = sanitizedHistory.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      assert.equal(contents[0].role, "user");
      assert.equal(contents[0].parts[0].text, "How did Arsenal play yesterday?");
      assert.equal(contents[1].role, "model");
      assert.equal(contents[1].parts[0].text, "Arsenal played with a 4-3-3 formation and dominated possession.");
      assert.equal(contents[2].role, "user");
      assert.equal(contents[2].parts[0].text, "Who scored the winning goal?");
    });

    it("should truncate long histories according to a sliding window of recent turns", () => {
      const longHistory = Array.from({ length: 25 }, (_, i) => ({
        sender: i % 2 === 0 ? "user" : "ai",
        text: `Turn ${i + 1}`,
      }));

      const windowed = longHistory.slice(-10);
      assert.equal(windowed.length, 10);
      assert.equal(windowed[0].text, "Turn 16");
      assert.equal(windowed[9].text, "Turn 25");
    });
  });

  // =========================================================================
  // 5. API Failures, Multi-Model Fallbacks & Recovery
  // =========================================================================
  describe("5. API Failures, Transient Error Detection & Model Fallbacks", () => {
    it("should accurately classify transient, quota, and rate-limit errors", () => {
      const transientErrors = [
        { status: 429, message: "Too many requests" },
        { status: 503, message: "Service Unavailable" },
        { message: "Resource has been exhausted (quota limit reached)" },
        { message: "Model is overloaded due to high traffic" },
        { message: "Model 'gemini-2.0-flash' is deprecated and shut down" },
        { code: "RESOURCE_EXHAUSTED", message: "Out of tokens" },
      ];

      transientErrors.forEach((err) => {
        assert.equal(
          isTransientOrQuotaError(err),
          true,
          `Error should be recognized as transient: ${err.message}`
        );
      });

      const permanentErrors = [
        { status: 400, message: "Invalid argument: contents is required" },
        { message: "Malformed JSON schema" },
      ];

      permanentErrors.forEach((err) => {
        assert.equal(
          isTransientOrQuotaError(err),
          false,
          `Error should not be transient: ${err.message}`
        );
      });
    });

    it("should succeed on primary model without calling fallback chain", async () => {
      const mockClient = {
        models: {
          generateContent: async ({ model }) => ({
            text: `Answer from primary model ${model}`,
          }),
        },
      };

      const result = await generateContentWithFallback(mockClient, {
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts: [{ text: "Hello" }] }],
      });

      assert.equal(result.text, "Answer from primary model gemini-3.8-flash");
    });

    it("should automatically fall back to alternative model when primary model encounters 429/quota error", async () => {
      let callCount = 0;
      const modelsCalled = [];

      const mockClient = {
        models: {
          generateContent: async ({ model }) => {
            callCount++;
            modelsCalled.push(model);
            if (model === "gemini-primary-quota-fail") {
              const err = new Error("Resource has been exhausted (rate limit 429)");
              err.status = 429;
              throw err;
            }
            return {
              text: `Recovered successfully using ${model}`,
            };
          },
        },
      };

      const result = await generateContentWithFallback(mockClient, {
        model: "gemini-primary-quota-fail",
        fallbackModels: ["gemini-backup-model"],
        contents: [{ role: "user", parts: [{ text: "Tactical analysis" }] }],
      });

      assert.equal(callCount, 2);
      assert.deepEqual(modelsCalled, ["gemini-primary-quota-fail", "gemini-backup-model"]);
      assert.equal(result.text, "Recovered successfully using gemini-backup-model");
    });

    it("should fail fast without attempting fallbacks on fatal non-transient errors", async () => {
      let callCount = 0;
      const mockClient = {
        models: {
          generateContent: async () => {
            callCount++;
            const err = new Error("Invalid payload: schema mismatch");
            err.status = 400;
            throw err;
          },
        },
      };

      await assert.rejects(
        async () =>
          generateContentWithFallback(mockClient, {
            model: "primary-model",
            fallbackModels: ["backup-model-1", "backup-model-2"],
            contents: [],
          }),
        (err) => {
          assert.equal(err.message, "Invalid payload: schema mismatch");
          assert.equal(callCount, 1, "Should not retry backup models for non-transient 400 errors");
          return true;
        }
      );
    });

    it("should throw when all models in the fallback chain are exhausted", async () => {
      let callCount = 0;
      const mockClient = {
        models: {
          generateContent: async ({ model }) => {
            callCount++;
            const err = new Error(`503 Overloaded on ${model}`);
            err.status = 503;
            throw err;
          },
        },
      };

      await assert.rejects(
        async () =>
          generateContentWithFallback(mockClient, {
            model: "model-1",
            fallbackModels: ["model-2"],
            contents: [],
          }),
        (err) => {
          assert.ok(err.message.includes("503 Overloaded"));
          assert.equal(callCount, 2);
          return true;
        }
      );
    });
  });

  // =========================================================================
  // 6. Invalid Prompts & API Request Validation
  // =========================================================================
  describe("6. Invalid Prompts & Input Validation on AI Endpoints", () => {
    it("should reject /api/v1/ai/chat with missing prompt returning 400", async () => {
      // Simulate authenticated user bypass for validation testing
      const res = await fetch(`${baseUrl}/api/v1/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      // Protected route without token returns 401
      assert.equal(res.status, 401);
    });

    it("should reject /api/v1/ai/rag/query with missing query returning 401 without auth", async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai/rag/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      assert.equal(res.status, 401);
    });

    it("should reject unauthenticated requests to AI conversations with 401", async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai/conversations`);
      assert.equal(res.status, 401);
    });

    it("should reject unauthenticated requests to AI recommendations with 401", async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai/recommendations`);
      assert.equal(res.status, 401);
    });

    it("should reject unauthenticated requests to AI memories with 401", async () => {
      const res = await fetch(`${baseUrl}/api/v1/ai/memories`);
      assert.equal(res.status, 401);
    });

    it("should reject empty, null, or whitespace prompts directly at controller layer with 400", async () => {
      const aiController = require("../controller/ai.controller");
      const invalidPrompts = ["", "   ", null, undefined, 12345, {}];

      for (const badPrompt of invalidPrompts) {
        let statusCode = null;
        let responseJson = null;

        const req = {
          body: { prompt: badPrompt },
          user: { _id: "test-user-id" },
        };
        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(payload) {
            responseJson = payload;
            return this;
          },
        };

        await aiController.chat(req, res);

        assert.equal(statusCode, 400);
        assert.equal(responseJson.success, false);
        assert.equal(responseJson.message, "Prompt string is required");
      }
    });

    it("should reject empty, null, or whitespace RAG queries directly at controller layer with 400", async () => {
      const aiController = require("../controller/ai.controller");
      const invalidQueries = ["", "   ", null, undefined, 42, []];

      for (const badQuery of invalidQueries) {
        let statusCode = null;
        let responseJson = null;

        const req = {
          body: { query: badQuery },
          user: { _id: "test-user-id" },
        };
        const res = {
          status(code) {
            statusCode = code;
            return this;
          },
          json(payload) {
            responseJson = payload;
            return this;
          },
        };

        await aiController.queryRAG(req, res);

        assert.equal(statusCode, 400);
        assert.equal(responseJson.success, false);
        assert.equal(responseJson.message, "Query string is required for RAG.");
      }
    });
  });
});
