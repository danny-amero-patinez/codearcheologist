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
exports.jobDir = jobDir;
exports.inputDir = inputDir;
exports.rawDir = rawDir;
exports.resultDir = resultDir;
exports.ghidraProjectDir = ghidraProjectDir;
exports.inputBinaryPath = inputBinaryPath;
exports.metaPath = metaPath;
exports.rawPePath = rawPePath;
exports.rawStringsPath = rawStringsPath;
exports.rawGhidraPath = rawGhidraPath;
exports.ghidraStdoutLogPath = ghidraStdoutLogPath;
exports.ghidraStderrLogPath = ghidraStderrLogPath;
exports.rawEvidencePath = rawEvidencePath;
exports.rawFunctionProfilesPath = rawFunctionProfilesPath;
exports.canonicalResultPath = canonicalResultPath;
exports.isValidId = isValidId;
exports.createJob = createJob;
exports.writeMeta = writeMeta;
exports.readMeta = readMeta;
exports.updateStatus = updateStatus;
exports.updatePhase = updatePhase;
exports.writeRawJson = writeRawJson;
exports.readRawJson = readRawJson;
exports.isNodeError = isNodeError;
/**
 * Job store — filesystem-backed persistence for analysis metadata.
 *
 * Source of truth is always work/<id>/meta.json.
 * The Node.js process holds NO in-memory state for analyses.
 *
 * Work directory layout (per Section 8 of brief):
 *   work/<id>/
 *     input/         ← uploaded binary (stored as binary.exe)
 *     raw/           ← pe.json, strings.json, ghidra.json, ghidra.stdout.log, ghidra.stderr.log
 *     result/        ← analysis.json, report.md, report.html
 *     ghidra-project/ ← isolated Ghidra project per analysis
 */
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const logger_js_1 = require("../../shared/logger.js");
const logger = (0, logger_js_1.createLogger)('jobStore');
// ── Path helpers ──────────────────────────────────────────────────────────────
function jobDir(workDir, id) {
    return path.join(workDir, id);
}
function inputDir(workDir, id) {
    return path.join(jobDir(workDir, id), 'input');
}
function rawDir(workDir, id) {
    return path.join(jobDir(workDir, id), 'raw');
}
function resultDir(workDir, id) {
    return path.join(jobDir(workDir, id), 'result');
}
function ghidraProjectDir(workDir, id) {
    return path.join(jobDir(workDir, id), 'ghidra-project');
}
function inputBinaryPath(workDir, id) {
    return path.join(inputDir(workDir, id), 'binary.exe');
}
function metaPath(workDir, id) {
    return path.join(jobDir(workDir, id), 'meta.json');
}
function rawPePath(workDir, id) {
    return path.join(rawDir(workDir, id), 'pe.json');
}
function rawStringsPath(workDir, id) {
    return path.join(rawDir(workDir, id), 'strings.json');
}
function rawGhidraPath(workDir, id) {
    return path.join(rawDir(workDir, id), 'ghidra.json');
}
function ghidraStdoutLogPath(workDir, id) {
    return path.join(rawDir(workDir, id), 'ghidra.stdout.log');
}
function ghidraStderrLogPath(workDir, id) {
    return path.join(rawDir(workDir, id), 'ghidra.stderr.log');
}
function rawEvidencePath(workDir, id) {
    return path.join(rawDir(workDir, id), 'evidence.json');
}
function rawFunctionProfilesPath(workDir, id) {
    return path.join(rawDir(workDir, id), 'functionProfiles.json');
}
function canonicalResultPath(workDir, id) {
    return path.join(resultDir(workDir, id), 'analysis.json');
}
// ── ID validation ─────────────────────────────────────────────────────────────
// Guard against path traversal. Analysis IDs must be UUID v4 format.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidId(id) {
    return UUID_RE.test(id);
}
// ── Job creation ──────────────────────────────────────────────────────────────
async function createJob(workDir, meta) {
    const dir = jobDir(workDir, meta.id);
    await fs.mkdir(dir, { recursive: true });
    await fs.mkdir(inputDir(workDir, meta.id), { recursive: true });
    await fs.mkdir(rawDir(workDir, meta.id), { recursive: true });
    await fs.mkdir(resultDir(workDir, meta.id), { recursive: true });
    await fs.mkdir(ghidraProjectDir(workDir, meta.id), { recursive: true });
    await writeMeta(workDir, meta);
    logger.info({ id: meta.id }, 'Job directory created');
}
// ── Meta read/write ───────────────────────────────────────────────────────────
async function writeMeta(workDir, meta) {
    await fs.writeFile(metaPath(workDir, meta.id), JSON.stringify(meta, null, 2), 'utf8');
}
async function readMeta(workDir, id) {
    const p = metaPath(workDir, id);
    try {
        const raw = await fs.readFile(p, 'utf8');
        return JSON.parse(raw);
    }
    catch {
        // File not found, directory not found, or corrupt JSON — treat as not found
        return null;
    }
}
async function updateStatus(workDir, id, status, errorMessage) {
    const meta = await readMeta(workDir, id);
    if (!meta) {
        logger.error({ id }, 'updateStatus: meta not found');
        return;
    }
    meta.status = status;
    meta.updatedAt = new Date().toISOString();
    if (errorMessage !== undefined)
        meta.errorMessage = errorMessage;
    await writeMeta(workDir, meta);
}
async function updatePhase(workDir, id, phase, update) {
    const meta = await readMeta(workDir, id);
    if (!meta)
        return;
    const rec = meta.phases.find(p => p.phase === phase);
    if (rec)
        Object.assign(rec, update);
    meta.updatedAt = new Date().toISOString();
    await writeMeta(workDir, meta);
}
// ── Raw artifact helpers ──────────────────────────────────────────────────────
async function writeRawJson(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}
async function readRawJson(filePath) {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
// ── Utilities ─────────────────────────────────────────────────────────────────
function isNodeError(err) {
    return err instanceof Error && 'code' in err;
}
//# sourceMappingURL=jobStore.js.map