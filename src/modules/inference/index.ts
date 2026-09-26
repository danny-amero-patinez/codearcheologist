/**
 * Inference module — deterministic rule-based reconstruction engine.
 *
 * Responsibilities:
 * - Implement InferenceRule interface (see types.ts)
 * - Evaluate evidence context against defined rules
 * - Produce Inference objects with classification, confidence, evidence IDs, rationale
 * - Enforce anti-false-positive rules (Section 20 of brief):
 *     SendMessageW / SendDlgItemMessageW != network evidence
 *     one URL != meaningful network capability
 *     generic password/login strings != high-confidence authentication
 *     generic SQL strings != high-confidence database
 *     CryptAcquireContextW alone != application-level encryption proof
 *     registry APIs alone != installer behavior
 *     CreateFileW alone != configuration-file behavior
 *     high entropy != proof of packing/malware
 *     digital signature presence != proof of trust/safety
 *     FUN_* name != original source function name
 *
 * Rules must be deterministic and testable without mocking.
 */

export { runInferenceEngine } from './engine.js';
export { ALL_RULES } from './rules.js';
export type { InferenceRule, EvidenceContext } from './rules.js';
