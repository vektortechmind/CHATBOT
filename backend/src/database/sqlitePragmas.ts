import { prisma } from "./prisma";

/**
 * SQLite em modo WAL + busy_timeout reduz bloqueios e melhora a chance de
 * persistência íntegra em reinícios (sessão WhatsApp / credenciais no Prisma).
 * 
 * Nota: Como algumas PRAGMAs retornam resultados, usamos try-catch.
 */
export async function applySqlitePragmas(): Promise<void> {
  try {
    // PRAGMA commands que retornam valores precisam de $queryRawUnsafe
    await prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL");
    await prisma.$queryRawUnsafe("PRAGMA synchronous=NORMAL");
    await prisma.$queryRawUnsafe("PRAGMA busy_timeout=8000");
  } catch (err) {
    // Ignore erros de PRAGMA (alguns bancos SQLite têm restrições)
    console.warn("⚠️  Aviso: Não foi possível aplicar alguma PRAGMA, continuando mesmo assim.");
  }
}
