/**
 * Evidence module — normalization, stable IDs, and evidence store.
 *
 * Responsibilities:
 * - Assign stable, deterministic evidence IDs within an analysis
 * - Normalize raw PE/string/Ghidra observations into the Evidence type
 * - Deduplicate evidence (avoid counting the same signal multiple times)
 * - Provide lookup of evidence by ID
 * - Persist normalized evidence to the work directory
 *
 * Invariants:
 * - Every ID assigned here must be valid everywhere it is referenced
 * - Evidence classification is always "observed" at this layer
 */

export { buildEvidenceStore, normalizePeEvidence, normalizeStringEvidence, normalizeGhidraEvidence, evidenceId } from './normalizer.js';
export { normalizeCallEdges } from './callEdgeNormalizer.js';
export { buildFunctionProfiles } from './functionProfiles.js';
export type { NormalizedEdges } from './callEdgeNormalizer.js';
