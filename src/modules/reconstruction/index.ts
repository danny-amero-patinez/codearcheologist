/**
 * Reconstruction module — candidate responsibility builder.
 *
 * Responsibilities:
 * - Build FunctionProfile objects from normalized evidence + Ghidra output
 * - Normalize and filter call edges (Section 9.9 of brief):
 *     Internal call edges must resolve to known function entry addresses
 *     Do not let arbitrary constants/ordinals become graph nodes
 * - Score and select interesting functions for decompilation
 * - Cluster functions by shared strong evidence signals
 * - Produce CandidateResponsibility objects when minimum evidence criteria met
 * - Reconstruct ExternalInteraction candidates
 * - Identify explicit Unknowns
 *
 * Invariants:
 * - Every CandidateResponsibility.evidenceIds must reference valid evidence IDs
 * - Confidence is deterministic and explainable
 * - observed/inferred/unknown separation is mandatory
 * - Small, explainable clusters are preferred over large generic ones
 */

export { buildCandidateResponsibilities } from './candidateBuilder.js';
export { buildExternalInteractions } from './externalsBuilder.js';
export { buildUnknowns } from './unknownsBuilder.js';
