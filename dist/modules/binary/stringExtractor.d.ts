/**
 * String extractor — extracts printable strings from a binary buffer.
 *
 * SAFETY: reads bytes only. The binary is never executed.
 *
 * Extracts both ASCII and UTF-16LE strings with offsets and categorises them.
 */
import { type ExtractedString } from '../../shared/types.js';
export declare function extractStrings(buf: Buffer, maxStrings: number): ExtractedString[];
//# sourceMappingURL=stringExtractor.d.ts.map