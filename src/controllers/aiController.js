import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "openrouter/free";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  compatibility: "strict",
  headers: {
    "HTTP-Referer": "https://github.com/jesusMartinez88/boda-judith-jesus",
    "X-Title": "Boda Judith & Jesus",
  }
});

const PROMPTS = {
  absence_reason: (guestName) =>
    `Actúa como el invitado "${guestName}" que no puede asistir a la boda de Judith y Jesús. 
    Escribe un mensaje corto y cariñoso para ellos explicando el motivo de tu ausencia en español. 
    Debe sonar natural, cercano y respetuoso. Máximo 2 frases.`,

  attendance_note: (guestName) =>
    `Actúa como el invitado "${guestName}" que confirma su asistencia a la boda de Judith y Jesús. 
    Escribe una nota rápida, festiva y cariñosa para los novios en español. 
    Máximo 2 frases.`,

  attendance_full: (guestName) =>
    `Actúa como el invitado "${guestName}" que confirma su asistencia a la boda de Judith y Jesús. 
    Genera dos cosas: 
    1. Una nota corta y cariñosa para los novios (máximo 2 frases).
    2. Una sugerencia de canción concreta (título y artista) para que los novios pongan en la fiesta, dando preferencia a música española.
    Responde en este formato exacto:
    MENSAJE: [tu mensaje para los novios aquí]
    CANCION: [Título - Artista]`,

  song_request: (guestName, songHint) => {
    const hint = songHint
      ? `Me gustaría que fuera algo como: "${songHint}".`
      : "";
    return `Actúa como el invitado "${guestName}" pidiendo una canción a los novios (Judith y Jesús) para su boda.
    ${hint}
    Sugiere una canción concreta (título y artista) que encaje en la fiesta, dando prioridad a música en español. 
    Diles en una frase por qué quieres que suene ese día.`;
  },
};

export const generateText = async (req, res) => {
  try {
    const { type, guestName, songHint, stream } = req.body;

    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY no está configurada en el servidor");
    }

    if (!type || !guestName) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    const promptFn = PROMPTS[type];
    const prompt = type === "song_request" ? promptFn(guestName, songHint) : promptFn(guestName);

    console.log(`Generating AI text (stream=${!!stream}) for ${guestName} using ${MODEL}...`);

    if (stream) {
      const result = streamText({
        model: openrouter(MODEL),
        prompt: prompt,
      });

      // Evitar que proxies o el servidor buffereen la respuesta
      res.setHeader('X-Accel-Buffering', 'no');
      result.pipeTextStreamToResponse(res);
    } else {
      const { text } = await streamText({
        model: openrouter(MODEL),
        prompt: prompt,
      });
      res.json({ success: true, data: { text } });
    }
  } catch (error) {
    console.error("AI SDK Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: "Error en la generación de IA",
        details: error.message 
      });
    } else {
      res.end();
    }
  }
};
