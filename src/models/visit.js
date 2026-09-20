import db from "../db.js";

/**
 * Registra una visita global a la app.
 * Deduplica: la misma IP en las últimas 24 h solo cuenta una vez.
 *
 * @param {string} ip  - IP del visitante (ya normalizada por Express).
 * @param {string} [ua] - User-Agent (opcional).
 */
export const track = async (ip, ua = null) => {
  const recent = await db.get(
    `SELECT id FROM page_visits
     WHERE ip = ? AND visitedAt >= datetime('now', '-24 hours')
     LIMIT 1`,
    [ip],
  );
  if (recent) return;

  await db.run(
    `INSERT INTO page_visits (ip, userAgent) VALUES (?, ?)`,
    [ip, ua],
  );
};

/**
 * Estadísticas globales de visitas:
 *   - totalVisits  → total de IPs únicas registradas (todas las épocas)
 *   - todayVisits  → IPs únicas en las últimas 24 h
 *   - weekVisits   → IPs únicas en los últimos 7 días
 *   - lastVisitAt  → timestamp de la visita más reciente
 */
export const getStats = async () => {
  const [total, today, week, last] = await Promise.all([
    db.get(`SELECT COUNT(*) AS n FROM page_visits`),
    db.get(`SELECT COUNT(*) AS n FROM page_visits WHERE visitedAt >= datetime('now', '-24 hours')`),
    db.get(`SELECT COUNT(*) AS n FROM page_visits WHERE visitedAt >= datetime('now', '-7 days')`),
    db.get(`SELECT MAX(visitedAt) AS t FROM page_visits`),
  ]);

  return {
    totalVisits: Number(total?.n ?? 0),
    todayVisits: Number(today?.n ?? 0),
    weekVisits: Number(week?.n ?? 0),
    lastVisitAt: last?.t ?? null,
  };
};
