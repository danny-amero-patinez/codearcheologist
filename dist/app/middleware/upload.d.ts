/**
 * Multer upload configuration.
 *
 * SAFETY: Multer stores the file to a temp path on disk.
 * The temp file is later moved into the job input directory.
 * The uploaded binary is NEVER executed.
 *
 * Security:
 * - MAX_BINARY_BYTES enforced via Multer limits (prevents disk exhaustion)
 * - Files are stored with generated names, not user-supplied names
 * - User-supplied filename is recorded for display only
 */
import multer from 'multer';
import { type AppConfig } from '../../config/config.js';
export declare function createUploadMiddleware(config: AppConfig): multer.Multer;
//# sourceMappingURL=upload.d.ts.map