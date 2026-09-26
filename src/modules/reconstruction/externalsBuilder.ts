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

const KIND_DESCRIPTIONS: Record<ExternalKind, string> = {
  filesystem: 'The binary reads, writes, or manages files on the local filesystem.',
  registry: 'The binary reads or writes Windows registry values.',
  network: 'The binary communicates over the network.',
  database: 'The binary queries or updates a database.',
  process: 'The binary creates or manages external processes.',
  service: 'The binary installs, starts, stops, or deletes Windows services or drivers.',
};

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
      description: KIND_DESCRIPTIONS[kind],
      confidence: inference.confidence,
      evidenceIds: safeEvidenceIds,
      limitations: KIND_LIMITATIONS[kind],
    });
  }

  return interactions;
}
