import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

console.log("🧪 Testing International Phone Validation\n");

const testCases = [
  // España
  { phone: "611222333", countryCode: "+34", expected: true, country: "España" },
  { phone: "711222333", countryCode: "+34", expected: true, country: "España" },
  { phone: "511222333", countryCode: "+34", expected: true, country: "España (fijo)" },
  { phone: "12345", countryCode: "+34", expected: false, country: "España (muy corto)" },
  
  // USA
  { phone: "2025551234", countryCode: "+1", expected: true, country: "USA" },
  { phone: "5551234", countryCode: "+1", expected: false, country: "USA (muy corto)" },
  
  // UK
  { phone: "7400123456", countryCode: "+44", expected: true, country: "UK" },
  { phone: "2071234567", countryCode: "+44", expected: true, country: "UK (London)" },
  
  // Francia
  { phone: "612345678", countryCode: "+33", expected: true, country: "Francia" },
  
  // Argentina
  { phone: "1123456789", countryCode: "+54", expected: true, country: "Argentina" },
  
  // México
  { phone: "5512345678", countryCode: "+52", expected: true, country: "México" },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ phone, countryCode, expected, country }) => {
  const fullNumber = `${countryCode}${phone}`;
  const isValid = isValidPhoneNumber(fullNumber);
  const status = isValid === expected ? "✅" : "❌";
  
  if (isValid === expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`${status} ${country}: ${countryCode} ${phone} - ${isValid ? "VÁLIDO" : "INVÁLIDO"}`);
  
  if (isValid && isValid === expected) {
    try {
      const parsed = parsePhoneNumber(fullNumber);
      console.log(`   Formato internacional: ${parsed.formatInternational()}`);
      console.log(`   Formato nacional: ${parsed.formatNational()}`);
    } catch (e) {
      // Ignorar errores de parsing
    }
  }
});

console.log(`\n📊 Resultados: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log("✅ Todos los tests pasaron!");
} else {
  console.log("❌ Algunos tests fallaron");
  process.exit(1);
}
