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
import * as os from 'os';
import { type AppConfig } from '../../config/config.js';

export function createUploadMiddleware(config: AppConfig): multer.Multer {
  return multer({
    dest: os.tmpdir(),
    limits: {
      fileSize: config.MAX_BINARY_BYTES,
      files: 1,
    },
    // Accept any file — PE validation is done by byte inspection in the parser
    fileFilter: (_req, _file, cb) => cb(null, true),
  });
}
