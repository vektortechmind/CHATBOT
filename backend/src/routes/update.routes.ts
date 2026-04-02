import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { verifyJwt } from "../security/middlewares";
import {
  checkForUpdate,
  applyUpdate,
  CURRENT_VERSION,
  GITHUB_REPO,
} from "../services/update.service";

type ApplyBody = { version: string };

async function updateRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/update/status",
    { preHandler: [verifyJwt] },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      try {
        const updateInfo = await checkForUpdate();
        return reply.send({
          currentVersion: updateInfo.currentVersion,
          latestVersion: updateInfo.latestVersion,
          hasUpdate: updateInfo.hasUpdate,
          releaseUrl: updateInfo.releaseUrl,
          changelog: updateInfo.changelog,
          githubRepo: GITHUB_REPO,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";
        fastify.log.error(`Erro ao verificar update: ${message}`);
        return reply.status(500).send({ error: message });
      }
    }
  );

  fastify.post<{ Body: ApplyBody }>(
    "/update/apply",
    { preHandler: [verifyJwt] },
    async (req: FastifyRequest<{ Body: ApplyBody }>, reply: FastifyReply) => {
      const { version } = req.body;

      if (!version || typeof version !== "string") {
        return reply.status(400).send({ error: "Versão é obrigatória" });
      }

      try {
        const result = await applyUpdate(version);
        return reply.send(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";
        fastify.log.error(`Erro ao aplicar update: ${message}`);
        return reply.status(500).send({
          success: false,
          error: `Erro ao aplicar update: ${message}`,
        });
      }
    }
  );
}

export default updateRoutes;
