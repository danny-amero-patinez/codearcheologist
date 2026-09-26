/**
 * Binary module public API.
 *
 * SAFETY: This module reads bytes ONLY. The binary is never executed.
 */
export { parsePe, computeSha256 } from './peParser.js';
export { extractStrings } from './stringExtractor.js';
