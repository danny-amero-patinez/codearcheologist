"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInferenceEngine = runInferenceEngine;
const rules_js_1 = require("./rules.js");
/**
 * Run all inference rules against the given evidence context.
 *
 * Deduplication: if two rules produce an inference with the same ruleId+category
 * combination, keep the one with higher confidence.
 */
function runInferenceEngine(ctx) {
    const results = [];
    for (const rule of rules_js_1.ALL_RULES) {
        const inferences = rule.evaluate(ctx);
        results.push(...inferences);
    }
    // Deduplicate by ruleId — each rule should produce at most one inference per
    // category, but guard against accidental duplicates by keeping the highest
    // confidence result per ruleId.
    const confidenceRank = {
        'high': 3,
        'medium': 2,
        'low': 1,
        'not-applicable': 0,
    };
    const best = new Map();
    for (const inf of results) {
        const existing = best.get(inf.ruleId);
        if (!existing) {
            best.set(inf.ruleId, inf);
        }
        else {
            const existingRank = confidenceRank[existing.confidence] ?? 0;
            const newRank = confidenceRank[inf.confidence] ?? 0;
            if (newRank > existingRank) {
                best.set(inf.ruleId, inf);
            }
        }
    }
    return Array.from(best.values());
}
//# sourceMappingURL=engine.js.map