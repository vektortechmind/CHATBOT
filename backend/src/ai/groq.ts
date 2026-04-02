import type { ChatMessage } from "./systemPrompt";

/**
 * Mensagens chegam como `ChatMessage[]` (system primeiro) via `askChat` → `normalizeMessagesForChatApi`.
 * @see ./systemPrompt.ts
 */
export type { ChatMessage } from "./systemPrompt";

const GROQ_MODEL = "llama-3.3-70b-versatile";

/** Modelo Whisper para transcrição de áudio na Groq */
const GROQ_WHISPER_MODEL = "whisper-large-v3-turbo";

export async function groqChat(apiKey: string, messages: ChatMessage[]) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: GROQ_MODEL, messages })
  });
  const raw = await res.text();
  if (!res.ok) {
    console.error("[groqChat] HTTP", res.status, raw.slice(0, 600));
    throw new Error(`Groq API error: ${res.status} ${raw.slice(0, 400)}`);
  }
  const data = JSON.parse(raw) as { choices?: { message?: { role?: string; content?: string } }[] };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Groq: resposta vazia");
  }
  return text;
}

/**
 * Transcrição de áudio usando a API Whisper da Groq.
 * @see https://console.groq.com/docs/api-reference#audio-create
 * @param apiKey - Chave de API da Groq (pode ser a mesma do chat ou groqAudioKey separada)
 * @param audioBuffer - Buffer do arquivo de áudio (OGG/Opus do WhatsApp, MP3, M4A, etc)
 * @param mimeType - MIME type do áudio (ex: audio/ogg, audio/mp3, audio/m4a)
 * @param language - (Opcional) Código ISO-639-1 do idioma (ex: "pt", "en") - melhora precisão
 * @returns Texto transcrito do áudio
 */
export async function groqWhisper(
  apiKey: string,
  audioBuffer: Buffer,
  mimeType: string = "audio/ogg",
  language: string = "pt"  // Padrão: português
) {
  // Mapear MIME type para extensão e tipo correto
  const lower = mimeType.toLowerCase();
  let ext = "ogg";
  let blobType = "audio/ogg";

  if (lower.includes("mpeg") || lower.includes("mp3")) {
    ext = "mp3";
    blobType = "audio/mpeg";
  } else if (lower.includes("mp4") || lower.includes("m4a")) {
    ext = "m4a";
    blobType = "audio/mp4";
  } else if (lower.includes("aac")) {
    ext = "m4a";
    blobType = "audio/aac";
  } else if (lower.includes("wav")) {
    ext = "wav";
    blobType = "audio/wav";
  } else if (lower.includes("webm")) {
    ext = "webm";
    blobType = "audio/webm";
  } else if (lower.includes("flac")) {
    ext = "flac";
    blobType = "audio/flac";
  }

  // Criar FormData para multipart/form-data
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: blobType });
  formData.append("file", blob, `audio.${ext}`);
  formData.append("model", GROQ_WHISPER_MODEL);
  formData.append("language", language);
  formData.append("response_format", "json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
      // Content-Type será definido automaticamente pelo FormData com boundary
    },
    body: formData
  });

  const raw = await res.text();
  if (!res.ok) {
    console.error("[groqWhisper] HTTP", res.status, raw.slice(0, 600));
    throw new Error(`Groq Whisper error: ${res.status} - ${raw.slice(0, 400)}`);
  }

  const data = JSON.parse(raw) as { text?: string; error?: { message?: string } };
  
  if (data.error) {
    throw new Error(`Groq Whisper: ${data.error.message || "Erro desconhecido"}`);
  }

  if (typeof data.text !== "string" || !data.text.trim()) {
    throw new Error("Groq Whisper: resposta vazia");
  }

  return data.text.trim();
}
