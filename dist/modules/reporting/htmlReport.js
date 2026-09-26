"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHtmlReport = generateHtmlReport;
const SAFETY_DISCLAIMER = '⚠️ Static analysis does NOT establish that this binary is safe. The binary was never executed.';
function esc(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function confidenceBadge(confidence) {
    const colorMap = {
        high: '#166534',
        medium: '#92400e',
        low: '#6b7280',
        'not-applicable': '#6b7280',
    };
    const bgMap = {
        high: '#dcfce7',
        medium: '#fef3c7',
        low: '#f3f4f6',
        'not-applicable': '#f3f4f6',
    };
    const color = colorMap[confidence] ?? '#6b7280';
    const bg = bgMap[confidence] ?? '#f3f4f6';
    return `<span style="background:${bg};color:${color};padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;text-transform:uppercase;">${esc(confidence)}</span>`;
}
function evidenceIdSpans(ids) {
    if (ids.length === 0)
        return '<em>no evidence IDs</em>';
    return ids.map(id => `<code style="background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:11px;">${esc(id)}</code>`).join(' ');
}
const CSS = `
  body { font-family: -apple-system, "Segoe UI", system-ui, sans-serif; font-size: 14px; line-height: 1.6; color: #1f2328; max-width: 960px; margin: 0 auto; padding: 24px; background: #fff; }
  h1 { font-size: 22px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 32px; }
  h2 { font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 28px; color: #1f2328; }
  h3 { font-size: 15px; margin-top: 20px; color: #1f2328; }
  .disclaimer { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px 16px; margin: 16px 0; color: #991b1b; font-weight: 500; }
  .meta { background: #f7f8fa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; margin: 16px 0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px; }
  th { background: #f7f8fa; text-align: left; padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 600; }
  td { padding: 6px 10px; border: 1px solid #e5e7eb; vertical-align: top; }
  code { background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 12px; font-family: "Cascadia Code", "Consolas", monospace; }
  .card { background: #f7f8fa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; margin: 12px 0; }
  ul { margin: 6px 0; padding-left: 22px; }
  li { margin: 3px 0; }
  .label { font-weight: 600; color: #57606a; font-size: 12px; text-transform: uppercase; margin-bottom: 2px; }
  .unknown-card { border-left: 3px solid #f59e0b; padding-left: 12px; margin: 16px 0; }
  .mod-high { border-left: 3px solid #dc2626; padding-left: 12px; margin: 16px 0; }
  .mod-medium { border-left: 3px solid #d97706; padding-left: 12px; margin: 16px 0; }
  .mod-low { border-left: 3px solid #6b7280; padding-left: 12px; margin: 16px 0; }
  .limitation { color: #57606a; font-style: italic; font-size: 13px; }
  footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #57606a; font-size: 12px; }
`.trim();
function generateHtmlReport(result) {
    const parts = [];
    parts.push(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Code Archaeologist — ${esc(result.binary.originalFilename)}</title><style>${CSS}</style></head><body>`);
    parts.push(`<h1>Code Archaeologist — Analysis Report</h1>`);
    parts.push(`<div class="disclaimer">${SAFETY_DISCLAIMER}</div>`);
    parts.push(`<div class="meta"><strong>Analysis ID:</strong> <code>${esc(result.analysis.id)}</code>&nbsp;&nbsp;<strong>Status:</strong> ${esc(result.analysis.status)}&nbsp;&nbsp;<strong>Generated:</strong> ${esc(new Date().toISOString())}</div>`);
    // 1. Executive Summary
    parts.push(`<h2>1. Executive Reconstruction Summary</h2>`);
    parts.push(`<table><tr><th>Field</th><th>Value</th></tr>`);
    parts.push(`<tr><td>Binary</td><td><code>${esc(result.binary.originalFilename)}</code></td></tr>`);
    parts.push(`<tr><td>SHA-256</td><td><code>${esc(result.binary.sha256)}</code></td></tr>`);
    parts.push(`<tr><td>Type</td><td>${esc(result.binary.peType)} / ${esc(result.binary.architecture)} / ${esc(result.binary.subsystem)}</td></tr>`);
    parts.push(`<tr><td>Inferred Capabilities</td><td>${result.capabilities.length}</td></tr>`);
    parts.push(`<tr><td>Candidate Responsibilities</td><td>${result.candidateComponents.length}</td></tr>`);
    parts.push(`<tr><td>Unknowns</td><td>${result.unknowns.length}</td></tr>`);
    if (result.analysis.errorMessage) {
        parts.push(`<tr><td>Note</td><td>${esc(result.analysis.errorMessage)}</td></tr>`);
    }
    parts.push(`</table>`);
    // 2. Binary Identification
    parts.push(`<h2>2. Binary Identification</h2><table><tr><th>Field</th><th>Value</th></tr>`);
    parts.push(`<tr><td>Filename</td><td><code>${esc(result.binary.originalFilename)}</code></td></tr>`);
    parts.push(`<tr><td>SHA-256</td><td><code>${esc(result.binary.sha256)}</code></td></tr>`);
    parts.push(`<tr><td>PE Type</td><td>${esc(result.binary.peType)}</td></tr>`);
    parts.push(`<tr><td>Architecture</td><td>${esc(result.binary.architecture)}</td></tr>`);
    parts.push(`<tr><td>Subsystem</td><td>${esc(result.binary.subsystem)}</td></tr>`);
    parts.push(`<tr><td>Entry Point</td><td><code>${esc(result.binary.entryPoint)}</code></td></tr>`);
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
    }
    parts.push(`</table>`);
    // 3. Analysis Coverage
    parts.push(`<h2>3. Analysis Coverage &amp; Tool Status</h2>`);
    parts.push(`<table><tr><th>Tool</th><th>Status</th></tr>`);
    parts.push(`<tr><td>PE Parser</td><td>${result.coverage.peParser ? '✓ Ran' : '✗ Did not run'}</td></tr>`);
    parts.push(`<tr><td>String Extractor</td><td>${result.coverage.strings ? '✓ Ran' : '✗ Did not run'}</td></tr>`);
    parts.push(`<tr><td>Ghidra</td><td>${result.coverage.ghidra ? '✓ Ran' : result.coverage.ghidraError ? `✗ Failed: ${esc(result.coverage.ghidraError)}` : '✗ Not configured'}</td></tr>`);
    parts.push(`</table>`);
    parts.push(`<ul>`);
    for (const phase of result.analysis.phases) {
        const icon = phase.status === 'completed' ? '✓' : phase.status === 'failed' ? '✗' : phase.status === 'skipped' ? '—' : '○';
        const dur = phase.durationMs !== undefined ? ` (${phase.durationMs}ms)` : '';
        const err = phase.error ? ` — <em>${esc(phase.error)}</em>` : '';
        parts.push(`<li>${icon} <strong>${esc(phase.phase)}</strong>${dur}${err}</li>`);
    }
    parts.push(`</ul>`);
    // 4. Reconstructed Capabilities
    parts.push(`<h2>4. Reconstructed Capabilities</h2>`);
    if (result.capabilities.length > 0) {
        for (const inf of result.capabilities) {
            parts.push(`<div class="card"><h3>${esc(inf.category)} ${confidenceBadge(inf.confidence)}</h3>`);
            parts.push(`<p>${esc(inf.statement)}</p>`);
            if (inf.rationale.length > 0) {
                parts.push(`<div class="label">Rationale</div><ul>${inf.rationale.map(r => `<li>${esc(r)}</li>`).join('')}</ul>`);
            }
            parts.push(`<div class="label">Evidence</div><p>${evidenceIdSpans(inf.evidenceIds)}</p>`);
            if (inf.limitations.length > 0) {
                parts.push(`<div class="label">Limitations</div><ul>${inf.limitations.map(l => `<li class="limitation">${esc(l)}</li>`).join('')}</ul>`);
            }
            parts.push(`</div>`);
        }
    }
    else {
        parts.push(`<p><em>No capabilities inferred from available evidence.</em></p>`);
    }
    // 5. Candidate Responsibilities
    parts.push(`<h2>5. Candidate Responsibilities</h2>`);
    if (result.candidateComponents.length > 0) {
        for (const cand of result.candidateComponents) {
            parts.push(`<div class="card"><h3>${esc(cand.name)} ${confidenceBadge(cand.confidence)}</h3>`);
            parts.push(`<p>${esc(cand.summary)}</p>`);
            parts.push(`<div class="label">Evidence</div><p>${evidenceIdSpans(cand.evidenceIds)}</p>`);
            if (cand.functions.length > 0) {
                parts.push(`<div class="label">Correlated Functions</div><ul>`);
                for (const fn of cand.functions) {
                    const nameStr = fn.autoGenerated ? `<code>${esc(fn.name)}</code> <em>(auto-generated name)</em>` : `<code>${esc(fn.name)}</code>`;
                    parts.push(`<li><code>${esc(fn.address)}</code>: ${nameStr}</li>`);
                }
                parts.push(`</ul>`);
            }
            if (cand.rationale.length > 0) {
                parts.push(`<div class="label">Analysis</div><ul>`);
                for (const r of cand.rationale) {
                    const label = r.classification === 'observed' ? 'Observed' : r.classification === 'inferred' ? 'Inferred' : 'Unknown';
                    parts.push(`<li><strong>${label}:</strong> ${esc(r.text)}</li>`);
                }
                parts.push(`</ul>`);
            }
            if (cand.limitations.length > 0) {
                parts.push(`<ul>${cand.limitations.map(l => `<li class="limitation">${esc(l)}</li>`).join('')}</ul>`);
            }
            parts.push(`</div>`);
        }
    }
    else {
        parts.push(`<p><em>No candidate responsibilities identified at medium or high confidence.</em></p>`);
    }
    // 6. External Interactions
    parts.push(`<h2>6. External Interactions</h2>`);
    if (result.externalInteractions.length > 0) {
        for (const ext of result.externalInteractions) {
            parts.push(`<div class="card"><h3>${esc(ext.kind)} ${confidenceBadge(ext.confidence)}</h3>`);
            parts.push(`<p>${esc(ext.description)}</p>`);
            parts.push(`<div class="label">Evidence</div><p>${evidenceIdSpans(ext.evidenceIds)}</p>`);
            if (ext.limitations.length > 0) {
                parts.push(`<ul>${ext.limitations.map(l => `<li class="limitation">${esc(l)}</li>`).join('')}</ul>`);
            }
            parts.push(`</div>`);
        }
    }
    else {
        parts.push(`<p><em>No external interactions detected.</em></p>`);
    }
    // 7. Interesting Functions
    parts.push(`<h2>7. Interesting Functions</h2>`);
    if (result.interestingFunctions.length > 0) {
        parts.push(`<table><tr><th>Address</th><th>Name</th><th>Auto-Generated</th><th>APIs</th><th>Score</th></tr>`);
        for (const fn of result.interestingFunctions) {
            const apis = fn.apiReferences.slice(0, 3).map(a => `<code>${esc(a)}</code>`).join(', ') + (fn.apiReferences.length > 3 ? '…' : '');
            parts.push(`<tr><td><code>${esc(fn.address)}</code></td><td><code>${esc(fn.name)}</code></td><td>${fn.autoGenerated ? 'Yes' : 'No'}</td><td>${apis || '—'}</td><td>${fn.selectionScore}</td></tr>`);
        }
        parts.push(`</table>`);
    }
    else {
        parts.push(`<p><em>No function profiles available (Ghidra analysis required).</em></p>`);
    }
    // 8. Dependencies
    parts.push(`<h2>8. Dependencies / Runtime Hints (DLL Imports)</h2>`);
    if (result.dependencies.length > 0) {
        parts.push(`<ul>${result.dependencies.map(d => `<li><code>${esc(d)}</code></li>`).join('')}</ul>`);
    }
    else {
        parts.push(`<p><em>No import table found.</em></p>`);
    }
    // 9. Unknowns
    parts.push(`<h2>9. Unknowns (Actionable Questions)</h2>`);
    if (result.unknowns.length > 0) {
        for (const unk of result.unknowns) {
            parts.push(`<div class="unknown-card">`);
            parts.push(`<h3>❓ ${esc(unk.question)}</h3>`);
            parts.push(`<p><strong>Why it matters:</strong> ${esc(unk.whyItMatters)}</p>`);
            parts.push(`<p><strong>Missing evidence:</strong> ${esc(unk.missingEvidence)}</p>`);
            parts.push(`<div class="label">How to resolve</div><ul>${unk.howToResolve.map(h => `<li>${esc(h)}</li>`).join('')}</ul>`);
            parts.push(`</div>`);
        }
    }
    else {
        parts.push(`<p><em>No unresolved questions identified.</em></p>`);
    }
    // 10. Modernization Blueprint
    parts.push(`<h2>10. Modernization Blueprint</h2>`);
    if (result.modernization.length > 0) {
        for (const rec of result.modernization) {
            parts.push(`<div class="mod-${rec.priority}">`);
            parts.push(`<h3>[${rec.priority.toUpperCase()}] ${esc(rec.title)}</h3>`);
            parts.push(`<p>${esc(rec.description)}</p>`);
            parts.push(`<div class="label">Evidence</div><p>${evidenceIdSpans(rec.evidenceIds)}</p>`);
            parts.push(`</div>`);
        }
    }
    else {
        parts.push(`<p><em>No modernization recommendations generated.</em></p>`);
    }
    // 11. Limitations
    parts.push(`<h2>11. Limitations</h2>`);
    parts.push(`<ul>${result.limitations.map(l => `<li class="limitation">${esc(l)}</li>`).join('')}</ul>`);
    // 12. Evidence Index
    const evidenceByKind = {};
    for (const ev of result.evidence) {
        evidenceByKind[ev.kind] = (evidenceByKind[ev.kind] ?? 0) + 1;
    }
    parts.push(`<h2>12. Evidence Index</h2>`);
    parts.push(`<p><strong>Total evidence items: ${result.evidence.length}</strong></p>`);
    parts.push(`<table><tr><th>Kind</th><th>Count</th></tr>`);
    for (const [kind, count] of Object.entries(evidenceByKind).sort()) {
        parts.push(`<tr><td>${esc(kind)}</td><td>${count}</td></tr>`);
    }
    parts.push(`</table>`);
    parts.push(`<footer>Made with IBM Bob</footer>`);
    parts.push(`</body></html>`);
    return parts.join('\n');
}
//# sourceMappingURL=htmlReport.js.map