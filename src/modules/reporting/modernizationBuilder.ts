/**
 * Modernization recommendation builder.
 *
 * Produces evidence-backed modernization recommendations derived from
 * candidate responsibilities. Each recommendation traces back to evidenceIds.
 */
import { v4 as uuidv4 } from 'uuid';
import {
  type CandidateResponsibility,
  type Unknown,
  type Inference,
  type ModernizationRecommendation,
} from '../../shared/types.js';

interface RecommendationTemplate {
  priority: ModernizationRecommendation['priority'];
  title: string;
  description: string;
}

const CATEGORY_RECOMMENDATIONS: Record<string, RecommendationTemplate> = {
  installation: {
    priority: 'high',
    title: 'Document and automate deployment process',
    description:
      'The binary contains installation logic. Before modernization, document all registry keys written, ' +
      'files deployed, and services installed. Automate equivalent deployment using a modern installer ' +
      'framework (WiX, MSIX, or scripted deployment) so the process is reproducible and auditable.',
  },
  service: {
    priority: 'high',
    title: 'Map service lifecycle and OS contracts',
    description:
      'The binary manages Windows service or driver lifecycle. Document the service name, startup type, ' +
      'account, and dependencies before replacement. Ensure the replacement preserves SCM contracts ' +
      'and handles service control events (stop, pause, continue) correctly.',
  },
  database: {
    priority: 'high',
    title: 'Identify database engine and schema before replacement',
    description:
      'The binary interacts with a database. Before modernization, identify the database engine, ' +
      'connection mechanism (ODBC DSN or connection string), and the schema. Capture and document ' +
      'all SQL queries executed at runtime. Schema migration must be planned before rewriting the ' +
      'data access layer.',
  },
  network: {
    priority: 'high',
    title: 'Inventory endpoints and authentication before replacement',
    description:
      'The binary communicates over the network. Capture all hostnames, IP addresses, ports, and ' +
      'protocols used at runtime. Document authentication mechanisms (API keys, tokens, certificates). ' +
      'Replacement must preserve all external service contracts and handle TLS correctly.',
  },
  filesystem: {
    priority: 'medium',
    title: 'Document file layout and side effects',
    description:
      'The binary reads and writes files. Enumerate all file paths accessed at runtime using ' +
      'process monitoring. Document side effects (created, modified, deleted files) so the ' +
      'replacement can replicate or improve on the file management behavior.',
  },
  persistence: {
    priority: 'medium',
    title: 'Enumerate registry configuration before migration',
    description:
      'The binary persists configuration in the registry. Document all registry keys and values ' +
      'used, their default values, and any migration logic needed when replacing the binary. ' +
      'Consider migrating to a modern configuration mechanism (JSON, XML, environment variables).',
  },
  process: {
    priority: 'medium',
    title: 'Document external process dependencies',
    description:
      'The binary launches external processes. Identify all child processes, their arguments, ' +
      'and the conditions under which they are invoked. Document whether the binary waits for ' +
      'completion or runs them asynchronously.',
  },
  authentication: {
    priority: 'high',
    title: 'Audit credential handling and security posture',
    description:
      'The binary handles authentication or credentials. Conduct a security audit of credential ' +
      'storage, transmission, and lifecycle. Ensure the replacement uses modern, secure credential ' +
      'management (e.g., Windows Credential Manager, OAuth2, certificate-based auth).',
  },
  cryptography: {
    priority: 'medium',
    title: 'Document cryptographic algorithms and key management',
    description:
      'The binary performs cryptographic operations. Document the algorithms, modes, key sizes, ' +
      'and key management approach. Ensure the replacement uses approved algorithms and modern ' +
      'key management (e.g., Azure Key Vault, Windows DPAPI, or HSM-backed keys).',
  },
};

export function buildModernizationRecommendations(
  candidates: CandidateResponsibility[],
  _unknowns: Unknown[],
  _inferences: Inference[],
): ModernizationRecommendation[] {
  const seen = new Set<string>();
  const recommendations: ModernizationRecommendation[] = [];

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
    });
  }

  // Sort by priority (high first)
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));

  return recommendations;
}
