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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ghidraQueue = void 0;
exports.buildInitialMeta = buildInitialMeta;
exports.intake = intake;
exports.runLightweightAnalysis = runLightweightAnalysis;
exports.skipRemainingPhases = skipRemainingPhases;
exports.runGhidraPhase = runGhidraPhase;
exports.runPipeline = runPipeline;
exports.getDiagnostics = getDiagnostics;
/**
 * Analysis pipeline — orchestrates the full analysis workflow.
 *
 * SAFETY: The uploaded binary is NEVER executed, spawned, or loaded.
 * All operations are static byte-reading, parsing, or headless Ghidra invocation.
 */
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const p_queue_1 = __importDefault(require("p-queue"));
const index_js_1 = require("../binary/index.js");
const index_js_2 = require("../ghidra/index.js");
const launcher_js_1 = require("../ghidra/launcher.js");
const logger_js_1 = require("../../shared/logger.js");
const store = __importStar(require("./jobStore.js"));
const logger = (0, logger_js_1.createLogger)('analysisPipeline');
// One Ghidra process at a time
exports.ghidraQueue = new p_queue_1.default({ concurrency: 1 });
// Path to the CodeArchaeologistScript.java (resolved relative to this source file)
// Works for both ts-node (src/) and compiled (dist/) layouts because the Java
// script is copied to dist/ by the build step alongside its source location.
const GHIDRA_SCRIPT_PATH = path.resolve(__dirname, '../ghidra/scripts/CodeArchaeologistScript.java');
// ── Factory ────────────────────────────────────────────────────────────────────
function buildInitialMeta(id, originalFilename, fileSizeBytes) {
    const now = new Date().toISOString();
    return {
        id,
        status: 'queued',
        createdAt: now,
        updatedAt: now,
        originalFilename,
        storedFilename: 'binary.exe',
        fileSizeBytes,
        sha256: '', // filled after hashing
        phases: [
            { phase: 'intake', status: 'pending' },
            { phase: 'profiling', status: 'pending' },
            { phase: 'extracting', status: 'pending' },
            { phase: 'ghidra-analysis', status: 'pending' },
            { phase: 'correlating', status: 'pending' },
            { phase: 'inferring', status: 'pending' },
            { phase: 'reconstructing', status: 'pending' },
            { phase: 'reporting', status: 'pending' },
        ],
    };
}
// ── Intake ─────────────────────────────────────────────────────────────────────
/**
 * Creates the job and stores the uploaded binary.
 *
 * Returns the canonical analysis ID. This is the one and only UUID for
 * this analysis — the same ID is used everywhere: API, meta.json, work dir,
 * artifacts, logs.
 */
async function intake(config, uploadedFilePath, originalFilename) {
    // ── Quick PE validation before creating the job ────────────────────────────
    // Read first 64 bytes to check MZ signature. This is cheap and synchronous.
    // SAFETY: reading bytes only — never executing the file.
    const head = Buffer.alloc(64);
    const fh = await fs.open(uploadedFilePath, 'r');
    try {
        await fh.read(head, 0, 64, 0);
    }
    finally {
        await fh.close();
    }
    if (head.length < 2 || head.readUInt16LE(0) !== 0x5a4d) {
        throw new Error('Not a valid PE file: missing MZ signature');
    }
    const id = (0, uuid_1.v4)();
    const fileStat = await fs.stat(uploadedFilePath);
    const meta = buildInitialMeta(id, originalFilename, fileStat.size);
    // Create work directory layout
    await store.createJob(config.WORK_DIR, meta);
    // Move the temp upload into the job input directory
    // SAFETY: we are copying the file bytes, NOT executing it
    const dest = store.inputBinaryPath(config.WORK_DIR, id);
    await fs.copyFile(uploadedFilePath, dest);
    // Update intake phase
    await store.updatePhase(config.WORK_DIR, id, 'intake', {
        status: 'completed',
        startedAt: meta.createdAt,
        completedAt: new Date().toISOString(),
    });
    await store.updateStatus(config.WORK_DIR, id, 'preparing');
    logger.info({ id, originalFilename }, 'Intake complete');
    return (await store.readMeta(config.WORK_DIR, id));
}
async function runLightweightAnalysis(config, id) {
    const binaryPath = store.inputBinaryPath(config.WORK_DIR, id);
    // ── Phase: profiling ───────────────────────────────────────────────────────
    const profilingStart = new Date().toISOString();
    await store.updatePhase(config.WORK_DIR, id, 'profiling', {
        status: 'running',
        startedAt: profilingStart,
    });
    await store.updateStatus(config.WORK_DIR, id, 'extracting');
    // SAFETY: readFile reads bytes only — binary is NOT executed
    const buf = await fs.readFile(binaryPath);
    const sha256 = (0, index_js_1.computeSha256)(buf);
    // Update sha256 in meta
    const meta = await store.readMeta(config.WORK_DIR, id);
    if (meta) {
        meta.sha256 = sha256;
        await store.writeMeta(config.WORK_DIR, meta);
    }
    let parseResult;
    try {
        parseResult = (0, index_js_1.parsePe)(buf, sha256);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await store.updatePhase(config.WORK_DIR, id, 'profiling', {
            status: 'failed',
            completedAt: new Date().toISOString(),
            error: msg,
        });
        await store.updateStatus(config.WORK_DIR, id, 'failed', `PE parsing failed: ${msg}`);
        throw err;
    }
    const metaLatest = await store.readMeta(config.WORK_DIR, id);
    const profile = {
        ...parseResult.profile,
        originalFilename: metaLatest?.originalFilename ?? '',
        storedFilename: 'binary.exe',
    };
    const profilingEnd = new Date().toISOString();
    await store.updatePhase(config.WORK_DIR, id, 'profiling', {
        status: 'completed',
        completedAt: profilingEnd,
        durationMs: Date.parse(profilingEnd) - Date.parse(profilingStart),
    });
    // Persist pe.json
    await store.writeRawJson(store.rawPePath(config.WORK_DIR, id), profile);
    logger.info({ id, peType: profile.peType, arch: profile.architecture }, 'PE profiling complete');
    // ── Phase: extracting (strings) ────────────────────────────────────────────
    const extractStart = new Date().toISOString();
    await store.updatePhase(config.WORK_DIR, id, 'extracting', {
        status: 'running',
        startedAt: extractStart,
    });
    const strings = (0, index_js_1.extractStrings)(buf, config.MAX_STRINGS);
    await store.writeRawJson(store.rawStringsPath(config.WORK_DIR, id), strings);
    const extractEnd = new Date().toISOString();
    await store.updatePhase(config.WORK_DIR, id, 'extracting', {
        status: 'completed',
        completedAt: extractEnd,
        durationMs: Date.parse(extractEnd) - Date.parse(extractStart),
    });
    logger.info({ id, stringCount: strings.length }, 'String extraction complete');
    return { profile, strings };
}
// ── Skip remaining phases when Ghidra not available ────────────────────────────
async function skipRemainingPhases(config, id, reason) {
    const remainingPhases = ['ghidra-analysis', 'correlating', 'inferring', 'reconstructing', 'reporting'];
    for (const phase of remainingPhases) {
        await store.updatePhase(config.WORK_DIR, id, phase, { status: 'skipped' });
    }
    await store.updateStatus(config.WORK_DIR, id, 'partial', reason);
    logger.info({ id, reason }, 'Remaining phases skipped — partial result');
}
// ── Ghidra phase ────────────────────────────────────────────────────────────────
/**
 * Runs the Ghidra analysis phase via the ghidraQueue (concurrency=1).
 *
 * Returns the validated Ghidra output, or null if Ghidra is unavailable or fails.
 * On failure, records the error in the phase but does NOT throw — PE/string evidence
 * is preserved and the status becomes `partial`.
 */
async function runGhidraPhase(config, id) {
    if (!config.GHIDRA_HOME) {
        await store.updatePhase(config.WORK_DIR, id, 'ghidra-analysis', {
            status: 'skipped',
            error: 'GHIDRA_HOME not configured',
        });
        return null;
    }
    const ghidraStart = new Date().toISOString();
    await store.updatePhase(config.WORK_DIR, id, 'ghidra-analysis', {
        status: 'running',
        startedAt: ghidraStart,
    });
    await store.updateStatus(config.WORK_DIR, id, 'decompiling');
    const binaryPath = store.inputBinaryPath(config.WORK_DIR, id);
    const outputJsonPath = store.rawGhidraPath(config.WORK_DIR, id);
    const projectDir = store.ghidraProjectDir(config.WORK_DIR, id);
    const stdoutLogPath = store.ghidraStdoutLogPath(config.WORK_DIR, id);
    const stderrLogPath = store.ghidraStderrLogPath(config.WORK_DIR, id);
    try {
        const result = await exports.ghidraQueue.add(() => (0, index_js_2.runGhidra)({
            config,
            analysisId: id,
            binaryPath,
            outputJsonPath,
            projectDir,
            scriptPath: GHIDRA_SCRIPT_PATH,
            stdoutLogPath,
            stderrLogPath,
        }));
        if (!result) {
            // p-queue returned undefined (shouldn't happen for non-void tasks, but guard anyway)
            throw new Error('Ghidra queue returned no result');
        }
        if (!result.success) {
            const ghidraEnd = new Date().toISOString();
            await store.updatePhase(config.WORK_DIR, id, 'ghidra-analysis', {
                status: 'failed',
                completedAt: ghidraEnd,
                durationMs: result.durationMs,
                ...(result.error !== undefined ? { error: result.error } : {}),
            });
            logger.warn({ id, error: result.error, timedOut: result.timedOut }, 'Ghidra phase failed — keeping PE evidence');
            return null;
        }
        // Validate output
        const ghidraOutput = await (0, index_js_2.validateGhidraOutput)(outputJsonPath);
        const ghidraEnd = new Date().toISOString();
        await store.updatePhase(config.WORK_DIR, id, 'ghidra-analysis', {
            status: 'completed',
            completedAt: ghidraEnd,
            durationMs: result.durationMs,
        });
        logger.info({ id, functionCount: ghidraOutput.functions.length, durationMs: result.durationMs }, 'Ghidra phase complete');
        return ghidraOutput;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const ghidraEnd = new Date().toISOString();
        await store.updatePhase(config.WORK_DIR, id, 'ghidra-analysis', {
            status: 'failed',
            completedAt: ghidraEnd,
            error: msg,
        });
        logger.warn({ id, err: msg }, 'Ghidra phase error — keeping PE evidence');
        return null;
    }
}
// ── Full pipeline entry point ──────────────────────────────────────────────────
/**
 * Run the full analysis pipeline asynchronously.
 * Called after intake; errors are caught and recorded, never thrown to the caller.
 */
async function runPipeline(config, id) {
    try {
        const { profile, strings } = await runLightweightAnalysis(config, id);
        // ── Ghidra phase ──────────────────────────────────────────────────────────
        const ghidraOutput = await runGhidraPhase(config, id);
        // ── Evidence building phase (correlating) ─────────────────────────────────
        // Dynamically import to avoid circular deps at module load time
        const { buildEvidenceStore } = await Promise.resolve().then(() => __importStar(require('../evidence/normalizer.js')));
        const { normalizeCallEdges } = await Promise.resolve().then(() => __importStar(require('../evidence/callEdgeNormalizer.js')));
        const { buildFunctionProfiles } = await Promise.resolve().then(() => __importStar(require('../evidence/functionProfiles.js')));
        const ghidraCorrelateStart = new Date().toISOString();
        await store.updatePhase(config.WORK_DIR, id, 'correlating', {
            status: 'running',
            startedAt: ghidraCorrelateStart,
        });
        const evidence = buildEvidenceStore(profile, strings, ghidraOutput ?? undefined);
        await store.writeRawJson(store.rawEvidencePath(config.WORK_DIR, id), evidence);
        let functionProfiles = [];
        if (ghidraOutput) {
            const normalizedEdges = normalizeCallEdges(ghidraOutput.functions, profile.imports);
            functionProfiles = buildFunctionProfiles(ghidraOutput.functions, normalizedEdges, evidence);
        }
        await store.writeRawJson(store.rawFunctionProfilesPath(config.WORK_DIR, id), functionProfiles);
        const ghidraCorrelateEnd = new Date().toISOString();
        await store.updatePhase(config.WORK_DIR, id, 'correlating', {
            status: 'completed',
            completedAt: ghidraCorrelateEnd,
            durationMs: Date.parse(ghidraCorrelateEnd) - Date.parse(ghidraCorrelateStart),
        });
        logger.info({ id, evidenceCount: evidence.length, functionProfileCount: functionProfiles.length }, 'Correlation complete');
        // ── Inference phase ────────────────────────────────────────────────────────
        const inferStart = new Date().toISOString();
        await store.updatePhase(config.WORK_DIR, id, 'inferring', {
            status: 'running',
            startedAt: inferStart,
        });
        const { runInferenceEngine } = await Promise.resolve().then(() => __importStar(require('../inference/engine.js')));
        const meta = await store.readMeta(config.WORK_DIR, id);
        const inferenceCtx = {
            evidence,
            functionProfiles,
            imports: profile.imports,
            strings,
        };
        const inferences = runInferenceEngine(inferenceCtx);
        const inferEnd = new Date().toISOString();
        await store.updatePhase(config.WORK_DIR, id, 'inferring', {
            status: 'completed',
            completedAt: inferEnd,
            durationMs: Date.parse(inferEnd) - Date.parse(inferStart),
        });
        logger.info({ id, inferenceCount: inferences.length }, 'Inference complete');
        // ── Reconstruction phase ───────────────────────────────────────────────────
        const reconStart = new Date().toISOString();
        await store.updatePhase(config.WORK_DIR, id, 'reconstructing', {
            status: 'running',
            startedAt: reconStart,
        });
        const { buildCandidateResponsibilities } = await Promise.resolve().then(() => __importStar(require('../reconstruction/candidateBuilder.js')));
        const { buildExternalInteractions } = await Promise.resolve().then(() => __importStar(require('../reconstruction/externalsBuilder.js')));
        const { buildUnknowns } = await Promise.resolve().then(() => __importStar(require('../reconstruction/unknownsBuilder.js')));
        const candidates = buildCandidateResponsibilities(inferences, functionProfiles, evidence);
        const externals = buildExternalInteractions(inferences, evidence, strings);
        const unknowns = buildUnknowns(inferences, profile);
        const reconEnd = new Date().toISOString();
        await store.updatePhase(config.WORK_DIR, id, 'reconstructing', {
            status: 'completed',
            completedAt: reconEnd,
            durationMs: Date.parse(reconEnd) - Date.parse(reconStart),
        });
        logger.info({ id, candidateCount: candidates.length, unknownCount: unknowns.length }, 'Reconstruction complete');
        // ── Reporting phase ────────────────────────────────────────────────────────
        const reportStart = new Date().toISOString();
        await store.updatePhase(config.WORK_DIR, id, 'reporting', {
            status: 'running',
            startedAt: reportStart,
        });
        const { buildModernizationRecommendations, buildCanonicalResult, generateMarkdownReport, generateHtmlReport } = await Promise.resolve().then(() => __importStar(require('../reporting/index.js')));
        const modernization = buildModernizationRecommendations(candidates, unknowns, inferences);
        const ghidraError = meta ? meta.phases.find(p => p.phase === 'ghidra-analysis')?.error : undefined;
        const coverage = {
            peParser: true,
            strings: true,
            ghidra: ghidraOutput !== null,
            ...(ghidraError !== undefined ? { ghidraError } : {}),
        };
        // Mark reporting completed and set final status BEFORE building the
        // canonical result snapshot, so that analysis.json contains terminal
        // lifecycle metadata rather than a stale intermediate state.
        const reportEnd = new Date().toISOString();
        await store.updatePhase(config.WORK_DIR, id, 'reporting', {
            status: 'completed',
            completedAt: reportEnd,
            durationMs: Date.parse(reportEnd) - Date.parse(reportStart),
        });
        if (ghidraOutput) {
            await store.updateStatus(config.WORK_DIR, id, 'completed');
        }
        else {
            await store.updateStatus(config.WORK_DIR, id, 'partial', config.GHIDRA_HOME
                ? 'Ghidra analysis failed — partial result (PE + strings only)'
                : 'GHIDRA_HOME not configured — partial result (PE + strings only)');
        }
        // Re-read the now-final metadata so the canonical result snapshot is correct.
        const finalMeta = await store.readMeta(config.WORK_DIR, id);
        const canonicalResult = buildCanonicalResult({
            meta: finalMeta,
            profile,
            coverage,
            evidence,
            functionProfiles,
            inferences,
            candidates,
            externals,
            unknowns,
            modernization,
            strings,
        });
        // Write canonical result + reports — all from the same final canonical object.
        await store.writeRawJson(store.canonicalResultPath(config.WORK_DIR, id), canonicalResult);
        const mdReport = generateMarkdownReport(canonicalResult);
        const htmlReport = generateHtmlReport(canonicalResult);
        await fs.writeFile(path.join(store.resultDir(config.WORK_DIR, id), 'report.md'), mdReport, 'utf8');
        await fs.writeFile(path.join(store.resultDir(config.WORK_DIR, id), 'report.html'), htmlReport, 'utf8');
        logger.info({ id }, 'Pipeline complete');
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ id, err: msg }, 'Pipeline error');
        await store.updateStatus(config.WORK_DIR, id, 'failed', msg).catch(() => undefined);
    }
}
async function getDiagnostics(config) {
    let workDirAccessible = false;
    try {
        await fs.access(config.WORK_DIR);
        workDirAccessible = true;
    }
    catch {
        try {
            await fs.mkdir(config.WORK_DIR, { recursive: true });
            workDirAccessible = true;
        }
        catch {
            workDirAccessible = false;
        }
    }
    // Check Ghidra availability
    let ghidra = { status: 'unchecked' };
    let java = { status: 'unchecked' };
    if (config.GHIDRA_HOME) {
        try {
            (0, launcher_js_1.detectLauncher)(config.GHIDRA_HOME);
            ghidra = { status: 'available' };
        }
        catch (err) {
            ghidra = { status: 'unavailable', reason: err instanceof Error ? err.message : String(err) };
        }
        const javaInfo = await (0, launcher_js_1.detectJava)();
        if (javaInfo.compatible) {
            java = { status: 'available' };
        }
        else {
            java = { status: 'unavailable', reason: javaInfo.error ?? `Java ${javaInfo.version} < 21` };
        }
    }
    return {
        node: process.version,
        platform: process.platform,
        workDir: path.resolve(config.WORK_DIR),
        workDirAccessible,
        ghidra,
        java,
    };
}
//# sourceMappingURL=pipeline.js.map