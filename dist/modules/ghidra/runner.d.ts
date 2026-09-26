import { type AppConfig } from '../../config/config.js';
export interface GhidraRunResult {
    success: boolean;
    exitCode: number | null;
    durationMs: number;
    timedOut: boolean;
    error?: string;
}
export interface RunGhidraParams {
    config: AppConfig;
    analysisId: string;
    binaryPath: string;
    outputJsonPath: string;
    projectDir: string;
    scriptPath: string;
    stdoutLogPath: string;
    stderrLogPath: string;
}
/**
 * Runs analyzeHeadless against the imported binary (static analysis only).
 *
 * Arg layout (Ghidra headless analyser contract):
 *   analyzeHeadless <projectLocation> <projectName> \
 *     -import <binary> \
 *     -scriptPath <scriptDir> \
 *     -postScript CodeArchaeologistScript.java <outputJson> <maxFunctions> \
 *     -deleteProject
 *
 * NOTE: There is NO `-scriptArgs` token between the script name and its
 * arguments. Ghidra passes everything after the script name directly to
 * args[] in the script.
 */
export declare function runGhidra(params: RunGhidraParams): Promise<GhidraRunResult>;
//# sourceMappingURL=runner.d.ts.map