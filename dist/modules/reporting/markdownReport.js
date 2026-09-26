"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMarkdownReport = generateMarkdownReport;
const SAFETY_DISCLAIMER = '⚠️ Static analysis does NOT establish that this binary is safe. The binary was never executed.';
function hr() {
    return '\n---\n';
}
function section(title, content) {
    return `## ${title}\n\n${content}\n`;
}
function confidenceBadge(confidence) {
    const upper = confidence.toUpperCase();
    return `**[${upper}]**`;
}
function formatEvidenceIds(ids) {
    if (ids.length === 0)
        return '_no evidence IDs_';
    return ids.map(id => `\`${id}\``).join(', ');
}
function generateMarkdownReport(result) {
    const sections = [];
    // Title + disclaimer
    sections.push(`# Code Archaeologist — Analysis Report\n`);
    sections.push(`> ${SAFETY_DISCLAIMER}\n`);
    sections.push(`> **Analysis ID:** \`${result.analysis.id}\`  \n> **Status:** ${result.analysis.status}  \n> **Generated:** ${new Date().toISOString()}\n`);
    sections.push(hr());
    // 1. Executive Reconstruction Summary
    const summaryLines = [];
    summaryLines.push(`- **Binary:** ${result.binary.originalFilename}`);
    summaryLines.push(`- **SHA-256:** \`${result.binary.sha256}\``);
    summaryLines.push(`- **Type:** ${result.binary.peType} | ${result.binary.architecture} | ${result.binary.subsystem}`);
    summaryLines.push(`- **Inferred Capabilities:** ${result.capabilities.length}`);
    summaryLines.push(`- **Candidate Responsibilities:** ${result.candidateComponents.length}`);
    summaryLines.push(`- **Unknowns:** ${result.unknowns.length}`);
    if (result.analysis.errorMessage) {
        summaryLines.push(`- **Note:** ${result.analysis.errorMessage}`);
    }
    sections.push(section('1. Executive Reconstruction Summary', summaryLines.join('\n')));
    // 2. Binary Identification
    const binaryLines = [];
    binaryLines.push(`| Field | Value |`);
    binaryLines.push(`|-------|-------|`);
    binaryLines.push(`| Filename | \`${result.binary.originalFilename}\` |`);
    binaryLines.push(`| SHA-256 | \`${result.binary.sha256}\` |`);
    binaryLines.push(`| PE Type | ${result.binary.peType} |`);
    binaryLines.push(`| Architecture | ${result.binary.architecture} |`);
    binaryLines.push(`| Subsystem | ${result.binary.subsystem} |`);
    binaryLines.push(`| Entry Point | \`${result.binary.entryPoint}\` |`);
    binaryLines.push(`| File Size | ${result.binary.fileSizeBytes.toLocaleString()} bytes |`);
    binaryLines.push(`| Signed | ${result.binary.hasSignature ? 'Yes (signature present — not verified)' : 'No'} |`);
    if (result.binary.overallEntropy !== undefined) {
        binaryLines.push(`| Overall Entropy | ${result.binary.overallEntropy.toFixed(3)} |`);
    }
    if (result.binary.versionInfo) {
        const vi = result.binary.versionInfo;
        if (vi.companyName)
            binaryLines.push(`| Company | ${vi.companyName} |`);
        if (vi.productName)
            binaryLines.push(`| Product | ${vi.productName} |`);
        if (vi.fileVersion)
            binaryLines.push(`| Version | ${vi.fileVersion} |`);
    }
    sections.push(section('2. Binary Identification', binaryLines.join('\n')));
    // 3. Analysis Coverage
    const coverageLines = [];
    coverageLines.push(`| Tool | Status |`);
    coverageLines.push(`|------|--------|`);
    coverageLines.push(`| PE Parser | ${result.coverage.peParser ? '✓ Ran' : '✗ Did not run'} |`);
    coverageLines.push(`| String Extractor | ${result.coverage.strings ? '✓ Ran' : '✗ Did not run'} |`);
    coverageLines.push(`| Ghidra | ${result.coverage.ghidra ? '✓ Ran' : result.coverage.ghidraError ? `✗ Failed: ${result.coverage.ghidraError}` : '✗ Not configured'} |`);
    coverageLines.push('');
    coverageLines.push('**Phases:**');
    for (const phase of result.analysis.phases) {
        const icon = phase.status === 'completed' ? '✓' : phase.status === 'failed' ? '✗' : phase.status === 'skipped' ? '—' : phase.status === 'running' ? '⟳' : '○';
        const durationStr = phase.durationMs !== undefined ? ` (${phase.durationMs}ms)` : '';
        const errStr = phase.error ? ` — ${phase.error}` : '';
        coverageLines.push(`- ${icon} ${phase.phase}${durationStr}${errStr}`);
    }
    sections.push(section('3. Analysis Coverage & Tool Status', coverageLines.join('\n')));
    // 4. Reconstructed Capabilities
    if (result.capabilities.length > 0) {
        const capLines = [];
        for (const inf of result.capabilities) {
            capLines.push(`### ${inf.category} — ${confidenceBadge(inf.confidence)}`);
            capLines.push('');
            capLines.push(`**Statement:** ${inf.statement}`);
            capLines.push('');
            if (inf.rationale.length > 0) {
                capLines.push('**Rationale:**');
                for (const r of inf.rationale) {
                    capLines.push(`- ${r}`);
                }
                capLines.push('');
            }
            capLines.push(`**Evidence:** ${formatEvidenceIds(inf.evidenceIds)}`);
            if (inf.limitations.length > 0) {
                capLines.push('');
                capLines.push('**Limitations:**');
                for (const lim of inf.limitations) {
                    capLines.push(`- ${lim}`);
                }
            }
            capLines.push('');
        }
        sections.push(section('4. Reconstructed Capabilities', capLines.join('\n')));
    }
    else {
        sections.push(section('4. Reconstructed Capabilities', '_No capabilities inferred from available evidence._'));
    }
    // 5. Candidate Responsibilities
    if (result.candidateComponents.length > 0) {
        const candLines = [];
        for (const cand of result.candidateComponents) {
            candLines.push(`### ${cand.name} — ${confidenceBadge(cand.confidence)}`);
            candLines.push('');
            candLines.push(`${cand.summary}`);
            candLines.push('');
            candLines.push(`**Evidence:** ${formatEvidenceIds(cand.evidenceIds)}`);
            if (cand.functions.length > 0) {
                candLines.push('');
                candLines.push('**Correlated Functions:**');
                for (const fn of cand.functions) {
                    const nameStr = fn.autoGenerated ? `\`${fn.name}\` _(auto-generated name)_` : `\`${fn.name}\``;
                    candLines.push(`- ${fn.address}: ${nameStr}`);
                }
            }
            if (cand.rationale.length > 0) {
                candLines.push('');
                candLines.push('**Analysis:**');
                for (const r of cand.rationale) {
                    const label = r.classification === 'observed' ? 'Observed' : r.classification === 'inferred' ? 'Inferred' : 'Unknown';
                    candLines.push(`- **${label}:** ${r.text}`);
                }
            }
            if (cand.limitations.length > 0) {
                candLines.push('');
                candLines.push('**Limitations:**');
                for (const lim of cand.limitations) {
                    candLines.push(`- ${lim}`);
                }
            }
            candLines.push('');
        }
        sections.push(section('5. Candidate Responsibilities', candLines.join('\n')));
    }
    else {
        sections.push(section('5. Candidate Responsibilities', '_No candidate responsibilities identified at medium or high confidence._'));
    }
    // 6. External Interactions
    if (result.externalInteractions.length > 0) {
        const extLines = [];
        for (const ext of result.externalInteractions) {
            extLines.push(`### ${ext.kind} — ${confidenceBadge(ext.confidence)}`);
            extLines.push('');
            extLines.push(ext.description);
            extLines.push('');
            extLines.push(`**Evidence:** ${formatEvidenceIds(ext.evidenceIds)}`);
            if (ext.limitations.length > 0) {
                extLines.push('');
                for (const lim of ext.limitations) {
                    extLines.push(`- _${lim}_`);
                }
            }
            extLines.push('');
        }
        sections.push(section('6. External Interactions', extLines.join('\n')));
    }
    else {
        sections.push(section('6. External Interactions', '_No external interactions detected._'));
    }
    // 7. Interesting Functions
    if (result.interestingFunctions.length > 0) {
        const fnLines = [];
        fnLines.push(`| Address | Name | Auto-Generated | APIs | Strings | Score |`);
        fnLines.push(`|---------|------|---------------|------|---------|-------|`);
        for (const fn of result.interestingFunctions) {
            const autoGen = fn.autoGenerated ? 'Yes' : 'No';
            const apis = fn.apiReferences.slice(0, 3).join(', ') + (fn.apiReferences.length > 3 ? '…' : '');
            const strs = fn.stringReferences.slice(0, 2).map(s => `\`${s.slice(0, 30)}\``).join(', ');
            fnLines.push(`| \`${fn.address}\` | \`${fn.name}\` | ${autoGen} | ${apis || '—'} | ${strs || '—'} | ${fn.selectionScore} |`);
        }
        sections.push(section('7. Interesting Functions', fnLines.join('\n')));
    }
    else {
        sections.push(section('7. Interesting Functions', '_No function profiles available (Ghidra analysis required)._'));
    }
    // 8. Dependencies
    if (result.dependencies.length > 0) {
        const depLines = result.dependencies.map(d => `- \`${d}\``);
        sections.push(section('8. Dependencies / Runtime Hints (DLL Imports)', depLines.join('\n')));
    }
    else {
        sections.push(section('8. Dependencies / Runtime Hints (DLL Imports)', '_No import table found._'));
    }
    // 9. Unknowns
    if (result.unknowns.length > 0) {
        const unknLines = [];
        for (const unk of result.unknowns) {
            unknLines.push(`### ❓ ${unk.question}`);
            unknLines.push('');
            unknLines.push(`**Why it matters:** ${unk.whyItMatters}`);
            unknLines.push('');
            unknLines.push(`**Missing evidence:** ${unk.missingEvidence}`);
            unknLines.push('');
            unknLines.push('**How to resolve:**');
            for (const how of unk.howToResolve) {
                unknLines.push(`- ${how}`);
            }
            unknLines.push('');
        }
        sections.push(section('9. Unknowns (Actionable Questions)', unknLines.join('\n')));
    }
    else {
        sections.push(section('9. Unknowns (Actionable Questions)', '_No unresolved questions identified._'));
    }
    // 10. Modernization Blueprint
    if (result.modernization.length > 0) {
        const modLines = [];
        for (const rec of result.modernization) {
            modLines.push(`### [${rec.priority.toUpperCase()}] ${rec.title}`);
            modLines.push('');
            modLines.push(rec.description);
            modLines.push('');
            modLines.push(`**Evidence:** ${formatEvidenceIds(rec.evidenceIds)}`);
            modLines.push('');
        }
        sections.push(section('10. Modernization Blueprint', modLines.join('\n')));
    }
    else {
        sections.push(section('10. Modernization Blueprint', '_No modernization recommendations generated._'));
    }
    // 11. Limitations
    const limLines = result.limitations.map(l => `- ${l}`);
    sections.push(section('11. Limitations', limLines.join('\n')));
    // 12. Evidence Index
    const evidenceByKind = {};
    for (const ev of result.evidence) {
        evidenceByKind[ev.kind] = (evidenceByKind[ev.kind] ?? 0) + 1;
    }
    const evidenceLines = [`**Total evidence items: ${result.evidence.length}**`, ''];
    evidenceLines.push('| Kind | Count |');
    evidenceLines.push('|------|-------|');
    for (const [kind, count] of Object.entries(evidenceByKind).sort()) {
        evidenceLines.push(`| ${kind} | ${count} |`);
    }
    sections.push(section('12. Evidence Index', evidenceLines.join('\n')));
    return sections.join('\n');
}
//# sourceMappingURL=markdownReport.js.map