import { createClient } from '@libsql/client';

const client = createClient({ url: 'file:data/wedding.db' });

// Ver columnas reales de la tabla
const pragma = await client.execute('PRAGMA table_info(landing_questionnaire)');
console.log('=== COLUMNS ===');
pragma.rows.forEach(r => console.log(r.cid, r.name, r.type, '| default:', r.dflt_value));

// Ver todas las filas
const rows = await client.execute('SELECT id, userId, weddingDate, estimatedGuests, predominantColor FROM landing_questionnaire');
console.log('\n=== ROWS (' + rows.rows.length + ') ===');
rows.rows.forEach(r => console.log(JSON.stringify(r)));

// Ver usuarios registrados
const users = await client.execute('SELECT id, username, slug, createdAt FROM users ORDER BY id DESC LIMIT 10');
console.log('\n=== RECENT USERS ===');
users.rows.forEach(r => console.log(JSON.stringify(r)));

// Ver si hay fila para userId=14 (pepe-pepe)
const lq14 = await client.execute('SELECT * FROM landing_questionnaire WHERE userId = 14');
console.log('\n=== LQ for userId=14 ===', lq14.rows.length, 'filas');

// SELECT con PUBLIC_COLUMNS del model actualizado
try {
  const testSelect = await client.execute(
    'SELECT id, userId, weddingDate, estimatedGuests, predominantColor, hasCountdown, hasBusService, hasHotelService, hasOurStory, hasAddToCalendar, hasVenueMap, hasGiftRegistry, giftBankAccount, contactCouple, contactGroomPhone, contactBridePhone, additionalServices, notes, createdAt, updatedAt FROM landing_questionnaire WHERE userId = 11'
  );
  console.log('\n=== SELECT with new columns for userId=11 ===');
  console.log(JSON.stringify(testSelect.rows[0] ?? null, null, 2));
} catch (err) {
  console.error('\n=== SELECT ERROR ===', err.message);
}

process.exit(0);
