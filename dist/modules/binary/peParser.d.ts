import { type BinaryProfile } from '../../shared/types.js';
interface RawSection {
    name: string;
    virtualAddress: number;
    virtualSize: number;
    rawOffset: number;
    rawSize: number;
    characteristics: number;
}
export interface ParseResult {
    profile: Omit<BinaryProfile, 'originalFilename' | 'storedFilename'>;
    rawSections: RawSection[];
}
export declare function parsePe(buf: Buffer, sha256: string): ParseResult;
export declare function computeSha256(buf: Buffer): string;
export {};
//# sourceMappingURL=peParser.d.ts.map