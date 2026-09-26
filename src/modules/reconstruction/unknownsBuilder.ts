/**
 * Unknowns builder.
 *
 * Produces actionable Unknown items from inferences and binary profile.
 * Each unknown captures what is missing and how it could be resolved.
 */
import { v4 as uuidv4 } from 'uuid';
import {
  type Inference,
  type BinaryProfile,
  type Unknown,
} from '../../shared/types.js';

interface UnknownTemplate {
  question: string;
  whyItMatters: string;
  missingEvidence: string;
  howToResolve: string[];
}

const RULE_UNKNOWNS: Record<string, UnknownTemplate> = {
  'database-interaction': {
    question: 'Which database engine is used?',
    whyItMatters: 'Replacement requires knowing the database technology, schema, and query patterns.',
    missingEvidence: 'No database engine identifier string or connection string was found in static analysis.',
    howToResolve: [
      'Run the binary in a monitored environment and capture ODBC or network database traffic.',
      'Search for DSN= or Driver={ connection string fragments in configuration files.',
      'Check application configuration files (.ini, .xml, .config) for database settings.',
    ],
  },
  'network-communication': {
    question: 'Which server or endpoint is contacted?',
    whyItMatters: 'Replacement requires knowledge of all external dependencies and authentication mechanisms.',
    missingEvidence: 'No concrete hostname or IP address was statically recoverable from code paths.',
    howToResolve: [
      'Run the binary in a network-monitored sandbox and capture DNS queries and TCP connections.',
      'Inspect configuration files and registry entries for URL or hostname settings.',
      'Check embedded string literals for URL patterns.',
    ],
  },
  'process-execution': {
    question: 'Which process or executable is launched, and for what purpose?',
    whyItMatters: 'Process dependencies must be documented before replacement to avoid missing capabilities.',
    missingEvidence: 'The specific executable path or command line is not statically deterministic.',
    howToResolve: [
      'Run the binary in a process-monitored sandbox and capture child process creation events.',
      'Search for embedded executable names and command-line argument patterns in strings.',
    ],
  },
  'service-driver-lifecycle': {
    question: 'Which service or driver name is managed?',
    whyItMatters: 'Service names and configurations must be documented for replacement or migration.',
    missingEvidence: 'Service name strings were not conclusively matched to SCM API call sites.',
    howToResolve: [
      'Run the binary and monitor Service Control Manager calls using Process Monitor.',
      'Search for service name strings adjacent to SCM API call sites in disassembly.',
    ],
  },
  'authentication-credentials': {
    question: 'How are credentials stored and transmitted?',
    whyItMatters: 'Security assessment and replacement require understanding credential handling.',
    missingEvidence: 'Credential storage mechanism (registry, file, memory) not determined statically.',
    howToResolve: [
      'Audit credential API usage (CredWrite, CredRead) in disassembly.',
      'Monitor registry and file access for credential storage patterns.',
    ],
  },
  'cryptographic-operations': {
    question: 'What data is encrypted, and with which algorithm and key management approach?',
    whyItMatters: 'Cryptographic replacement requires understanding algorithm, mode, and key lifecycle.',
    missingEvidence: 'Algorithm and key management cannot be fully determined from API imports alone.',
    howToResolve: [
      'Examine CryptAcquireContextW call sites to identify provider and algorithm identifiers.',
      'Search for CALG_ constants and BCrypt algorithm identifier strings.',
      'Dynamic analysis would reveal runtime key usage.',
    ],
  },
};

export function buildUnknowns(
  inferences: Inference[],
  _profile: BinaryProfile,
): Unknown[] {
  const unknowns: Unknown[] = [];
  const seen = new Set<string>();

  for (const inference of inferences) {
    const template = RULE_UNKNOWNS[inference.ruleId];
    if (!template) continue;
    if (seen.has(inference.ruleId)) continue;
    seen.add(inference.ruleId);

    unknowns.push({
      id: uuidv4(),
      question: template.question,
      whyItMatters: template.whyItMatters,
      missingEvidence: template.missingEvidence,
      howToResolve: template.howToResolve,
    });
  }

  return unknowns;
}
