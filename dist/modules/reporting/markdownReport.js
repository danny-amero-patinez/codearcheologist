"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMarkdownReport = generateMarkdownReport;
const SAFETY_DISCLAIMER = '⚠️ Static analysis does NOT establish that this binary is safe. The binary was never executed.';
// ── Bounded display constants ──────────────────────────────────────────────
const MAX_INTERESTING_FUNCTIONS = 10;
const MAX_FUNCTIONS_PER_CANDIDATE = 8;
const MAX_CALLERS_PER_FUNCTION = 5;
const MAX_CALLEES_PER_FUNCTION = 8;
const MAX_EVIDENCE_ROWS = 200;
const MAX_EVIDENCE_SUMMARY_LEN = 120;
const MAX_DECOMP_LINES = 8;
// ── Helpers ────────────────────────────────────────────────────────────────
function hr() {
    return '\n---\n';
}
function section(title, content) {
    return `## ${title}\n\n${content}\n`;
}
function confidenceBadge(confidence) {
    return `**[${confidence.toUpperCase()}]**`;
}
function formatEvidenceIds(ids) {
    if (ids.length === 0)
        return '_no evidence IDs_';
    return ids.map(id => `\`${id}\``).join(', ');
}
/** Escape pipe characters so they don't break Markdown table cells. */
function escapeCell(s) {
    return s.replace(/\|/g, '\\|');
}
/** Truncate a string for display. */
function truncate(s, maxLen) {
    return s.length > maxLen ? s.slice(0, maxLen) + '…' : s;
}
/**
 * Find associated responsibility names for a given function profile.
 */
function associatedResponsibilities(fp, candidates) {
    const result = [];
    for (const c of candidates) {
        const hasFunction = c.functions.some(f => f.address === fp.address);
        if (hasFunction && !result.includes(c.name)) {
            result.push(c.name);
        }
    }
    return result;
}
/**
 * Try to resolve a decompilation preview from the evidence store.
 * Looks for evidence items referenced by decompilationEvidenceIds whose
 * data shape safely exposes a string body (pseudocode).
 * Returns a short preview of at most MAX_DECOMP_LINES meaningful lines,
 * or null if no usable text is found.
 */
function resolveDecompilationPreview(fp, evidenceMap) {
    for (const eid of fp.decompilationEvidenceIds) {
        const ev = evidenceMap.get(eid);
        if (!ev)
            continue;
        const data = ev.data;
        // The decompilation evidence data shape from the normalizer stores
        // { body: string } or { pseudocode: string } or the raw string itself.
        let body = null;
        if (typeof data === 'string') {
            body = data;
        }
        else if (data !== null && typeof data === 'object') {
            const d = data;
            if (typeof d['body'] === 'string')
                body = d['body'];
            else if (typeof d['pseudocode'] === 'string')
                body = d['pseudocode'];
            else if (typeof d['decompilation'] === 'string')
                body = d['decompilation'];
            else if (typeof d['text'] === 'string')
                body = d['text'];
        }
        if (body && body.trim().length > 0) {
            const lines = body.split('\n').filter(l => l.trim().length > 0);
            const preview = lines.slice(0, MAX_DECOMP_LINES).join('\n');
            const omitted = lines.length > MAX_DECOMP_LINES
                ? `\n// …${lines.length - MAX_DECOMP_LINES} more lines` : '';
            return preview + omitted;
        }
    }
    return null;
}
// ── Executive summary (deterministic, from canonical data) ─────────────────
function buildExecutiveSummary(result) {
    const lines = [];
    const highConf = result.candidateComponents.filter(c => c.confidence === 'high');
    const medConf = result.candidateComponents.filter(c => c.confidence === 'medium');
    const totalCand = result.candidateComponents.length;
    const ghidraRan = result.coverage.ghidra;
    // Paragraph 1 — what was found
    if (totalCand > 0) {
        const names = result.candidateComponents.map(c => c.name);
        const uniqueNames = [...new Set(names)];
        const nameList = uniqueNames.length <= 4
            ? uniqueNames.map(n => `_${n}_`).join(', ')
            : uniqueNames.slice(0, 4).map(n => `_${n}_`).join(', ') + ` and ${uniqueNames.length - 4} more`;
        lines.push(`Static evidence suggests this binary contains ${totalCand} candidate responsibilit${totalCand === 1 ? 'y' : 'ies'} ` +
            `related to: ${nameList}. ` +
            `These conclusions are based on correlated imports, strings${ghidraRan ? ', call-graph edges, and function-level references' : ' and PE metadata'}; ` +
            `they do not establish runtime execution paths.`);
        if (highConf.length > 0 || medConf.length > 0) {
            const parts = [];
            if (highConf.length > 0)
                parts.push(`${highConf.length} at high confidence`);
            if (medConf.length > 0)
                parts.push(`${medConf.length} at medium confidence`);
            lines.push(`Confidence breakdown: ${parts.join(', ')}.`);
        }
    }
    else {
        lines.push(`No candidate responsibilities were identified at medium or high confidence from available static evidence.`);
    }
    lines.push('');
    // Paragraph 2 — key modernization concern
    const highRecs = result.modernization.filter(r => r.priority === 'high');
    if (highRecs.length > 0) {
        const concern = highRecs.map(r => `_${r.title}_`).join('; ');
        lines.push(`The highest-priority modernization concerns are: ${concern}. ` +
            `Runtime side effects, exact service names, registry contents, and OS contracts remain unresolved ` +
            `and should be recovered from a deployed installation before replacement.`);
        lines.push('');
    }
    // Paragraph 3 — Ghidra coverage note
    if (!ghidraRan) {
        lines.push(`⚠️ Ghidra function-level analysis did not run for this analysis. ` +
            `Function profiles, call graph edges, and decompilation evidence are unavailable. ` +
            `Reconstruction depth is limited to PE metadata and string extraction.`);
        lines.push('');
    }
    // Unknowns bullet list
    if (result.unknowns.length > 0) {
        lines.push(`**Unresolved questions (${result.unknowns.length}):**`);
        for (const u of result.unknowns) {
            lines.push(`- ${u.question}`);
        }
    }
    return lines.join('\n');
}
// ── Report generator ───────────────────────────────────────────────────────
function generateMarkdownReport(result) {
    const sections = [];
    // Build fast evidence lookup map
    const evidenceMap = new Map(result.evidence.map(e => [e.id, e]));
    // Title + disclaimer
    sections.push(`# Code Archaeologist — Analysis Report\n`);
    sections.push(`> ${SAFETY_DISCLAIMER}\n`);
    sections.push(`> **Analysis ID:** \`${result.analysis.id}\`  \n` +
        `> **Status:** ${result.analysis.status}  \n` +
        `> **Generated:** ${new Date().toISOString()}\n`);
    sections.push(hr());
    // ── 1. Executive Reconstruction Summary ───────────────────────────────────
    sections.push(section('1. Executive Reconstruction Summary', buildExecutiveSummary(result)));
    // ── 2. Binary Identification ──────────────────────────────────────────────
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
        if (vi.description)
            binaryLines.push(`| Description | ${vi.description} |`);
        if (vi.originalFilename)
            binaryLines.push(`| Original Filename | \`${vi.originalFilename}\` |`);
    }
    sections.push(section('2. Binary Identification', binaryLines.join('\n')));
    // ── 3. Analysis Coverage & Tool Status ────────────────────────────────────
    const coverageLines = [];
    coverageLines.push(`| Tool | Status |`);
    coverageLines.push(`|------|--------|`);
    coverageLines.push(`| PE Parser | ${result.coverage.peParser ? '✓ Ran' : '✗ Did not run'} |`);
    coverageLines.push(`| String Extractor | ${result.coverage.strings ? '✓ Ran' : '✗ Did not run'} |`);
    coverageLines.push(`| Ghidra | ${result.coverage.ghidra ? '✓ Ran' : result.coverage.ghidraError ? `✗ Failed: ${result.coverage.ghidraError}` : '✗ Not configured'} |`);
    coverageLines.push('');
    coverageLines.push('**Phases:**');
    for (const phase of result.analysis.phases) {
        const icon = phase.status === 'completed' ? '✓'
            : phase.status === 'failed' ? '✗'
                : phase.status === 'skipped' ? '—'
                    : phase.status === 'running' ? '⟳'
                        : '○';
        const durationStr = phase.durationMs !== undefined ? ` (${phase.durationMs}ms)` : '';
        const errStr = phase.error ? ` — ${phase.error}` : '';
        coverageLines.push(`- ${icon} ${phase.phase}${durationStr}${errStr}`);
    }
    sections.push(section('3. Analysis Coverage & Tool Status', coverageLines.join('\n')));
    // ── 4. Reconstructed Capabilities ─────────────────────────────────────────
    if (result.capabilities.length > 0) {
        const capLines = [];
        for (const inf of result.capabilities) {
            capLines.push(`### ${inf.category} — ${confidenceBadge(inf.confidence)}`);
            capLines.push('');
            capLines.push(`**Statement:** ${inf.statement}`);
            capLines.push('');
            if (inf.rationale.length > 0) {
                capLines.push('**Rationale:**');
                for (const r of inf.rationale)
                    capLines.push(`- ${r}`);
                capLines.push('');
            }
            capLines.push(`**Evidence:** ${formatEvidenceIds(inf.evidenceIds)}`);
            if (inf.limitations.length > 0) {
                capLines.push('');
                capLines.push('**Limitations:**');
                for (const lim of inf.limitations)
                    capLines.push(`- ${lim}`);
            }
            capLines.push('');
        }
        sections.push(section('4. Reconstructed Capabilities', capLines.join('\n')));
    }
    else {
        sections.push(section('4. Reconstructed Capabilities', '_No capabilities inferred from available evidence._'));
    }
    // ── 5. Candidate Responsibilities ─────────────────────────────────────────
    if (result.candidateComponents.length > 0) {
        const candLines = [];
        for (const cand of result.candidateComponents) {
            candLines.push(`### ${cand.name} — ${confidenceBadge(cand.confidence)}`);
            candLines.push('');
            candLines.push(cand.summary);
            candLines.push('');
            candLines.push(`**Evidence:** ${formatEvidenceIds(cand.evidenceIds)}`);
            // Key API references
            if (cand.keyApis && cand.keyApis.length > 0) {
                candLines.push('');
                candLines.push(`**Key API references:** ${cand.keyApis.map(a => `\`${a}\``).join(', ')}`);
            }
            // Key string references
            if (cand.keyStrings && cand.keyStrings.length > 0) {
                candLines.push('');
                candLines.push(`**Key string references:** ${cand.keyStrings.map(s => `\`${truncate(s, 80)}\``).join(', ')}`);
            }
            // Correlated functions (bounded)
            if (cand.functions.length > 0) {
                const displayed = cand.functions.slice(0, MAX_FUNCTIONS_PER_CANDIDATE);
                const omitted = cand.functions.length - displayed.length;
                candLines.push('');
                candLines.push('**Associated functions:**');
                for (const fn of displayed) {
                    const nameStr = fn.autoGenerated
                        ? `\`${fn.name}\` _(auto-generated name)_`
                        : `\`${fn.name}\``;
                    candLines.push(`- \`${fn.address}\`: ${nameStr}`);
                }
                if (omitted > 0)
                    candLines.push(`- _…and ${omitted} more_`);
            }
            // Rationale with explicit classification labels
            if (cand.rationale.length > 0) {
                candLines.push('');
                candLines.push('**Analysis:**');
                for (const r of cand.rationale) {
                    const label = r.classification === 'observed' ? 'Observed'
                        : r.classification === 'inferred' ? 'Inferred'
                            : 'Unknown';
                    candLines.push(`- **${label}:** ${r.text}`);
                }
            }
            // Limitations
            if (cand.limitations.length > 0) {
                candLines.push('');
                candLines.push('**Limitations:**');
                for (const lim of cand.limitations)
                    candLines.push(`- ${lim}`);
            }
            candLines.push('');
        }
        sections.push(section('5. Candidate Responsibilities', candLines.join('\n')));
    }
    else {
        sections.push(section('5. Candidate Responsibilities', '_No candidate responsibilities identified at medium or high confidence._'));
    }
    // ── 6. External Interactions ───────────────────────────────────────────────
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
                for (const lim of ext.limitations)
                    extLines.push(`- _${lim}_`);
            }
            extLines.push('');
        }
        sections.push(section('6. External Interactions', extLines.join('\n')));
    }
    else {
        sections.push(section('6. External Interactions', '_No external interactions detected._'));
    }
    // ── 7. Interesting Functions — detailed per-function view ─────────────────
    const topFns = result.interestingFunctions.slice(0, MAX_INTERESTING_FUNCTIONS);
    if (topFns.length > 0) {
        const fnSections = [];
        const omittedFns = result.interestingFunctions.length - topFns.length;
        for (const fp of topFns) {
            const autoGenStr = fp.autoGenerated ? ' _(auto-generated name)_' : '';
            fnSections.push(`### \`${fp.name}\` at \`${fp.address}\`${autoGenStr}`);
            fnSections.push('');
            fnSections.push(`- **Selection score:** ${fp.selectionScore}`);
            if (fp.selectionReasons.length > 0) {
                fnSections.push(`- **Selection reasons:** ${fp.selectionReasons.join(', ')}`);
            }
            const assoc = associatedResponsibilities(fp, result.candidateComponents);
            if (assoc.length > 0) {
                fnSections.push(`- **Associated responsibilities:** ${assoc.map(n => `_${n}_`).join(', ')}`);
            }
            if (fp.apiReferences.length > 0) {
                fnSections.push(`- **API references:** ${fp.apiReferences.map(a => `\`${a}\``).join(', ')}`);
            }
            if (fp.stringReferences.length > 0) {
                const strs = fp.stringReferences.map(s => `\`${truncate(s, 80)}\``).join(', ');
                fnSections.push(`- **String references:** ${strs}`);
            }
            if (fp.callers.length > 0) {
                const shown = fp.callers.slice(0, MAX_CALLERS_PER_FUNCTION);
                const more = fp.callers.length - shown.length;
                const callerStr = shown.map(a => `\`${a}\``).join(', ') + (more > 0 ? ` …+${more}` : '');
                fnSections.push(`- **Called by:** ${callerStr}`);
            }
            if (fp.callees.length > 0) {
                const shown = fp.callees.slice(0, MAX_CALLEES_PER_FUNCTION);
                const more = fp.callees.length - shown.length;
                const calleeStr = shown.map(a => `\`${a}\``).join(', ') + (more > 0 ? ` …+${more}` : '');
                fnSections.push(`- **Calls:** ${calleeStr}`);
            }
            const allEvIds = [...fp.evidenceIds, ...fp.decompilationEvidenceIds];
            if (allEvIds.length > 0) {
                fnSections.push(`- **Evidence:** ${formatEvidenceIds(allEvIds)}`);
            }
            // Decompilation preview — only if canonical evidence contains usable text
            if (fp.decompilationEvidenceIds.length > 0) {
                const preview = resolveDecompilationPreview(fp, evidenceMap);
                if (preview) {
                    fnSections.push('');
                    fnSections.push('<details>');
                    fnSections.push('<summary>Decompiled pseudocode preview (not original source)</summary>');
                    fnSections.push('');
                    fnSections.push('```c');
                    fnSections.push(preview);
                    fnSections.push('```');
                    fnSections.push('');
                    fnSections.push('</details>');
                }
                else {
                    fnSections.push(`- **Decompilation evidence IDs:** ${formatEvidenceIds(fp.decompilationEvidenceIds)}`);
                }
            }
            fnSections.push('');
        }
        if (omittedFns > 0) {
            fnSections.push(`_…and ${omittedFns} more functions in the canonical result._`);
        }
        sections.push(section('7. Interesting Functions', fnSections.join('\n')));
    }
    else {
        sections.push(section('7. Interesting Functions', '_No function profiles available (Ghidra analysis required)._'));
    }
    // ── 8. Dependencies / Runtime Hints ───────────────────────────────────────
    if (result.dependencies.length > 0) {
        const depLines = result.dependencies.map(d => `- \`${d}\``);
        sections.push(section('8. Dependencies / Runtime Hints (DLL Imports)', depLines.join('\n')));
    }
    else {
        sections.push(section('8. Dependencies / Runtime Hints (DLL Imports)', '_No import table found._'));
    }
    // ── 9. Unknowns / Actionable Questions ────────────────────────────────────
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
            for (const how of unk.howToResolve)
                unknLines.push(`- ${how}`);
            unknLines.push('');
        }
        sections.push(section('9. Unknowns (Actionable Questions)', unknLines.join('\n')));
    }
    else {
        sections.push(section('9. Unknowns (Actionable Questions)', '_No unresolved questions identified._'));
    }
    // ── 10. Modernization Blueprint ────────────────────────────────────────────
    if (result.modernization.length > 0) {
        const modLines = [];
        for (const rec of result.modernization) {
            modLines.push(`### [${rec.priority.toUpperCase()}] ${rec.title}`);
            modLines.push('');
            modLines.push(rec.description);
            modLines.push('');
            if (rec.rationale) {
                modLines.push(`**Rationale:** ${rec.rationale}`);
                modLines.push('');
            }
            if (rec.steps && rec.steps.length > 0) {
                modLines.push('**Recommended steps:**');
                for (const step of rec.steps)
                    modLines.push(`1. ${step}`);
                modLines.push('');
            }
            if (rec.artifactsToRecover && rec.artifactsToRecover.length > 0) {
                modLines.push('**Artifacts to recover:**');
                for (const art of rec.artifactsToRecover)
                    modLines.push(`- ${art}`);
                modLines.push('');
            }
            modLines.push(`**Evidence:** ${formatEvidenceIds(rec.evidenceIds)}`);
            modLines.push('');
        }
        // Investigation sequence
        const plan = result.modernizationPlan;
        if (plan && plan.investigationSequence.length > 0) {
            modLines.push('### Investigation Sequence');
            modLines.push('');
            modLines.push('Recommended order to resolve unresolved dependencies before replacement:');
            modLines.push('');
            plan.investigationSequence.forEach((step, i) => {
                modLines.push(`${i + 1}. ${step}`);
            });
            modLines.push('');
        }
        // Aggregated artifacts to recover
        if (plan && plan.artifactsToRecover.length > 0) {
            modLines.push('### Artifacts to Recover from a Deployed Installation');
            modLines.push('');
            for (const art of plan.artifactsToRecover)
                modLines.push(`- ${art}`);
            modLines.push('');
        }
        sections.push(section('10. Modernization Blueprint', modLines.join('\n')));
    }
    else {
        sections.push(section('10. Modernization Blueprint', '_No modernization recommendations generated._'));
    }
    // ── 11. Limitations ────────────────────────────────────────────────────────
    const limLines = result.limitations.map(l => `- ${l}`);
    sections.push(section('11. Limitations', limLines.join('\n')));
    // ── 12. Evidence Index ─────────────────────────────────────────────────────
    const evidenceByKind = {};
    for (const ev of result.evidence) {
        evidenceByKind[ev.kind] = (evidenceByKind[ev.kind] ?? 0) + 1;
    }
    const evidenceLines = [
        `**Total evidence items: ${result.evidence.length}**`,
        '',
        '| Kind | Count |',
        '|------|------:|',
    ];
    for (const [kind, count] of Object.entries(evidenceByKind).sort()) {
        evidenceLines.push(`| ${kind} | ${count} |`);
    }
    // Bounded detailed evidence table
    const displayedEvidence = result.evidence.slice(0, MAX_EVIDENCE_ROWS);
    const omittedEvidence = result.evidence.length - displayedEvidence.length;
    evidenceLines.push('');
    evidenceLines.push('### Evidence Detail');
    evidenceLines.push('');
    evidenceLines.push('| ID | Kind | Tool | Location | Summary |');
    evidenceLines.push('|---|---|---|---|---|');
    for (const ev of displayedEvidence) {
        const loc = ev.location
            ? (ev.location.address ?? ev.location.functionAddress ?? (ev.location.offset !== undefined ? `+0x${ev.location.offset.toString(16)}` : ''))
            : '';
        const summary = escapeCell(truncate(ev.summary, MAX_EVIDENCE_SUMMARY_LEN));
        const locCell = escapeCell(loc);
        evidenceLines.push(`| \`${ev.id}\` | ${ev.kind} | ${ev.sourceTool} | ${locCell} | ${summary} |`);
    }
    if (omittedEvidence > 0) {
        evidenceLines.push('');
        evidenceLines.push(`_…${omittedEvidence} additional evidence items omitted from this table. See canonical JSON for full detail._`);
    }
    sections.push(section('12. Evidence Index', evidenceLines.join('\n')));
    return sections.join('\n');
}
//# sourceMappingURL=markdownReport.js.map