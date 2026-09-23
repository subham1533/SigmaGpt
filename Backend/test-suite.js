import http from "node:http";
import app from "./server.js";
import { getMistralAPIResponse } from "./utils/mistral.js";
import { getDatabase, parseThread } from "./utils/database.js";

const PORT = 5555;
let server;

const startServer = () => new Promise((resolve, reject) => {
    server = app.listen(PORT, () => {
        resolve();
    });
    server.on("error", reject);
});

const stopServer = () => new Promise((resolve) => {
    if (server) {
        server.close(resolve);
    } else {
        resolve();
    }
});

const request = ({ method, path, body }) => new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
        hostname: "localhost",
        port: PORT,
        path,
        method,
        headers: {
            "Content-Type": "application/json",
            ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {})
        }
    }, (res) => {
        let data = "";
        res.on("data", chunk => { data += chunk; });
        res.on("end", () => {
            try {
                const parsed = data ? JSON.parse(data) : null;
                resolve({ status: res.statusCode, body: parsed, raw: data });
            } catch {
                resolve({ status: res.statusCode, body: data, raw: data });
            }
        });
    });

    req.on("error", reject);
    if (payload) {
        req.write(payload);
    }
    req.end();
});

let passed = 0;
let failed = 0;

const assert = (condition, name, details = "") => {
    if (condition) {
        console.log(`  PASS: ${name}`);
        passed++;
    } else {
        console.error(`  FAIL: ${name}${details ? ` -> ${details}` : ""}`);
        failed++;
    }
};

const runAllTests = async () => {
    console.log("\n==========================================");
    console.log("   RUNNING SIGMAGPT FULL API TEST SUITE   ");
    console.log("==========================================\n");

    // 1. Direct Mistral AI completion
    console.log("--- 1. Testing Mistral AI Integration ---");
    try {
        const singleReply = await getMistralAPIResponse("What is 2 + 2? Reply with just the number.");
        assert(singleReply.includes("4"), "Mistral API returns valid completion", `Got: ${singleReply}`);
    } catch (err) {
        assert(false, "Mistral API returns valid completion", err.message);
    }

    // 2. Mistral Model Fallback
    console.log("\n--- 2. Testing Model Fallback Mechanism ---");
    try {
        const fallbackReply = await getMistralAPIResponse(
            "Say 'FALLBACK_SUCCESS'",
            { model: "mistral-small-latest" } // Intentionally use the 429-causing model
        );
        assert(
            fallbackReply.toLowerCase().includes("fallback_success"),
            "Fallback smoothly recovers when primary model fails with 429",
            `Got: ${fallbackReply}`
        );
    } catch (err) {
        assert(false, "Fallback smoothly recovers when primary model fails", err.message);
    }

    // 3. Multi-turn Conversation Context
    console.log("\n--- 3. Testing Multi-Turn Conversation Memory ---");
    try {
        const multiTurnReply = await getMistralAPIResponse([
            { role: "user", content: "My secret word is PINEAPPLE." },
            { role: "assistant", content: "Got it! Your secret word is PINEAPPLE." },
            { role: "user", content: "What was my secret word?" }
        ]);
        assert(
            multiTurnReply.toUpperCase().includes("PINEAPPLE"),
            "Multi-turn conversation remembers context across turns",
            `Got: ${multiTurnReply}`
        );
    } catch (err) {
        assert(false, "Multi-turn conversation remembers context", err.message);
    }

    // 4. Database CRUD Operations
    console.log("\n--- 4. Testing SQLite Database Operations ---");
    try {
        const db = await getDatabase();
        const testId = `test-${Date.now()}`;
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO threads (threadId, title, messages, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
            testId, "Direct DB Test", JSON.stringify([{ role: "user", content: "db test" }]), now, now
        );

        const row = await db.get("SELECT * FROM threads WHERE threadId = ?", testId);
        const parsed = parseThread(row);
        assert(parsed && parsed.threadId === testId && parsed.messages.length === 1, "Database inserts and parses thread record");

        await db.run("DELETE FROM threads WHERE threadId = ?", testId);
        const deletedRow = await db.get("SELECT * FROM threads WHERE threadId = ?", testId);
        assert(!deletedRow, "Database removes thread record on delete");
    } catch (err) {
        assert(false, "Database operations succeed", err.message);
    }

    // Start Express Server for HTTP API Tests
    console.log("\n--- 5. Testing HTTP API Endpoints ---");
    await startServer();

    try {
        // Health Check
        const healthRes = await request({ method: "GET", path: "/api/health" });
        assert(healthRes.status === 200 && healthRes.body.status === "ok", "GET /api/health returns 200 OK");

        // Input Validation
        const emptyChatRes = await request({ method: "POST", path: "/api/chat", body: { threadId: "x", message: "" } });
        assert(emptyChatRes.status === 400, "POST /api/chat rejects empty message with 400");

        const noThreadRes = await request({ method: "POST", path: "/api/chat", body: { message: "hi" } });
        assert(noThreadRes.status === 400, "POST /api/chat rejects missing threadId with 400");

        // Successful Chat (Turn 1)
        const threadId = `e2e-thread-${Date.now()}`;
        console.log(`   Executing POST /api/chat (Turn 1) for thread: ${threadId}...`);
        const chat1 = await request({
            method: "POST",
            path: "/api/chat",
            body: {
                threadId,
                message: "Hello! My favorite color is purple. Remember this."
            }
        });
        assert(chat1.status === 200 && typeof chat1.body.reply === "string" && chat1.body.reply.length > 0, "POST /api/chat returns assistant reply for Turn 1");

        // Successful Chat (Turn 2 - testing context persistence in DB and AI)
        console.log(`   Executing POST /api/chat (Turn 2) to test memory retention...`);
        const chat2 = await request({
            method: "POST",
            path: "/api/chat",
            body: {
                threadId,
                message: "What is my favorite color?"
            }
        });
        assert(
            chat2.status === 200 && chat2.body.reply.toLowerCase().includes("purple"),
            "POST /api/chat Turn 2 remembers favorite color from Turn 1",
            `Reply was: ${chat2.body?.reply}`
        );

        // Fetch thread list
        const threadsRes = await request({ method: "GET", path: "/api/thread" });
        assert(
            threadsRes.status === 200 && Array.isArray(threadsRes.body) && threadsRes.body.some(t => t.threadId === threadId),
            "GET /api/thread lists active threads"
        );

        // Fetch single thread messages
        const singleThreadRes = await request({ method: "GET", path: `/api/thread/${threadId}` });
        assert(
            singleThreadRes.status === 200 && Array.isArray(singleThreadRes.body) && singleThreadRes.body.length === 4,
            "GET /api/thread/:id returns all 4 messages (2 user + 2 assistant)"
        );

        // Delete thread
        const delRes = await request({ method: "DELETE", path: `/api/thread/${threadId}` });
        assert(delRes.status === 200 && delRes.body.success, "DELETE /api/thread/:id deletes thread");

        // Verify thread is gone
        const verifyDelRes = await request({ method: "GET", path: `/api/thread/${threadId}` });
        assert(verifyDelRes.status === 404, "GET /api/thread/:id after deletion returns 404");

    } catch (err) {
        assert(false, "HTTP API Endpoints execution", err.message);
    } finally {
        await stopServer();
    }

    console.log("\n==========================================");
    console.log(`   TEST SUMMARY: ${passed} PASSED, ${failed} FAILED   `);
    console.log("==========================================\n");

    if (failed > 0) {
        process.exit(1);
    }
};

runAllTests().catch((err) => {
    console.error("Test suite runner crashed:", err);
    process.exit(1);
});
