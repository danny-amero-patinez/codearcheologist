import { type Evidence, type FunctionProfile, type ImportEntry, type ExtractedString, type Inference } from '../../shared/types.js';
export interface EvidenceContext {
    evidence: Evidence[];
    functionProfiles: FunctionProfile[];
    imports: ImportEntry[];
    strings: ExtractedString[];
}
export interface InferenceRule {
    id: string;
    evaluate(ctx: EvidenceContext): Inference[];
}
export declare const windowsInstallationRule: InferenceRule;
export declare const registryConfigPersistenceRule: InferenceRule;
export declare const serviceDriverLifecycleRule: InferenceRule;
export declare const filesystemDeploymentRule: InferenceRule;
export declare const processExecutionRule: InferenceRule;
export declare const networkCommunicationRule: InferenceRule;
export declare const databaseInteractionRule: InferenceRule;
export declare const authenticationCredentialsRule: InferenceRule;
export declare const cryptographicOperationsRule: InferenceRule;
export declare const ALL_RULES: InferenceRule[];
//# sourceMappingURL=rules.d.ts.map