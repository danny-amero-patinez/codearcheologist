/**
 * Application configuration.
 *
 * Loads and validates environment variables using Zod.
 * Fails fast at startup if required config is missing or invalid.
 */
import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),
  WORK_DIR: z.string().default('./work'),

  MAX_BINARY_BYTES: z.coerce.number().int().positive().default(104_857_600), // 100 MB
  MAX_GHIDRA_FUNCTIONS: z.coerce.number().int().positive().default(20),
  MAX_STRINGS: z.coerce.number().int().positive().default(5000),
  GHIDRA_TIMEOUT_MS: z.coerce.number().int().positive().default(180_000), // 3 min

  GHIDRA_HOME: z.string().optional(),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(): AppConfig {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid configuration:', result.error.format());
    process.exit(1);
  }
  return result.data;
}
