/**
 * Reporting module — generates canonical result and reports.
 *
 * Responsibilities:
 * - Build the CanonicalResult JSON from all reconstruction outputs
 * - Generate Markdown report from canonical result (NOT independently recomputed)
 * - Generate HTML report from canonical result (NOT independently recomputed)
 * - Provide evidence index
 * - Ensure candidate responsibilities are prominent, not buried
 *
 * Invariants:
 * - Markdown and HTML are DERIVED from canonical JSON — never the other way around
 * - Partial analysis must be clearly marked as partial
 * - Limitations section must always be present
 * - No huge raw decompilation blocks in default reports
 * - Static analysis safety disclaimer must be included in all reports
 */
export { buildCanonicalResult } from './resultBuilder.js';
export { buildModernizationRecommendations } from './modernizationBuilder.js';
export { generateMarkdownReport } from './markdownReport.js';
export { generateHtmlReport } from './htmlReport.js';
//# sourceMappingURL=index.d.ts.map