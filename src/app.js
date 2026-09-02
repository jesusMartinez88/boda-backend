import "./env.js";
import express from "express";
import cors from "cors";
import guestRoutes from "./routes/guests.js";
import statsRoutes from "./routes/stats.js";
import authRoutes from "./routes/auth.js";
import settingsRoutes from "./routes/settings.js";
import tableRoutes from "./routes/tables.js";
import financeRoutes from "./routes/finances.js";
import todoRoutes from "./routes/todos.js";
import aiRoutes from "./routes/ai.js";
import contactRoutes from "./routes/contacts.js";
import categoryRoutes from "./routes/categories.js";
import musicPlaylistRoutes from "./routes/music-playlist.routes.js";
import userRoutes from "./routes/users.js";
import { initializeEmailService } from "./services/emailService.js";
import { initializeWhatsAppService } from "./services/whatsappService.js";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import jwt from "jsonwebtoken";
import compression from "compression";
import { logError } from "./utils/logger.js";

const app = express();

initializeEmailService();
initializeWhatsAppService();

const isProduction = process.env.NODE_ENV === "production";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: isProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
  }),
);

app.use(
  compression({
    filter: (req, res) => {
      if (req.originalUrl?.includes("/api/ai")) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET);
        return 500;
      } catch {}
    }
    return 100;
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts, please try again in an hour.",
  },
});

const corsOptions = {
  origin: process.env.ORIGIN_URL || "http://localhost:4200",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
};

app.set("trust proxy", 1);
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/", generalLimiter);

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Wedding API is running" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/table", tableRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/finances", financeRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/music-playlist", musicPlaylistRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  logError(`Error in ${req.method} ${req.path}`, err);

  const production = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    success: false,
    error: "Internal server error",
    ...(production ? {} : { message: err.message, stack: err.stack }),
  });
});

export default app;
