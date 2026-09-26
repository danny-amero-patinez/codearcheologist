/**
 * Inference engine — runs all rules against the evidence context and returns
 * a deduplicated list of Inference objects.
 */
import { type Inference } from '../../shared/types.js';
import { type EvidenceContext } from './rules.js';
/**
 * Run all inference rules against the given evidence context.
 *
 * Deduplication: if two rules produce an inference with the same ruleId+category
 * combination, keep the one with higher confidence.
 */
export declare function runInferenceEngine(ctx: EvidenceContext): Inference[];
//# sourceMappingURL=engine.d.ts.map