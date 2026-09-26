/**
 * HTTP request logger middleware.
 */
import { type Request, type Response, type NextFunction } from 'express';
import { createLogger } from '../../shared/logger.js';

const logger = createLogger('http');

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - start,
      },
      'request',
    );
  });
  next();
}
