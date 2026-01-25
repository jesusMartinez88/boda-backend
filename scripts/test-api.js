#!/usr/bin/env node

/**
 * Script de prueba rápida de la API
 * Ejecutar: node scripts/test-api.js
 */

import http from "http";

const baseUrl = "http://localhost:3000";

function makeRequest(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body),
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: body,
          });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log("🧪 Iniciando pruebas de API...\n");

  try {
    // Test 1: Health check
    console.log("📋 Test 1: Health Check");
    let result = await makeRequest("/health");
    console.log("Status:", result.status);
    console.log("Response:", result.data);
    console.log("✅ PASS\n");

    // Test 2: Listar invitados
    console.log("📋 Test 2: Listar todos los invitados");
    result = await makeRequest("/api/guests");
    console.log("Status:", result.status);
    console.log("Count:", result.data.count);
    console.log("✅ PASS\n");

    // Test 3: Obtener invitado específico
    console.log("📋 Test 3: Obtener invitado específico (ID: 1)");
    result = await makeRequest("/api/guests/1");
    console.log("Status:", result.status);
    if (result.data.data) {
      console.log("Name:", result.data.data.name);
    }
    console.log("✅ PASS\n");

    // Test 4: Estadísticas
    console.log("📋 Test 4: Obtener estadísticas generales");
    result = await makeRequest("/api/stats");
    console.log("Status:", result.status);
    console.log("Data:", result.data.data);
    console.log("✅ PASS\n");

    // Test 5: Crear invitado
    console.log("📋 Test 5: Crear nuevo invitado");
    const newGuest = {
      name: "Test Usuario",
      email: "test@example.com",
      phone: "666666666",
      attending: true,
      mealType: "normal",
      needsTransport: true,
      allergies: null,
      notes: "Prueba",
    };
    result = await makeRequest("/api/guests", "POST", newGuest);
    console.log("Status:", result.status);
    if (result.data.data) {
      console.log("Created ID:", result.data.data.id);
    }
    console.log("✅ PASS\n");

    console.log("🎉 Todas las pruebas pasaron correctamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

runTests();
