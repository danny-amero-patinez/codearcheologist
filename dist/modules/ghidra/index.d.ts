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
export { detectLauncher, detectJava, getGhidraVersion } from './launcher.js';
export { runGhidra } from './runner.js';
export { validateGhidraOutput } from './validator.js';
export type { GhidraRawOutput, GhidraFunction } from './validator.js';
export type { GhidraRunResult } from './runner.js';
export type { LauncherInfo, JavaInfo } from './launcher.js';
//# sourceMappingURL=index.d.ts.map