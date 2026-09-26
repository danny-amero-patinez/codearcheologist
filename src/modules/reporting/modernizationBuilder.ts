/**
 * Modernization recommendation builder.
 *
 * Produces evidence-backed modernization recommendations derived from
 * candidate responsibilities, unknowns, and inferences.
 * Each recommendation traces back to evidenceIds and related responsibility IDs.
 */
import { v4 as uuidv4 } from 'uuid';
import {
  type CandidateResponsibility,
  type Unknown,
  type Inference,
  type ModernizationRecommendation,
  type ModernizationPlan,
} from '../../shared/types.js';

interface RecommendationTemplate {
  priority: ModernizationRecommendation['priority'];
  title: string;
  description: string;
  rationale: string;
  steps: string[];
  artifactsToRecover: string[];
  /** Position in the investigation sequence (lower = earlier). */
  sequenceOrder: number;
}

const CATEGORY_RECOMMENDATIONS: Record<string, RecommendationTemplate> = {
  installation: {
    priority: 'high',
    title: 'Document and automate deployment process',
    description:
      'The binary contains installation logic. Before modernization, document all registry keys written, ' +
      'files deployed, and services installed. Automate equivalent deployment using a modern installer ' +
      'framework (WiX, MSIX, or scripted deployment) so the process is reproducible and auditable.',
    rationale:
      'Installation/uninstallation APIs and related strings were correlated in static evidence. ' +
      'Deployment contracts must be fully understood before the binary can be replaced.',
    steps: [
      'Enumerate registry-path and installer-string evidence already observed in this analysis.',
      'Identify installed files and services from a deployed installation.',
      'Document installer and uninstaller side effects (registry writes, file placements, service registrations).',
      'Capture the installed directory layout from a live deployment.',
      'Reproduce the deployment contract using a modern packaging mechanism only after those contracts are understood.',
    ],
    artifactsToRecover: [
      'installer packages',
      'uninstaller metadata',
      'registry export for relevant application keys',
      'installed file layout',
      'service registration details',
      'configuration files',
    ],
    sequenceOrder: 1,
  },
  service: {
    priority: 'high',
    title: 'Map service lifecycle and OS contracts',
    description:
      'The binary manages Windows service or driver lifecycle. Document the service name, startup type, ' +
      'account, and dependencies before replacement. Ensure the replacement preserves SCM contracts ' +
      'and handles service control events (stop, pause, continue) correctly.',
    rationale:
      'Service Control Manager APIs and service-related strings were correlated in static evidence. ' +
      'Service names, startup configuration, and OS contracts cannot be determined from static analysis alone.',
    steps: [
      'Identify service and driver names from a deployed installation using sc.exe or the registry.',
      'Capture SCM configuration: startup mode, account, dependencies.',
      'Document stop, start, pause, and delete behavior.',
      'Recover driver or service binaries and their associated configuration from the deployed system.',
      'Map service control event handling before designing the replacement.',
    ],
    artifactsToRecover: [
      'service registration details',
      'SCM configuration export',
      'driver or service binaries',
      'service account configuration',
      'installed file layout',
    ],
    sequenceOrder: 2,
  },
  database: {
    priority: 'high',
    title: 'Identify database engine and schema before replacement',
    description:
      'The binary interacts with a database. Before modernization, identify the database engine, ' +
      'connection mechanism (ODBC DSN or connection string), and the schema. Capture and document ' +
      'all SQL queries executed at runtime. Schema migration must be planned before rewriting the ' +
      'data access layer.',
    rationale:
      'ODBC, database-API, and SQL-string evidence was correlated in static analysis. ' +
      'The database engine, schema, and runtime queries cannot be fully recovered from static evidence alone.',
    steps: [
      'Identify the database engine and driver from ODBC DSN configuration or connection strings.',
      'Recover the schema from a deployed database instance.',
      'Inventory SQL evidence already present in this analysis.',
      'Capture connection configuration and DSN settings from the deployed system.',
      'Map persistence behavior and query patterns before rewriting the data access layer.',
    ],
    artifactsToRecover: [
      'ODBC DSN configuration',
      'database schema export',
      'connection string configuration',
      'SQL query inventory',
    ],
    sequenceOrder: 4,
  },
  network: {
    priority: 'high',
    title: 'Inventory endpoints and authentication before replacement',
    description:
      'The binary communicates over the network. Capture all hostnames, IP addresses, ports, and ' +
      'protocols used at runtime. Document authentication mechanisms (API keys, tokens, certificates). ' +
      'Replacement must preserve all external service contracts and handle TLS correctly.',
    rationale:
      'Network-communication APIs were correlated in static evidence. ' +
      'Actual endpoints, authentication credentials, and runtime traffic cannot be confirmed from static analysis.',
    steps: [
      'Inventory actual endpoints and protocols from URL/hostname string evidence in this analysis.',
      'Recover certificate and configuration material from the deployed system where applicable.',
      'Document the authentication mechanism (API keys, tokens, certificates, Windows auth).',
      'Capture runtime network traffic in a controlled environment to identify all endpoints.',
      'Validate runtime traffic separately before designing the replacement communication layer.',
    ],
    artifactsToRecover: [
      'endpoint and hostname configuration',
      'TLS certificates',
      'authentication configuration',
      'network policy or firewall rules',
    ],
    sequenceOrder: 5,
  },
  filesystem: {
    priority: 'medium',
    title: 'Document file layout and side effects',
    description:
      'The binary reads and writes files. Enumerate all file paths accessed at runtime using ' +
      'process monitoring. Document side effects (created, modified, deleted files) so the ' +
      'replacement can replicate or improve on the file management behavior.',
    rationale:
      'Filesystem APIs and file-path strings were correlated in static evidence. ' +
      'Exact runtime file operations cannot be confirmed without dynamic tracing.',
    steps: [
      'Map observed path and file-path string evidence already collected in this analysis.',
      'Recover the deployed directory layout from a live installation.',
      'Identify configuration, data, and log files.',
      'Validate read, write, and delete behavior using process monitoring before replacement.',
    ],
    artifactsToRecover: [
      'installed directory layout',
      'configuration files',
      'log files',
      'data files',
    ],
    sequenceOrder: 3,
  },
  persistence: {
    priority: 'medium',
    title: 'Enumerate registry configuration before migration',
    description:
      'The binary persists configuration in the registry. Document all registry keys and values ' +
      'used, their default values, and any migration logic needed when replacing the binary. ' +
      'Consider migrating to a modern configuration mechanism (JSON, XML, environment variables).',
    rationale:
      'Registry APIs and registry-path strings were correlated in static evidence. ' +
      'The exact keys, values, and their semantics cannot be determined from static analysis alone.',
    steps: [
      'Enumerate observed registry-path evidence already present in this analysis.',
      'Recover relevant keys and values from a deployed installation using regedit or reg.exe.',
      'Classify settings as application settings, machine state, or installer metadata.',
      'Define a migration target for each setting in the replacement.',
    ],
    artifactsToRecover: [
      'registry export for relevant application keys',
      'configuration migration mapping',
    ],
    sequenceOrder: 6,
  },
  process: {
    priority: 'medium',
    title: 'Document external process dependencies',
    description:
      'The binary launches external processes. Identify all child processes, their arguments, ' +
      'and the conditions under which they are invoked. Document whether the binary waits for ' +
      'completion or runs them asynchronously.',
    rationale:
      'Process-creation APIs were correlated in static evidence. ' +
      'Child executable identities and invocation arguments cannot be confirmed from static analysis.',
    steps: [
      'Identify child executable evidence from string and API references in this analysis.',
      'Recover executable dependencies from the deployed system.',
      'Document invocation arguments and conditions through runtime monitoring.',
      'Determine whether child processes are waited for or run asynchronously.',
    ],
    artifactsToRecover: [
      'external executable dependencies',
      'child process invocation documentation',
    ],
    sequenceOrder: 7,
  },
  authentication: {
    priority: 'high',
    title: 'Audit credential handling and security posture',
    description:
      'The binary handles authentication or credentials. Conduct a security audit of credential ' +
      'storage, transmission, and lifecycle. Ensure the replacement uses modern, secure credential ' +
      'management (e.g., Windows Credential Manager, OAuth2, certificate-based auth).',
    rationale:
      'Authentication APIs and credential-related strings were correlated in static evidence. ' +
      'A dedicated security review is required before replacement.',
    steps: [
      'Identify credential-related static evidence already present in this analysis.',
      'Recover configuration and certificate references from the deployed system.',
      'Document trust boundaries and authentication flows.',
      'Perform a dedicated security review of credential handling before designing the replacement.',
    ],
    artifactsToRecover: [
      'certificates',
      'authentication configuration',
      'credential storage documentation',
    ],
    sequenceOrder: 8,
  },
  cryptography: {
    priority: 'medium',
    title: 'Document cryptographic algorithms and key management',
    description:
      'The binary performs cryptographic operations. Document the algorithms, modes, key sizes, ' +
      'and key management approach. Ensure the replacement uses approved algorithms and modern ' +
      'key management (e.g., Azure Key Vault, Windows DPAPI, or HSM-backed keys).',
    rationale:
      'Cryptographic APIs were correlated in static evidence. ' +
      'Exact algorithms, key material, and key management practices cannot be confirmed from static analysis.',
    steps: [
      'Identify API and library evidence from this analysis.',
      'Determine algorithms only where evidence supports it — do not speculate.',
      'Recover key, certificate, and configuration artifacts from the deployed system.',
      'Validate key lifecycle and management separately before replacement.',
    ],
    artifactsToRecover: [
      'certificates',
      'key management configuration',
      'cryptographic policy documentation',
    ],
    sequenceOrder: 9,
  },
};

// Map candidate responsibility names back to categories
const NAME_TO_CATEGORY: Record<string, string> = {
  'windows installation and uninstallation handling': 'installation',
  'registry-backed configuration and settings persistence': 'persistence',
  'windows service and driver lifecycle management': 'service',
  'filesystem deployment and file management': 'filesystem',
  'external process creation and management': 'process',
  'network communication': 'network',
  'database access and query execution': 'database',
  'authentication and credential handling': 'authentication',
  'cryptographic operations': 'cryptography',
};

export function buildModernizationRecommendations(
  candidates: CandidateResponsibility[],
  _unknowns: Unknown[],
  _inferences: Inference[],
): ModernizationRecommendation[] {
  const seen = new Set<string>();
  const recommendations: ModernizationRecommendation[] = [];

  for (const candidate of candidates) {
    const category = NAME_TO_CATEGORY[candidate.name.toLowerCase()] ?? candidate.name.toLowerCase();
    if (seen.has(category)) continue;

    const template = CATEGORY_RECOMMENDATIONS[category];
    if (!template) continue;

    seen.add(category);
    recommendations.push({
      id: uuidv4(),
      priority: template.priority,
      title: template.title,
      description: template.description,
      evidenceIds: candidate.evidenceIds,
      relatedResponsibilityIds: [candidate.id],
      rationale: template.rationale,
      steps: template.steps,
      artifactsToRecover: template.artifactsToRecover,
    });
  }

  // Sort by priority (high first), then by sequenceOrder within same priority
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    if (pDiff !== 0) return pDiff;
    const catA = NAME_TO_CATEGORY[a.title.toLowerCase()] ??
      Object.entries(CATEGORY_RECOMMENDATIONS).find(([, t]) => t.title === a.title)?.[0] ?? '';
    const catB = NAME_TO_CATEGORY[b.title.toLowerCase()] ??
      Object.entries(CATEGORY_RECOMMENDATIONS).find(([, t]) => t.title === b.title)?.[0] ?? '';
    return (CATEGORY_RECOMMENDATIONS[catA]?.sequenceOrder ?? 99) -
           (CATEGORY_RECOMMENDATIONS[catB]?.sequenceOrder ?? 99);
  });

  return recommendations;
}

/**
 * Build a plan-level ModernizationPlan from the recommendations produced.
 * Returns undefined if no supported recommendations exist.
 */
export function buildModernizationPlan(
  recommendations: ModernizationRecommendation[],
): ModernizationPlan | undefined {
  if (recommendations.length === 0) return undefined;

  // Find matching templates to get sequenceOrder
  const ordered = [...recommendations].sort((a, b) => {
    const catA = Object.entries(CATEGORY_RECOMMENDATIONS)
      .find(([, t]) => t.title === a.title)?.[0] ?? '';
    const catB = Object.entries(CATEGORY_RECOMMENDATIONS)
      .find(([, t]) => t.title === b.title)?.[0] ?? '';
    return (CATEGORY_RECOMMENDATIONS[catA]?.sequenceOrder ?? 99) -
           (CATEGORY_RECOMMENDATIONS[catB]?.sequenceOrder ?? 99);
  });

  const investigationSequence = ordered.map(r => r.title);

  // Aggregate and deduplicate artifacts across all recommendations
  const artifactSet = new Set<string>();
  for (const rec of ordered) {
    for (const a of rec.artifactsToRecover ?? []) {
      artifactSet.add(a);
    }
  }

  return {
    investigationSequence,
    artifactsToRecover: [...artifactSet],
  };
}
