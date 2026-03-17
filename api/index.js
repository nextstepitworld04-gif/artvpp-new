import app from "../backend/server.js";
import connectDB from "../backend/config/db.js";

export default async (req, res) => {
    try {
        await connectDB();
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
