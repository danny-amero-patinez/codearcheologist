# Analysis Pipeline

This document describes each phase of the Code Archaeologist analysis pipeline in detail: purpose, inputs, outputs, status transitions, failure behavior, and bounds.

**Safety invariant:** The uploaded binary is **never executed**. All phases operate on file reads and external tooling that operates on the binary's static contents.

---

## Overview

The pipeline consists of eight sequential phases:

| # | Phase | `AnalysisStatus` during | Description |
|---|---|---|---|
| 1 | `intake` | `queued` → `preparing` | Validate and store the upload |
| 2 | `profiling` | `preparing` → `extracting` | Parse PE headers |
| 3 | `extracting` | `extracting` | Extract and categorise strings |
| 4 | `ghidra-analysis` | `decompiling` | Run Ghidra headless (optional) |
| 5 | `correlating` | `correlating` | Correlate evidence across tools |
| 6 | `inferring` | `reporting` | Apply inference rules |
| 7 | `reconstructing` | `reporting` | Cluster into responsibilities |
| 8 | `reporting` | `reporting` → terminal | Assemble and write result |

Each phase writes a `PhaseRecord` to `meta.json`. The orchestrator updates `AnalysisMeta.status` as phases advance.

---

## Phase 1: `intake`

### Purpose
Accept and validate the uploaded binary. Assign a canonical UUID. Initialise the work directory.

### AnalysisStatus
- Entry: `queued`
- While running: `preparing`
- On success: advances to phase 2

### Inputs
- Multipart upload with field name `file`
- `MAX_BINARY_BYTES` configuration limit (default 100 MB)

### Steps
1. Receive the uploaded file from the HTTP layer.
2. Check file size against `MAX_BINARY_BYTES`. If exceeded, reject with `413 FILE_TOO_LARGE`.
3. Read the first two bytes. If they are not `MZ` (0x4D 0x5A), reject with `422 UNPROCESSABLE_BINARY`.
4. Compute SHA-256 digest.
5. Generate UUID v4 as the `analysisId`.
6. Create work directory: `{WORK_DIR}/{analysisId}/binary/`.
7. Write the binary to `{WORK_DIR}/{analysisId}/binary/{analysisId}.bin`.
8. Write initial `meta.json` with `status: "preparing"`, phase records with all phases at `pending` except `intake` at `completed`.

### Outputs
- Work directory created
- Binary stored as `storedFilename`
- `meta.json` written with `status: "preparing"`

### Failure Behavior
- **Fatal.** If intake fails (file too large, not PE, disk error), the analysis never starts. HTTP error returned synchronously. No work directory may be left behind.

### Timeouts / Bounds
- The HTTP upload timeout governs file receive time.
- SHA-256 computation is bounded by file size (`MAX_BINARY_BYTES`).

---

## Phase 2: `profiling`

### Purpose
Parse the PE binary structure to produce a `BinaryProfile` and raw PE evidence records.

### AnalysisStatus
- While running: `preparing`

### Inputs
- Stored binary at `{WORK_DIR}/{analysisId}/binary/{analysisId}.bin`

### Steps
1. Parse PE headers (DOS header, NT headers, optional header, section table).
2. Parse imports directory — DLL names and imported function names.
3. Parse exports directory — exported function names and ordinals.
4. Parse version info resource if present.
5. Detect Authenticode signature presence (boolean only; do not verify).
6. Compute per-section Shannon entropy.
7. Compute whole-file Shannon entropy.
8. Emit an `Evidence` record per import entry (`kind: "import"`), per section (`kind: "pe-section"`), per export (`kind: "export"`), and one top-level `kind: "binary-metadata"` record.
9. Write `artifacts/binary-profile.json`.

### Outputs
- `BinaryProfile` object
- `Evidence[]` with kinds: `binary-metadata`, `pe-section`, `import`, `export`, `metadata`
- `artifacts/binary-profile.json`

### Failure Behavior
- **Fatal.** A PE parser failure means the file cannot be characterised at all. Analysis transitions to `failed`.

### Timeouts / Bounds
- Expected: < 5 seconds for any binary under `MAX_BINARY_BYTES`.
- No external processes are spawned.

---

## Phase 3: `extracting`

### Purpose
Scan the binary for printable strings and categorise them.

### AnalysisStatus
- While running: `extracting`

### Inputs
- Stored binary
- `MAX_STRINGS` configuration limit (default 5 000)

### Steps
1. Scan the binary for contiguous sequences of printable ASCII (≥ 4 characters).
2. Scan for contiguous sequences of UTF-16LE printable characters (≥ 4 characters).
3. Assign a `StringCategory` to each string using heuristic pattern matching (URL patterns, registry path patterns, SQL keyword patterns, etc.).
4. Record the file offset and containing PE section (if determinable) for each string.
5. Apply `MAX_STRINGS` cap: prioritise strings from `.rdata`, `.data`, version info. If the cap is reached, record a warning in the phase.
6. Emit one `Evidence` record per string (`kind: "string"`).
7. Write `artifacts/strings.json`.

### Outputs
- `Evidence[]` with `kind: "string"` and `data` of type `ExtractedString`
- `artifacts/strings.json`

### Failure Behavior
- **Fatal.** String extraction is a core evidence source. Failure transitions analysis to `failed`.

### Timeouts / Bounds
- Expected: < 15 seconds for a 100 MB binary.
- Bounded by `MAX_STRINGS` to prevent memory exhaustion.

---

## Phase 4: `ghidra-analysis`

### Purpose
Run Ghidra headless to produce function-level evidence: function profiles, call edges, cross-references, and decompilation snippets.

### AnalysisStatus
- While running: `decompiling`

### Inputs
- Stored binary
- `GHIDRA_HOME` environment variable (path to Ghidra installation)
- `GHIDRA_TIMEOUT_MS` configuration (default 180 000 ms = 3 minutes)
- `MAX_GHIDRA_FUNCTIONS` configuration (default 20 interesting functions)
- `CodeArchaeologistScript.java` bundled at `src/modules/ghidra/scripts/`

### Steps
1. Check `GHIDRA_HOME` is set and the Ghidra executable exists. If not, **skip** this phase (`PhaseRecord.status = "skipped"`).
2. Launch `analyzeHeadless` as a child process with the bundled script.
3. Wait up to `GHIDRA_TIMEOUT_MS` for completion.
4. On success: parse the JSON output from the script.
5. Select up to `MAX_GHIDRA_FUNCTIONS` interesting functions using the selection score algorithm.
6. Emit `Evidence` records: `kind: "function"`, `kind: "function-call"`, `kind: "reference"`, `kind: "decompilation"`.
7. Write `artifacts/ghidra-output.json`.

### Outputs (on success)
- `Evidence[]` with kinds: `function`, `function-call`, `reference`, `decompilation`
- `FunctionProfile[]` (up to `MAX_GHIDRA_FUNCTIONS` entries)
- `artifacts/ghidra-output.json`

### Failure Behavior (critical — graceful degradation)
- If `GHIDRA_HOME` is not set: phase is `skipped`. Analysis continues normally.
- If the Ghidra process fails, crashes, or times out:
  - `PhaseRecord.status = "failed"` with `error` message
  - **PE and string evidence already gathered MUST NOT be discarded.**
  - Analysis continues to phase 5 (`correlating`) using only PE and string evidence.
  - After phase 8 (`reporting`), analysis status becomes **`partial`** (not `failed`, not `completed`).
- A `ToolCoverage.ghidraError` is set to the failure reason.

### Timeouts / Bounds
- Hard timeout: `GHIDRA_TIMEOUT_MS` (default 3 minutes).
- Function limit: `MAX_GHIDRA_FUNCTIONS` (default 20).

---

## Phase 5: `correlating`

### Purpose
Cross-reference and deduplicate evidence across PE-parser, string extractor, and Ghidra outputs. Produce a unified, deduplicated evidence array.

### AnalysisStatus
- While running: `correlating`

### Inputs
- All evidence gathered from phases 2, 3, and 4

### Steps
1. Assign stable IDs to all evidence records (format: `evd-{n}` with zero-padded integer).
2. Deduplicate: remove duplicate import evidence (same DLL + function appearing in both PE import table and Ghidra API references). Prefer the PE-parser source.
3. Normalise call edges: for each `function-call` evidence record, resolve caller and callee addresses to function names where available.
4. Write `artifacts/evidence.json`.

### Outputs
- Merged, deduplicated `Evidence[]` with stable IDs
- `artifacts/evidence.json`

### Failure Behavior
- **Fatal.** Without a coherent evidence array, inference is impossible.

---

## Phase 6: `inferring`

### Purpose
Apply rule-based inference to the evidence array to produce `Inference` (capability) records.

### AnalysisStatus
- While running: `reporting`

### Inputs
- Unified `Evidence[]` from phase 5

### Steps
1. For each registered inference rule, scan the evidence array.
2. If a rule fires, emit an `Inference` with:
   - `ruleId` identifying the rule
   - `evidenceIds` citing the evidence
   - `confidence` determined by the rule's confidence logic
   - `rationale` explaining the reasoning
   - `limitations` stating what cannot be concluded
3. Write `artifacts/inferences.json`.

### Anti-Overclaim Rules
Rules must respect the constraints in [`EVIDENCE_AND_INFERENCE.md`](./EVIDENCE_AND_INFERENCE.md). In particular:
- `SendMessageW` / `SendDlgItemMessageW` → **NOT** network evidence
- One URL string → **NOT** medium/high network confidence
- Generic password/login strings → **NOT** high-confidence auth
- Generic SQL strings → **NOT** high-confidence database
- `CryptAcquireContextW` alone → **NOT** proof of application-level encryption
- Registry APIs alone → **NOT** installer behavior
- `CreateFileW` alone → **NOT** config-file behavior

### Outputs
- `Inference[]` (capabilities array in result)
- `artifacts/inferences.json`

### Failure Behavior
- **Fatal.** Inference failure prevents result assembly.

---

## Phase 7: `reconstructing`

### Purpose
Cluster inferences and evidence into `CandidateResponsibility` objects. Group `ExternalInteraction` records. Produce `Unknown` records for identified gaps.

### AnalysisStatus
- While running: `reporting`

### Inputs
- `Evidence[]` from phase 5
- `Inference[]` from phase 6

### Steps
1. For each candidate responsibility cluster, group related inferences and evidence.
2. Assign a human-readable `name` and `summary` to each cluster.
3. Set `confidence` based on the weakest inference in the cluster.
4. Populate `rationale` array with `observed`/`inferred`/`unknown` entries.
5. For each observed external system interaction, emit an `ExternalInteraction` record.
6. For each identifiable gap (e.g. no database driver found but SQL strings present), emit an `Unknown` record.
7. Generate `ModernizationRecommendation` records for significant modernization opportunities.

### Outputs
- `CandidateResponsibility[]` (as `candidateComponents` in result)
- `ExternalInteraction[]`
- `Unknown[]`
- `ModernizationRecommendation[]`

### Failure Behavior
- **Fatal.** Reconstruction failure prevents result assembly.

---

## Phase 8: `reporting`

### Purpose
Assemble the `CanonicalResult` and write formatted reports to disk.

### AnalysisStatus
- While running: `reporting`
- On success (all previous phases succeeded or Ghidra was only failure): `completed` or `partial`
- On failure: `failed`

### Inputs
- All outputs from phases 2–7
- `ToolCoverage` object

### Steps
1. Assemble `CanonicalResult` from all phase outputs.
2. Write `artifacts/result.json`.
3. Generate Markdown report; write `artifacts/report.md`.
4. Generate HTML report; write `artifacts/report.html`.
5. Update `meta.json`:
   - If Ghidra phase was `failed`: set `status = "partial"`
   - If all phases succeeded: set `status = "completed"`
6. Mark all active phase records as `completed` with timestamps.

### Terminal Status Logic

```
if ghidra-analysis.status == "failed" AND peParser evidence exists:
    analysisStatus = "partial"
else if all phases == "completed" or "skipped":
    analysisStatus = "completed"
else:
    analysisStatus = "failed"
```

### Outputs
- `artifacts/result.json`
- `artifacts/report.md`
- `artifacts/report.html`
- Updated `meta.json` with terminal status

### Failure Behavior
- **Fatal.** If reporting itself fails, status = `failed` and no result is available.

### Timeouts / Bounds
- Expected: < 5 seconds. No external processes.

---

## Phase Status Summary

| Phase | Fatal on failure | Graceful degradation |
|---|---|---|
| `intake` | Yes | No |
| `profiling` | Yes | No |
| `extracting` | Yes | No |
| `ghidra-analysis` | **No** | Yes — `partial` result |
| `correlating` | Yes | No |
| `inferring` | Yes | No |
| `reconstructing` | Yes | No |
| `reporting` | Yes | No |

---

## Configuration Bounds Summary

| Variable | Default | Effect |
|---|---|---|
| `MAX_BINARY_BYTES` | 104 857 600 (100 MB) | Maximum upload size |
| `MAX_STRINGS` | 5 000 | Cap on extracted strings |
| `MAX_GHIDRA_FUNCTIONS` | 20 | Cap on interesting functions selected |
| `GHIDRA_TIMEOUT_MS` | 180 000 (3 min) | Ghidra process timeout |
| `WORK_DIR` | `./work` | Base directory for analysis work dirs |
