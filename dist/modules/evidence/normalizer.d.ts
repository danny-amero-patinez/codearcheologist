/**
 * Evidence normalizer — converts raw analysis artifacts into the canonical Evidence model.
 *
 * All evidence produced here has classification: 'observed'.
 * IDs are stable and unique within an analysis run.
 */
import { type BinaryProfile, type Evidence, type ExtractedString } from '../../shared/types.js';
import { type GhidraRawOutput } from '../ghidra/validator.js';
/**
 * Generates a stable, human-readable evidence ID.
 * Format: evd-<3-char-kind>-<zero-padded-index>
 * Example: evd-bin-0000, evd-sec-0001, evd-imp-0002
 */
export declare function evidenceId(kind: string, index: number): string;
/**
 * Normalizes a BinaryProfile into Evidence items.
 * Returns: one binary-metadata, one pe-section per section, one import per DLL,
 * one export per export entry.
 */
export declare function normalizePeEvidence(profile: BinaryProfile): Evidence[];
/**
 * Normalizes extracted strings into Evidence items.
 *
 * @param strings  - Extracted string list
 * @param offset   - Starting index for ID generation (to avoid collisions when
 *                   combined with PE evidence IDs)
 */
export declare function normalizeStringEvidence(strings: ExtractedString[], offset: number): Evidence[];
/**
 * Normalizes Ghidra output into Evidence items.
 *
 * @param ghidra  - Validated Ghidra output
 * @param offset  - Starting index for ID generation
 */
export declare function normalizeGhidraEvidence(ghidra: GhidraRawOutput, offset: number): Evidence[];
/**
 * Builds the full evidence store for an analysis.
 *
 * Combines PE, string, and optional Ghidra evidence into a single deduplicated
 * array with globally unique IDs.
 */
export declare function buildEvidenceStore(profile: BinaryProfile, strings: ExtractedString[], ghidra?: GhidraRawOutput): Evidence[];
//# sourceMappingURL=normalizer.d.ts.map