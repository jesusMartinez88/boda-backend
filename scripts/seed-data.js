#!/usr/bin/env node

/**
 * Script para cargar datos de ejemplo en la base de datos
 * Ejecutar: node scripts/seed-data.js
 */

import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../data/wedding.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
    process.exit(1);
  }
});

const sampleGuests = [
  {
    name: "Juan García López",
    email: "juan.garcia@example.com",
    phone: "612345678",
    attending: true,
    mealType: "normal",
    needsTransport: true,
    allergies: null,
    notes: "Amigo de la familia",
  },
  {
    name: "María Rodríguez Martínez",
    email: "maria.rodriguez@example.com",
    phone: "623456789",
    attending: true,
    mealType: "vegetarian",
    needsTransport: false,
    allergies: "Gluten",
    notes: "Celíaca",
  },
  {
    name: "Carlos Fernández López",
    email: "carlos.fernandez@example.com",
    phone: "634567890",
    attending: true,
    mealType: "normal",
    needsTransport: true,
    allergies: null,
    notes: "Compañero de trabajo",
  },
  {
    name: "Ana Martínez García",
    email: "ana.martinez@example.com",
    phone: "645678901",
    attending: false,
    mealType: "normal",
    needsTransport: false,
    allergies: null,
    notes: "No puede asistir por motivos laborales",
  },
  {
    name: "Pedro Sánchez López",
    email: "pedro.sanchez@example.com",
    phone: "656789012",
    attending: true,
    mealType: "normal",
    needsTransport: false,
    allergies: "Lactosa",
    notes: "Intolerante a la lactosa",
  },
  {
    name: "Isabel Gómez Martínez",
    email: "isabel.gomez@example.com",
    phone: "667890123",
    attending: true,
    mealType: "vegan",
    needsTransport: true,
    allergies: "Frutos secos",
    notes: "Vegana, alérgica a frutos secos",
  },
];

const insertGuests = () => {
  db.serialize(() => {
    const stmt = db.prepare(
      "INSERT INTO guests (name, email, phone, attending, mealType, needsTransport, allergies, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );

    sampleGuests.forEach((guest) => {
      stmt.run(
        guest.name,
        guest.email,
        guest.phone,
        guest.attending ? 1 : 0,
        guest.mealType,
        guest.needsTransport ? 1 : 0,
        guest.allergies,
        guest.notes,
        (err) => {
          if (err) {
            console.error("Error inserting guest:", err);
          }
        },
      );
    });

    stmt.finalize((err) => {
      if (err) {
        console.error("Error finalizing statement:", err);
      } else {
        console.log(`✅ ${sampleGuests.length} guests loaded successfully!`);
      }
      db.close();
    });
  });
};

// Clear existing guests first (optional)
db.run("DELETE FROM guests", (err) => {
  if (err) console.error("Error clearing guests:", err);
  insertGuests();
});
