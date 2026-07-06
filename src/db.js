import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const isProduction = process.env.NODE_ENV === "production";
const url = isProduction
  ? process.env.TURSO_DATABASE_URL
  : process.env.DB_PATH || "file:data/wedding.db";
const authToken = isProduction ? process.env.TURSO_AUTH_TOKEN : undefined;

if (isProduction && !url) {
  console.error("TURSO_DATABASE_URL is not set in environment variables.");
  process.exit(1);
}

console.log(
  `Using ${isProduction ? "Turso" : "local SQLite"} database: ${url}`,
);

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
  },
};

const initializeTables = async () => {
  try {
    console.log(
      `Initializing ${isProduction ? "Turso" : "local SQLite"} database tables...`,
    );

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
    await db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('total_estimated_guests', '0')",
    );
    await db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('max_guests_per_table', '10')",
    );
    await db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('auto_assign_tables', '0')",
    );
    await db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('enable_highchairs', '0')",
    );

    // Tabla de mesas
    await db.run(`
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        capacity INTEGER,
        shape TEXT DEFAULT 'round',
        posX REAL DEFAULT 0,
        posY REAL DEFAULT 0,
        highchairs INTEGER DEFAULT 0,
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
      const user = await db.get("SELECT id FROM users WHERE username = ?", [
        adminUsername,
      ]);
      if (!user) {
        const hashedPassword = bcrypt.hashSync(adminPassword, 10);
        await db.run(
          "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
          [adminUsername, hashedPassword, "admin"],
        );
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

    // Tabla de playlist de musica
    await db.run(`
      CREATE TABLE IF NOT EXISTS music_playlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        youtube_url TEXT NOT NULL,
        youtube_id TEXT,
        note TEXT,
        order_index INTEGER NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_music_playlist_order_index
      ON music_playlist(order_index)
    `);

    // Tabla de categorías de contactos
    await db.run(`
      CREATE TABLE IF NOT EXISTS contact_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insertar categorías por defecto si no existen
    try {
      await db.run(
        "INSERT OR IGNORE INTO contact_categories (name, slug) VALUES ('Novio', 'novio')",
      );
      await db.run(
        "INSERT OR IGNORE INTO contact_categories (name, slug) VALUES ('Novia', 'novia')",
      );
    } catch (e) {}

    // Tabla de contactos para invitaciones (sin restricción de side)
    await db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        side TEXT NOT NULL,
        country_code TEXT DEFAULT '+34' NOT NULL,
        linkSent INTEGER DEFAULT 0,
        sentAt DATETIME,
        invitation_status TEXT DEFAULT 'not_sent',
        responded_at DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migración: agregar country_code a contactos existentes si no existe
    // Solo intentar si la tabla ya existía (verificar si tiene la columna)
    try {
      const tableInfo = await db.all("PRAGMA table_info(contacts)");
      const hasCountryCode = tableInfo.some(
        (col) => col.name === "country_code",
      );

      if (!hasCountryCode) {
        await db.run(
          `ALTER TABLE contacts ADD COLUMN country_code TEXT DEFAULT '+34' NOT NULL`,
        );
        console.log("✅ Column country_code added to existing contacts table");
      }
    } catch (err) {
      // Ignorar errores de migración - la columna ya existe en el schema
      if (!err.message.includes("duplicate column")) {
        console.error("Migration warning:", err.message);
      }
    }

    // Migración: agregar invitation_status y responded_at a contactos existentes
    try {
      const tableInfo = await db.all("PRAGMA table_info(contacts)");
      const hasInvitationStatus = tableInfo.some(
        (col) => col.name === "invitation_status",
      );
      const hasRespondedAt = tableInfo.some(
        (col) => col.name === "responded_at",
      );

      if (!hasInvitationStatus) {
        await db.run(
          `ALTER TABLE contacts ADD COLUMN invitation_status TEXT DEFAULT 'not_sent'`,
        );
        console.log(
          "✅ Column invitation_status added to existing contacts table",
        );
      }
      if (!hasRespondedAt) {
        await db.run(`ALTER TABLE contacts ADD COLUMN responded_at DATETIME`);
        console.log("✅ Column responded_at added to existing contacts table");
      }
    } catch (err) {
      if (!err.message.includes("duplicate column")) {
        console.error("Migration warning:", err.message);
      }
    }

    // Migración: agregar captainIds a tables (para múltiples capitanes)
    try {
      const tablesInfo = await db.all("PRAGMA table_info(tables)");
      const hasCaptainIds = tablesInfo.some((col) => col.name === "captainIds");
      if (!hasCaptainIds) {
        await db.run(`ALTER TABLE tables ADD COLUMN captainIds TEXT`);
        console.log("✅ Column captainIds added to existing tables table");
      }
    } catch (err) {
      if (!err.message?.includes("duplicate column")) {
        console.error("Migration warning (captainIds):", err.message);
      }
    }

    // Migración: quitar columna captainId legacy
    try {
      const tablesInfo = await db.all("PRAGMA table_info(tables)");
      const hasCaptainId = tablesInfo.some((col) => col.name === "captainId");
      if (hasCaptainId) {
        await db.run(`ALTER TABLE tables DROP COLUMN captainId`);
        console.log("✅ Column captainId dropped from tables table");
      }
    } catch (err) {
      if (!err.message?.includes("no such column")) {
        console.error("Migration warning (drop captainId):", err.message);
      }
    }

    // Migración: agregar rotation a tables existentes si no existe
    try {
      const tablesInfo = await db.all("PRAGMA table_info(tables)");
      const hasRotation = tablesInfo.some((col) => col.name === "rotation");
      if (!hasRotation) {
        await db.run(
          `ALTER TABLE tables ADD COLUMN rotation INTEGER DEFAULT 0`,
        );
        console.log("✅ Column rotation added to existing tables table");
      }
    } catch (err) {
      if (!err.message?.includes("duplicate column")) {
        console.error("Migration warning (rotation):", err.message);
      }
    }

    // Migración: agregar highchairs a tables existentes si no existe
    try {
      const tablesInfo = await db.all("PRAGMA table_info(tables)");
      const hasHighchairs = tablesInfo.some((col) => col.name === "highchairs");
      if (!hasHighchairs) {
        await db.run(
          `ALTER TABLE tables ADD COLUMN highchairs INTEGER DEFAULT 0`,
        );
        console.log("✅ Column highchairs added to existing tables table");
      }
    } catch (err) {
      if (!err.message?.includes("duplicate column")) {
        console.error("Migration warning (highchairs):", err.message);
      }
    }

    console.log(
      `${isProduction ? "Turso" : "Local SQLite"} database initialized successfully`,
    );
  } catch (err) {
    console.error(
      `Error initializing ${isProduction ? "Turso" : "local SQLite"} tables:`,
      err,
    );
  }
};

// Ejecutar inicialización
initializeTables();

export default db;
