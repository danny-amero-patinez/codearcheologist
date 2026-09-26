/**
 * Application configuration.
 *
 * Loads and validates environment variables using Zod.
 * Fails fast at startup if required config is missing or invalid.
 */
import { z } from 'zod';
declare const configSchema: z.ZodObject<{
    PORT: z.ZodDefault<z.ZodNumber>;
    HOST: z.ZodDefault<z.ZodString>;
    WORK_DIR: z.ZodDefault<z.ZodString>;
    MAX_BINARY_BYTES: z.ZodDefault<z.ZodNumber>;
    MAX_GHIDRA_FUNCTIONS: z.ZodDefault<z.ZodNumber>;
    MAX_STRINGS: z.ZodDefault<z.ZodNumber>;
    GHIDRA_TIMEOUT_MS: z.ZodDefault<z.ZodNumber>;
    GHIDRA_HOME: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    PORT: number;
    HOST: string;
    WORK_DIR: string;
    MAX_BINARY_BYTES: number;
    MAX_GHIDRA_FUNCTIONS: number;
    MAX_STRINGS: number;
    GHIDRA_TIMEOUT_MS: number;
    GHIDRA_HOME?: string | undefined;
}, {
    PORT?: number | undefined;
    HOST?: string | undefined;
    WORK_DIR?: string | undefined;
    MAX_BINARY_BYTES?: number | undefined;
    MAX_GHIDRA_FUNCTIONS?: number | undefined;
    MAX_STRINGS?: number | undefined;
    GHIDRA_TIMEOUT_MS?: number | undefined;
    GHIDRA_HOME?: string | undefined;
}>;
export type AppConfig = z.infer<typeof configSchema>;
export declare function loadConfig(): AppConfig;
export {};
//# sourceMappingURL=config.d.ts.map