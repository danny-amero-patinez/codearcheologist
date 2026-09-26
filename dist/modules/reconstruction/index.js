"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUnknowns = exports.buildExternalInteractions = exports.buildCandidateResponsibilities = void 0;
var candidateBuilder_js_1 = require("./candidateBuilder.js");
Object.defineProperty(exports, "buildCandidateResponsibilities", { enumerable: true, get: function () { return candidateBuilder_js_1.buildCandidateResponsibilities; } });
var externalsBuilder_js_1 = require("./externalsBuilder.js");
Object.defineProperty(exports, "buildExternalInteractions", { enumerable: true, get: function () { return externalsBuilder_js_1.buildExternalInteractions; } });
var unknownsBuilder_js_1 = require("./unknownsBuilder.js");
Object.defineProperty(exports, "buildUnknowns", { enumerable: true, get: function () { return unknownsBuilder_js_1.buildUnknowns; } });
//# sourceMappingURL=index.js.map