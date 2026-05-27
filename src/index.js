import app from "./app.js";
import { logInfo } from "./utils/logger.js";
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
  logInfo(`🎉 Wedding API running on http://localhost:${PORT}`);
  logInfo(`📊 API documentation at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  logInfo("Shutting down gracefully...");
  // El cliente de libSQL no requiere un cierre explícito forzado de la misma manera que sqlite3
  process.exit(0);
});
