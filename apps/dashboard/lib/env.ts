import z from "zod";

const processEnv = {
  UPLOAD_API_ENDPOINT: process.env.NEXT_PUBLIC_UPLOAD_API_ENDPOINT,
};

const parsed = z
  .object({
    UPLOAD_API_ENDPOINT: z.string().optional(),
  })
  .safeParse(processEnv);

if (!parsed.success) {
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
