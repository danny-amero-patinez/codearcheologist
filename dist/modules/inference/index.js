"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_RULES = exports.runInferenceEngine = void 0;
var engine_js_1 = require("./engine.js");
Object.defineProperty(exports, "runInferenceEngine", { enumerable: true, get: function () { return engine_js_1.runInferenceEngine; } });
var rules_js_1 = require("./rules.js");
Object.defineProperty(exports, "ALL_RULES", { enumerable: true, get: function () { return rules_js_1.ALL_RULES; } });
//# sourceMappingURL=index.js.map