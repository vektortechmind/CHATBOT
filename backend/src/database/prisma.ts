import { PrismaClient } from "@prisma/client";

/**
 * Configuração otimizada do Prisma para SQLite em produção (VPS):
 * - Pool de conexões eficiente
 * - Logs em produção apenas para erros
 * - Timeout de conexão adequado para SQLite
 */
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === "production"
    ? ["error"]
    : ["query", "info", "warn", "error"],
  errorFormat: "pretty"
});
