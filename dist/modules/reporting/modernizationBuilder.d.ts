import { type CandidateResponsibility, type Unknown, type Inference, type ModernizationRecommendation, type ModernizationPlan } from '../../shared/types.js';
export declare function buildModernizationRecommendations(candidates: CandidateResponsibility[], _unknowns: Unknown[], _inferences: Inference[]): ModernizationRecommendation[];
/**
 * Build a plan-level ModernizationPlan from the recommendations produced.
 * Returns undefined if no supported recommendations exist.
 */
export declare function buildModernizationPlan(recommendations: ModernizationRecommendation[]): ModernizationPlan | undefined;
//# sourceMappingURL=modernizationBuilder.d.ts.map