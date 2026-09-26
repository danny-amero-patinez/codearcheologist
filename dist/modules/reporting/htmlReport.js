"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHtmlReport = generateHtmlReport;
const SAFETY_DISCLAIMER = '⚠️ Static analysis does NOT establish that this binary is safe. The binary was never executed.';
// ── Bounded display constants (same as Markdown) ──────────────────────────
const MAX_INTERESTING_FUNCTIONS = 10;
const MAX_FUNCTIONS_PER_CANDIDATE = 8;
const MAX_CALLERS_PER_FUNCTION = 5;
const MAX_CALLEES_PER_FUNCTION = 8;
const MAX_EVIDENCE_ROWS = 200;
const MAX_EVIDENCE_SUMMARY_LEN = 120;
const MAX_DECOMP_LINES = 8;
// ── HTML helpers ──────────────────────────────────────────────────────────
function esc(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function truncate(s, maxLen) {
    return s.length > maxLen ? s.slice(0, maxLen) + '…' : s;
}
function confidenceBadge(confidence) {
    const colorMap = {
        high: '#166534', medium: '#92400e', low: '#6b7280', 'not-applicable': '#6b7280',
    };
    const bgMap = {
        high: '#dcfce7', medium: '#fef3c7', low: '#f3f4f6', 'not-applicable': '#f3f4f6',
    };
    const color = colorMap[confidence] ?? '#6b7280';
    const bg = bgMap[confidence] ?? '#f3f4f6';
    return `<span style="background:${bg};color:${color};padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;text-transform:uppercase;">${esc(confidence)}</span>`;
}
function evidenceIdSpans(ids) {
    if (ids.length === 0)
        return '<em>no evidence IDs</em>';
    return ids.map(id => `<code>${esc(id)}</code>`).join(' ');
}
function codeTag(s) {
    return `<code>${esc(s)}</code>`;
}
function labelDiv(text) {
    return `<div class="label">${text}</div>`;
}
function ul(items) {
    return `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
}
function ol(items) {
    return `<ol>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ol>`;
}
/**
 * Find associated responsibility names for a function profile.
 */
function associatedResponsibilities(fp, candidates) {
    const result = [];
    for (const c of candidates) {
        if (c.functions.some(f => f.address === fp.address) && !result.includes(c.name)) {
            result.push(c.name);
        }
    }
    return result;
}
/**
 * Resolve decompilation preview from canonical evidence.
 * Only returns text when the evidence data safely exposes a string body.
 */
function resolveDecompilationPreview(fp, evidenceMap) {
    for (const eid of fp.decompilationEvidenceIds) {
        const ev = evidenceMap.get(eid);
        if (!ev)
            continue;
        const data = ev.data;
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
// ── Executive summary ─────────────────────────────────────────────────────
function buildExecutiveSummaryHtml(result) {
    const parts = [];
    const totalCand = result.candidateComponents.length;
    const highConf = result.candidateComponents.filter(c => c.confidence === 'high');
    const medConf = result.candidateComponents.filter(c => c.confidence === 'medium');
    const ghidraRan = result.coverage.ghidra;
    if (totalCand > 0) {
        const names = result.candidateComponents.map(c => c.name);
        const uniqueNames = [...new Set(names)];
        const nameList = uniqueNames.length <= 4
            ? uniqueNames.map(n => `<em>${esc(n)}</em>`).join(', ')
            : uniqueNames.slice(0, 4).map(n => `<em>${esc(n)}</em>`).join(', ') + ` and ${uniqueNames.length - 4} more`;
        parts.push(`<p>Static evidence suggests this binary contains ${totalCand} candidate responsibilit${totalCand === 1 ? 'y' : 'ies'} ` +
            `related to: ${nameList}. ` +
            `These conclusions are based on correlated imports, strings${ghidraRan ? ', call-graph edges, and function-level references' : ' and PE metadata'}; ` +
            `they do not establish runtime execution paths.</p>`);
        const confParts = [];
        if (highConf.length > 0)
            confParts.push(`${highConf.length} at high confidence`);
        if (medConf.length > 0)
            confParts.push(`${medConf.length} at medium confidence`);
        if (confParts.length > 0) {
            parts.push(`<p>Confidence breakdown: ${esc(confParts.join(', '))}.</p>`);
        }
    }
    else {
        parts.push(`<p>No candidate responsibilities were identified at medium or high confidence from available static evidence.</p>`);
    }
    const highRecs = result.modernization.filter(r => r.priority === 'high');
    if (highRecs.length > 0) {
        const concern = highRecs.map(r => `<em>${esc(r.title)}</em>`).join('; ');
        parts.push(`<p>The highest-priority modernization concerns are: ${concern}. ` +
            `Runtime side effects, exact service names, registry contents, and OS contracts remain unresolved ` +
            `and should be recovered from a deployed installation before replacement.</p>`);
    }
    if (!ghidraRan) {
        parts.push(`<p><strong>⚠️ Ghidra function-level analysis did not run.</strong> ` +
            `Function profiles, call graph edges, and decompilation evidence are unavailable. ` +
            `Reconstruction depth is limited to PE metadata and string extraction.</p>`);
    }
    if (result.unknowns.length > 0) {
        parts.push(`<p><strong>Unresolved questions (${result.unknowns.length}):</strong></p>`);
        parts.push(ul(result.unknowns.map(u => esc(u.question))));
    }
    return parts.join('\n');
}
const CSS = `
  body{font-family:-apple-system,"Segoe UI",system-ui,sans-serif;font-size:14px;line-height:1.6;color:#1f2328;max-width:980px;margin:0 auto;padding:24px;background:#fff}
  h1{font-size:22px;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:32px}
  h2{font-size:18px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-top:28px;color:#1f2328}
  h3{font-size:15px;margin-top:20px;color:#1f2328}
  h4{font-size:13px;margin-top:14px;color:#1f2328;font-weight:600}
  .disclaimer{background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;margin:16px 0;color:#991b1b;font-weight:500}
  .meta{background:#f7f8fa;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px;margin:16px 0}
  table{border-collapse:collapse;width:100%;margin:12px 0;font-size:13px}
  th{background:#f7f8fa;text-align:left;padding:6px 10px;border:1px solid #e5e7eb;font-weight:600}
  td{padding:6px 10px;border:1px solid #e5e7eb;vertical-align:top;word-break:break-word;max-width:400px}
  code{background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:12px;font-family:"Cascadia Code","Consolas",monospace;word-break:break-all}
  pre{background:#f0f0f0;padding:10px 14px;border-radius:4px;font-size:12px;font-family:"Cascadia Code","Consolas",monospace;overflow-x:auto;white-space:pre-wrap;word-break:break-word}
  .card{background:#f7f8fa;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px;margin:12px 0}
  .fn-card{background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px;margin:12px 0;border-left:3px solid #3b82f6}
  ul{margin:6px 0;padding-left:22px} li{margin:3px 0}
  ol{margin:6px 0;padding-left:22px}
  .label{font-weight:600;color:#57606a;font-size:12px;text-transform:uppercase;margin-bottom:2px;margin-top:10px}
  .unknown-card{border-left:3px solid #f59e0b;padding-left:12px;margin:16px 0}
  .mod-high{border-left:3px solid #dc2626;padding-left:12px;margin:16px 0}
  .mod-medium{border-left:3px solid #d97706;padding-left:12px;margin:16px 0}
  .mod-low{border-left:3px solid #6b7280;padding-left:12px;margin:16px 0}
  .limitation{color:#57606a;font-style:italic;font-size:13px}
  .autogen{color:#6b7280;font-style:italic;font-size:12px}
  details>summary{cursor:pointer;font-weight:600;color:#3b82f6;font-size:13px;margin:8px 0}
  footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;color:#57606a;font-size:12px}
`.trim();
// ── Main generator ────────────────────────────────────────────────────────
function generateHtmlReport(result) {
    const parts = [];
    // Build evidence lookup map
    const evidenceMap = new Map(result.evidence.map(e => [e.id, e]));
    parts.push(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Code Archaeologist — ${esc(result.binary.originalFilename)}</title><style>${CSS}</style></head><body>`);
    parts.push(`<h1>Code Archaeologist — Analysis Report</h1>`);
    parts.push(`<div class="disclaimer">${SAFETY_DISCLAIMER}</div>`);
    parts.push(`<div class="meta"><strong>Analysis ID:</strong> ${codeTag(result.analysis.id)}&nbsp;&nbsp;<strong>Status:</strong> ${esc(result.analysis.status)}&nbsp;&nbsp;<strong>Generated:</strong> ${esc(new Date().toISOString())}</div>`);
    // ── 1. Executive Reconstruction Summary ───────────────────────────────────
    parts.push(`<h2>1. Executive Reconstruction Summary</h2>`);
    parts.push(buildExecutiveSummaryHtml(result));
    // ── 2. Binary Identification ──────────────────────────────────────────────
    parts.push(`<h2>2. Binary Identification</h2>`);
    parts.push(`<table><tr><th>Field</th><th>Value</th></tr>`);
    parts.push(`<tr><td>Filename</td><td>${codeTag(result.binary.originalFilename)}</td></tr>`);
    parts.push(`<tr><td>SHA-256</td><td>${codeTag(result.binary.sha256)}</td></tr>`);
    parts.push(`<tr><td>PE Type</td><td>${esc(result.binary.peType)}</td></tr>`);
    parts.push(`<tr><td>Architecture</td><td>${esc(result.binary.architecture)}</td></tr>`);
    parts.push(`<tr><td>Subsystem</td><td>${esc(result.binary.subsystem)}</td></tr>`);
    parts.push(`<tr><td>Entry Point</td><td>${codeTag(result.binary.entryPoint)}</td></tr>`);
    parts.push(`<tr><td>File Size</td><td>${result.binary.fileSizeBytes.toLocaleString()} bytes</td></tr>`);
    parts.push(`<tr><td>Signed</td><td>${result.binary.hasSignature ? 'Yes (signature present — not verified)' : 'No'}</td></tr>`);
    if (result.binary.overallEntropy !== undefined) {
        parts.push(`<tr><td>Overall Entropy</td><td>${result.binary.overallEntropy.toFixed(3)}</td></tr>`);
    }
    if (result.binary.versionInfo) {
        const vi = result.binary.versionInfo;
        if (vi.companyName)
            parts.push(`<tr><td>Company</td><td>${esc(vi.companyName)}</td></tr>`);
        if (vi.productName)
            parts.push(`<tr><td>Product</td><td>${esc(vi.productName)}</td></tr>`);
        if (vi.fileVersion)
            parts.push(`<tr><td>Version</td><td>${esc(vi.fileVersion)}</td></tr>`);
        if (vi.description)
            parts.push(`<tr><td>Description</td><td>${esc(vi.description)}</td></tr>`);
        if (vi.originalFilename)
            parts.push(`<tr><td>Original Filename</td><td>${codeTag(vi.originalFilename)}</td></tr>`);
    }
    parts.push(`</table>`);
    // ── 3. Analysis Coverage & Tool Status ────────────────────────────────────
    parts.push(`<h2>3. Analysis Coverage &amp; Tool Status</h2>`);
    parts.push(`<table><tr><th>Tool</th><th>Status</th></tr>`);
    parts.push(`<tr><td>PE Parser</td><td>${result.coverage.peParser ? '✓ Ran' : '✗ Did not run'}</td></tr>`);
    parts.push(`<tr><td>String Extractor</td><td>${result.coverage.strings ? '✓ Ran' : '✗ Did not run'}</td></tr>`);
    const ghidraStatus = result.coverage.ghidra ? '✓ Ran'
        : result.coverage.ghidraError ? `✗ Failed: ${esc(result.coverage.ghidraError)}`
            : '✗ Not configured';
    parts.push(`<tr><td>Ghidra</td><td>${ghidraStatus}</td></tr>`);
    parts.push(`</table>`);
    parts.push(`<p><strong>Phases:</strong></p><ul>`);
    for (const phase of result.analysis.phases) {
        const icon = phase.status === 'completed' ? '✓'
            : phase.status === 'failed' ? '✗'
                : phase.status === 'skipped' ? '—'
                    : phase.status === 'running' ? '⟳'
                        : '○';
        const dur = phase.durationMs !== undefined ? ` (${phase.durationMs}ms)` : '';
        const err = phase.error ? ` — <em>${esc(phase.error)}</em>` : '';
        parts.push(`<li>${icon} <strong>${esc(phase.phase)}</strong>${dur}${err}</li>`);
    }
    parts.push(`</ul>`);
    // ── 4. Reconstructed Capabilities ─────────────────────────────────────────
    parts.push(`<h2>4. Reconstructed Capabilities</h2>`);
    if (result.capabilities.length > 0) {
        for (const inf of result.capabilities) {
            parts.push(`<div class="card">`);
            parts.push(`<h3>${esc(inf.category)} ${confidenceBadge(inf.confidence)}</h3>`);
            parts.push(`<p>${esc(inf.statement)}</p>`);
            if (inf.rationale.length > 0) {
                parts.push(labelDiv('Rationale'));
                parts.push(ul(inf.rationale.map(r => esc(r))));
            }
            parts.push(labelDiv('Evidence'));
            parts.push(`<p>${evidenceIdSpans(inf.evidenceIds)}</p>`);
            if (inf.limitations.length > 0) {
                parts.push(labelDiv('Limitations'));
                parts.push(ul(inf.limitations.map(l => `<span class="limitation">${esc(l)}</span>`)));
            }
            parts.push(`</div>`);
        }
    }
    else {
        parts.push(`<p><em>No capabilities inferred from available evidence.</em></p>`);
    }
    // ── 5. Candidate Responsibilities ─────────────────────────────────────────
    parts.push(`<h2>5. Candidate Responsibilities</h2>`);
    if (result.candidateComponents.length > 0) {
        for (const cand of result.candidateComponents) {
            parts.push(`<div class="card">`);
            parts.push(`<h3>${esc(cand.name)} ${confidenceBadge(cand.confidence)}</h3>`);
            parts.push(`<p>${esc(cand.summary)}</p>`);
            parts.push(labelDiv('Evidence'));
            parts.push(`<p>${evidenceIdSpans(cand.evidenceIds)}</p>`);
            if (cand.keyApis && cand.keyApis.length > 0) {
                parts.push(labelDiv('Key API References'));
                parts.push(`<p>${cand.keyApis.map(a => codeTag(a)).join(' ')}</p>`);
            }
            if (cand.keyStrings && cand.keyStrings.length > 0) {
                parts.push(labelDiv('Key String References'));
                parts.push(`<p>${cand.keyStrings.map(s => codeTag(truncate(s, 80))).join(' ')}</p>`);
            }
            if (cand.functions.length > 0) {
                const displayed = cand.functions.slice(0, MAX_FUNCTIONS_PER_CANDIDATE);
                const omitted = cand.functions.length - displayed.length;
                parts.push(labelDiv('Associated Functions'));
                parts.push(`<ul>`);
                for (const fn of displayed) {
                    const nameTag = fn.autoGenerated
                        ? `${codeTag(fn.name)} <span class="autogen">(auto-generated name)</span>`
                        : codeTag(fn.name);
                    parts.push(`<li>${codeTag(fn.address)}: ${nameTag}</li>`);
                }
                if (omitted > 0)
                    parts.push(`<li><em>…and ${omitted} more</em></li>`);
                parts.push(`</ul>`);
            }
            if (cand.rationale.length > 0) {
                parts.push(labelDiv('Analysis'));
                parts.push(`<ul>`);
                for (const r of cand.rationale) {
                    const label = r.classification === 'observed' ? 'Observed'
                        : r.classification === 'inferred' ? 'Inferred'
                            : 'Unknown';
                    parts.push(`<li><strong>${label}:</strong> ${esc(r.text)}</li>`);
                }
                parts.push(`</ul>`);
            }
            if (cand.limitations.length > 0) {
                parts.push(labelDiv('Limitations'));
                parts.push(ul(cand.limitations.map(l => `<span class="limitation">${esc(l)}</span>`)));
            }
            parts.push(`</div>`);
        }
    }
    else {
        parts.push(`<p><em>No candidate responsibilities identified at medium or high confidence.</em></p>`);
    }
    // ── 6. External Interactions ───────────────────────────────────────────────
    parts.push(`<h2>6. External Interactions</h2>`);
    if (result.externalInteractions.length > 0) {
        for (const ext of result.externalInteractions) {
            parts.push(`<div class="card">`);
            parts.push(`<h3>${esc(ext.kind)} ${confidenceBadge(ext.confidence)}</h3>`);
            parts.push(`<p>${esc(ext.description)}</p>`);
            parts.push(labelDiv('Evidence'));
            parts.push(`<p>${evidenceIdSpans(ext.evidenceIds)}</p>`);
            if (ext.limitations.length > 0) {
                parts.push(ul(ext.limitations.map(l => `<span class="limitation">${esc(l)}</span>`)));
            }
            parts.push(`</div>`);
        }
    }
    else {
        parts.push(`<p><em>No external interactions detected.</em></p>`);
    }
    // ── 7. Interesting Functions — detailed per-function view ─────────────────
    parts.push(`<h2>7. Interesting Functions</h2>`);
    const topFns = result.interestingFunctions.slice(0, MAX_INTERESTING_FUNCTIONS);
    if (topFns.length > 0) {
        const omittedFns = result.interestingFunctions.length - topFns.length;
        for (const fp of topFns) {
            parts.push(`<div class="fn-card">`);
            const autoGenNote = fp.autoGenerated
                ? ` <span class="autogen">(auto-generated name)</span>` : '';
            parts.push(`<h3>${codeTag(fp.name)} at ${codeTag(fp.address)}${autoGenNote}</h3>`);
            parts.push(`<ul>`);
            parts.push(`<li><strong>Selection score:</strong> ${fp.selectionScore}</li>`);
            if (fp.selectionReasons.length > 0) {
                parts.push(`<li><strong>Selection reasons:</strong> ${esc(fp.selectionReasons.join(', '))}</li>`);
            }
            const assoc = associatedResponsibilities(fp, result.candidateComponents);
            if (assoc.length > 0) {
                parts.push(`<li><strong>Associated responsibilities:</strong> ${assoc.map(n => `<em>${esc(n)}</em>`).join(', ')}</li>`);
            }
            if (fp.apiReferences.length > 0) {
                parts.push(`<li><strong>API references:</strong> ${fp.apiReferences.map(a => codeTag(a)).join(' ')}</li>`);
            }
            if (fp.stringReferences.length > 0) {
                parts.push(`<li><strong>String references:</strong> ${fp.stringReferences.map(s => codeTag(truncate(s, 80))).join(' ')}</li>`);
            }
            if (fp.callers.length > 0) {
                const shown = fp.callers.slice(0, MAX_CALLERS_PER_FUNCTION);
                const more = fp.callers.length - shown.length;
                const callerStr = shown.map(a => codeTag(a)).join(' ') + (more > 0 ? ` <em>…+${more}</em>` : '');
                parts.push(`<li><strong>Called by:</strong> ${callerStr}</li>`);
            }
            if (fp.callees.length > 0) {
                const shown = fp.callees.slice(0, MAX_CALLEES_PER_FUNCTION);
                const more = fp.callees.length - shown.length;
                const calleeStr = shown.map(a => codeTag(a)).join(' ') + (more > 0 ? ` <em>…+${more}</em>` : '');
                parts.push(`<li><strong>Calls:</strong> ${calleeStr}</li>`);
            }
            const allEvIds = [...fp.evidenceIds, ...fp.decompilationEvidenceIds];
            if (allEvIds.length > 0) {
                parts.push(`<li><strong>Evidence:</strong> ${evidenceIdSpans(allEvIds)}</li>`);
            }
            parts.push(`</ul>`);
            // Decompilation preview — only if canonical evidence contains usable text
            if (fp.decompilationEvidenceIds.length > 0) {
                const preview = resolveDecompilationPreview(fp, evidenceMap);
                if (preview) {
                    parts.push(`<details><summary>Decompiled pseudocode preview — not original source</summary>`);
                    parts.push(`<pre>${esc(preview)}</pre>`);
                    parts.push(`</details>`);
                }
                else {
                    parts.push(`<p><small><strong>Decompilation evidence IDs:</strong> ${evidenceIdSpans(fp.decompilationEvidenceIds)}</small></p>`);
                }
            }
            parts.push(`</div>`);
        }
        if (omittedFns > 0) {
            parts.push(`<p><em>…and ${omittedFns} more functions in the canonical result.</em></p>`);
        }
    }
    else {
        parts.push(`<p><em>No function profiles available (Ghidra analysis required).</em></p>`);
    }
    // ── 8. Dependencies / Runtime Hints ───────────────────────────────────────
    parts.push(`<h2>8. Dependencies / Runtime Hints (DLL Imports)</h2>`);
    if (result.dependencies.length > 0) {
        parts.push(ul(result.dependencies.map(d => codeTag(d))));
    }
    else {
        parts.push(`<p><em>No import table found.</em></p>`);
    }
    // ── 9. Unknowns / Actionable Questions ────────────────────────────────────
    parts.push(`<h2>9. Unknowns (Actionable Questions)</h2>`);
    if (result.unknowns.length > 0) {
        for (const unk of result.unknowns) {
            parts.push(`<div class="unknown-card">`);
            parts.push(`<h3>❓ ${esc(unk.question)}</h3>`);
            parts.push(`<p><strong>Why it matters:</strong> ${esc(unk.whyItMatters)}</p>`);
            parts.push(`<p><strong>Missing evidence:</strong> ${esc(unk.missingEvidence)}</p>`);
            parts.push(labelDiv('How to resolve'));
            parts.push(ul(unk.howToResolve.map(h => esc(h))));
            parts.push(`</div>`);
        }
    }
    else {
        parts.push(`<p><em>No unresolved questions identified.</em></p>`);
    }
    // ── 10. Modernization Blueprint ────────────────────────────────────────────
    parts.push(`<h2>10. Modernization Blueprint</h2>`);
    if (result.modernization.length > 0) {
        for (const rec of result.modernization) {
            parts.push(`<div class="mod-${rec.priority}">`);
            parts.push(`<h3>[${rec.priority.toUpperCase()}] ${esc(rec.title)}</h3>`);
            parts.push(`<p>${esc(rec.description)}</p>`);
            if (rec.rationale) {
                parts.push(`<p><strong>Rationale:</strong> ${esc(rec.rationale)}</p>`);
            }
            if (rec.steps && rec.steps.length > 0) {
                parts.push(labelDiv('Recommended Steps'));
                parts.push(ol(rec.steps));
            }
            if (rec.artifactsToRecover && rec.artifactsToRecover.length > 0) {
                parts.push(labelDiv('Artifacts to Recover'));
                parts.push(ul(rec.artifactsToRecover.map(a => esc(a))));
            }
            parts.push(labelDiv('Evidence'));
            parts.push(`<p>${evidenceIdSpans(rec.evidenceIds)}</p>`);
            if (rec.relatedResponsibilityIds.length > 0) {
                parts.push(labelDiv('Related Responsibilities'));
                parts.push(`<p>${rec.relatedResponsibilityIds.map(id => codeTag(id)).join(' ')}</p>`);
            }
            parts.push(`</div>`);
        }
        // Investigation Sequence
        const plan = result.modernizationPlan;
        if (plan && plan.investigationSequence.length > 0) {
            parts.push(`<h3>Investigation Sequence</h3>`);
            parts.push(`<p>Recommended order to resolve unresolved dependencies before replacement:</p>`);
            parts.push(ol(plan.investigationSequence));
        }
        // Aggregated Artifacts to Recover
        if (plan && plan.artifactsToRecover.length > 0) {
            parts.push(`<h3>Artifacts to Recover from a Deployed Installation</h3>`);
            parts.push(ul(plan.artifactsToRecover.map(a => esc(a))));
        }
    }
    else {
        parts.push(`<p><em>No modernization recommendations generated.</em></p>`);
    }
    // ── 11. Limitations ────────────────────────────────────────────────────────
    parts.push(`<h2>11. Limitations</h2>`);
    parts.push(ul(result.limitations.map(l => `<span class="limitation">${esc(l)}</span>`)));
    // ── 12. Evidence Index ─────────────────────────────────────────────────────
    const evidenceByKind = {};
    for (const ev of result.evidence) {
        evidenceByKind[ev.kind] = (evidenceByKind[ev.kind] ?? 0) + 1;
    }
    parts.push(`<h2>12. Evidence Index</h2>`);
    parts.push(`<p><strong>Total evidence items: ${result.evidence.length}</strong></p>`);
    parts.push(`<table><tr><th>Kind</th><th style="text-align:right">Count</th></tr>`);
    for (const [kind, count] of Object.entries(evidenceByKind).sort()) {
        parts.push(`<tr><td>${esc(kind)}</td><td style="text-align:right">${count}</td></tr>`);
    }
    parts.push(`</table>`);
    // Bounded detailed evidence table
    const displayedEvidence = result.evidence.slice(0, MAX_EVIDENCE_ROWS);
    const omittedEvidence = result.evidence.length - displayedEvidence.length;
    parts.push(`<h3>Evidence Detail</h3>`);
    parts.push(`<table><tr><th>ID</th><th>Kind</th><th>Tool</th><th>Location</th><th>Summary</th></tr>`);
    for (const ev of displayedEvidence) {
        const loc = ev.location
            ? (ev.location.address ?? ev.location.functionAddress ?? (ev.location.offset !== undefined ? `+0x${ev.location.offset.toString(16)}` : ''))
            : '';
        const summary = truncate(ev.summary, MAX_EVIDENCE_SUMMARY_LEN);
        parts.push(`<tr><td>${codeTag(ev.id)}</td><td>${esc(ev.kind)}</td><td>${esc(ev.sourceTool)}</td><td>${codeTag(loc)}</td><td>${esc(summary)}</td></tr>`);
    }
    parts.push(`</table>`);
    if (omittedEvidence > 0) {
        parts.push(`<p><em>…${omittedEvidence} additional evidence items omitted. See canonical JSON for full detail.</em></p>`);
    }
    parts.push(`<footer>Made with IBM Bob</footer>`);
    parts.push(`</body></html>`);
    return parts.join('\n');
}
//# sourceMappingURL=htmlReport.js.map