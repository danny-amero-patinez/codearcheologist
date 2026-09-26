# Testing Contract

This document specifies the **externally observable behavior** of the Code Archaeologist API. A test suite built from this document alone should be able to verify any conforming implementation without reading `src/`.

**Safety invariant:** Static analysis does **not** establish that a binary is safe. The binary is **never executed**.

---

## Contract Invariants

These invariants hold for every request and response:

1. **Error envelope.** Every error response body has the shape `{ "error": { "code": string, "message": string, "details"?: any } }`.
2. **`Content-Type: application/json`** for all JSON responses.
3. **UUID stability.** The `id` returned by `POST /api/v1/analyses/binary` never changes for the lifetime of the analysis.
4. **Status monotonicity.** Once `status` is `completed`, `partial`, or `failed`, it never changes on subsequent polls.
5. **All `CanonicalResult` top-level keys present.** Even if arrays are empty, the keys must not be absent.
6. **Evidence ID referential integrity.** Every `evidenceId` in `capabilities`, `candidateComponents`, `externalInteractions`, `modernization`, or `interestingFunctions` must resolve to an entry in `result.evidence[]`.
7. **`classification: "observed"` on all evidence.** No evidence record may have `classification` other than `"observed"`.
8. **`classification: "inferred"` on all Inference objects.** No `Inference` record may have `classification` other than `"inferred"`.
9. **PE evidence on Ghidra failure.** When `coverage.ghidra = false` and `coverage.peParser = true`, the result's `evidence[]` must contain PE-sourced records (`pe-parser` source). They must not disappear.

---

## Happy-Path Lifecycle

### TC-HP-01: Full successful analysis

**Precondition:** Server is running. Ghidra is available (`tools` endpoint confirms it).

1. `GET /api/v1/health` → `200`, body `{ "status": "ok" }`.
2. `POST /api/v1/analyses/binary` with a valid PE file as field `file` → `202`.
   - Response body is `AnalysisMeta` with `status: "queued"`.
   - Response body contains a `phases` array with 8 entries.
   - Response body `id` is a UUID v4.
3. `GET /api/v1/analyses/{id}` → `200` while `status` is active.
   - Response `status` is one of: `queued | preparing | extracting | decompiling | correlating | reporting`.
4. Poll until `status` is terminal. Expect `completed` for a valid PE with Ghidra available.
5. `GET /api/v1/analyses/{id}/result` → `200`.
   - `result.analysis.id` equals the `id` from step 2.
   - `result.analysis.status` is `"completed"`.
   - `result.coverage.peParser` is `true`.
   - `result.coverage.strings` is `true`.
   - `result.coverage.ghidra` is `true`.
   - `result.evidence` is non-empty.
   - `result.binary.originalFilename` equals the uploaded filename.

**Expected duration:** < 5 minutes end-to-end.

---

### TC-HP-02: Ghidra-not-configured analysis (partial result)

**Precondition:** Server is running. `GHIDRA_HOME` is not set.

1. Upload a valid PE file → `202`.
2. Poll to terminal. Expect `status: "partial"`.
3. `GET /api/v1/analyses/{id}/result` → `200`.
   - `result.coverage.ghidra` is `false`.
   - `result.coverage.ghidraError` is a non-empty string.
   - `result.coverage.peParser` is `true`.
   - `result.evidence` contains items with `sourceTool: "pe-parser"`.
   - `result.evidence` contains items with `sourceTool: "strings"`.
   - `result.evidence` contains **no** items with `sourceTool: "ghidra"`.
   - `result.interestingFunctions` is `[]`.
   - `result.limitations` contains at least one entry.

---

## Invalid Upload Cases

### TC-INV-01: No `file` field

`POST /api/v1/analyses/binary` with an empty body or body missing the `file` field.

- Response: `400`
- `error.code`: `"VALIDATION_ERROR"`

### TC-INV-02: File too large

`POST /api/v1/analyses/binary` with a file exceeding `MAX_BINARY_BYTES`.

- Response: `413`
- `error.code`: `"FILE_TOO_LARGE"`

### TC-INV-03: Non-PE file

`POST /api/v1/analyses/binary` with a file that does not begin with the MZ signature (`0x4D 0x5A`).

- Response: `422`
- `error.code`: `"UNPROCESSABLE_BINARY"`

### TC-INV-04: Non-multipart request

`POST /api/v1/analyses/binary` with `Content-Type: application/json` and a JSON body.

- Response: `400`
- `error.code`: `"VALIDATION_ERROR"`

---

## Not-Found Cases

### TC-NF-01: Unknown analysis ID

`GET /api/v1/analyses/00000000-0000-0000-0000-000000000000`

- Response: `404`
- `error.code`: `"NOT_FOUND"`

### TC-NF-02: Unknown evidence ID

`GET /api/v1/analyses/{id}/evidence/evd-99999` (where `evd-99999` does not exist in the analysis)

- Response: `404`
- `error.code`: `"NOT_FOUND"`

### TC-NF-03: Result not found

`GET /api/v1/analyses/00000000-0000-0000-0000-000000000000/result`

- Response: `404`
- `error.code`: `"NOT_FOUND"`

---

## Error Envelope Contract

### TC-ERR-01: Error envelope shape

For any error response (4xx or 5xx), the response body must have:

```json
{
  "error": {
    "code": "<string>",
    "message": "<string>"
  }
}
```

- `error.code` must be a non-empty string.
- `error.message` must be a non-empty string.
- `error.details` is optional and may be omitted or null.

---

## Polling Contract

### TC-POLL-01: Status progression

1. Immediately after upload: `status` is `queued` or `preparing`.
2. During extraction: `status` is `extracting`.
3. During Ghidra: `status` is `decompiling`.
4. During correlation/inference/reconstruction/reporting: `status` is `correlating` or `reporting`.
5. After completion: `status` is `completed`, `partial`, or `failed`. **Never returns to an active status.**

### TC-POLL-02: Phase record completeness

The `phases` array in every `AnalysisMeta` response must contain exactly 8 entries — one per `AnalysisPhase` value — in order:
`intake`, `profiling`, `extracting`, `ghidra-analysis`, `correlating`, `inferring`, `reconstructing`, `reporting`.

### TC-POLL-03: Completed phases have timestamps

Any phase with `status: "completed"` must have:
- `startedAt` set to a valid ISO 8601 string
- `completedAt` set to a valid ISO 8601 string
- `durationMs` set to a non-negative integer

### TC-POLL-04: Result not ready during processing

`GET /api/v1/analyses/{id}/result` when `status` is `extracting` (not terminal):

- Response: `409`
- `error.code`: `"ANALYSIS_NOT_READY"`

### TC-POLL-05: Result unavailable after failure

`GET /api/v1/analyses/{id}/result` when `status` is `failed`:

- Response: `410`
- `error.code`: `"ANALYSIS_FAILED"`

---

## Partial Result Contract

### TC-PART-01: Partial status only when PE evidence exists

A `partial` result can only occur when `coverage.peParser = true`. If PE parsing itself failed, the status must be `failed`, not `partial`.

### TC-PART-02: No Ghidra evidence in partial result

When `coverage.ghidra = false`, no item in `result.evidence[]` may have `sourceTool: "ghidra"`.

### TC-PART-03: PE evidence not lost on Ghidra failure

When `status = "partial"`:
- `result.evidence` must contain items with `sourceTool: "pe-parser"` (imports, sections, metadata).
- The count of PE evidence items must equal what was extracted during the `profiling` phase.

### TC-PART-04: Ghidra phase skipped vs. failed distinction

When `GHIDRA_HOME` is not configured:
- The `ghidra-analysis` `PhaseRecord.status` is `"skipped"`, not `"failed"`.
- `coverage.ghidra = false`.
- The overall analysis `status` is still `"partial"` (not `"completed"`).

When Ghidra is configured but the process fails/times out:
- The `ghidra-analysis` `PhaseRecord.status` is `"failed"`.
- `PhaseRecord.error` is set to a non-empty string.
- `coverage.ghidra = false` and `coverage.ghidraError` is set.

---

## Evidence Behavior

### TC-EVD-01: Evidence IDs are stable

Two calls to `GET /api/v1/analyses/{id}/result` for the same analysis must return evidence items with identical `id` values in the same order.

### TC-EVD-02: Evidence `classification` is always `"observed"`

Every item in `result.evidence[]` must have `classification: "observed"`.

### TC-EVD-03: Evidence detail endpoint returns same data

The evidence item returned by `GET /api/v1/analyses/{id}/evidence/{evidenceId}` must be identical to the corresponding item in `result.evidence[]`.

### TC-EVD-04: Referential integrity

For each `evidenceId` referenced by any object in the result, there must be a corresponding entry in `result.evidence[]`. No dangling references.

---

## Report Behavior

### TC-RPT-01: JSON report equals result

`GET /api/v1/analyses/{id}/report?format=json` must return a body identical to `GET /api/v1/analyses/{id}/result`.

### TC-RPT-02: Markdown report is non-empty

`GET /api/v1/analyses/{id}/report?format=markdown` must return a non-empty string. `Content-Type` must be `text/markdown`.

### TC-RPT-03: HTML report is non-empty

`GET /api/v1/analyses/{id}/report?format=html` must return a non-empty string beginning with `<!DOCTYPE html>` or `<html`. `Content-Type` must be `text/html`.

### TC-RPT-04: Invalid format

`GET /api/v1/analyses/{id}/report?format=pdf`:

- Response: `400`
- `error.code`: `"VALIDATION_ERROR"`

---

## Anti-Overclaim Acceptance Criteria

These criteria verify that the anti-overclaim rules from [`EVIDENCE_AND_INFERENCE.md`](./EVIDENCE_AND_INFERENCE.md) are enforced:

### TC-AOC-01: SendMessageW is not network evidence

Given a binary that imports `SendMessageW` but no Winsock/WinHTTP/WinInet APIs:

- `result.externalInteractions` must contain **no** entry with `kind: "network"`.
- `result.capabilities` must contain **no** inference with `category: "network"` citing only `SendMessageW`.

### TC-AOC-02: One URL string is not medium/high network confidence

Given a binary with a single URL string and no network API imports:

- Any network `Inference` in `result.capabilities` must have `confidence: "low"`.

### TC-AOC-03: Generic auth strings are not high-confidence authentication

Given a binary with strings `"Password"`, `"Username"` but no credential API imports:

- Any authentication `Inference` must have `confidence` of `"low"` or `"medium"`, not `"high"`.

### TC-AOC-04: Generic SQL strings are not high-confidence database

Given a binary with strings containing `"SELECT"` and `"FROM"` but no ODBC/ADO imports:

- Any database `Inference` must have `confidence: "low"`.

### TC-AOC-05: CryptAcquireContextW alone is not encryption

Given a binary that imports only `CryptAcquireContextW` from `ADVAPI32.dll`:

- `result.capabilities` must **not** contain a `high`-confidence encryption `Inference` citing only that import.

### TC-AOC-06: Registry APIs alone are not installer evidence

Given a binary with `RegOpenKeyExW` and `RegSetValueExW` imports but no installer metadata strings:

- `result.capabilities` must **not** contain an installer `Inference`.

### TC-AOC-07: CreateFileW alone is not config-file evidence

Given a binary with only `CreateFileW` and no config-filename strings:

- `result.capabilities` must **not** contain a `medium` or `high` confidence config-file `Inference`.

### TC-AOC-08: High entropy is not flagged as malicious

Given a binary with high overall entropy but no other indicators:

- No `Inference` or risk item may use language asserting the binary is packed or malicious.
- Any mention of entropy must use qualified language ("may indicate").

### TC-AOC-09: Digital signature is not a safety claim

Given a binary with `hasSignature: true`:

- `result.risks[]` must **not** contain any statement that the binary is safe due to its signature.
- `result.capabilities[]` must **not** cite `hasSignature` as evidence of safety.

### TC-AOC-10: FUN_* names are not presented as meaningful

Given a result containing `interestingFunctions` with `autoGenerated: true` entries:

- Rationale text in `capabilities` and `candidateComponents` must not present `FUN_*` names as if they were original source symbols.

---

## Phase 0 Acceptance Gate

Before Phase 0 is considered complete, verify:

1. `openapi.yaml`, `docs/`, and `examples/` are mutually consistent.
2. Every endpoint documented in `docs/API_CONTRACT.md` has a corresponding path in `openapi.yaml`.
3. Every fixture file in `examples/` validates against its corresponding schema in `openapi.yaml`.
4. All enum values used in fixtures match the enum definitions in `openapi.yaml` and `docs/DOMAIN_MODEL.md`.
5. All `evidenceId` references in `examples/analysis-result.json` resolve to entries in the `evidence` array of the same file.
6. A developer with only `docs/`, `examples/`, and `openapi.yaml` can build a mock server that passes the test cases in this document.
7. No fixture uses "VeraCrypt" as the example binary. All examples use the fictional `LegacySalesApp.exe`.
