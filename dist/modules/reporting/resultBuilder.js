"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCanonicalResult = buildCanonicalResult;
const STANDARD_LIMITATIONS = [
    'The uploaded binary was NEVER executed. All conclusions are from static analysis only.',
    'Static analysis cannot establish the runtime behavior, safety, or trustworthiness of this binary.',
    'Decompiled pseudocode and function names (especially FUN_*) are approximations, not original source code.',
    'Missing debug symbols mean function names and types are partially or fully unknown.',
    'Confidence levels reflect signal strength in the static evidence, not runtime certainty.',
    'Inferences marked as HIGH confidence still require validation by dynamic analysis or source code review.',
    'Call graph edges may be incomplete due to indirect calls, virtual dispatch, or obfuscation.',
    'Packed, encrypted, or self-modifying code may hide capabilities not visible in static analysis.',
];
const SAFETY_RISK = 'Static analysis CANNOT establish that this binary is safe. The binary was never executed. Treat it as untrusted until verified.';
/** Select the top N function profiles by selectionScore. */
function topFunctions(profiles, n = 20) {
    return [...profiles].sort((a, b) => b.selectionScore - a.selectionScore).slice(0, n);
}
/** Extract unique DLL names from the binary profile imports. */
function extractDependencies(profile) {
    return [...new Set(profile.imports.map(imp => imp.dll))].sort();
}
function buildCanonicalResult(params) {
    const { meta, profile, coverage, evidence, functionProfiles, inferences, candidates, externals, unknowns, modernization, } = params;
    return {
        analysis: meta,
        binary: profile,
        coverage,
        evidence,
        capabilities: inferences,
        /** NOTE: field name is candidateComponents per API contract */
        candidateComponents: candidates,
        externalInteractions: externals,
        dependencies: extractDependencies(profile),
        interestingFunctions: topFunctions(functionProfiles),
        unknowns,
        risks: [SAFETY_RISK],
        modernization,
        limitations: STANDARD_LIMITATIONS,
    };
}
//# sourceMappingURL=resultBuilder.js.map