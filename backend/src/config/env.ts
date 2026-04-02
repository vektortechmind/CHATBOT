import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().startsWith("file:"),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(16),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(5),
  /** Origens extras para CORS (VPS), separadas por vírgula. Ex: https://app.seudominio.com */
  CORS_ORIGINS: z.string().optional(),
  /** Token real do BotFather (>=10). Valores curtos/placeholder são ignorados. */
  TELEGRAM_BOT_TOKEN: z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim();
    if (s.length < 10) return undefined;
    return s;
  }, z.string().min(10).optional())
});

export const env = envSchema.parse(process.env);
