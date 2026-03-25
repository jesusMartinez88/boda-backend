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
        tableId INTEGER,
        isAdult INTEGER DEFAULT 1,
        seatNumber INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      (err) => {
        if (err) console.error("Error creating guests table:", err);
        else {
          console.log("Guests table ready");
          // Asegurar que las columnas necesarias existen (para actualizaciones de DB)
          db.all("PRAGMA table_info(guests)", (err, columns) => {
            if (!err) {
              const hasTableId = columns.some((col) => col.name === "tableId");
              const hasTableName = columns.some(
                (col) => col.name === "tableName",
              );
              const hasIsAdult = columns.some((col) => col.name === "isAdult");
              const hasSeatNumber = columns.some(
                (col) => col.name === "seatNumber",
              );

              if (!hasTableId && hasTableName) {
                db.run("ALTER TABLE guests RENAME COLUMN tableName TO tableId");
              } else if (!hasTableId) {
                db.run("ALTER TABLE guests ADD COLUMN tableId INTEGER");
              }

              if (!hasIsAdult) {
                db.run(
                  "ALTER TABLE guests ADD COLUMN isAdult INTEGER DEFAULT 1",
                  (err) => {
                    if (err) console.error("Error adding isAdult column:", err);
                    else console.log("Added isAdult column to guests table");
                  },
                );
              }

              if (!hasSeatNumber) {
                db.run(
                  "ALTER TABLE guests ADD COLUMN seatNumber INTEGER",
                  (err) => {
                    if (err)
                      console.error("Error adding seatNumber column:", err);
                    else console.log("Added seatNumber column to guests table");
                  },
                );
              }
            }
          });
        }
      },
    );

    // Tabla de configuración
    db.run(
      `
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      (err) => {
        if (err) console.error("Error creating settings table:", err);
        else console.log("Settings table ready");
      },
    );

    // Inicializar configuraciones por defecto
    db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('total_estimated_guests', '0')",
    );
    db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('max_guests_per_table', '10')",
    );
    db.run(
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('auto_assign_tables', '0')",
    );

    // Tabla de mesas (UPDATED)
    db.run(
      `
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        capacity INTEGER, -- Si es NULL, usa el global max_guests_per_table
        shape TEXT DEFAULT 'round', -- 'round' o 'square'
        posX REAL DEFAULT 0,
        posY REAL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      (err) => {
        if (err) console.error("Error creating tables table:", err);
        else {
          console.log("Tables table ready");
          // Migración si el nombre de la columna era 'number'
          db.all("PRAGMA table_info(tables)", (err, columns) => {
            if (!err) {
              const hasName = columns.some((col) => col.name === "name");
              const hasNumber = columns.some((col) => col.name === "number");
              const hasPosX = columns.some((col) => col.name === "posX");
              const hasPosY = columns.some((col) => col.name === "posY");

              if (!hasName && hasNumber) {
                db.serialize(() => {
                  db.run("ALTER TABLE tables RENAME COLUMN number TO name");
                  // Convertir números a string tipo "Mesa X" si el usuario quiere,
                  // pero por ahora solo cambiamos el tipo y nombre de columna.
                  db.run("UPDATE tables SET name = CAST(name AS TEXT)");
                  console.log(
                    "Renamed tables.number to tables.name and cast to TEXT",
                  );
                });
              }

              if (!hasPosX) {
                db.run(
                  "ALTER TABLE tables ADD COLUMN posX REAL DEFAULT 0",
                  (err) => {
                    if (err) console.error("Error adding posX column:", err);
                    else console.log("Added posX column to tables table");
                  },
                );
              }

              if (!hasPosY) {
                db.run(
                  "ALTER TABLE tables ADD COLUMN posY REAL DEFAULT 0",
                  (err) => {
                    if (err) console.error("Error adding posY column:", err);
                    else console.log("Added posY column to tables table");
                  },
                );
              }
            }
          });
        }
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
          const password = process.env.ADMIN_PASSWORD;

          if (!password && !process.env.ADMIN_PASSWORD) {
            console.error(
              "FATAL: ADMIN_PASSWORD environment variable is NOT set.",
            );
          }

          db.get(
            "SELECT id FROM users WHERE username = ?",
            [username],
            (err, row) => {
              if (!row && password) {
                const hashedPassword = bcrypt.hashSync(password, 10);
                db.run(
                  "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
                  [username, hashedPassword, "admin"],
                  (err) => {
                    if (err) console.error("Error creating default user:", err);
                    else console.log(`Default user '${username}' created`);
                  },
                );
              } else if (!row && !password) {
                console.error(
                  "Skipping default user creation because ADMIN_PASSWORD is missing.",
                );
              }
            },
          );
        }
      },
    );

    // Tabla de finanzas (ingresos y gastos)
    db.run(
      `
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
    `,
      (err) => {
        if (err) {
          console.error("Error creating finances table:", err);
        } else {
          console.log("Finances table ready");
          // Migración: agregar columna paidBy si no existe
          db.all("PRAGMA table_info(finances)", (err, columns) => {
            if (!err) {
              const hasPaidBy = columns.some((col) => col.name === "paidBy");
              if (!hasPaidBy) {
                db.run(
                  "ALTER TABLE finances ADD COLUMN paidBy TEXT",
                  (err) => {
                    if (err) console.error("Error adding paidBy column:", err);
                    else console.log("Added paidBy column to finances table");
                  },
                );
              }
            }
          });
        }
      },
    );

    // Tabla de tareas (Todos)
    db.run(
      `
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        date DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      (err) => {
        if (err) console.error("Error creating todos table:", err);
        else console.log("Todos table ready");
      },
    );
  });
};

export default db;
