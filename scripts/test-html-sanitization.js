import { sanitizeHTML, sanitizeRichText, sanitizeObject } from '../src/utils/validation.js';

console.log("🧪 Testing HTML Sanitization with DOMPurify\n");

// Test 1: Sanitización completa (eliminar TODO el HTML)
console.log("1️⃣ sanitizeHTML - Eliminar TODO el HTML");
const maliciousHTML = '<script>alert("XSS")</script><p>Texto normal</p><img src=x onerror="alert(1)">';
const sanitized1 = sanitizeHTML(maliciousHTML);
console.log(`   Input:  ${maliciousHTML}`);
console.log(`   Output: ${sanitized1}`);
console.log(`   ✅ ${sanitized1 === 'Texto normal' ? 'HTML eliminado correctamente' : 'ERROR'}\n`);

// Test 2: Rich text seguro (permitir tags seguros)
console.log("2️⃣ sanitizeRichText - Permitir tags seguros");
const richText = '<p>Texto con <b>negrita</b> y <script>alert("XSS")</script></p>';
const sanitized2 = sanitizeRichText(richText);
console.log(`   Input:  ${richText}`);
console.log(`   Output: ${sanitized2}`);
console.log(`   ✅ ${sanitized2.includes('<b>') && !sanitized2.includes('<script>') ? 'Tags seguros permitidos, scripts eliminados' : 'ERROR'}\n`);

// Test 3: XSS en atributos
console.log("3️⃣ XSS en atributos");
const xssAttr = '<a href="javascript:alert(1)">Click</a>';
const sanitized3 = sanitizeHTML(xssAttr);
console.log(`   Input:  ${xssAttr}`);
console.log(`   Output: ${sanitized3}`);
console.log(`   ✅ ${!sanitized3.includes('javascript:') ? 'JavaScript en href eliminado' : 'ERROR'}\n`);

// Test 4: Sanitización de objeto completo
console.log("4️⃣ sanitizeObject - Sanitizar objeto completo");
const dirtyObject = {
  name: '<script>alert("XSS")</script>Juan Pérez',
  email: 'juan@example.com',
  notes: '<p>Notas con <b>formato</b> y <script>alert("XSS")</script></p>',
  allergies: '<img src=x onerror="alert(1)">Ninguna',
};

const cleanObject = sanitizeObject(
  dirtyObject,
  ['name', 'allergies'], // Eliminar HTML completamente
  ['notes'] // Permitir rich text seguro
);

console.log("   Input:");
console.log(`     name: ${dirtyObject.name}`);
console.log(`     notes: ${dirtyObject.notes}`);
console.log(`     allergies: ${dirtyObject.allergies}`);
console.log("\n   Output:");
console.log(`     name: ${cleanObject.name}`);
console.log(`     notes: ${cleanObject.notes}`);
console.log(`     allergies: ${cleanObject.allergies}`);

const nameClean = !cleanObject.name.includes('<script>');
const notesHasFormat = cleanObject.notes.includes('<b>');
const notesNoScript = !cleanObject.notes.includes('<script>');
const allergiesClean = !cleanObject.allergies.includes('<img');

console.log(`\n   ✅ name limpio: ${nameClean}`);
console.log(`   ✅ notes con formato: ${notesHasFormat}`);
console.log(`   ✅ notes sin scripts: ${notesNoScript}`);
console.log(`   ✅ allergies limpio: ${allergiesClean}`);

// Test 5: Inyección de eventos
console.log("\n5️⃣ Inyección de eventos HTML");
const eventInjection = '<div onload="alert(1)" onclick="alert(2)">Click me</div>';
const sanitized5 = sanitizeHTML(eventInjection);
console.log(`   Input:  ${eventInjection}`);
console.log(`   Output: ${sanitized5}`);
console.log(`   ✅ ${!sanitized5.includes('onload') && !sanitized5.includes('onclick') ? 'Eventos eliminados' : 'ERROR'}\n`);

// Test 6: SVG con scripts
console.log("6️⃣ SVG con scripts embebidos");
const svgXSS = '<svg><script>alert("XSS")</script></svg>';
const sanitized6 = sanitizeHTML(svgXSS);
console.log(`   Input:  ${svgXSS}`);
console.log(`   Output: ${sanitized6}`);
console.log(`   ✅ ${!sanitized6.includes('<script>') ? 'Scripts en SVG eliminados' : 'ERROR'}\n`);

// Test 7: Data URIs maliciosos
console.log("7️⃣ Data URIs maliciosos");
const dataURI = '<img src="data:text/html,<script>alert(1)</script>">';
const sanitized7 = sanitizeHTML(dataURI);
console.log(`   Input:  ${dataURI}`);
console.log(`   Output: ${sanitized7}`);
console.log(`   ✅ ${sanitized7 === '' ? 'Data URI malicioso eliminado' : 'ERROR'}\n`);

console.log("✅ Todos los tests de sanitización completados!");
console.log("\n🔒 DOMPurify está protegiendo contra:");
console.log("   - XSS via <script> tags");
console.log("   - XSS via atributos (onclick, onload, etc.)");
console.log("   - XSS via javascript: URIs");
console.log("   - XSS via data: URIs");
console.log("   - XSS via SVG embebido");
console.log("   - Inyección de HTML arbitrario");
