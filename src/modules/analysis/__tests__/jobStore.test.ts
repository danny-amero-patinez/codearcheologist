/**
 * Job store unit tests.
 *
 * Tests use a temporary directory, cleaned up after each test.
 */
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import {
  createJob,
  readMeta,
  writeMeta,
  updateStatus,
  updatePhase,
  isValidId,
  jobDir,
  inputDir,
  rawDir,
  resultDir,
} from '../../../modules/analysis/jobStore';
import { type AnalysisMeta } from '../../../shared/types';

function makeTestMeta(id: string): AnalysisMeta {
  const now = new Date().toISOString();
  return {
    id,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    originalFilename: 'test.exe',
    storedFilename: 'binary.exe',
    fileSizeBytes: 1024,
    sha256: 'abc123',
    phases: [
      { phase: 'intake',          status: 'pending' },
      { phase: 'profiling',       status: 'pending' },
      { phase: 'extracting',      status: 'pending' },
      { phase: 'ghidra-analysis', status: 'pending' },
      { phase: 'correlating',     status: 'pending' },
      { phase: 'inferring',       status: 'pending' },
      { phase: 'reconstructing',  status: 'pending' },
      { phase: 'reporting',       status: 'pending' },
    ],
  };
}

describe('isValidId', () => {
  test('accepts valid UUID v4', () => {
    expect(isValidId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
  });

  test('rejects path traversal attempts', () => {
    expect(isValidId('../etc/passwd')).toBe(false);
    expect(isValidId('../../secret')).toBe(false);
    expect(isValidId('abc/def')).toBe(false);
  });

  test('rejects short strings', () => {
    expect(isValidId('abc')).toBe(false);
    expect(isValidId('')).toBe(false);
  });

  test('rejects strings with null bytes', () => {
    expect(isValidId('a1b2c3d4-e5f6-7890-abcd-ef123456\x0090')).toBe(false);
  });
});

describe('jobStore filesystem operations', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ca-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('createJob creates required directory structure', async () => {
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const meta = makeTestMeta(id);
    await createJob(tmpDir, meta);

    const dirs = [jobDir(tmpDir, id), inputDir(tmpDir, id), rawDir(tmpDir, id), resultDir(tmpDir, id)];
    for (const d of dirs) {
      const stat = await fs.stat(d);
      expect(stat.isDirectory()).toBe(true);
    }
  });

  test('readMeta returns null for non-existent analysis', async () => {
    const result = await readMeta(tmpDir, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    expect(result).toBeNull();
  });

  test('writeMeta and readMeta round-trip', async () => {
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const meta = makeTestMeta(id);
    await createJob(tmpDir, meta);

    const read = await readMeta(tmpDir, id);
    expect(read).not.toBeNull();
    expect(read?.id).toBe(id);
    expect(read?.status).toBe('queued');
    expect(read?.originalFilename).toBe('test.exe');
  });

  test('updateStatus persists new status', async () => {
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    await createJob(tmpDir, makeTestMeta(id));
    await updateStatus(tmpDir, id, 'extracting');

    const meta = await readMeta(tmpDir, id);
    expect(meta?.status).toBe('extracting');
  });

  test('updatePhase persists phase update', async () => {
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    await createJob(tmpDir, makeTestMeta(id));
    await updatePhase(tmpDir, id, 'intake', { status: 'completed', durationMs: 42 });

    const meta = await readMeta(tmpDir, id);
    const intake = meta?.phases.find(p => p.phase === 'intake');
    expect(intake?.status).toBe('completed');
    expect(intake?.durationMs).toBe(42);
  });

  test('uses the same ID for directory and meta', async () => {
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    await createJob(tmpDir, makeTestMeta(id));

    const meta = await readMeta(tmpDir, id);
    expect(meta?.id).toBe(id);

    // The work directory must use the same ID
    const dir = jobDir(tmpDir, id);
    const stat = await fs.stat(dir);
    expect(stat.isDirectory()).toBe(true);
  });
});
