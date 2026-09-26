# Architecture

## Product Purpose

Code Archaeologist is a static-analysis REST service that accepts a Windows PE binary, runs a multi-phase analysis pipeline, and returns a structured report describing the binary's probable responsibilities, capabilities, external interactions, and modernization recommendations.

**Safety invariant:** The uploaded binary is **never executed**. All analysis is purely static. This tool cannot determine whether a binary is safe or malicious — it can only describe what the binary *appears to be designed to do* based on observable artifacts.

---

## High-Level Module Map

```
┌─────────────────────────────────────────────────────────────────┐
│  HTTP Layer  (src/app/)                                          │
│  Express app · middleware · routes (health, analyses)           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ calls
┌───────────────────────────▼─────────────────────────────────────┐
│  Analysis Orchestrator  (src/modules/analysis/)                  │
│  Drives the pipeline, owns the work directory, writes meta.json │
└──┬────────┬─────────────┬──────────────┬────────────────────────┘
   │        │             │              │
   ▼        ▼             ▼              ▼
Binary   Evidence      Ghidra        Inference / Reconstruction / Reporting
Profiler Extractor     Bridge        (src/modules/inference/,
(binary/) (evidence/)  (ghidra/)      src/modules/reconstruction/,
                                      src/modules/reporting/)
```

### Dependency Direction

```
app → analysis → binary, evidence, ghidra, inference, reconstruction, reporting
                 ↓
             shared/types, shared/errors, shared/logger
```

No module may import from `app`. `shared` has no upstream dependencies.

---

## Modules

### `src/app/`
Express HTTP layer. Routes, middleware (request logging, error handling). Does **not** contain business logic.

### `src/modules/analysis/`
Pipeline orchestrator. Creates the work directory, writes `meta.json`, advances `AnalysisStatus`, invokes sub-modules in order, handles graceful degradation.

### `src/modules/binary/`
**PE Parser.** Reads PE headers, sections, imports, exports, version info. Produces a `BinaryProfile` and raw PE `Evidence` records. This module **must not fail fatally** — even partial PE data is preferable to an error.

### `src/modules/evidence/`
**String Extractor.** Scans the binary for printable ASCII and UTF-16LE strings. Categorises each string by heuristic rules. Produces `Evidence` records with `kind: 'string'`. Bounded by `MAX_STRINGS` config.

### `src/modules/ghidra/`
**Ghidra Bridge.** Runs a headless Ghidra analysis via a child process, using `CodeArchaeologistScript.java`. Produces `function`, `function-call`, `decompilation`, and `reference` evidence. This module **may fail gracefully** — see the Ghidra Boundary section.

### `src/modules/inference/`
Applies inference rules to evidence. Produces `Inference` (capability) records. Each inference must cite `evidenceIds` and carry a `confidence` rating. Never infers beyond what the evidence warrants.

### `src/modules/reconstruction/`
Clusters inferences and evidence into `CandidateResponsibility` objects. Groups `ExternalInteraction` records. Produces `Unknown` records for gaps. These are **candidate** groupings, not proven architecture.

### `src/modules/reporting/`
Assembles the final `CanonicalResult`. Produces JSON, Markdown, and HTML report formats. Writes artefacts to the work directory.

---

## Work Directory Layout

Each analysis owns a directory at `{WORK_DIR}/{analysisId}/`:

```
{WORK_DIR}/{analysisId}/
  meta.json          ← AnalysisMeta (status, phases, timestamps, file info)
  binary/            ← uploaded binary (stored under storedFilename)
  artifacts/
    binary-profile.json
    strings.json
    ghidra-output.json   (if Ghidra succeeded)
    evidence.json
    inferences.json
    result.json          ← CanonicalResult
    report.md
    report.html
```

The `analysisId` is a UUID v4. It is used as the work directory name, the `id` field in `meta.json`, and in all API response `id` fields. **One canonical ID everywhere.**

---

## Analysis Pipeline

See [`ANALYSIS_PIPELINE.md`](./ANALYSIS_PIPELINE.md) for phase-by-phase detail.

Phases in order:
1. `intake` — validate upload, store binary, assign UUID, write initial `meta.json`
2. `profiling` — run PE parser, extract `BinaryProfile`
3. `extracting` — extract and categorise strings
4. `ghidra-analysis` — run Ghidra headless (may be skipped if Ghidra unavailable)
5. `correlating` — correlate evidence records across tools
6. `inferring` — apply inference rules, produce capabilities
7. `reconstructing` — produce candidate responsibilities, external interactions, unknowns
8. `reporting` — assemble and write `CanonicalResult` and formatted reports

---

## Ghidra Boundary

Ghidra is an **optional enrichment layer**. The pipeline can produce a useful (though limited) result without it.

- If `GHIDRA_HOME` is not configured, the `ghidra-analysis` phase is **skipped**.
- If Ghidra is configured but the process fails, times out, or returns an error, the phase is marked `failed`.
- When `ghidra-analysis` fails: the analysis status becomes `partial` (not `failed`), provided at least PE or string evidence exists.
- PE evidence and string evidence gathered before the Ghidra phase **must not be discarded** on Ghidra failure.

---

## Reconstruction Boundary

Reconstruction produces **candidate** groupings. The word "candidate" is non-negotiable:
- These are plausible groupings, not proven software components.
- Every `CandidateResponsibility` exposes a `confidence` level and a `rationale` array distinguishing `observed` facts from `inferred` conclusions.
- Limitations must be listed explicitly.

---

## Reporting Boundary

- `CanonicalResult` is the single source of truth for report content.
- Reports (JSON / Markdown / HTML) are derived views — they must not introduce new facts.
- The reporting module writes artefacts to `artifacts/` inside the work directory.

---

## Failure Model

| Scenario | Status | Fatal? |
|---|---|---|
| File too large / not a valid PE | `failed` | Yes |
| Ghidra unavailable (not configured) | phase `skipped`, analysis continues | No |
| Ghidra process error/timeout | phase `failed`, analysis → `partial` | No |
| PE parser crashes | `failed` | Yes |
| String extractor crashes | `failed` | Yes (insufficient evidence) |
| Inference engine crashes | `failed` | Yes |
| Reconstruction crashes | `failed` | Yes |
| Reporting crashes | `failed` | Yes |

An analysis can only reach `partial` if both PE profiling and string extraction succeeded but Ghidra failed.

---

## Important Invariants

1. **UUID immutability.** The analysis ID assigned at intake never changes.
2. **No binary execution.** The binary is stored and read, never spawned.
3. **PE evidence persistence.** Ghidra failure must not cause PE or string evidence to be lost.
4. **No overclaiming.** Inference rules must produce the lowest confidence level that the evidence warrants. See [`EVIDENCE_AND_INFERENCE.md`](./EVIDENCE_AND_INFERENCE.md) for anti-overclaim rules.
5. **Status monotonicity.** Status transitions are one-directional: a terminal status (`completed`, `partial`, `failed`) is never changed.
6. **candidateComponents vs. CandidateResponsibility.** The API field name is `candidateComponents`; the domain type name is `CandidateResponsibility`. These refer to the same objects.
7. **Digital signature ≠ trust.** A signed binary is not necessarily safe. The system must never infer safety from the presence of a digital signature.
8. **High entropy ≠ packed/malicious.** Entropy is a signal, not a conclusion.
