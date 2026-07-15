import * as Setting from "../models/setting.js";

/**
 * Servicio de notificaciones vía WhatsApp usando CallMeBot.
 *
 * CallMeBot es un servicio gratuito que expone una API HTTP GET muy simple:
 *   https://api.callmebot.com/whatsapp.php?phone=<PHONE>&text=<TEXT>&apikey=<APIKEY>
 *
 * La API key se obtiene activando el bot en WhatsApp una vez (ver docs de CallMeBot).
 * El `phone` y la `apikey` los configuramos como settings de la app
 * (`whatsapp_phone`, `whatsapp_apikey`). El envío solo se dispara si la setting
 * booleana `enable_whatsapp` está activa.
 */

let initialized = false;

/**
 * Inicializa el servicio. No necesita SDK ni claves en tiempo de arranque
 * porque las settings se consultan en cada envío. Se mantiene por simetría
 * con `emailService` y para poder añadir aquí validaciones futuras.
 */
export const initializeWhatsAppService = () => {
  initialized = true;
  console.log("✅ WhatsApp (CallMeBot) service ready");
  return true;
};

const buildCallMeBotUrl = ({ phone, apikey, text }) => {
  // CallMeBot necesita el texto sin encoding adicional, porque URLSearchParams
  // ya lo hace. Solo limpiamos el teléfono de espacios.
  const cleanPhone = phone.replace(/\s+/g, "");

  const params = new URLSearchParams({
    phone: cleanPhone,
    text: text,
    apikey,
  });

  return `https://api.callmebot.com/whatsapp.php?${params.toString()}`;
};

const formatGuestMessage = (guest, numAdults, numChildren) => {
  const attendance = guest.attending ? "✅ Confirmado" : "❌ No asiste";
  const transport = guest.needsTransport ? "🚌 Sí necesita" : "✖️ No necesita";
  const allergies = guest.allergies || "Ninguna";
  const notes = guest.notes || "Sin observaciones";
  const phone = guest.phone || "No proporcionado";
  const email = guest.email || "No proporcionado";

  // Construir el mensaje con mejor formato y separación
  const lines = [
    "🎉 *¡NUEVA CONFIRMACIÓN!* 🎉",
    "━━━━━━━━━━━━━━━━━",
    "",
    `👤 *${guest.name.trim()}*`,
    "",
    "� *DATOS DE CONTACTO*",
    `📧 ${email}`,
    `📱 ${phone}`,
    "",
    "👥 *ASISTENCIA*",
    `${attendance}`,
    `• Adultos: ${numAdults}`,
    `• Niños: ${numChildren}`,
    "",
    "🍽️ *PREFERENCIAS*",
    `• Menú: ${guest.mealType || "Normal"}`,
    `• Alergias: ${allergies}`,
    "",
    "🚌 *TRANSPORTE*",
    `${transport}`,
  ];

  // Solo agregar notas si hay algo relevante
  if (notes && notes !== "Sin observaciones") {
    lines.push("");
    lines.push("� *OBSERVACIONES*");
    lines.push(notes);
  }

  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━");
  lines.push("✨ _Notificación automática_ ✨");

  return lines.join("\n");
};

/**
 * Envía una notificación por WhatsApp al propietario cuando se crea un nuevo
 * invitado. Es un fire-and-forget: si falla, se loguea y se devuelve null
 * sin propagar el error (igual que el servicio de email).
 */
export const sendNewGuestWhatsApp = async (guest, numAdults, numChildren) => {
  if (!initialized) {
    console.warn("WhatsApp service not initialized; skipping notification.");
    return null;
  }

  try {
    const enabled = await Setting.getSetting("enable_whatsapp");
    const isEnabled =
      enabled === "true" ||
      enabled === "1" ||
      enabled === 1 ||
      enabled === true;

    if (!isEnabled) {
      console.log("WhatsApp notifications are disabled.");
      return null;
    }

    const phone = await Setting.getSetting("whatsapp_phone");
    const apikey = await Setting.getSetting("whatsapp_apikey");

    if (!phone || !apikey) {
      console.warn(
        "WhatsApp enabled but whatsapp_phone / whatsapp_apikey missing. Skipping.",
      );
      return null;
    }

    const text = formatGuestMessage(guest, numAdults, numChildren);
    const url = buildCallMeBotUrl({ phone, apikey, text });

    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      console.error(
        `CallMeBot responded with ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const body = await response.text();
    console.log("📱 WhatsApp notification sent:", body.slice(0, 80));
    return { ok: true, status: response.status };
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error.message);
    return null;
  }
};

/**
 * Helper para tests/health-check: permite saber si el servicio está inicializado.
 */
export const isWhatsAppServiceReady = () => initialized;
