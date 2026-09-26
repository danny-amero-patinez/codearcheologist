/**
 * Canonical result builder.
 *
 * Assembles the full CanonicalResult shape from all pipeline outputs.
 * This is the single source of truth for reports — markdown and HTML
 * are DERIVED from this, never independently computed.
 */
import { type AnalysisMeta, type BinaryProfile, type ToolCoverage, type Evidence, type FunctionProfile, type Inference, type CandidateResponsibility, type ExternalInteraction, type Unknown, type ModernizationRecommendation, type ExtractedString, type CanonicalResult } from '../../shared/types.js';
interface BuildCanonicalResultParams {
    meta: AnalysisMeta;
    profile: BinaryProfile;
    coverage: ToolCoverage;
    evidence: Evidence[];
    functionProfiles: FunctionProfile[];
    inferences: Inference[];
    candidates: CandidateResponsibility[];
    externals: ExternalInteraction[];
    unknowns: Unknown[];
    modernization: ModernizationRecommendation[];
    strings: ExtractedString[];
}
export declare function buildCanonicalResult(params: BuildCanonicalResultParams): CanonicalResult;
export {};
//# sourceMappingURL=resultBuilder.d.ts.map