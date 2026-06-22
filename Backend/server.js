import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.use("/api", chatRoutes);

// Define DB Connection before starting the server
const connectDB = async () => {
    const dbUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sigmagpt";
    try {
        await mongoose.connect(dbUri);
        console.log("Connected with Database successfully!");
    } catch (err) {
        console.error(`Failed to connect with Database at ${dbUri}:`, err.message);
    }
};

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await connectDB();
});


