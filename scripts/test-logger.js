import logger, { logError, logInfo, logWarn, logDebug } from '../src/utils/logger.js';

console.log("🧪 Testing Winston Logger...\n");

// Test diferentes niveles de log
logInfo("Test INFO message", { user: "test", action: "login" });
logWarn("Test WARNING message", { reason: "rate limit approaching" });
logDebug("Test DEBUG message", { query: "SELECT * FROM users" });

// Test error logging
try {
  throw new Error("Test error for logging");
} catch (error) {
  logError("Test ERROR caught", error);
}

console.log("\n✅ Logs escritos. Verifica:");
console.log("   - logs/combined.log (todos los niveles)");
console.log("   - logs/error.log (solo errores)");
