/**
 * Analysis pipeline — orchestrates the full analysis workflow.
 *
 * SAFETY: The uploaded binary is NEVER executed, spawned, or loaded.
 * All operations are static byte-reading, parsing, or headless Ghidra invocation.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import PQueue from 'p-queue';
import { type AppConfig } from '../../config/config.js';
import { type AnalysisMeta, type BinaryProfile, type ExtractedString } from '../../shared/types.js';
import { computeSha256, parsePe, extractStrings } from '../binary/index.js';
import { runGhidra, validateGhidraOutput } from '../ghidra/index.js';
import { detectLauncher, detectJava } from '../ghidra/launcher.js';
import { createLogger } from '../../shared/logger.js';
import * as store from './jobStore.js';

const logger = createLogger('analysisPipeline');

// One Ghidra process at a time
export const ghidraQueue = new PQueue({ concurrency: 1 });

// Path to the CodeArchaeologistScript.java (resolved relative to this source file)
// Works for both ts-node (src/) and compiled (dist/) layouts because the Java
// script is copied to dist/ by the build step alongside its source location.
const GHIDRA_SCRIPT_PATH = path.resolve(__dirname, '../ghidra/scripts/CodeArchaeologistScript.java');

// ── Factory ────────────────────────────────────────────────────────────────────

export function buildInitialMeta(
  id: string,
  originalFilename: string,
  fileSizeBytes: number,
): AnalysisMeta {
  const now = new Date().toISOString();
  return {
    id,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    originalFilename,
    storedFilename: 'binary.exe',
    fileSizeBytes,
    sha256: '',   // filled after hashing
    phases: [
      { phase: 'intake',         status: 'pending' },
      { phase: 'profiling',      status: 'pending' },
      { phase: 'extracting',     status: 'pending' },
      { phase: 'ghidra-analysis',status: 'pending' },
      { phase: 'correlating',    status: 'pending' },
      { phase: 'inferring',      status: 'pending' },
      { phase: 'reconstructing', status: 'pending' },
      { phase: 'reporting',      status: 'pending' },
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
export async function intake(
  config: AppConfig,
  uploadedFilePath: string,
  originalFilename: string,
): Promise<AnalysisMeta> {
  // ── Quick PE validation before creating the job ────────────────────────────
  // Read first 64 bytes to check MZ signature. This is cheap and synchronous.
  // SAFETY: reading bytes only — never executing the file.
  const head = Buffer.alloc(64);
  const fh = await fs.open(uploadedFilePath, 'r');
  try {
    await fh.read(head, 0, 64, 0);
  } finally {
    await fh.close();
  }
  if (head.length < 2 || head.readUInt16LE(0) !== 0x5a4d) {
    throw new Error('Not a valid PE file: missing MZ signature');
  }

  const id = uuidv4();
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
  return (await store.readMeta(config.WORK_DIR, id)) as AnalysisMeta;
}

// ── Lightweight analysis phase ─────────────────────────────────────────────────

interface LightweightResult {
  profile: BinaryProfile;
  strings: ExtractedString[];
}

export async function runLightweightAnalysis(
  config: AppConfig,
  id: string,
): Promise<LightweightResult> {
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
  const sha256 = computeSha256(buf);

  // Update sha256 in meta
  const meta = await store.readMeta(config.WORK_DIR, id);
  if (meta) {
    meta.sha256 = sha256;
    await store.writeMeta(config.WORK_DIR, meta);
  }

  let parseResult;
  try {
    parseResult = parsePe(buf, sha256);
  } catch (err: unknown) {
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
  const profile: BinaryProfile = {
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

  const strings = extractStrings(buf, config.MAX_STRINGS);
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

export async function skipRemainingPhases(
  config: AppConfig,
  id: string,
  reason: string,
): Promise<void> {
  const remainingPhases = ['ghidra-analysis', 'correlating', 'inferring', 'reconstructing', 'reporting'] as const;
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
export async function runGhidraPhase(
  config: AppConfig,
  id: string,
): Promise<import('../ghidra/validator.js').GhidraRawOutput | null> {
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
    const result = await ghidraQueue.add(() =>
      runGhidra({
        config,
        analysisId: id,
        binaryPath,
        outputJsonPath,
        projectDir,
        scriptPath: GHIDRA_SCRIPT_PATH,
        stdoutLogPath,
        stderrLogPath,
      }),
    );

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
    const ghidraOutput = await validateGhidraOutput(outputJsonPath);

    const ghidraEnd = new Date().toISOString();
    await store.updatePhase(config.WORK_DIR, id, 'ghidra-analysis', {
      status: 'completed',
      completedAt: ghidraEnd,
      durationMs: result.durationMs,
    });

    logger.info(
      { id, functionCount: ghidraOutput.functions.length, durationMs: result.durationMs },
      'Ghidra phase complete',
    );
    return ghidraOutput;

  } catch (err: unknown) {
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
export async function runPipeline(config: AppConfig, id: string): Promise<void> {
  try {
    const { profile, strings } = await runLightweightAnalysis(config, id);

    // ── Ghidra phase ──────────────────────────────────────────────────────────
    const ghidraOutput = await runGhidraPhase(config, id);

    // ── Evidence building phase (correlating) ─────────────────────────────────
    // Dynamically import to avoid circular deps at module load time
    const { buildEvidenceStore } = await import('../evidence/normalizer.js');
    const { normalizeCallEdges } = await import('../evidence/callEdgeNormalizer.js');
    const { buildFunctionProfiles } = await import('../evidence/functionProfiles.js');

    const ghidraCorrelateStart = new Date().toISOString();
    await store.updatePhase(config.WORK_DIR, id, 'correlating', {
      status: 'running',
      startedAt: ghidraCorrelateStart,
    });

    const evidence = buildEvidenceStore(profile, strings, ghidraOutput ?? undefined);
    await store.writeRawJson(store.rawEvidencePath(config.WORK_DIR, id), evidence);

    let functionProfiles: import('../../shared/types.js').FunctionProfile[] = [];
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

    const { runInferenceEngine } = await import('../inference/engine.js');
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

    const { buildCandidateResponsibilities } = await import('../reconstruction/candidateBuilder.js');
    const { buildExternalInteractions } = await import('../reconstruction/externalsBuilder.js');
    const { buildUnknowns } = await import('../reconstruction/unknownsBuilder.js');

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

    const { buildModernizationRecommendations, buildCanonicalResult, generateMarkdownReport, generateHtmlReport } =
      await import('../reporting/index.js');

    const modernization = buildModernizationRecommendations(candidates, unknowns, inferences);
    const coverage = {
      peParser: true,
      strings: true,
      ghidra: ghidraOutput !== null,
      ghidraError: meta ? meta.phases.find(p => p.phase === 'ghidra-analysis')?.error : undefined,
    };

    const canonicalResult = buildCanonicalResult({
      meta: meta!,
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

    // Write canonical result + reports
    await store.writeRawJson(store.canonicalResultPath(config.WORK_DIR, id), canonicalResult);

    const mdReport = generateMarkdownReport(canonicalResult);
    const htmlReport = generateHtmlReport(canonicalResult);

    await fs.writeFile(
      path.join(store.resultDir(config.WORK_DIR, id), 'report.md'),
      mdReport,
      'utf8',
    );
    await fs.writeFile(
      path.join(store.resultDir(config.WORK_DIR, id), 'report.html'),
      htmlReport,
      'utf8',
    );

    const reportEnd = new Date().toISOString();
    await store.updatePhase(config.WORK_DIR, id, 'reporting', {
      status: 'completed',
      completedAt: reportEnd,
      durationMs: Date.parse(reportEnd) - Date.parse(reportStart),
    });

    // Set final status
    if (ghidraOutput) {
      await store.updateStatus(config.WORK_DIR, id, 'completed');
    } else {
      await store.updateStatus(config.WORK_DIR, id, 'partial',
        config.GHIDRA_HOME
          ? 'Ghidra analysis failed — partial result (PE + strings only)'
          : 'GHIDRA_HOME not configured — partial result (PE + strings only)',
      );
    }

    logger.info({ id }, 'Pipeline complete');

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ id, err: msg }, 'Pipeline error');
    await store.updateStatus(config.WORK_DIR, id, 'failed', msg).catch(() => undefined);
  }
}

// ── Diagnostics ───────────────────────────────────────────────────────────────

export interface DiagnosticsResult {
  node: string;
  platform: string;
  workDir: string;
  workDirAccessible: boolean;
  ghidra: { status: 'unchecked' | 'available' | 'unavailable'; reason?: string };
  java: { status: 'unchecked' | 'available' | 'unavailable'; reason?: string };
}

export async function getDiagnostics(config: AppConfig): Promise<DiagnosticsResult> {
  let workDirAccessible = false;
  try {
    await fs.access(config.WORK_DIR);
    workDirAccessible = true;
  } catch {
    try {
      await fs.mkdir(config.WORK_DIR, { recursive: true });
      workDirAccessible = true;
    } catch {
      workDirAccessible = false;
    }
  }

  // Check Ghidra availability
  let ghidra: DiagnosticsResult['ghidra'] = { status: 'unchecked' };
  let java: DiagnosticsResult['java'] = { status: 'unchecked' };

  if (config.GHIDRA_HOME) {
    try {
      detectLauncher(config.GHIDRA_HOME);
      ghidra = { status: 'available' };
    } catch (err) {
      ghidra = { status: 'unavailable', reason: err instanceof Error ? err.message : String(err) };
    }

    const javaInfo = await detectJava();
    if (javaInfo.compatible) {
      java = { status: 'available' };
    } else {
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
