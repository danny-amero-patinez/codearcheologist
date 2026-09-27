/**
 * Express application factory.
 *
 * Wires together middleware, routers, and error handling.
 */
import * as path from 'path';
import express, { type Express } from 'express';
import cors from 'cors';
import { type AppConfig } from '../config/config.js';
import { healthRouter } from './routes/health.js';
import { analysesRouter } from './routes/analyses.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

export function createApp(config: AppConfig): Express {
  const app = express();

  // Allow requests from the Astro frontend on any localhost port (dev + preview).
  // In production the frontend is served by this same Express instance, so
  // same-origin requests need no CORS header — the list below covers local dev.
  app.use(cors({
    origin: [
      'http://localhost:4321',
      'http://localhost:4322',
      'http://127.0.0.1:4321',
      'http://127.0.0.1:4322',
    ],
    methods: ['GET', 'POST'],
  }));

  app.use(express.json());
  app.use(requestLogger);

  // Routes
  app.use('/api/v1', healthRouter(config));
  app.use('/api/v1/analyses', analysesRouter(config));

  // Serve the compiled Astro frontend from <appRoot>/public/.
  // In production (container) the Dockerfile copies frontend/dist → /app/public/.
  // In local dev this directory may not exist; Express silently skips missing roots.
  const frontendDir = path.resolve(__dirname, '..', '..', 'public');
  app.use(express.static(frontendDir));

  // SPA fallback: serve index.html for any unmatched GET so client-side routing works.
  app.get('*', (_req, res, next) => {
    const indexPath = path.join(frontendDir, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) next(); // no index.html (dev mode) — fall through to 404
    });
  });

  // Centralized error handler — must be last
  app.use(errorHandler);

  return app;
}
