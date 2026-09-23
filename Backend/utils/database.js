import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const databaseDirectory = process.env.VERCEL
    ? path.join("/tmp", "sigmagpt_data")
    : path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");

const databasePath = path.join(databaseDirectory, "sigmagpt.sqlite");
let databasePromise;

export const getDatabase = async () => {
    if (!databasePromise) {
        databasePromise = (async () => {
            await mkdir(databaseDirectory, { recursive: true });
            const database = await open({ filename: databasePath, driver: sqlite3.Database });
            await database.exec(`
                CREATE TABLE IF NOT EXISTS threads (
                    threadId TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    messages TEXT NOT NULL DEFAULT '[]',
                    createdAt TEXT NOT NULL,
                    updatedAt TEXT NOT NULL
                )
            `);
            return database;
        })();
    }

    return databasePromise;
};

export const parseThread = (thread) => {
    if (!thread) return null;
    let parsedMessages = [];
    try {
        parsedMessages = typeof thread.messages === "string" ? JSON.parse(thread.messages) : (thread.messages || []);
    } catch {
        parsedMessages = [];
    }
    return {
        ...thread,
        messages: parsedMessages
    };
};