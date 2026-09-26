import PQueue from 'p-queue';
import { type AppConfig } from '../../config/config.js';
import { type AnalysisMeta, type BinaryProfile, type ExtractedString } from '../../shared/types.js';
export declare const ghidraQueue: PQueue<import("p-queue/dist/priority-queue.js").default, import("p-queue").DefaultAddOptions>;
export declare function buildInitialMeta(id: string, originalFilename: string, fileSizeBytes: number): AnalysisMeta;
/**
 * Creates the job and stores the uploaded binary.
 *
 * Returns the canonical analysis ID. This is the one and only UUID for
 * this analysis — the same ID is used everywhere: API, meta.json, work dir,
 * artifacts, logs.
 */
export declare function intake(config: AppConfig, uploadedFilePath: string, originalFilename: string): Promise<AnalysisMeta>;
interface LightweightResult {
    profile: BinaryProfile;
    strings: ExtractedString[];
}
export declare function runLightweightAnalysis(config: AppConfig, id: string): Promise<LightweightResult>;
export declare function skipRemainingPhases(config: AppConfig, id: string, reason: string): Promise<void>;
/**
 * Runs the Ghidra analysis phase via the ghidraQueue (concurrency=1).
 *
 * Returns the validated Ghidra output, or null if Ghidra is unavailable or fails.
 * On failure, records the error in the phase but does NOT throw — PE/string evidence
 * is preserved and the status becomes `partial`.
 */
export declare function runGhidraPhase(config: AppConfig, id: string): Promise<import('../ghidra/validator.js').GhidraRawOutput | null>;
/**
 * Run the full analysis pipeline asynchronously.
 * Called after intake; errors are caught and recorded, never thrown to the caller.
 */
export declare function runPipeline(config: AppConfig, id: string): Promise<void>;
export interface DiagnosticsResult {
    node: string;
    platform: string;
    workDir: string;
    workDirAccessible: boolean;
    ghidra: {
        status: 'unchecked' | 'available' | 'unavailable';
        reason?: string;
    };
    java: {
        status: 'unchecked' | 'available' | 'unavailable';
        reason?: string;
    };
}
export declare function getDiagnostics(config: AppConfig): Promise<DiagnosticsResult>;
export {};
//# sourceMappingURL=pipeline.d.ts.map