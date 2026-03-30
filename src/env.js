try {
  process.loadEnvFile();
  console.log("Environment variables loaded from .env");
} catch (e) {
  // Ignorar si el archivo no existe
}
