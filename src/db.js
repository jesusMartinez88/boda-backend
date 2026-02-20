import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath =
  process.env.DB_PATH || path.join(__dirname, "../data/wedding.db");

// Asegurar que la carpeta data existe
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");
    initializeTables();
  }
});

const initializeTables = () => {
  db.serialize(() => {
    // Tabla de invitados
    db.run(
      `
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
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      (err) => {
        if (err) console.error("Error creating guests table:", err);
        else console.log("Guests table ready");
      },
    );

    // Tabla de acompañantes
    db.run(
      `
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
    `,
      (err) => {
        if (err) console.error("Error creating companions table:", err);
        else console.log("Companions table ready");
      },
    );

    // Tabla de preferencias
    db.run(
      `
      CREATE TABLE IF NOT EXISTS preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guestId INTEGER NOT NULL,
        musicPreference TEXT,
        seatLocation TEXT,
        dietaryRestriction TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (guestId) REFERENCES guests(id) ON DELETE CASCADE
      )
    `,
      (err) => {
        if (err) console.error("Error creating preferences table:", err);
        else console.log("Preferences table ready");
      },
    );

    // Tabla de usuarios (para el panel de control/stats)
    db.run(
      `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      (err) => {
        if (err) {
          console.error("Error creating users table:", err);
        } else {
          console.log("Users table ready");
          // Crear usuario por defecto si no existe
          const username = process.env.ADMIN_USERNAME || "admin";
          const password = process.env.ADMIN_PASSWORD || "boda2026";
          
          db.get("SELECT id FROM users WHERE username = ?", [username], (err, row) => {
            if (!row) {
              const hashedPassword = bcrypt.hashSync(password, 10);
              db.run(
                "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                [username, hashedPassword, "admin"],
                (err) => {
                  if (err) console.error("Error creating default user:", err);
                  else console.log(`Default user '${username}' created`);
                }
              );
            }
          });
        }
      },
    );
  });
};

export default db;
