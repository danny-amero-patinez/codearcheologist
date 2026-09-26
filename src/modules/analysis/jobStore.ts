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
import * as fs from 'fs/promises';
import * as path from 'path';
import { type AnalysisMeta, type AnalysisStatus, type AnalysisPhase, type PhaseRecord } from '../../shared/types.js';
import { createLogger } from '../../shared/logger.js';

const logger = createLogger('jobStore');

// ── Path helpers ──────────────────────────────────────────────────────────────

export function jobDir(workDir: string, id: string): string {
  return path.join(workDir, id);
}

export function inputDir(workDir: string, id: string): string {
  return path.join(jobDir(workDir, id), 'input');
}

export function rawDir(workDir: string, id: string): string {
  return path.join(jobDir(workDir, id), 'raw');
}

export function resultDir(workDir: string, id: string): string {
  return path.join(jobDir(workDir, id), 'result');
}

export function ghidraProjectDir(workDir: string, id: string): string {
  return path.join(jobDir(workDir, id), 'ghidra-project');
}

export function inputBinaryPath(workDir: string, id: string): string {
  return path.join(inputDir(workDir, id), 'binary.exe');
}

export function metaPath(workDir: string, id: string): string {
  return path.join(jobDir(workDir, id), 'meta.json');
}

export function rawPePath(workDir: string, id: string): string {
  return path.join(rawDir(workDir, id), 'pe.json');
}

export function rawStringsPath(workDir: string, id: string): string {
  return path.join(rawDir(workDir, id), 'strings.json');
}

export function rawGhidraPath(workDir: string, id: string): string {
  return path.join(rawDir(workDir, id), 'ghidra.json');
}

export function ghidraStdoutLogPath(workDir: string, id: string): string {
  return path.join(rawDir(workDir, id), 'ghidra.stdout.log');
}

export function ghidraStderrLogPath(workDir: string, id: string): string {
  return path.join(rawDir(workDir, id), 'ghidra.stderr.log');
}

export function rawEvidencePath(workDir: string, id: string): string {
  return path.join(rawDir(workDir, id), 'evidence.json');
}

export function rawFunctionProfilesPath(workDir: string, id: string): string {
  return path.join(rawDir(workDir, id), 'functionProfiles.json');
}

export function canonicalResultPath(workDir: string, id: string): string {
  return path.join(resultDir(workDir, id), 'analysis.json');
}

// ── ID validation ─────────────────────────────────────────────────────────────
// Guard against path traversal. Analysis IDs must be UUID v4 format.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidId(id: string): boolean {
  return UUID_RE.test(id);
}

// ── Job creation ──────────────────────────────────────────────────────────────

export async function createJob(workDir: string, meta: AnalysisMeta): Promise<void> {
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

export async function writeMeta(workDir: string, meta: AnalysisMeta): Promise<void> {
  await fs.writeFile(metaPath(workDir, meta.id), JSON.stringify(meta, null, 2), 'utf8');
}

export async function readMeta(workDir: string, id: string): Promise<AnalysisMeta | null> {
  const p = metaPath(workDir, id);
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw) as AnalysisMeta;
  } catch {
    // File not found, directory not found, or corrupt JSON — treat as not found
    return null;
  }
}

export async function updateStatus(
  workDir: string,
  id: string,
  status: AnalysisStatus,
  errorMessage?: string,
): Promise<void> {
  const meta = await readMeta(workDir, id);
  if (!meta) {
    logger.error({ id }, 'updateStatus: meta not found');
    return;
  }
  meta.status = status;
  meta.updatedAt = new Date().toISOString();
  if (errorMessage !== undefined) meta.errorMessage = errorMessage;
  await writeMeta(workDir, meta);
}

export async function updatePhase(
  workDir: string,
  id: string,
  phase: AnalysisPhase,
  update: Partial<PhaseRecord>,
): Promise<void> {
  const meta = await readMeta(workDir, id);
  if (!meta) return;
  const rec = meta.phases.find(p => p.phase === phase);
  if (rec) Object.assign(rec, update);
  meta.updatedAt = new Date().toISOString();
  await writeMeta(workDir, meta);
}

// ── Raw artifact helpers ──────────────────────────────────────────────────────

export async function writeRawJson(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function readRawJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
