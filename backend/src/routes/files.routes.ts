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

export async function filesRoutes(fastify: FastifyInstance) {
  // Hardening e Proteção da Rota via JWT HttpOnly
  fastify.addHook("preValidation", verifyJwt);

  fastify.get("/", async (_request, reply) => {
    const files = await prisma.file.findMany({
      where: { channel: "WHATSAPP" },
      include: {
        instance: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return reply.send(files);
  });

  // Rotas estáticas ANTES de /:instanceId (senão "download" é capturado como UUID)
  fastify.get("/download/:fileId", async (request, reply) => {
    const { fileId } = request.params as { fileId: string };
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
      return reply.status(404).send({ error: "Arquivo não encontrado." });
    }

    reply.header("Content-Type", file.mimetype);
    reply.header("Content-Disposition", `inline; filename="${encodeURIComponent(file.filename)}"`);
    return reply.send(file.data);
  });

  fastify.get("/:instanceId", async (request, reply) => {
    const { instanceId } = request.params as { instanceId: string };
    const files = await prisma.file.findMany({
      where: {
        instanceId,
        channel: "WHATSAPP"
      },
      orderBy: { createdAt: "asc" }
    });
    return reply.send(files);
  });

  fastify.post("/:instanceId/upload", async (request, reply) => {
    const { instanceId } = request.params as { instanceId: string };
    const parts = request.parts(); // O limitador de 5MB já atua nativamente aqui pelo Fastify Core

    let savedFile = null;

    for await (const part of parts) {
      if (part.type === "file") {
        const ext = path.extname(part.filename).toLowerCase();
        const allowedExts = [".pdf", ".txt", ".docx", ".json", ".png", ".jpg", ".jpeg", ".webp"];

        // Anti File Execution (PHP/Node/Shell inject blocker)
        if (!allowedExts.includes(ext)) {
          return reply.status(400).send({ error: "Extensão inválida OWASP: Upload bloqueado." });
        }

        const buffer = await streamToBuffer(part.file, 5 * 1024 * 1024);
        const resolvedMime = resolveMimeFromUpload(part.filename, part.mimetype);

        // File Content Sanity Check via Lib — só extrai texto para KNOWLEDGE (contexto da IA)
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
              channel: "WHATSAPP"
            }
          });
        } catch (e) {
          return reply.status(400).send({ error: "Arquivo corrompido ou inextraível OWASP." });
        }
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
    if (file && file.channel === "WHATSAPP") {
      await prisma.file.delete({ where: { id: fileId } });
    }
    return reply.send({ success: true, message: "Excluído da Máquina." });
  });
}
