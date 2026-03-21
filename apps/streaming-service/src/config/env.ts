// src/config/env.ts
import dotenv from "dotenv";
import { z } from "zod";

import { logger } from "@/utils/logger";

dotenv.config();

// Define schema with Zod
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  NEW_RELIC_KEY: z.string().optional(),
  PORT: z.string().default("8000"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  REDIS_URL: z.string().optional(),
});

// Parse + validate
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.debug("Invalid environment variables", parsed.error);
  process.exit(1);
}

export const env = parsed.data;
