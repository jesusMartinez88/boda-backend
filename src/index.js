import express from "express";
import cors from "cors";
import "dotenv/config";
import db from "./db.js";
import guestRoutes from "./routes/guests.js";
import statsRoutes from "./routes/stats.js";
import authRoutes from "./routes/auth.js";
import settingsRoutes from "./routes/settings.js";
import tableRoutes from "./routes/tables.js";
import { initializeEmailService } from "./services/emailService.js";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize email service
initializeEmailService();

// Security Middlewares
app.use(helmet());

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts, please try again in an hour." }
});

const corsOptions = {
  origin: process.env.ORIGIN_URL || "http://localhost:4200",
  methods: ["GET", "POST", "PUT","PATCH", "DELETE"],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/", generalLimiter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Wedding API is running" });
});

// API Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/table", tableRoutes); // Alias en singular
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
