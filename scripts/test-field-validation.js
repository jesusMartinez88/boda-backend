// Test de validación de longitud de campos
// Ejecutar con el servidor corriendo: node scripts/test-field-validation.js

const BASE_URL = "http://localhost:3000/api";

async function testFieldValidation() {
  try {
    console.log("🧪 Testing Field Length Validation\n");

    // Test 1: Nombre muy largo en contacto
    console.log("1️⃣ POST /api/contacts - Nombre muy largo (>100 caracteres)");
    const longName = "A".repeat(101);
    const test1 = await fetch(`${BASE_URL}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: longName,
        phone: "611222333",
        side: "novio",
        countryCode: "+34"
      })
    });
    const result1 = await test1.json();
    
    if (!result1.success && result1.error && result1.error.includes("máximo 100 caracteres")) {
      console.log("   ✅ Validación funcionando: " + result1.error);
    } else {
      console.log("   ❌ ERROR: Nombre largo fue aceptado");
      console.log("   Response:", JSON.stringify(result1));
    }

    // Test 2: Teléfono inválido internacional
    console.log("\n2️⃣ POST /api/contacts - Teléfono inválido para USA");
    const test2 = await fetch(`${BASE_URL}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test USA",
        phone: "123", // Muy corto
        side: "novio",
        countryCode: "+1"
      })
    });
    const result2 = await test2.json();
    
    if (!result2.success && result2.error.includes("inválido")) {
      console.log("   ✅ Validación funcionando: " + result2.error);
    } else {
      console.log("   ❌ ERROR: Teléfono inválido fue aceptado");
    }

    // Test 3: Contacto válido internacional
    console.log("\n3️⃣ POST /api/contacts - Contacto válido (UK)");
    const test3 = await fetch(`${BASE_URL}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "John Smith",
        phone: "7400123456",
        side: "novio",
        countryCode: "+44"
      })
    });
    const result3 = await test3.json();
    
    if (result3.success) {
      console.log(`   ✅ Contacto creado: ${result3.data.name} - ${result3.data.countryCode} ${result3.data.phone}`);
      
      // Limpiar
      await fetch(`${BASE_URL}/contacts/${result3.data.id}`, { method: "DELETE" });
      console.log("   ✅ Contacto de prueba eliminado");
    } else {
      console.log("   ❌ ERROR: " + result3.error);
    }

    // Test 4: Email inválido en invitado
    console.log("\n4️⃣ POST /api/guests - Email inválido");
    const test4 = await fetch(`${BASE_URL}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Guest",
        email: "invalid-email", // Sin @
        adults: 1
      })
    });
    const result4 = await test4.json();
    
    if (!result4.success && result4.error.includes("Email inválido")) {
      console.log("   ✅ Validación funcionando: " + result4.error);
    } else {
      console.log("   ❌ ERROR: Email inválido fue aceptado");
    }

    // Test 5: Notas muy largas en invitado
    console.log("\n5️⃣ POST /api/guests - Notas muy largas (>1000 caracteres)");
    const longNotes = "A".repeat(1001);
    const test5 = await fetch(`${BASE_URL}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Guest",
        notes: longNotes,
        adults: 1
      })
    });
    const result5 = await test5.json();
    
    if (!result5.success && result5.error.includes("máximo 1000 caracteres")) {
      console.log("   ✅ Validación funcionando: " + result5.error);
    } else {
      console.log("   ❌ ERROR: Notas largas fueron aceptadas");
    }

    console.log("\n✅ Tests de validación completados!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

testFieldValidation();
