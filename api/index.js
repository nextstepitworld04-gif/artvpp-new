import app from "../backend/server.js";
import connectDB from "../backend/config/db.js";

export default async (req, res) => {
    try {
        await connectDB();

        // Vercel sometimes passes the full path, sometimes strips the prefix.
        // Our Express app expects paths like /api/v1/...
        // If the path doesn't start with /api/v1, we might need to adjust it.
        console.log(`Incoming request: ${req.method} ${req.url}`);

        return app(req, res);
    } catch (error) {
        console.error("❌ Vercel function error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error - Database connection failed",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
