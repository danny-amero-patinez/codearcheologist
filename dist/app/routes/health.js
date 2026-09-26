"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = healthRouter;
/**
 * Health, diagnostics, and tools endpoints.
 *
 * GET /api/v1/health
 * GET /api/v1/diagnostics
 * GET /api/v1/tools
 */
const express_1 = require("express");
const pipeline_js_1 = require("../../modules/analysis/pipeline.js");
const index_js_1 = require("../../modules/ghidra/index.js");
function healthRouter(config) {
    const router = (0, express_1.Router)();
    router.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    router.get('/diagnostics', async (_req, res, next) => {
        try {
            const diag = await (0, pipeline_js_1.getDiagnostics)(config);
            res.json({ status: 'ok', ...diag });
        }
        catch (err) {
            next(err);
        }
    });
    router.get('/tools', async (_req, res, next) => {
        try {
            // Check Ghidra availability
            let ghidraAvailable = false;
            let ghidraVersion;
            let ghidraError;
            if (config.GHIDRA_HOME) {
                try {
                    (0, index_js_1.detectLauncher)(config.GHIDRA_HOME);
                    ghidraAvailable = true;
                    ghidraVersion = await (0, index_js_1.getGhidraVersion)(config.GHIDRA_HOME);
                }
                catch (err) {
                    ghidraError = err instanceof Error ? err.message : String(err);
                }
            }
            else {
                ghidraError = 'GHIDRA_HOME not configured';
            }
            // Check Java availability
            let javaAvailable = false;
            let javaVersion;
            let javaError;
            const javaInfo = await (0, index_js_1.detectJava)();
            javaAvailable = javaInfo.compatible;
            javaVersion = javaInfo.version !== 'unknown' ? javaInfo.version : undefined;
            if (!javaInfo.compatible) {
                javaError = javaInfo.error ?? `Java ${javaInfo.version} detected but version >= 21 required`;
            }
            res.json({
                tools: [
                    { name: 'pe-parser', available: true, description: 'PE structure, imports, exports, version info' },
                    { name: 'strings', available: true, description: 'Printable string extraction with categorisation' },
                    {
                        name: 'ghidra',
                        available: ghidraAvailable && javaAvailable,
                        description: 'Headless Ghidra — decompilation and function analysis',
                        ...(ghidraVersion !== undefined ? { version: ghidraVersion } : {}),
                        ...(ghidraError !== undefined ? { error: ghidraError } : {}),
                    },
                    {
                        name: 'java',
                        available: javaAvailable,
                        description: `JDK 21+ required for Ghidra`,
                        ...(javaVersion !== undefined ? { version: javaVersion } : {}),
                        ...(javaError !== undefined ? { error: javaError } : {}),
                    },
                ],
            });
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=health.js.map