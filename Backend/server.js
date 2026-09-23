import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import chatRoutes from "./routes/chat.js";
import { getDatabase } from "./utils/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const connectDBMiddleware = async (req, res, next) => {
    try {
        await getDatabase();
        next();
    } catch (err) {
        console.error("Failed to initialize SQLite database:", err.message);
        next(err);
    }
};

app.use(connectDBMiddleware);
app.use("/api", chatRoutes);

// Export app for Vercel Serverless
export default app;

// Only listen when running locally (not in serverless environment)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
