import { z } from "zod";

/**
 * Env phía browser — chỉ biến NEXT_PUBLIC_*.
 * Validate 1 lần khi import (fail sớm nếu thiếu config).
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3001"),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
