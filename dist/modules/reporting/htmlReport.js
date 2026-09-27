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
        high: '#3fb950', medium: '#d29922', low: '#8b949e', 'not-applicable': '#8b949e',
    };
    const borderMap = {
        high: 'rgba(63,185,80,0.35)', medium: 'rgba(210,153,34,0.35)', low: 'rgba(139,148,158,0.3)', 'not-applicable': 'rgba(139,148,158,0.3)',
    };
    const color = colorMap[confidence] ?? '#8b949e';
    const border = borderMap[confidence] ?? 'rgba(139,148,158,0.3)';
    return `<span style="color:${color};border:1px solid ${border};padding:1px 7px;border-radius:3px;font-size:11px;font-weight:700;text-transform:uppercase;font-family:'Cascadia Code',Consolas,monospace;">${esc(confidence)}</span>`;
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
  *,*::before,*::after{box-sizing:border-box}
  html{background:#0a0a0a}
  body{font-family:system-ui,"Segoe UI",sans-serif;font-size:14px;line-height:1.6;color:#e6edf3;max-width:980px;margin:0 auto;padding:24px 32px;background:#0a0a0a}
  /* ── Report header ─── */
  .report-header{border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:20px;margin-bottom:24px}
  .report-product{font-size:11px;color:#57606a;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px}
  .report-title{font-size:22px;font-weight:700;color:#e6edf3;margin:0 0 12px;letter-spacing:-.01em}
  .report-meta-row{display:flex;flex-wrap:wrap;gap:8px 24px;font-size:12px;color:#8b949e;font-family:"Cascadia Code",Consolas,monospace}
  .report-meta-row span strong{color:#c9d1d9;font-weight:500}
  .report-credit{font-size:11px;color:#484f58;margin-top:8px}
  /* ── TOC ─── */
  .toc{background:#161b22;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:14px 18px;margin:0 0 28px;font-size:13px}
  .toc-title{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#57606a;font-weight:600;margin:0 0 8px}
  .toc-links{display:flex;flex-wrap:wrap;gap:4px 0}
  .toc-links a{color:#29d9ff;text-decoration:none;margin-right:16px;font-size:12px}
  .toc-links a:hover{text-decoration:underline}
  /* ── Headings ─── */
  h1{font-size:18px;font-weight:700;color:#e6edf3;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:6px;margin:32px 0 12px}
  h2{font-size:15px;font-weight:600;color:#c9d1d9;margin:24px 0 8px}
  h3{font-size:13px;font-weight:600;color:#c9d1d9;margin:16px 0 6px}
  h4{font-size:12px;font-weight:600;color:#8b949e;margin:12px 0 4px}
  /* ── Disclaimer ─── */
  .disclaimer{background:rgba(248,81,73,.08);border:1px solid rgba(248,81,73,.3);border-radius:6px;padding:10px 14px;margin:16px 0;color:#f85149;font-size:13px;font-weight:500}
  /* ── Meta box ─── */
  .meta{background:#161b22;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:10px 14px;margin:12px 0;font-size:12px;color:#8b949e;font-family:"Cascadia Code",Consolas,monospace}
  .meta strong{color:#c9d1d9;font-weight:500}
  /* ── Tables ─── */
  table{border-collapse:collapse;width:100%;margin:10px 0;font-size:13px;overflow-x:auto;display:block}
  thead th{background:#161b22;text-align:left;padding:7px 10px;border:1px solid rgba(255,255,255,0.08);font-weight:600;color:#8b949e;font-size:11px;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
  tbody tr:nth-child(even){background:rgba(255,255,255,0.02)}
  td{padding:6px 10px;border:1px solid rgba(255,255,255,0.06);vertical-align:top;word-break:break-word;max-width:380px;color:#c9d1d9}
  td:first-child{color:#8b949e;font-size:12px;white-space:nowrap}
  /* ── Code ─── */
  code{background:#1c2128;color:#79c0ff;padding:1px 5px;border-radius:3px;font-size:12px;font-family:"Cascadia Code",Consolas,monospace;word-break:break-all}
  pre{background:#161b22;border:1px solid rgba(255,255,255,0.08);padding:12px 14px;border-radius:6px;font-size:12px;font-family:"Cascadia Code",Consolas,monospace;overflow-x:auto;white-space:pre;word-break:normal;max-height:320px;overflow-y:auto;color:#c9d1d9}
  details>summary{cursor:pointer;font-weight:600;color:#29d9ff;font-size:12px;margin:8px 0;user-select:none}
  details>summary::marker{color:#484f58}
  .pseudocode-warning{font-size:11px;color:#57606a;font-style:italic;margin-bottom:6px}
  /* ── Cards ─── */
  .card{background:#161b22;border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:12px 16px;margin:10px 0}
  .fn-card{background:#0d1117;border:1px solid rgba(255,255,255,0.07);border-left:3px solid rgba(41,217,255,0.4);border-radius:0 6px 6px 0;padding:12px 16px;margin:10px 0}
  /* ── Labels ─── */
  .label{font-weight:600;color:#57606a;font-size:11px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px;margin-top:12px}
  /* ── Autogen ─── */
  .autogen{color:#57606a;font-style:italic;font-size:11px;font-family:system-ui,"Segoe UI",sans-serif}
  /* ── Unknown ─── */
  .unknown-card{border-left:3px solid #d29922;background:rgba(210,153,34,.04);padding:10px 14px;margin:12px 0;border-radius:0 6px 6px 0}
  .unknown-card h3{color:#d29922;margin:0 0 6px}
  /* ── Modernization ─── */
  .mod-high{border-left:3px solid #f85149;background:rgba(248,81,73,.04);padding:10px 14px;margin:12px 0;border-radius:0 6px 6px 0}
  .mod-medium{border-left:3px solid #d29922;background:rgba(210,153,34,.04);padding:10px 14px;margin:12px 0;border-radius:0 6px 6px 0}
  .mod-low{border-left:3px solid #484f58;background:rgba(72,79,88,.06);padding:10px 14px;margin:12px 0;border-radius:0 6px 6px 0}
  /* ── Misc ─── */
  ul{margin:6px 0;padding-left:20px} li{margin:3px 0;color:#c9d1d9}
  ol{margin:6px 0;padding-left:20px}
  .limitation{color:#57606a;font-style:italic;font-size:12px}
  a{color:#29d9ff;text-decoration:none}
  a:hover{text-decoration:underline}
  /* ── Footer ─── */
  footer{margin-top:48px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.07);text-align:center;color:#484f58;font-size:11px}
`.trim();
// ── Main generator ────────────────────────────────────────────────────────
function generateHtmlReport(result) {
    const parts = [];
    // Build evidence lookup map
    const evidenceMap = new Map(result.evidence.map(e => [e.id, e]));
    parts.push(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Code Archaeologist — ${esc(result.binary.originalFilename)}</title><style>${CSS}</style></head><body>`);
    // ── Report header ──────────────────────────────────────────────────────────
    const binaryMeta = [result.binary.peType, result.binary.architecture, result.binary.subsystem].filter(Boolean).join(' • ');
    parts.push(`<div class="report-header">`);
    parts.push(`<div class="report-product">Code Archaeologist &nbsp;/&nbsp; Static Binary Analysis Report</div>`);
    parts.push(`<div class="report-title">${esc(result.binary.originalFilename)}</div>`);
    parts.push(`<div class="report-meta-row">`);
    if (binaryMeta)
        parts.push(`<span>${esc(binaryMeta)}</span>`);
    parts.push(`<span><strong>Analysis:</strong> ${codeTag(result.analysis.id)}</span>`);
    parts.push(`<span><strong>Status:</strong> ${esc(result.analysis.status)}</span>`);
    parts.push(`<span><strong>Generated:</strong> ${esc(new Date().toISOString())}</span>`);
    parts.push(`</div>`);
    parts.push(`<div class="report-credit">Built by Xalapa Team</div>`);
    parts.push(`</div>`);
    parts.push(`<div class="disclaimer">${SAFETY_DISCLAIMER}</div>`);
    // ── Table of contents ──────────────────────────────────────────────────────
    parts.push(`<nav class="toc"><div class="toc-title">Contents</div><div class="toc-links">`);
    const tocItems = [
        ['#s1', 'Overview'], ['#s2', 'Coverage'], ['#s3', 'Capabilities'],
        ['#s4', 'Responsibilities'], ['#s5', 'External Interactions'], ['#s6', 'Interesting Functions'],
        ['#s7', 'Dependencies'], ['#s8', 'Unknowns'], ['#s9', 'Modernization'],
        ['#s10', 'Limitations'], ['#s11', 'Evidence'],
    ];
    tocItems.forEach(([href, label]) => parts.push(`<a href="${href}">${label}</a>`));
    parts.push(`</div></nav>`);
    // ── 1. Executive Reconstruction Summary ───────────────────────────────────
    parts.push(`<h1 id="s1">Overview</h1>`);
    parts.push(buildExecutiveSummaryHtml(result));
    // ── 2. Binary Identification (inline in Overview) ─────────────────────────
    parts.push(`<h2>Binary Identification</h2>`);
    parts.push(`<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>`);
    parts.push(`<tr><td>Filename</td><td>${codeTag(result.binary.originalFilename)}</td></tr>`);
    parts.push(`<tr><td>PE Type</td><td>${esc(result.binary.peType)}</td></tr>`);
    parts.push(`<tr><td>Architecture</td><td>${esc(result.binary.architecture)}</td></tr>`);
    parts.push(`<tr><td>Subsystem</td><td>${esc(result.binary.subsystem)}</td></tr>`);
    parts.push(`<tr><td>Entry Point</td><td>${codeTag(result.binary.entryPoint)}</td></tr>`);
    parts.push(`<tr><td>File Size</td><td>${result.binary.fileSizeBytes.toLocaleString()} bytes</td></tr>`);
    parts.push(`<tr><td>Signature</td><td>${result.binary.hasSignature ? 'Present — verification not performed' : 'Not present'}</td></tr>`);
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
    parts.push(`<tr><td>SHA-256</td><td>${codeTag(result.binary.sha256)}</td></tr>`);
    parts.push(`</tbody></table>`);
    // ── 3. Analysis Coverage & Tool Status ────────────────────────────────────
    parts.push(`<h1 id="s2">Coverage</h1>`);
    parts.push(`<table><thead><tr><th>Engine</th><th>Status</th></tr></thead><tbody>`);
    parts.push(`<tr><td>PE Parser</td><td>${result.coverage.peParser ? '✓ Completed' : '✗ Did not run'}</td></tr>`);
    parts.push(`<tr><td>String Extractor</td><td>${result.coverage.strings ? '✓ Completed' : '✗ Did not run'}</td></tr>`);
    const ghidraStatus = result.coverage.ghidra ? '✓ Completed'
        : result.coverage.ghidraError ? `✗ Failed: ${esc(result.coverage.ghidraError)}`
            : '✗ Not configured';
    parts.push(`<tr><td>Ghidra</td><td>${ghidraStatus}</td></tr>`);
    parts.push(`</tbody></table>`);
    parts.push(`<h2>Pipeline Phases</h2><table><thead><tr><th>Phase</th><th>Status</th><th>Duration</th></tr></thead><tbody>`);
    for (const phase of result.analysis.phases) {
        const icon = phase.status === 'completed' ? '✓'
            : phase.status === 'failed' ? '✗'
                : phase.status === 'skipped' ? '—'
                    : phase.status === 'running' ? '⟳'
                        : '○';
        const dur = phase.durationMs !== undefined ? esc(String(phase.durationMs) + ' ms') : '—';
        const err = phase.error ? ` <em style="color:#f85149">${esc(phase.error)}</em>` : '';
        parts.push(`<tr><td>${esc(phase.phase)}</td><td>${icon} ${esc(phase.status)}${err}</td><td style="font-family:'Cascadia Code',Consolas,monospace">${dur}</td></tr>`);
    }
    parts.push(`</tbody></table>`);
    // ── 4. Reconstructed Capabilities ─────────────────────────────────────────
    parts.push(`<h1 id="s3">Capabilities</h1>`);
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
    parts.push(`<h1 id="s4">Responsibilities</h1>`);
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
    parts.push(`<h1 id="s5">External Interactions</h1>`);
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
    parts.push(`<h1 id="s6">Interesting Functions</h1>`);
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
                    parts.push(`<details><summary>View decompiled pseudocode preview</summary>`);
                    parts.push(`<p class="pseudocode-warning">⚠️ This is Ghidra-generated pseudocode — not recovered source code. Auto-generated names (FUN_*) indicate unnamed functions.</p>`);
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
    parts.push(`<h1 id="s7">Dependencies</h1>`);
    if (result.dependencies.length > 0) {
        parts.push(ul(result.dependencies.map(d => codeTag(d))));
    }
    else {
        parts.push(`<p><em>No import table found.</em></p>`);
    }
    // ── 9. Unknowns / Actionable Questions ────────────────────────────────────
    parts.push(`<h1 id="s8">Unknowns</h1>`);
    parts.push(`<p style="color:#8b949e;font-size:13px">Unknowns are evidence gaps — they represent actionable questions for further investigation, not analysis failures.</p>`);
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
    parts.push(`<h1 id="s9">Modernization</h1>`);
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
    parts.push(`<h1 id="s10">Limitations</h1>`);
    parts.push(ul(result.limitations.map(l => `<span class="limitation">${esc(l)}</span>`)));
    // ── 12. Evidence Index ─────────────────────────────────────────────────────
    const evidenceByKind = {};
    for (const ev of result.evidence) {
        evidenceByKind[ev.kind] = (evidenceByKind[ev.kind] ?? 0) + 1;
    }
    parts.push(`<h1 id="s11">Evidence</h1>`);
    parts.push(`<p style="color:#8b949e;font-size:13px"><strong style="color:#c9d1d9">${result.evidence.length}</strong> evidence items collected.</p>`);
    parts.push(`<table><thead><tr><th>Kind</th><th style="text-align:right">Count</th></tr></thead><tbody>`);
    for (const [kind, count] of Object.entries(evidenceByKind).sort()) {
        parts.push(`<tr><td>${esc(kind)}</td><td style="text-align:right;font-family:'Cascadia Code',Consolas,monospace">${count}</td></tr>`);
    }
    parts.push(`</tbody></table>`);
    // Bounded detailed evidence table
    const displayedEvidence = result.evidence.slice(0, MAX_EVIDENCE_ROWS);
    const omittedEvidence = result.evidence.length - displayedEvidence.length;
    parts.push(`<h2>Evidence Detail</h2>`);
    parts.push(`<table><thead><tr><th>ID</th><th>Kind</th><th>Tool</th><th>Location</th><th>Summary</th></tr></thead><tbody>`);
    for (const ev of displayedEvidence) {
        const loc = ev.location
            ? (ev.location.address ?? ev.location.functionAddress ?? (ev.location.offset !== undefined ? `+0x${ev.location.offset.toString(16)}` : ''))
            : '';
        const summary = truncate(ev.summary, MAX_EVIDENCE_SUMMARY_LEN);
        parts.push(`<tr><td>${codeTag(ev.id)}</td><td>${esc(ev.kind)}</td><td>${esc(ev.sourceTool)}</td><td>${codeTag(String(loc))}</td><td>${esc(summary)}</td></tr>`);
    }
    parts.push(`</tbody></table>`);
    if (omittedEvidence > 0) {
        parts.push(`<p style="color:#57606a;font-size:12px;font-style:italic">…${omittedEvidence} additional evidence items omitted. See canonical JSON for full detail.</p>`);
    }
    parts.push(`<footer><p style="margin:0">Made with IBM Bob</p><p style="margin:4px 0 0">Code Archaeologist &nbsp;·&nbsp; Built by Xalapa Team</p></footer>`);
    parts.push(`</body></html>`);
    return parts.join('\n');
}
//# sourceMappingURL=htmlReport.js.map