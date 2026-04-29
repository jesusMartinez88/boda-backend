const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/free";

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

const callOpenRouter = async (prompt, modelOverride = null) => {
  const modelToUse = modelOverride || MODEL;
  console.log(`Calling OpenRouter with model ${modelToUse} and prompt: ${prompt.substring(0, 50)}...`);
  
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/jesusMartinez88/boda-judith-jesus",
      "X-Title": "Boda Judith & Jesus",
    },
    body: JSON.stringify({
      model: modelToUse,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`OpenRouter error: ${response.status}`, errorBody);
    throw new Error(`OpenRouter error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  
  if (data.error) {
    console.error("OpenRouter API Error:", data.error);
    throw new Error(`OpenRouter API Error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    console.error("OpenRouter response without content:", JSON.stringify(data));
    
    // Si es el primer intento (sin override), reintentamos con Llama
    if (!modelOverride) {
      console.log("Empty response detected. Retrying once with google/gemini-2.0-flash-lite-preview-02-05:free...");
      return callOpenRouter(prompt, "google/gemini-2.0-flash-lite-preview-02-05:free");
    }
    
    throw new Error("El modelo de IA devolvió una respuesta vacía. Esto puede deberse a saturación del modelo gratuito o límites de la API.");
  }
  
  return content.trim();
};

export const generateText = async (req, res) => {
  try {
    const { type, guestName, songHint } = req.body;

    if (!type || !guestName) {
      return res.status(400).json({
        success: false,
        error: "Los campos 'type' y 'guestName' son requeridos",
      });
    }

    const validTypes = ["absence_reason", "attendance_note", "song_request", "attendance_full"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Tipo inválido. Valores permitidos: ${validTypes.join(", ")}`,
      });
    }

    const promptFn = PROMPTS[type];
    const prompt =
      type === "song_request"
        ? promptFn(guestName, songHint)
        : promptFn(guestName);

    const text = await callOpenRouter(prompt);

    res.json({
      success: true,
      data: {
        type,
        guestName,
        text,
      },
    });
  } catch (error) {
    console.error("Error generating AI text:", error);
    res.status(500).json({
      success: false,
      error: "Error al generar texto con IA",
      message: error.message,
    });
  }
};
