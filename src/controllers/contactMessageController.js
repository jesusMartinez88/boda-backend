import { sendContactMessageEmail } from "../services/emailService.js";
import {
  validateFields,
  sanitizeObject,
  isValidEmail,
} from "../utils/validation.js";

const ALLOWED_CATEGORIES = new Set(["consulta", "sugerencia", "rsvp", "otro"]);
const MESSAGE_MAX = 2000;
const NAME_MAX = 100;
const EMAIL_MAX = 255;
const SUBJECT_MAX = 200;

/**
 * POST /api/contact-message
 * Endpoint público: recibe un mensaje del formulario de la invitación y
 * notifica por email al propietario (EMAILOWNER).
 *
 * Body esperado:
 *   {
 *     name:     string  (requerido, max 100)
 *     email:    string  (opcional, max 255, formato email)
 *     category: string  (opcional, uno de consulta|sugerencia|rsvp|otro)
 *     subject:  string  (opcional, max 200)
 *     message:  string  (requerido, max 2000)
 *   }
 *
 * Respuestas:
 *   - 201 { success: true, data: { sent: boolean } }
 *   - 400 { success: false, error: string }   ← validación
 *   - 503 { success: false, error: "Email service not configured" }
 */
export const createContactMessage = async (req, res) => {
  try {
    const data = req.body || {};

    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "El nombre es obligatorio." });
    }

    if (
      !data.message ||
      typeof data.message !== "string" ||
      !data.message.trim()
    ) {
      return res
        .status(400)
        .json({ success: false, error: "El mensaje es obligatorio." });
    }

    if (data.message.length > MESSAGE_MAX) {
      return res.status(400).json({
        success: false,
        error: `El mensaje no puede superar los ${MESSAGE_MAX} caracteres.`,
      });
    }

    if (data.email && !isValidEmail(data.email)) {
      return res
        .status(400)
        .json({ success: false, error: "El email no tiene un formato válido." });
    }

    if (data.category && !ALLOWED_CATEGORIES.has(data.category)) {
      return res.status(400).json({
        success: false,
        error:
          "Categoría inválida. Usa una de: consulta, sugerencia, rsvp, otro.",
      });
    }

    const lengthCheck = validateFields(
      {
        name: data.name,
        subject: data.subject,
        email: data.email,
      },
      {
        name: NAME_MAX,
        subject: SUBJECT_MAX,
        email: EMAIL_MAX,
      },
    );

    if (!lengthCheck.valid) {
      return res
        .status(400)
        .json({ success: false, error: lengthCheck.errors.join(", ") });
    }

    // Saneamos SIEMPRE antes de reenviar al servicio de email.
    const sanitized = sanitizeObject(
      {
        name: data.name.trim(),
        email: data.email ? data.email.trim() : undefined,
        category: data.category ? data.category.trim() : undefined,
        subject: data.subject ? data.subject.trim() : undefined,
        message: data.message.trim(),
      },
      [],
      ["message"],
    );

    const result = await sendContactMessageEmail(sanitized);

    if (!result) {
      // Puede pasar por dos motivos: Resend no configurado o Resend lanzó
      // excepción. En ambos casos avisamos al cliente para que reintente.
      return res.status(503).json({
        success: false,
        error:
          "El servicio de email no está disponible en este momento. Inténtalo de nuevo más tarde.",
      });
    }

    return res.status(201).json({
      success: true,
      data: { sent: true },
    });
  } catch (error) {
    console.error("Error en createContactMessage:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};
