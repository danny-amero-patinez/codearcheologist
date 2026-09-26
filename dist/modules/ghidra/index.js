"use strict";
/**
 * Ghidra module — headless Ghidra integration.
 *
 * Responsibilities:
 * - Detect GHIDRA_HOME and the platform-correct launcher
 *   Windows: <GHIDRA_HOME>\support\analyzeHeadless.bat
 *   Linux:   <GHIDRA_HOME>/support/analyzeHeadless
 * - Validate Java version (JDK 21+ required)
 * - Spawn analyzeHeadless with arguments passed as an ARRAY (never shell-interpolated)
 * - Enforce timeout; kill process on expiry
 * - Capture stdout/stderr to job artifacts
 * - Run the project-owned Ghidra script via -postScript (no -scriptArgs token)
 * - Validate ghidra.json output exists and is non-empty before marking success
 * - Degrade gracefully: Ghidra failure must not discard PE/string evidence
 *
 * SAFETY: analyzeHeadless performs STATIC analysis only.
 *         The uploaded binary is passed as an IMPORT TARGET, never executed.
 *         Arguments are passed as an array; user-controlled paths are NEVER
 *         interpolated into a shell string.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGhidraOutput = exports.runGhidra = exports.getGhidraVersion = exports.detectJava = exports.detectLauncher = void 0;
var launcher_js_1 = require("./launcher.js");
Object.defineProperty(exports, "detectLauncher", { enumerable: true, get: function () { return launcher_js_1.detectLauncher; } });
Object.defineProperty(exports, "detectJava", { enumerable: true, get: function () { return launcher_js_1.detectJava; } });
Object.defineProperty(exports, "getGhidraVersion", { enumerable: true, get: function () { return launcher_js_1.getGhidraVersion; } });
var runner_js_1 = require("./runner.js");
Object.defineProperty(exports, "runGhidra", { enumerable: true, get: function () { return runner_js_1.runGhidra; } });
var validator_js_1 = require("./validator.js");
Object.defineProperty(exports, "validateGhidraOutput", { enumerable: true, get: function () { return validator_js_1.validateGhidraOutput; } });
//# sourceMappingURL=index.js.map