/**
 * Call edge normalizer — filters invalid call graph edges from Ghidra output.
 *
 * Section 9.9 of brief: raw numeric constants (e.g. 0x24, 0x2, 0xbe) must NOT
 * become graph nodes. Only edges that resolve to known function entry addresses
 * or recognised import symbols are kept.
 */
import { type GhidraFunction } from '../ghidra/validator.js';
import { type ImportEntry } from '../../shared/types.js';
export interface NormalizedEdges {
    callers: string[];
    callees: string[];
}
/**
 * Filters call graph edges to retain only edges that resolve to:
 * - A known function entry address (internal call)
 * - OR a known import symbol name (external call, stored as the symbol name)
 *
 * Addresses smaller than 0x1000 are rejected as likely numeric constants.
 *
 * @param functions  - Ghidra function list (raw output)
 * @param imports    - PE import table entries
 * @returns Map from function address → { callers, callees } (all validated)
 */
export declare function normalizeCallEdges(functions: GhidraFunction[], imports: ImportEntry[]): Map<string, NormalizedEdges>;
//# sourceMappingURL=callEdgeNormalizer.d.ts.map