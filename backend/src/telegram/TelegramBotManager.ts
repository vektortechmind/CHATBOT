import { Telegraf, Context } from "telegraf";
import { prisma } from "../database/prisma";
import { askChat, transcribeAudio } from "../ai/providerSelector";
import { getResolvedTelegramPrompt } from "../services/agentPrompt";
import { buildCompleteSystemPrompt, resolveAgentDisplayName } from "../ai/systemPrompt";
import { extractTextFromBuffer } from "../services/fileExtractor";

type MemoryItem = { role: "user" | "assistant"; content: string };

const userMemory = new Map<string, MemoryItem[]>();

/**
 * Baixa um arquivo do Telegram e retorna como Buffer.
 */
async function downloadTelegramFile(ctx: Context, filePath: string): Promise<Buffer | null> {
  try {
    // Usar link direto do arquivo do Telegram
    const link = await ctx.telegram.getFileLink(filePath);
    const response = await fetch(link.href);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("[downloadTelegramFile] Erro:", err);
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function randomInt(min: number, max: number) {
  const a = Math.ceil(min);
  const b = Math.floor(max);
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function splitLongTextForTelegram(text: string, maxChunkLen = 3500): string[] {
  const t = String(text ?? "").trim();
  if (!t) return [];

  const paragraphs = t.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];

  const push = (s: string) => {
    const v = s.trim();
    if (!v) return;
    if (v.length <= maxChunkLen) {
      chunks.push(v);
      return;
    }

    const sentences = v.split(/(?<=[.!?])\s+/g);
    let current = "";
    for (const sentence of sentences) {
      const candidate = current ? `${current} ${sentence}` : sentence;
      if (candidate.length <= maxChunkLen) {
        current = candidate;
      } else {
        if (current) chunks.push(current.trim());
        current = sentence;
        while (current.length > maxChunkLen) {
          chunks.push(current.slice(0, maxChunkLen));
          current = current.slice(maxChunkLen);
        }
      }
    }
    if (current.trim()) chunks.push(current.trim());
  };

  for (const p of paragraphs) push(p);
  return chunks;
}

async function getTelegramInstance() {
  let instance = await prisma.instance.findFirst();
  if (!instance) {
    instance = await prisma.instance.create({
      data: { name: "Agente Principal", typing: true, delayMin: 4000, delayMax: 7000 }
    });
  }
  return instance;
}

async function ensureKnowledgeExtracted(
  files: Array<{ id: string; mimetype: string; data: Buffer; extracted: string | null }>
) {
  for (const file of files) {
    if (file.extracted && file.extracted.trim()) continue;

    const canExtract = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/json",
      "text/plain"
    ].includes(file.mimetype);
    if (!canExtract) continue;

    try {
      const text = await extractTextFromBuffer(Buffer.from(file.data), file.mimetype);
      if (text && text.trim()) {
        await prisma.file.update({
          where: { id: file.id },
          data: { extracted: text }
        });
        file.extracted = text;
      }
    } catch {
      // Mantém sem extracted se arquivo estiver inválido/ilegível.
    }
  }
}

async function handleTelegramMessage(ctx: Context) {
  const message = ctx.message;
  if (!message || !("chat" in message) || message.chat.type !== "private") return;
  
  const chatId = message.chat.id;
  const fromId = message.from?.id;
  if (!fromId) return;

  const instance = await getTelegramInstance();
  if (!instance.aiTelegramEnabled) return;

  // Detectar tipo de mensagem (texto, áudio, voz, vídeo)
  let userContent: string | undefined;
  let isAudioTranscribed = false;

  // 1. Mensagem de texto
  if ("text" in message && typeof message.text === "string") {
    userContent = message.text.trim();
  }
  
  // 2. Mensagem de áudio (arquivo de áudio)
  if (!userContent && "audio" in message && message.audio) {
    try {
      const audioFile = message.audio;
      const fileId = audioFile.file_id;
      const file = await ctx.telegram.getFile(fileId);
      if (file && "file_path" in file && file.file_path) {
        const audioBuffer = await downloadTelegramFile(ctx, file.file_path);
        if (audioBuffer) {
          const mimeType = audioFile.mime_type || "audio/mpeg";
          const transcribed = await transcribeAudio(instance.id, audioBuffer, mimeType, "pt");
          userContent = `[Áudio transcrito]: ${transcribed}`;
          isAudioTranscribed = true;
          console.log(`[Telegram] Áudio transcrito: ${transcribed.slice(0, 100)}...`);
        }
      }
    } catch (err) {
      console.error("[Telegram] Erro ao transcrever áudio:", err);
    }
  }

  // 3. Nota de voz (voice message)
  if (!userContent && "voice" in message && message.voice) {
    try {
      const voiceFile = message.voice;
      const fileId = voiceFile.file_id;
      const file = await ctx.telegram.getFile(fileId);
      if (file && "file_path" in file && file.file_path) {
        const audioBuffer = await downloadTelegramFile(ctx, file.file_path);
        if (audioBuffer) {
          const mimeType = voiceFile.mime_type || "audio/ogg";
          const transcribed = await transcribeAudio(instance.id, audioBuffer, mimeType, "pt");
          userContent = `[Nota de voz transcrita]: ${transcribed}`;
          isAudioTranscribed = true;
          console.log(`[Telegram] Nota de voz transcrita: ${transcribed.slice(0, 100)}...`);
        }
      }
    } catch (err) {
      console.error("[Telegram] Erro ao transcrever nota de voz:", err);
    }
  }

  // 4. Mensagem de vídeo (extrair áudio do vídeo)
  if (!userContent && "video" in message && message.video) {
    try {
      const videoFile = message.video;
      const fileId = videoFile.file_id;
      const file = await ctx.telegram.getFile(fileId);
      if (file && "file_path" in file && file.file_path) {
        const videoBuffer = await downloadTelegramFile(ctx, file.file_path);
        if (videoBuffer) {
          const mimeType = videoFile.mime_type || "video/mp4";
          // Usar o buffer do vídeo como áudio (Groq Whisper aceita MP4)
          const transcribed = await transcribeAudio(instance.id, videoBuffer, mimeType, "pt");
          userContent = `[Vídeo transcrito]: ${transcribed}`;
          isAudioTranscribed = true;
          console.log(`[Telegram] Vídeo transcrito: ${transcribed.slice(0, 100)}...`);
        }
      }
    } catch (err) {
      console.error("[Telegram] Erro ao transcrever vídeo:", err);
    }
  }

  if (!userContent || !userContent.trim()) return;
  const knowledgeFiles = await prisma.file.findMany({
    where: { instanceId: instance.id, channel: "TELEGRAM" },
    orderBy: { createdAt: "asc" }
  });
  await ensureKnowledgeExtracted(
    knowledgeFiles as Array<{ id: string; mimetype: string; data: Buffer; extracted: string | null }>
  );
  const extractedParts = knowledgeFiles
    .map((f) => f.extracted)
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  const combinedKnowledge =
    extractedParts.length > 0
      ? "\n[CONTEXTO DE ARQUIVOS (priorize quando relevante)]:\n" +
        extractedParts.join("\n---\n") +
        "\n[FIM DO CONTEXTO]\n"
      : undefined;

  const behavioral = await getResolvedTelegramPrompt(instance.id);
  const systemContent = buildCompleteSystemPrompt({
    agentName: resolveAgentDisplayName(instance),
    behavioralPrompt: behavioral,
    fileContextSuffix: combinedKnowledge
  });

  const memoryKey = `${instance.id}:${fromId}`;
  let memory = userMemory.get(memoryKey) ?? [];
  memory.push({ role: "user", content: userContent });
  if (memory.length > 15) memory = memory.slice(memory.length - 15);
  userMemory.set(memoryKey, memory);

  if (instance.typing) {
    const min = clamp(instance.delayMin ?? 4000, 4000, 7000);
    const max = clamp(instance.delayMax ?? 7000, 4000, 7000);
    await ctx.telegram.sendChatAction(chatId, "typing");
    await sleep(randomInt(min, Math.max(min, max)));
  }

  const aiResponse = await askChat(instance.id, [{ role: "system", content: systemContent }, ...memory]);
  const parts = splitLongTextForTelegram(aiResponse, 3500);
  if (parts.length === 0) return;

  for (let i = 0; i < parts.length; i++) {
    if (instance.typing) {
      await ctx.telegram.sendChatAction(chatId, "typing");
      await sleep(randomInt(700, 1400));
    }
    await ctx.telegram.sendMessage(chatId, parts[i]);
    if (i < parts.length - 1 && instance.typing) {
      await sleep(randomInt(900, 1600));
    }
  }

  let finalMemory = userMemory.get(memoryKey) ?? memory;
  finalMemory.push({ role: "assistant", content: aiResponse });
  if (finalMemory.length > 15) finalMemory = finalMemory.slice(finalMemory.length - 15);
  userMemory.set(memoryKey, finalMemory);
}

export class TelegramBotManager {
  private static bot: Telegraf<Context> | null = null;
  private static started = false;
  private static botLabel: string | null = null;

  static start(token: string) {
    if (this.started) return;
    this.started = true;

    const bot = new Telegraf(token);
    this.bot = bot;
    void bot.telegram
      .getMe()
      .then((me) => {
        const username = me.username ? `@${me.username}` : null;
        this.botLabel = me.first_name || username || null;
      })
      .catch((err) => {
        console.warn("[Telegram] Não foi possível obter dados do bot (getMe):", err);
      });

    bot.on("message", async (ctx) => {
      try {
        await handleTelegramMessage(ctx);
      } catch (err) {
        console.error("[Telegram] Falha ao processar mensagem:", err);
      }
    });

    bot.catch((err) => {
      console.error("[Telegram] polling_error:", err);
    });

    void bot.launch();
    console.log("[Telegram] Bot iniciado com polling.");
  }

  static async stop() {
    if (!this.bot) return;
    try {
      this.bot.stop("manual-stop");
    } finally {
      this.bot = null;
      this.started = false;
      this.botLabel = null;
    }
  }

  static getStatus() {
    return {
      online: this.started,
      label: this.botLabel
    };
  }
}
