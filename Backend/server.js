import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Database connection middleware for serverless environment
const connectDBMiddleware = async (req, res, next) => {
    if (mongoose.connection.readyState === 1) {
        return next();
    }
    const dbUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sigmagpt";
    try {
        await mongoose.connect(dbUri);
        console.log("Connected with Database successfully!");
        next();
    } catch (err) {
        console.error(`Failed to connect with Database at ${dbUri}:`, err.message);
        next(err);
    }
};

app.use(connectDBMiddleware);

app.use("/api", chatRoutes);

// Export app for Vercel Serverless
export default app;

// Only listen when running locally (not in serverless environment)
if (!process.env.VERCEL) {
    app.listen(PORT, async () => {
        console.log(`Server running on port ${PORT}`);
        // Connect immediately when running locally
        const dbUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sigmagpt";
        try {
            await mongoose.connect(dbUri);
            console.log("Connected with Database successfully (local)!");
        } catch (err) {
            console.error(`Failed to connect with Database at ${dbUri} (local):`, err.message);
        }
    });
}



