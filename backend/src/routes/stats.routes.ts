import { FastifyInstance } from "fastify";
import { prisma } from "../database/prisma";

export async function statsRoutes(fastify: FastifyInstance) {
  fastify.get("/stats", async () => {
    const [totalInstances, connectedInstances, totalFiles] = await Promise.all([
      prisma.instance.count(),
      prisma.instance.count({ where: { status: "connected" } }),
      prisma.file.count(),
    ]);

    return {
      totalInstances,
      connectedInstances,
      totalFiles,
    };
  });
}
