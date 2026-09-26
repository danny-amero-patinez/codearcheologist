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
exports.analysesRouter = analysesRouter;
/**
 * Analysis endpoints.
 *
 * POST   /api/v1/analyses/binary
 * GET    /api/v1/analyses/:id
 * GET    /api/v1/analyses/:id/result
 * GET    /api/v1/analyses/:id/evidence/:evidenceId
 * GET    /api/v1/analyses/:id/report?format=json|markdown|html
 *
 * Security:
 * - Analysis IDs are validated as UUID v4 before any file-system access
 * - Path traversal is prevented by UUID validation + path.join to a fixed base
 */
const express_1 = require("express");
const fs = __importStar(require("fs/promises"));
const index_js_1 = require("../../modules/analysis/index.js");
const upload_js_1 = require("../middleware/upload.js");
const errors_js_1 = require("../../shared/errors.js");
const logger_js_1 = require("../../shared/logger.js");
const index_js_2 = require("../../modules/reporting/index.js");
const logger = (0, logger_js_1.createLogger)('analysesRoute');
function analysesRouter(config) {
    const router = (0, express_1.Router)();
    const upload = (0, upload_js_1.createUploadMiddleware)(config);
    // ── POST /api/v1/analyses/binary ──────────────────────────────────────────
    router.post('/binary', upload.single('file'), async (req, res, next) => {
        try {
            if (!req.file) {
                throw new errors_js_1.ValidationError('No file uploaded. Use multipart/form-data with field name "file".');
            }
            const originalFilename = req.file.originalname ?? 'unknown.bin';
            // SAFETY: req.file.path is the temp path Multer wrote.
            // We move the bytes to the job directory — NEVER execute them.
            let meta;
            try {
                meta = await (0, index_js_1.intake)(config, req.file.path, originalFilename);
            }
            catch (err) {
                // Clean up temp file on intake failure
                await fs.unlink(req.file.path).catch(() => undefined);
                const msg = err instanceof Error ? err.message : String(err);
                throw new errors_js_1.UnprocessableError(`Binary intake failed: ${msg}`);
            }
            // Clean up Multer temp file (already copied to job dir)
            await fs.unlink(req.file.path).catch(() => undefined);
            // Fire-and-forget pipeline (asynchronous)
            (0, index_js_1.runPipeline)(config, meta.id).catch((err) => {
                logger.error({ id: meta.id, err }, 'Pipeline error (background)');
            });
            logger.info({ id: meta.id, originalFilename }, 'Analysis created');
            res.status(202).json({ analysis: meta });
        }
        catch (err) {
            next(err);
        }
    });
    // ── GET /api/v1/analyses/:id ──────────────────────────────────────────────
    router.get('/:id', async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!id || !index_js_1.store.isValidId(id))
                throw new errors_js_1.ValidationError('Invalid analysis ID format');
            const meta = await index_js_1.store.readMeta(config.WORK_DIR, id);
            if (!meta)
                throw new errors_js_1.NotFoundError(`Analysis ${id}`);
            res.json({ analysis: meta });
        }
        catch (err) {
            next(err);
        }
    });
    // ── GET /api/v1/analyses/:id/result ──────────────────────────────────────
    router.get('/:id/result', async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!id || !index_js_1.store.isValidId(id))
                throw new errors_js_1.ValidationError('Invalid analysis ID format');
            const meta = await index_js_1.store.readMeta(config.WORK_DIR, id);
            if (!meta)
                throw new errors_js_1.NotFoundError(`Analysis ${id}`);
            if (meta.status === 'queued' || meta.status === 'preparing' ||
                meta.status === 'extracting' || meta.status === 'decompiling' ||
                meta.status === 'correlating' || meta.status === 'reporting') {
                res.status(202).json({ analysis: meta, result: null, message: 'Analysis in progress' });
                return;
            }
            const result = await index_js_1.store.readRawJson(index_js_1.store.canonicalResultPath(config.WORK_DIR, id));
            if (!result) {
                // Return partial meta if result not yet written
                res.json({ analysis: meta, result: null });
                return;
            }
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    });
    // ── GET /api/v1/analyses/:id/evidence/:evidenceId ─────────────────────────
    router.get('/:id/evidence/:evidenceId', async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!id || !index_js_1.store.isValidId(id))
                throw new errors_js_1.ValidationError('Invalid analysis ID format');
            const meta = await index_js_1.store.readMeta(config.WORK_DIR, id);
            if (!meta)
                throw new errors_js_1.NotFoundError(`Analysis ${id}`);
            // TODO Milestone 3: look up individual evidence by evidenceId from normalised store
            res.status(501).json({
                error: { code: 'NOT_IMPLEMENTED', message: 'Evidence lookup available in Milestone 3' },
            });
        }
        catch (err) {
            next(err);
        }
    });
    // ── GET /api/v1/analyses/:id/report ──────────────────────────────────────
    router.get('/:id/report', async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!id || !index_js_1.store.isValidId(id))
                throw new errors_js_1.ValidationError('Invalid analysis ID format');
            const meta = await index_js_1.store.readMeta(config.WORK_DIR, id);
            if (!meta)
                throw new errors_js_1.NotFoundError(`Analysis ${id}`);
            if (meta.status === 'queued' || meta.status === 'preparing' ||
                meta.status === 'extracting' || meta.status === 'decompiling' ||
                meta.status === 'correlating' || meta.status === 'reporting') {
                res.status(202).json({ analysis: meta, result: null, message: 'Analysis in progress' });
                return;
            }
            const result = await index_js_1.store.readRawJson(index_js_1.store.canonicalResultPath(config.WORK_DIR, id));
            if (!result) {
                res.status(404).json({ error: { code: 'RESULT_NOT_FOUND', message: 'No result available for this analysis yet' } });
                return;
            }
            const format = typeof req.query['format'] === 'string' ? req.query['format'] : 'json';
            if (format === 'markdown') {
                const md = (0, index_js_2.generateMarkdownReport)(result);
                res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
                res.send(md);
            }
            else if (format === 'html') {
                const html = (0, index_js_2.generateHtmlReport)(result);
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.send(html);
            }
            else {
                // Default: json
                res.json(result);
            }
        }
        catch (err) {
            next(err);
        }
    });
    return router;
}
//# sourceMappingURL=analyses.js.map