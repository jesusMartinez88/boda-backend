import { Resend } from "resend";

let resend = null;
let emailEnabled = false;

/**
 * Inicializar el servicio de email con Resend
 */
export const initializeEmailService = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      "⚠️ RESEND_API_KEY not configured. Email functionality disabled.",
    );
    emailEnabled = false;
    return null;
  }

  try {
    resend = new Resend(apiKey);
    emailEnabled = true;
    console.log("✅ Resend email service ready");
    return resend;
  } catch (error) {
    console.error("❌ Email service error:", error.message);
    emailEnabled = false;
    return null;
  }
};

/**
 * Enviar email cuando se crea un nuevo invitado
 */
export const sendNewGuestEmail = async (guest, numAdults, numChildren) => {
  if (!emailEnabled || !process.env.SEND_EMAIL_ON_GUEST_CREATE) {
    console.log("Email sending is disabled.");
    return null;
  }

  try {
    const emailOwner = process.env.EMAILOWNER;

    if (!emailOwner) {
      console.warn("EMAILOWNER not configured");
      return null;
    }

    // Formatear datos del invitado
    const guestDetails = `
      <h3>Nuevo Invitado Registrado</h3>
      <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
        <tr style="background-color: #f0f0f0;">
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>Nombre</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">${guest.name}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>Email</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">📧${guest.email}</td>
        </tr>
        <tr style="background-color: #f0f0f0;">
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>Teléfono</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">📱${guest.phone || "No proporcionado"}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>Asistencia</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">${guest.attending ? "✅ Confirmado" : "❌ Pendiente"}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>Adultos</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">🧓${numAdults}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>Niños</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">🚸${numChildren}</td>
        </tr>
        <tr style="background-color: #f0f0f0;">
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>Tipo de Comida</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">🥑${guest.mealType || "Normal"}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>Necesita Autobús</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">${guest.needsTransport ? "🚌 Sí" : "✖️ No"}</td>
        </tr>
        <tr style="background-color: #f0f0f0;">
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>Alergias</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">${guest.allergies || "Ninguna"}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>Notas</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px;">${guest.notes || "Ninguna"}</td>
        </tr>
      </table>
    `;

    const result = await resend.emails.send({
      from: "Wedding API <onboarding@resend.dev>",
      to: emailOwner,
      subject: `🎉 Nuevo Invitado: ${guest.name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4CAF50; color: white; padding: 20px; border-radius: 5px; }
              .content { margin-top: 20px; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>🎉 Boda - Nuevo Invitado Registrado</h2>
              </div>
              <div class="content">
                ${guestDetails}
              </div>
              <div class="footer">
                <p>Este es un email automático del sistema de gestión de invitados. No responder directamente.</p>
                <p>${new Date().toLocaleString("es-ES")}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("✉️ Email enviado:", emailOwner);
    return result;
  } catch (error) {
    console.error("Error sending email:", error.message);
    return null;
  }
};

/**
 * Enviar email de confirmación al invitado (opcional)
 */
export const sendGuestConfirmationEmail = async (guest) => {
  if (!emailEnabled) {
    return null;
  }

  try {
    const result = await resend.emails.send({
      from: "Wedding API <onboarding@resend.dev>",
      to: guest.email,
      subject: "🎉 ¡Confirmamos tu registro en la boda!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4CAF50; color: white; padding: 20px; border-radius: 5px; }
              .content { margin-top: 20px; line-height: 1.6; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>🎉 ¡Bienvenido a la Boda!</h2>
              </div>
              <div class="content">
                <p>Hola <strong>${guest.name}</strong>,</p>
                <p>Gracias por registrarte en nuestra boda. Aquí está un resumen de tu registro:</p>
                <ul>
                  <li><strong>Email:</strong> ${guest.email}</li>
                  <li><strong>Asistencia:</strong> ${guest.attending ? "✅ Confirmado" : "❌ Pendiente"}</li>
                  <li><strong>Tipo de Comida:</strong> ${guest.mealType}</li>
                  <li><strong>Necesita Autobús:</strong> ${guest.needsTransport ? "🚌 Sí" : "✖️ No"}</li>
                  ${guest.allergies ? `<li><strong>Alergias:</strong> ${guest.allergies}</li>` : ""}
                </ul>
                <p>Si necesitas hacer cambios en tu registro, por favor contacta con nosotros.</p>
                <p>¡Nos vemos pronto!</p>
              </div>
              <div class="footer">
                <p>Este es un email automático. No responder directamente a este email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("✉️ Confirmation email sent:", result.id);
    return result;
  } catch (error) {
    console.error("Error sending confirmation email:", error.message);
    return null;
  }
};
