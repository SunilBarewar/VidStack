// src/config/env.ts
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Define schema with Zod
const envSchema = z.object({
  S3_BUCKET_REGION: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
});

// Parse + validate
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsed.error.errors, null, 2),
  );
  process.exit(1);
}

export const env = parsed.data;
