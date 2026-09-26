/**
 * Structured logger factory backed by pino.
 */
import pino from 'pino';

const transport =
  process.env['NODE_ENV'] !== 'production'
    ? pino.transport({ target: 'pino-pretty', options: { colorize: true } })
    : undefined;

const rootLogger = pino(
  {
    level: process.env['LOG_LEVEL'] ?? 'info',
  },
  transport,
);

export function createLogger(name: string): pino.Logger {
  return rootLogger.child({ module: name });
}
