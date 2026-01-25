import express from "express";
import cors from "cors";
import "dotenv/config";
import db from "./db.js";
import guestRoutes from "./routes/guests.js";
import statsRoutes from "./routes/stats.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Wedding API is running" });
});

// API Routes
app.use("/api/guests", guestRoutes);
app.use("/api/stats", statsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎉 Wedding API running on http://localhost:${PORT}`);
  console.log(`📊 API documentation at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down...");
  db.close((err) => {
    if (err) console.error("Error closing database:", err);
    process.exit(0);
  });
});
