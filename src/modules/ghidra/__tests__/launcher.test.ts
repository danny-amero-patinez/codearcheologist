/**
 * Ghidra launcher unit tests.
 *
 * detectLauncher uses existsSync internally, so we mock 'fs' for path-construction
 * tests. detectJava mocks child_process.spawn to avoid requiring a real JDK.
 */
import * as path from 'path';
import { EventEmitter } from 'events';

// ── detectLauncher ─────────────────────────────────────────────────────────────

// We mock the 'fs' module used inside launcher.ts (via require('fs').existsSync)
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fsMock = require('fs') as { existsSync: jest.Mock };

// We mock child_process.spawn for detectJava tests
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cpMock = require('child_process') as { spawn: jest.Mock };

import { detectLauncher, detectJava } from '../../../modules/ghidra/launcher';

// ── Path construction tests ────────────────────────────────────────────────────

describe('detectLauncher — path construction', () => {
  const GHIDRA_HOME = '/opt/ghidra_11.0';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Windows: resolves analyzeHeadless.bat under support/', () => {
    const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    fsMock.existsSync.mockReturnValue(true);

    const result = detectLauncher(GHIDRA_HOME);

    expect(result.platform).toBe('windows');
    expect(result.launcherPath).toContain('analyzeHeadless.bat');
    expect(result.launcherPath).toContain('support');

    Object.defineProperty(process, 'platform', originalPlatform ?? { value: process.platform, configurable: true });
  });

  test('Linux: resolves analyzeHeadless (no extension) under support/', () => {
    const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    fsMock.existsSync.mockReturnValue(true);

    const result = detectLauncher(GHIDRA_HOME);

    expect(result.platform).toBe('linux');
    expect(result.launcherPath).toContain('analyzeHeadless');
    expect(result.launcherPath).not.toContain('.bat');
    expect(result.launcherPath).toContain('support');

    Object.defineProperty(process, 'platform', originalPlatform ?? { value: process.platform, configurable: true });
  });

  test('throws descriptive error when launcher file does not exist', () => {
    fsMock.existsSync.mockReturnValue(false);

    expect(() => detectLauncher('/nonexistent/ghidra')).toThrow(
      /Ghidra launcher not found/,
    );
  });

  test('throws error referencing the GHIDRA_HOME in the message', () => {
    fsMock.existsSync.mockReturnValue(false);
    const home = '/my/custom/ghidra';

    expect(() => detectLauncher(home)).toThrow(home);
  });

  test('launcher path is inside the provided ghidraHome', () => {
    fsMock.existsSync.mockReturnValue(true);
    const home = '/opt/ghidra_11.0';

    const result = detectLauncher(home);

    expect(result.launcherPath.startsWith(path.normalize(home))).toBe(true);
  });
});

// ── detectJava ─────────────────────────────────────────────────────────────────

function makeSpawnMock(stderrOutput: string, exitCode: number, emitError?: Error) {
  const proc = new EventEmitter() as NodeJS.EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: jest.Mock;
  };
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.kill = jest.fn();

  cpMock.spawn.mockReturnValue(proc);

  // Emit events on next tick to simulate async process
  setImmediate(() => {
    if (emitError) {
      proc.emit('error', emitError);
    } else {
      proc.stderr.emit('data', Buffer.from(stderrOutput));
      proc.emit('close', exitCode);
    }
  });

  return proc;
}

describe('detectJava', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns compatible=true for Java 21', async () => {
    makeSpawnMock('openjdk version "21.0.3" 2024-04-16\nOpenJDK Runtime Environment', 0);
    const result = await detectJava();
    expect(result.compatible).toBe(true);
    expect(result.version).toContain('21');
    expect(result.error).toBeUndefined();
  });

  test('returns compatible=true for Java 22', async () => {
    makeSpawnMock('openjdk version "22.0.1" 2024-06-18', 0);
    const result = await detectJava();
    expect(result.compatible).toBe(true);
  });

  test('returns compatible=false for Java 17', async () => {
    makeSpawnMock('openjdk version "17.0.10" 2024-01-16', 0);
    const result = await detectJava();
    expect(result.compatible).toBe(false);
  });

  test('returns compatible=false for Java 1.8 (old format)', async () => {
    makeSpawnMock('java version "1.8.0_391"\nJava(TM) SE Runtime Environment', 0);
    const result = await detectJava();
    expect(result.compatible).toBe(false);
  });

  test('returns compatible=false with error when java not found', async () => {
    const proc = new EventEmitter() as NodeJS.EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    cpMock.spawn.mockReturnValue(proc);

    setImmediate(() => {
      proc.emit('error', new Error('spawn java ENOENT'));
    });

    const result = await detectJava();
    expect(result.compatible).toBe(false);
    expect(result.error).toMatch(/java not found/);
  });

  test('returns compatible=false when version output is unrecognisable', async () => {
    makeSpawnMock('some unexpected output with no version info', 0);
    const result = await detectJava();
    expect(result.compatible).toBe(false);
    expect(result.error).toMatch(/Could not parse/);
  });
});
