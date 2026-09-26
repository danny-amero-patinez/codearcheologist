/**
 * External interactions builder.
 *
 * Produces ExternalInteraction objects from inferences. Only fires when
 * evidence supports it. Always includes limitations.
 */
import { v4 as uuidv4 } from 'uuid';
import {
  type Inference,
  type Evidence,
  type ExtractedString,
  type ExternalInteraction,
} from '../../shared/types.js';

type ExternalKind = ExternalInteraction['kind'];

const RULE_TO_KIND: Record<string, ExternalKind | undefined> = {
  'filesystem-deployment': 'filesystem',
  'registry-config-persistence': 'registry',
  'windows-installation': 'registry',
  'network-communication': 'network',
  'database-interaction': 'database',
  'process-execution': 'process',
  'service-driver-lifecycle': 'service',
};

// Confidence-aware description builder.
// HIGH: strong corroborated wording.
// MEDIUM: bounded/suggestive wording.
// LOW / anything else: candidate/potential wording — never claims confirmed activity.
const KIND_DESCRIPTIONS_HIGH: Record<ExternalKind, string> = {
  filesystem: 'Static evidence strongly supports filesystem interaction through correlated filesystem APIs and path evidence.',
  registry: 'Static evidence strongly supports Windows registry interaction through correlated registry APIs and key-path evidence.',
  network: 'Static evidence strongly supports network-related functionality through correlated network APIs and endpoint evidence.',
  database: 'Static evidence strongly supports database interaction through correlated database APIs and query evidence.',
  process: 'Static evidence strongly supports external process management through correlated process-creation APIs.',
  service: 'Static evidence strongly supports Windows service or driver lifecycle management through correlated SCM APIs.',
};

const KIND_DESCRIPTIONS_MEDIUM: Record<ExternalKind, string> = {
  filesystem: 'Static evidence suggests the binary may interact with the local filesystem.',
  registry: 'Static evidence suggests the binary may read or write Windows registry values.',
  network: 'Static evidence suggests the binary may perform network communication.',
  database: 'Static evidence suggests the binary may interact with a database.',
  process: 'Static evidence suggests the binary may create or manage external processes.',
  service: 'Static evidence suggests the binary may manage Windows services or drivers.',
};

const KIND_DESCRIPTIONS_LOW: Record<ExternalKind, string> = {
  filesystem: 'Potential filesystem interaction: filesystem-related evidence is present, but corroborated API usage was not established.',
  registry: 'Potential registry interaction: registry-related evidence is present, but corroborated API usage was not established.',
  network: 'Potential network interaction: endpoint or URL evidence is present, but network API usage was not corroborated.',
  database: 'Potential database interaction: SQL or database-like strings are present, but executed database access was not established.',
  process: 'Potential process management: process-related evidence is present, but corroborated API usage was not established.',
  service: 'Potential service management: service-related evidence is present, but corroborated API usage was not established.',
};

function kindDescription(kind: ExternalKind, confidence: string): string {
  if (confidence === 'high') return KIND_DESCRIPTIONS_HIGH[kind];
  if (confidence === 'medium') return KIND_DESCRIPTIONS_MEDIUM[kind];
  return KIND_DESCRIPTIONS_LOW[kind];
}

const KIND_LIMITATIONS: Record<ExternalKind, string[]> = {
  filesystem: [
    'Static analysis cannot enumerate specific files accessed at runtime.',
    'File paths may be computed dynamically and are not recoverable statically.',
  ],
  registry: [
    'Static analysis cannot enumerate specific registry keys accessed at runtime.',
    'Registry paths may be constructed dynamically.',
  ],
  network: [
    'Static analysis cannot confirm which hosts or ports are contacted at runtime.',
    'Network payloads cannot be recovered by static analysis.',
  ],
  database: [
    'Static analysis cannot identify the database engine, connection string, or schema.',
  ],
  process: [
    'Static analysis cannot determine which processes are launched or their arguments.',
  ],
  service: [
    'Static analysis cannot confirm which service names are managed or their configurations.',
  ],
};

export function buildExternalInteractions(
  inferences: Inference[],
  evidence: Evidence[],
  _strings: ExtractedString[],
): ExternalInteraction[] {
  const seenKinds = new Set<ExternalKind>();
  const interactions: ExternalInteraction[] = [];
  const validIds = new Set(evidence.map(e => e.id));

  for (const inference of inferences) {
    const kind = RULE_TO_KIND[inference.ruleId];
    if (!kind) continue;
    if (seenKinds.has(kind)) continue;
    seenKinds.add(kind);

    const safeEvidenceIds = inference.evidenceIds.filter(id => validIds.has(id));

    interactions.push({
      id: uuidv4(),
      kind,
      description: kindDescription(kind, inference.confidence),
      confidence: inference.confidence,
      evidenceIds: safeEvidenceIds,
      limitations: KIND_LIMITATIONS[kind],
    });
  }

  return interactions;
}
