import mongoose from "mongoose";
import dns from "dns";

// Force Node.js to use Google DNS for SRV lookups (helps with some ISP issues)
dns.setServers(['8.8.8.8', '8.8.4.4']);

/**
 * Connects to MongoDB database
 * Uses connection pooling by default in Mongoose 6+
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // These options are set by default in Mongoose 6+
            // but we include them for clarity
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on("error", (err) => {
            console.error("❌ MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("⚠️ MongoDB disconnected");
        });

        // Graceful shutdown
        process.on("SIGINT", async () => {
            await mongoose.connection.close();
            console.log("MongoDB connection closed due to app termination");
            process.exit(0);
        });

    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;

