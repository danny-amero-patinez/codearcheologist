/**
 * Ghidra launcher detection utilities.
 *
 * SAFETY: detectJava spawns `java -version` only — NOT the uploaded binary.
 *         Arguments are always passed as an array, never shell-interpolated.
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import { createLogger } from '../../shared/logger.js';

const logger = createLogger('ghidra.launcher');

export interface LauncherInfo {
  launcherPath: string;
  platform: 'windows' | 'linux';
}

export interface JavaInfo {
  version: string;
  compatible: boolean;
  error?: string;
}

/**
 * Resolves the platform-correct analyzeHeadless launcher path and validates
 * that the file exists.
 *
 * Windows: <ghidraHome>\support\analyzeHeadless.bat
 * Linux:   <ghidraHome>/support/analyzeHeadless
 */
export function detectLauncher(ghidraHome: string): LauncherInfo {
  const isWindows = process.platform === 'win32';
  const launcherPath = isWindows
    ? path.join(ghidraHome, 'support', 'analyzeHeadless.bat')
    : path.join(ghidraHome, 'support', 'analyzeHeadless');
  const platform: 'windows' | 'linux' = isWindows ? 'windows' : 'linux';

  // Synchronous existence check — called once at analysis start, not hot path
  const { existsSync } = require('fs') as typeof import('fs');
  if (!existsSync(launcherPath)) {
    throw new Error(
      `Ghidra launcher not found at ${launcherPath}. ` +
      `Verify GHIDRA_HOME="${ghidraHome}" points to a valid Ghidra installation.`,
    );
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
export function detectJava(): Promise<JavaInfo> {
  return new Promise((resolve) => {
    // java prints version info to stderr
    const proc = spawn('java', ['-version'], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    proc.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    proc.stdout?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

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
export async function getGhidraVersion(ghidraHome: string): Promise<string | undefined> {
  const propsPath = path.join(ghidraHome, 'Ghidra', 'application.properties');
  try {
    const content = await fs.readFile(propsPath, 'utf8');
    const match = content.match(/^application\.version\s*=\s*(.+)$/m);
    return match?.[1]?.trim();
  } catch {
    return undefined;
  }
}
