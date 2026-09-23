import express from "express";
import { getDatabase, parseThread } from "../utils/database.js";
import getMistralAPIResponse from "../utils/mistral.js";

const router = express.Router();

// Health check endpoint
router.get("/health", async (req, res) => {
    try {
        const database = await getDatabase();
        await database.get("SELECT 1");
        res.json({
            status: "ok",
            model: process.env.MISTRAL_MODEL || "ministral-8b-latest",
            database: "connected"
        });
    } catch (err) {
        console.error("Health check error:", err);
        res.status(500).json({
            status: "error",
            error: err.message || "Database connection failed"
        });
    }
});


// Get all threads
router.get("/thread", async (req, res) => {
    try {
        const database = await getDatabase();
        const threads = await database.all("SELECT * FROM threads ORDER BY updatedAt DESC");
        res.json(threads.map(parseThread));
    } catch (err) {
        console.error("Fetch threads error:", err);
        res.status(500).json({ error: "Failed to fetch threads" });
    }
});

// Get single thread messages
router.get("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;

    try {
        const database = await getDatabase();
        const thread = await database.get("SELECT * FROM threads WHERE threadId = ?", threadId);

        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        res.json(parseThread(thread).messages);
    } catch (err) {
        console.error("Fetch thread messages error:", err);
        res.status(500).json({ error: "Failed to fetch chat" });
    }
});

// Delete single thread
router.delete("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;

    try {
        const database = await getDatabase();
        const deletedThread = await database.run("DELETE FROM threads WHERE threadId = ?", threadId);

        if (!deletedThread.changes) {
            return res.status(404).json({ error: "Thread not found" });
        }

        res.status(200).json({ success: "Thread deleted successfully" });
    } catch (err) {
        console.error("Delete thread error:", err);
        res.status(500).json({ error: "Failed to delete thread" });
    }
});

// Chat endpoint (multi-turn context aware with model fallback)
router.post("/chat", async (req, res) => {
    const { threadId, message } = req.body;

    if (!threadId || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "missing required fields (threadId and non-empty message)" });
    }

    try {
        const database = await getDatabase();
        let thread = await database.get("SELECT * FROM threads WHERE threadId = ?", threadId);
        const now = new Date().toISOString();
        let messages = [];

        if (thread) {
            try {
                messages = typeof thread.messages === "string" ? JSON.parse(thread.messages) : (thread.messages || []);
            } catch {
                messages = [];
            }
        } else {
            thread = { threadId, title: message.trim().slice(0, 50), createdAt: now };
        }

        messages.push({ role: "user", content: message.trim(), timestamp: now });

        // Pass full conversation history to Mistral for multi-turn awareness
        const conversationHistory = messages.map(m => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content
        }));

        const assistantReply = await getMistralAPIResponse(conversationHistory);

        messages.push({ role: "assistant", content: assistantReply, timestamp: new Date().toISOString() });

        await database.run(
            `INSERT INTO threads (threadId, title, messages, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(threadId) DO UPDATE SET messages = excluded.messages, updatedAt = excluded.updatedAt`,
            threadId, thread.title, JSON.stringify(messages), thread.createdAt || now, new Date().toISOString()
        );

        res.json({ reply: assistantReply });
    } catch (err) {
        const statusCode = err?.statusCode;

        if (statusCode === 429) {
            return res.status(429).json({ error: "Mistral API rate limit reached. Please try again in a moment." });
        }

        if (statusCode === 403) {
            return res.status(403).json({ error: "Mistral model is not available for this subscription tier." });
        }

        console.error("Chat completion error:", err);
        res.status(500).json({ error: err?.message || "Failed to generate assistant reply" });
    }
});

export default router;