/**
 * Express application factory.
 *
 * Wires together middleware, routers, and error handling.
 */
import express, { type Express } from 'express';
import { type AppConfig } from '../config/config.js';
import { healthRouter } from './routes/health.js';
import { analysesRouter } from './routes/analyses.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

export function createApp(config: AppConfig): Express {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  // Routes
  app.use('/api/v1', healthRouter(config));
  app.use('/api/v1/analyses', analysesRouter(config));

  // Centralized error handler — must be last
  app.use(errorHandler);

  return app;
}
