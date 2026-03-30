import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const isProduction = process.env.NODE_ENV === "production";
const url = isProduction ? process.env.TURSO_DATABASE_URL : (process.env.DB_PATH || "file:data/wedding.db");
const authToken = isProduction ? process.env.TURSO_AUTH_TOKEN : undefined;

if (isProduction && !url) {
  console.error("TURSO_DATABASE_URL is not set in environment variables.");
  process.exit(1);
}

console.log(`Using ${isProduction ? "Turso" : "local SQLite"} database: ${url}`);

const client = createClient({
  url: url,
  authToken: authToken,
});

const db = {
  /**
   * Ejecuta una consulta y devuelve todas las filas (mimic sqlite3.all)
   */
  all: async (sql, params = []) => {
    try {
      const result = await client.execute({ sql, args: params });
      return result.rows;
    } catch (err) {
      console.error("Database Error (all):", err);
      throw err;
    }
  },

  /**
   * Ejecuta una consulta y devuelve la primera fila (mimic sqlite3.get)
   */
  get: async (sql, params = []) => {
    try {
      const result = await client.execute({ sql, args: params });
      return result.rows[0];
    } catch (err) {
      console.error("Database Error (get):", err);
      throw err;
    }
  },

  /**
   * Ejecuta una consulta (INSERT, UPDATE, DELETE) (mimic sqlite3.run)
   */
  run: async (sql, params = []) => {
    try {
      const result = await client.execute({ sql, args: params });
      return {
        lastID: result.lastInsertRowid ? Number(result.lastInsertRowid) : null,
        changes: result.rowsAffected,
      };
    } catch (err) {
      console.error("Database Error (run):", err);
      throw err;
    }
  },

  /**
   * Ejecuta múltiples consultas en una transacción (mimic sqlite3.serialize simple logic or batch)
   */
  batch: async (queries) => {
    try {
      return await client.batch(queries);
    } catch (err) {
      console.error("Database Error (batch):", err);
      throw err;
    }
  },

  // Método de conveniencia para ejecutar SQL crudo
  execute: async (sql, params = []) => {
    return await client.execute({ sql, args: params });
  }
};

const initializeTables = async () => {
  try {
    console.log(`Initializing ${isProduction ? "Turso" : "local SQLite"} database tables...`);

    // Tabla de invitados
    await db.run(`
      CREATE TABLE IF NOT EXISTS guests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        attending INTEGER DEFAULT 0,
        mealType TEXT DEFAULT 'normal',
        needsTransport INTEGER DEFAULT 0,
        allergies TEXT,
        notes TEXT,
        tableId INTEGER,
        isAdult INTEGER DEFAULT 1,
        seatNumber INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de configuración
    await db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inicializar configuraciones por defecto
    await db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('total_estimated_guests', '0')");
    await db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('max_guests_per_table', '10')");
    await db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('auto_assign_tables', '0')");

    // Tabla de mesas
    await db.run(`
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        capacity INTEGER,
        shape TEXT DEFAULT 'round',
        posX REAL DEFAULT 0,
        posY REAL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de acompañantes
    await db.run(`
      CREATE TABLE IF NOT EXISTS companions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guestId INTEGER NOT NULL,
        name TEXT NOT NULL,
        relation TEXT,
        mealType TEXT DEFAULT 'normal',
        allergies TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (guestId) REFERENCES guests(id) ON DELETE CASCADE
      )
    `);

    // Tabla de preferencias
    await db.run(`
      CREATE TABLE IF NOT EXISTS preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guestId INTEGER NOT NULL,
        musicPreference TEXT,
        seatLocation TEXT,
        dietaryRestriction TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (guestId) REFERENCES guests(id) ON DELETE CASCADE
      )
    `);

    // Tabla de usuarios
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Usuario admin por defecto
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword) {
      const user = await db.get("SELECT id FROM users WHERE username = ?", [adminUsername]);
      if (!user) {
        const hashedPassword = bcrypt.hashSync(adminPassword, 10);
        await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [
          adminUsername,
          hashedPassword,
          "admin",
        ]);
        console.log(`Default user '${adminUsername}' created`);
      }
    }

    // Tabla de finanzas
    await db.run(`
      CREATE TABLE IF NOT EXISTS finances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
        category TEXT,
        paidBy TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de tareas (Todos)
    await db.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        date DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log(`${isProduction ? "Turso" : "Local SQLite"} database initialized successfully`);
  } catch (err) {
    console.error(`Error initializing ${isProduction ? "Turso" : "local SQLite"} tables:`, err);
  }
};

// Ejecutar inicialización
initializeTables();

export default db;
