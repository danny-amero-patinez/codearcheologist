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
exports.detectLauncher = detectLauncher;
exports.detectJava = detectJava;
exports.getGhidraVersion = getGhidraVersion;
/**
 * Ghidra launcher detection utilities.
 *
 * SAFETY: detectJava spawns `java -version` only — NOT the uploaded binary.
 *         Arguments are always passed as an array, never shell-interpolated.
 */
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const logger_js_1 = require("../../shared/logger.js");
const logger = (0, logger_js_1.createLogger)('ghidra.launcher');
/**
 * Resolves the platform-correct analyzeHeadless launcher path and validates
 * that the file exists.
 *
 * Windows: <ghidraHome>\support\analyzeHeadless.bat
 * Linux:   <ghidraHome>/support/analyzeHeadless
 */
function detectLauncher(ghidraHome) {
    const isWindows = process.platform === 'win32';
    const launcherPath = isWindows
        ? path.join(ghidraHome, 'support', 'analyzeHeadless.bat')
        : path.join(ghidraHome, 'support', 'analyzeHeadless');
    const platform = isWindows ? 'windows' : 'linux';
    // Synchronous existence check — called once at analysis start, not hot path
    const { existsSync } = require('fs');
    if (!existsSync(launcherPath)) {
        throw new Error(`Ghidra launcher not found at ${launcherPath}. ` +
            `Verify GHIDRA_HOME="${ghidraHome}" points to a valid Ghidra installation.`);
    }
    logger.debug({ launcherPath, platform }, 'Ghidra launcher detected');
    return { launcherPath, platform };
}
/**
 * Detects the Java version by running `java -version`.
 * Requires major version >= 21 for Ghidra 11+.
 *
 * SAFETY: Spawns `java` only with `-version` flag — NOT the uploaded binary.
 */
function detectJava() {
    return new Promise((resolve) => {
        // java prints version info to stderr
        const proc = (0, child_process_1.spawn)('java', ['-version'], { stdio: ['ignore', 'pipe', 'pipe'] });
        let stderr = '';
        proc.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
        proc.stdout?.on('data', (chunk) => { stderr += chunk.toString(); });
        proc.on('error', (err) => {
            resolve({ version: 'unknown', compatible: false, error: `java not found: ${err.message}` });
        });
        proc.on('close', (code) => {
            // java -version exits 0; parse version from stderr output
            // Example: openjdk version "21.0.3" 2024-04-16
            const match = stderr.match(/version\s+"?(\d+)(?:\.(\d+))?/i);
            if (!match || !match[1]) {
                resolve({
                    version: 'unknown',
                    compatible: false,
                    error: `Could not parse Java version from output: ${stderr.slice(0, 200)}`,
                });
                return;
            }
            // Pre-Java 9: "1.8.0_...", major is second segment; Java 9+: "21.0.3", major is first
            const rawMajor = match[1] === '1' && match[2] ? Number(match[2]) : Number(match[1]);
            const version = match[0].replace('version "', '').replace('"', '').trim();
            const compatible = rawMajor >= 21;
            logger.debug({ version, compatible, exitCode: code }, 'Java version detected');
            resolve({ version, compatible });
        });
    });
}
/**
 * Reads the Ghidra version from <ghidraHome>/Ghidra/application.properties.
 * Returns undefined if the file cannot be read.
 */
async function getGhidraVersion(ghidraHome) {
    const propsPath = path.join(ghidraHome, 'Ghidra', 'application.properties');
    try {
        const content = await fs.readFile(propsPath, 'utf8');
        const match = content.match(/^application\.version\s*=\s*(.+)$/m);
        return match?.[1]?.trim();
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=launcher.js.map