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
import { Router } from 'express';
import { type AppConfig } from '../../config/config.js';
export declare function analysesRouter(config: AppConfig): Router;
//# sourceMappingURL=analyses.d.ts.map