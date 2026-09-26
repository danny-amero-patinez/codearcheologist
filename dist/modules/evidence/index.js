"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFunctionProfiles = exports.normalizeCallEdges = exports.evidenceId = exports.normalizeGhidraEvidence = exports.normalizeStringEvidence = exports.normalizePeEvidence = exports.buildEvidenceStore = void 0;
var normalizer_js_1 = require("./normalizer.js");
Object.defineProperty(exports, "buildEvidenceStore", { enumerable: true, get: function () { return normalizer_js_1.buildEvidenceStore; } });
Object.defineProperty(exports, "normalizePeEvidence", { enumerable: true, get: function () { return normalizer_js_1.normalizePeEvidence; } });
Object.defineProperty(exports, "normalizeStringEvidence", { enumerable: true, get: function () { return normalizer_js_1.normalizeStringEvidence; } });
Object.defineProperty(exports, "normalizeGhidraEvidence", { enumerable: true, get: function () { return normalizer_js_1.normalizeGhidraEvidence; } });
Object.defineProperty(exports, "evidenceId", { enumerable: true, get: function () { return normalizer_js_1.evidenceId; } });
var callEdgeNormalizer_js_1 = require("./callEdgeNormalizer.js");
Object.defineProperty(exports, "normalizeCallEdges", { enumerable: true, get: function () { return callEdgeNormalizer_js_1.normalizeCallEdges; } });
var functionProfiles_js_1 = require("./functionProfiles.js");
Object.defineProperty(exports, "buildFunctionProfiles", { enumerable: true, get: function () { return functionProfiles_js_1.buildFunctionProfiles; } });
//# sourceMappingURL=index.js.map