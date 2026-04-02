import { FastifyInstance } from "fastify";
import { verifyJwt } from "../security/middlewares";
import { prisma } from "../database/prisma";
import path from "path";
import { extractTextFromBuffer } from "../services/fileExtractor";

async function streamToBuffer(stream: NodeJS.ReadableStream, maxBytes: number) {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of stream as any) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      throw new Error("Arquivo excede o limite.");
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

function resolveMimeFromUpload(filename: string, incomingMime?: string) {
  const ext = path.extname(filename).toLowerCase();
  const byExt: Record<string, string> = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp"
  };

  const normalizedIncoming = String(incomingMime ?? "").trim().toLowerCase();
  if (!normalizedIncoming || normalizedIncoming === "application/octet-stream") {
    return byExt[ext] ?? "application/octet-stream";
  }
  return normalizedIncoming;
}

export async function telegramFilesRoutes(fastify: FastifyInstance) {
  fastify.addHook("preValidation", verifyJwt);

  fastify.get("/:instanceId", async (request, reply) => {
    const { instanceId } = request.params as { instanceId: string };
    const files = await prisma.file.findMany({
      where: {
        instanceId,
        channel: "TELEGRAM"
      },
      orderBy: { createdAt: "asc" }
    });
    return reply.send(files);
  });

  fastify.post("/:instanceId/upload", async (request, reply) => {
    const { instanceId } = request.params as { instanceId: string };
    const parts = request.parts();
    let savedFile = null;

    for await (const part of parts) {
      if (part.type !== "file") continue;
      const ext = path.extname(part.filename).toLowerCase();
      const allowedExts = [".pdf", ".txt", ".docx", ".json", ".png", ".jpg", ".jpeg", ".webp"];
      if (!allowedExts.includes(ext)) {
        return reply.status(400).send({ error: "Extensão inválida OWASP: Upload bloqueado." });
      }

      const buffer = await streamToBuffer(part.file, 5 * 1024 * 1024);
      const resolvedMime = resolveMimeFromUpload(part.filename, part.mimetype);

      try {
        let extractedText: string | null = null;
        const canExtract = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/json",
          "text/plain"
        ].includes(resolvedMime);
        if (canExtract) {
          extractedText = await extractTextFromBuffer(buffer, resolvedMime);
        }

        savedFile = await prisma.file.create({
          data: {
            instanceId,
            filename: part.filename,
            mimetype: resolvedMime,
            data: buffer,
            extracted: extractedText,
            channel: "TELEGRAM"
          }
        });
      } catch {
        return reply.status(400).send({ error: "Arquivo corrompido ou inextraível OWASP." });
      }
    }

    if (!savedFile) {
      return reply.status(400).send({ error: "Nenhum arquivo de upload válido recebido no form-data." });
    }

    return reply.send(savedFile);
  });

  fastify.delete("/:fileId", async (request, reply) => {
    const { fileId } = request.params as { fileId: string };
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (file && file.channel === "TELEGRAM") {
      await prisma.file.delete({ where: { id: fileId } });
    }
    return reply.send({ success: true, message: "Excluído da base do Telegram." });
  });
}
