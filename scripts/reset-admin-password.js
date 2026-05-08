import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

// Cargar variables de entorno
try {
  process.loadEnvFile();
} catch (e) {
  console.error("❌ No se pudo cargar .env");
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === "production";
const url = isProduction ? process.env.TURSO_DATABASE_URL : (process.env.DB_PATH || "file:data/wedding.db");
const authToken = isProduction ? process.env.TURSO_AUTH_TOKEN : undefined;

console.log(`🔐 Reseteando contraseña de admin en ${isProduction ? "Turso" : "local SQLite"}...\n`);

const client = createClient({ url, authToken });

async function resetAdminPassword() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error("❌ ADMIN_PASSWORD no está definido en .env");
      process.exit(1);
    }

    console.log(`Usuario: ${adminUsername}`);
    console.log(`Nueva contraseña: ${adminPassword}`);
    console.log("");

    // Verificar si el usuario existe
    const user = await client.execute({
      sql: "SELECT id, username FROM users WHERE username = ?",
      args: [adminUsername]
    });

    if (user.rows.length === 0) {
      console.log("⚠️  Usuario no existe, creándolo...");
      
      // Crear usuario
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      await client.execute({
        sql: "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        args: [adminUsername, hashedPassword, "admin"]
      });
      
      console.log(`✅ Usuario '${adminUsername}' creado exitosamente`);
    } else {
      console.log(`✅ Usuario '${adminUsername}' encontrado (ID: ${user.rows[0].id})`);
      
      // Actualizar contraseña
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      await client.execute({
        sql: "UPDATE users SET password = ? WHERE username = ?",
        args: [hashedPassword, adminUsername]
      });
      
      console.log(`✅ Contraseña actualizada exitosamente`);
    }

    console.log("\n🎉 Proceso completado!");
    console.log("\n📝 Credenciales de acceso:");
    console.log(`   Usuario: ${adminUsername}`);
    console.log(`   Contraseña: ${adminPassword}`);
    console.log("\n⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

resetAdminPassword();
