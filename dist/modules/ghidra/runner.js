"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGhidra = runGhidra;
/**
 * Ghidra runner — spawns analyzeHeadless with array args (never shell-interpolated).
 *
 * SAFETY INVARIANTS:
 * - The uploaded binary is passed as an IMPORT target to Ghidra's static analyser.
 *   It is NEVER executed by Node.js.
 * - All arguments are passed as an array to child_process.spawn — user-controlled
 *   paths are NEVER interpolated into a shell string.
 * - On Windows: uses `cmd.exe /c` to invoke the .bat launcher, which correctly
 *   handles paths containing spaces without shell injection.
 */
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const launcher_js_1 = require("./launcher.js");
const logger_js_1 = require("../../shared/logger.js");
const logger = (0, logger_js_1.createLogger)('ghidra.runner');
/**
 * Runs analyzeHeadless against the imported binary (static analysis only).
 *
 * Arg layout (Ghidra headless analyser contract):
 *   analyzeHeadless <projectLocation> <projectName> \
 *     -import <binary> \
 *     -scriptPath <scriptDir> \
 *     -postScript CodeArchaeologistScript.java <outputJson> <maxFunctions> \
 *     -deleteProject
 *
 * NOTE: There is NO `-scriptArgs` token between the script name and its
 * arguments. Ghidra passes everything after the script name directly to
 * args[] in the script.
 */
async function runGhidra(params) {
    const { config, analysisId, binaryPath, outputJsonPath, projectDir, scriptPath, stdoutLogPath, stderrLogPath, } = params;
    if (!config.GHIDRA_HOME) {
        return {
            success: false,
            exitCode: null,
            durationMs: 0,
            timedOut: false,
            error: 'GHIDRA_HOME is not configured',
        };
    }
    let launcher;
    try {
        launcher = (0, launcher_js_1.detectLauncher)(config.GHIDRA_HOME);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, exitCode: null, durationMs: 0, timedOut: false, error: msg };
    }
    const scriptDir = path.dirname(scriptPath);
    // Ghidra headless args array — NEVER shell-interpolated
    const ghidraArgs = [
        projectDir,
        analysisId,
        '-import', binaryPath,
        '-scriptPath', scriptDir,
        '-postScript', 'CodeArchaeologistScript.java', outputJsonPath, String(config.MAX_GHIDRA_FUNCTIONS),
        '-deleteProject',
    ];
    // Windows: invoke the .bat via cmd.exe to handle paths with spaces
    // Linux: invoke the launcher script directly
    const { command, args } = launcher.platform === 'windows'
        ? { command: 'cmd.exe', args: ['/c', launcher.launcherPath, ...ghidraArgs] }
        : { command: launcher.launcherPath, args: ghidraArgs };
    logger.debug({ analysisId, command, args }, 'Spawning Ghidra analyzeHeadless');
    const startMs = Date.now();
    return new Promise((resolve) => {
        // Open log file handles for stdout and stderr capture
        let stdoutFd = null;
        let stderrFd = null;
        let stdoutChunks = [];
        let stderrChunks = [];
        let settled = false;
        let timer = null;
        function finish(result) {
            if (settled)
                return;
            settled = true;
            if (timer !== null)
                clearTimeout(timer);
            // Flush log files and resolve
            const flushAndResolve = async () => {
                try {
                    if (stdoutFd) {
                        await stdoutFd.write(stdoutChunks.join(''));
                        await stdoutFd.close();
                    }
                }
                catch { /* best effort */ }
                try {
                    if (stderrFd) {
                        await stderrFd.write(stderrChunks.join(''));
                        await stderrFd.close();
                    }
                }
                catch { /* best effort */ }
                resolve(result);
            };
            void flushAndResolve();
        }
        // Open log files asynchronously then spawn
        Promise.all([
            fs.open(stdoutLogPath, 'w').catch(() => null),
            fs.open(stderrLogPath, 'w').catch(() => null),
        ]).then(([outFd, errFd]) => {
            stdoutFd = outFd;
            stderrFd = errFd;
            // SAFETY: spawn with args array — binaryPath is never shell-interpolated
            const proc = (0, child_process_1.spawn)(command, args, {
                stdio: ['ignore', 'pipe', 'pipe'],
                shell: false, // explicit: never use shell
            });
            proc.stdout?.on('data', (chunk) => {
                stdoutChunks.push(chunk.toString());
            });
            proc.stderr?.on('data', (chunk) => {
                stderrChunks.push(chunk.toString());
            });
            proc.on('error', (err) => {
                finish({
                    success: false,
                    exitCode: null,
                    durationMs: Date.now() - startMs,
                    timedOut: false,
                    error: `Failed to spawn Ghidra: ${err.message}`,
                });
            });
            proc.on('close', (exitCode) => {
                const durationMs = Date.now() - startMs;
                logger.info({ analysisId, exitCode, durationMs }, 'Ghidra process exited');
                if (exitCode !== 0) {
                    const stderr = stderrChunks.join('').slice(0, 500);
                    finish({
                        success: false,
                        exitCode,
                        durationMs,
                        timedOut: false,
                        error: `Ghidra exited with code ${exitCode}. stderr: ${stderr}`,
                    });
                    return;
                }
                // Exit code 0 but no output file = failure
                fs.stat(outputJsonPath)
                    .then((stat) => {
                    if (stat.size === 0) {
                        finish({
                            success: false,
                            exitCode: 0,
                            durationMs,
                            timedOut: false,
                            error: 'Ghidra exited 0 but output file is empty',
                        });
                    }
                    else {
                        finish({ success: true, exitCode: 0, durationMs, timedOut: false });
                    }
                })
                    .catch(() => {
                    finish({
                        success: false,
                        exitCode: 0,
                        durationMs,
                        timedOut: false,
                        error: 'Ghidra exited 0 but output file does not exist',
                    });
                });
            });
            // Enforce timeout
            timer = setTimeout(() => {
                logger.warn({ analysisId, timeoutMs: config.GHIDRA_TIMEOUT_MS }, 'Ghidra timed out — killing process');
                proc.kill('SIGKILL');
                finish({
                    success: false,
                    exitCode: null,
                    durationMs: Date.now() - startMs,
                    timedOut: true,
                    error: `Ghidra timed out after ${config.GHIDRA_TIMEOUT_MS}ms`,
                });
            }, config.GHIDRA_TIMEOUT_MS);
        });
    });
}
//# sourceMappingURL=runner.js.map