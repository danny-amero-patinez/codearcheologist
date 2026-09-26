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
import { Router, type Request, type Response, type NextFunction } from 'express';
import * as fs from 'fs/promises';
import { type AppConfig } from '../../config/config.js';
import { intake, runPipeline, store } from '../../modules/analysis/index.js';
import { createUploadMiddleware } from '../middleware/upload.js';
import { NotFoundError, ValidationError, UnprocessableError } from '../../shared/errors.js';
import { createLogger } from '../../shared/logger.js';
import { type CanonicalResult } from '../../shared/types.js';
import { generateMarkdownReport, generateHtmlReport } from '../../modules/reporting/index.js';

const logger = createLogger('analysesRoute');

export function analysesRouter(config: AppConfig): Router {
  const router = Router();
  const upload = createUploadMiddleware(config);

  // ── POST /api/v1/analyses/binary ──────────────────────────────────────────

  router.post(
    '/binary',
    upload.single('file'),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.file) {
          throw new ValidationError('No file uploaded. Use multipart/form-data with field name "file".');
        }

        const originalFilename = req.file.originalname ?? 'unknown.bin';

        // SAFETY: req.file.path is the temp path Multer wrote.
        // We move the bytes to the job directory — NEVER execute them.
        let meta;
        try {
          meta = await intake(config, req.file.path, originalFilename);
        } catch (err: unknown) {
          // Clean up temp file on intake failure
          await fs.unlink(req.file.path).catch(() => undefined);
          const msg = err instanceof Error ? err.message : String(err);
          throw new UnprocessableError(`Binary intake failed: ${msg}`);
        }

        // Clean up Multer temp file (already copied to job dir)
        await fs.unlink(req.file.path).catch(() => undefined);

        // Fire-and-forget pipeline (asynchronous)
        runPipeline(config, meta.id).catch((err: unknown) => {
          logger.error({ id: meta.id, err }, 'Pipeline error (background)');
        });

        logger.info({ id: meta.id, originalFilename }, 'Analysis created');

        res.status(202).json({ analysis: meta });
      } catch (err) {
        next(err);
      }
    },
  );

  // ── GET /api/v1/analyses/:id ──────────────────────────────────────────────

  router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || !store.isValidId(id)) throw new ValidationError('Invalid analysis ID format');

      const meta = await store.readMeta(config.WORK_DIR, id);
      if (!meta) throw new NotFoundError(`Analysis ${id}`);

      res.json({ analysis: meta });
    } catch (err) {
      next(err);
    }
  });

  // ── GET /api/v1/analyses/:id/result ──────────────────────────────────────

  router.get('/:id/result', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || !store.isValidId(id)) throw new ValidationError('Invalid analysis ID format');

      const meta = await store.readMeta(config.WORK_DIR, id);
      if (!meta) throw new NotFoundError(`Analysis ${id}`);

      if (meta.status === 'queued' || meta.status === 'preparing' ||
          meta.status === 'extracting' || meta.status === 'decompiling' ||
          meta.status === 'correlating' || meta.status === 'reporting') {
        res.status(202).json({ analysis: meta, result: null, message: 'Analysis in progress' });
        return;
      }

      const result = await store.readRawJson(store.canonicalResultPath(config.WORK_DIR, id));
      if (!result) {
        // Return partial meta if result not yet written
        res.json({ analysis: meta, result: null });
        return;
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  // ── GET /api/v1/analyses/:id/evidence/:evidenceId ─────────────────────────

  router.get('/:id/evidence/:evidenceId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || !store.isValidId(id)) throw new ValidationError('Invalid analysis ID format');

      const meta = await store.readMeta(config.WORK_DIR, id);
      if (!meta) throw new NotFoundError(`Analysis ${id}`);

      // TODO Milestone 3: look up individual evidence by evidenceId from normalised store
      res.status(501).json({
        error: { code: 'NOT_IMPLEMENTED', message: 'Evidence lookup available in Milestone 3' },
      });
    } catch (err) {
      next(err);
    }
  });

  // ── GET /api/v1/analyses/:id/report ──────────────────────────────────────

  router.get('/:id/report', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id || !store.isValidId(id)) throw new ValidationError('Invalid analysis ID format');

      const meta = await store.readMeta(config.WORK_DIR, id);
      if (!meta) throw new NotFoundError(`Analysis ${id}`);

      if (meta.status === 'queued' || meta.status === 'preparing' ||
          meta.status === 'extracting' || meta.status === 'decompiling' ||
          meta.status === 'correlating' || meta.status === 'reporting') {
        res.status(202).json({ analysis: meta, result: null, message: 'Analysis in progress' });
        return;
      }

      const result = await store.readRawJson<CanonicalResult>(store.canonicalResultPath(config.WORK_DIR, id));
      if (!result) {
        res.status(404).json({ error: { code: 'RESULT_NOT_FOUND', message: 'No result available for this analysis yet' } });
        return;
      }

      const format = typeof req.query['format'] === 'string' ? req.query['format'] : 'json';

      if (format === 'markdown') {
        const md = generateMarkdownReport(result);
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.send(md);
      } else if (format === 'html') {
        const html = generateHtmlReport(result);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        // Force browser download rather than opening in the current tab
        res.setHeader('Content-Disposition', `attachment; filename="report-${id}.html"`);
        res.send(html);
      } else {
        // Default: json
        res.json(result);
      }
    } catch (err) {
      next(err);
    }
  });

  return router;
}
