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
export declare function detectLauncher(ghidraHome: string): LauncherInfo;
/**
 * Detects the Java version by running `java -version`.
 * Requires major version >= 21 for Ghidra 11+.
 *
 * SAFETY: Spawns `java` only with `-version` flag — NOT the uploaded binary.
 */
export declare function detectJava(): Promise<JavaInfo>;
/**
 * Reads the Ghidra version from <ghidraHome>/Ghidra/application.properties.
 * Returns undefined if the file cannot be read.
 */
export declare function getGhidraVersion(ghidraHome: string): Promise<string | undefined>;
//# sourceMappingURL=launcher.d.ts.map