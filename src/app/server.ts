/**
 * Code Archaeologist — Entry point
 *
 * Starts the Express server. Configuration is validated at startup via Zod.
 * SAFETY: This server never executes uploaded binaries. All analysis is static.
 */
import * as fs from 'fs/promises';
import { createApp } from './app.js';
import { loadConfig } from '../config/config.js';
import { createLogger } from '../shared/logger.js';

const logger = createLogger('server');

async function main(): Promise<void> {
  const config = loadConfig();

  // Ensure work directory exists
  await fs.mkdir(config.WORK_DIR, { recursive: true });

  const app = createApp(config);

  app.listen(config.PORT, config.HOST, () => {
    logger.info(
      { host: config.HOST, port: config.PORT, workDir: config.WORK_DIR },
      'Code Archaeologist API server started',
    );
  });
}

main().catch((err: unknown) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
