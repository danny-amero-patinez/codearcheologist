# Integration Guide

This guide is for a frontend developer (or mock-server author) who has **no access to the backend source code** and no running backend. Everything you need to build a client, mock server, or black-box test suite is in this document and the files it references.

---

## Base URL and Versioning

```
http://{HOST}:{PORT}/api/v1
```

Default: `http://127.0.0.1:3000/api/v1`

All endpoints are under `/api/v1`. There is no other API version currently.

---

## No Authentication

Phase 0 requires no authentication headers. All endpoints are open.

---

## Upload Flow

### Step 1: POST the binary

```http
POST /api/v1/analyses/binary
Content-Type: multipart/form-data

[form field: file = <binary file bytes>]
```

The multipart field name **must** be `file`. Any other field name will result in a `400 VALIDATION_ERROR`.

**Constraints:**
- Maximum file size: 100 MB (configurable server-side)
- File must be a Windows PE binary (MZ header). Non-PE files return `422 UNPROCESSABLE_BINARY`.

**Successful response: `202 Accepted`**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "queued",
  "createdAt": "2024-11-15T14:22:00.000Z",
  "updatedAt": "2024-11-15T14:22:00.000Z",
  "originalFilename": "LegacySalesApp.exe",
  "storedFilename": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.bin",
  "fileSizeBytes": 2097152,
  "sha256": "e3b0c44298fc1c149afb...",
  "phases": [...]
}
```

**Save the `id` field.** This is the analysis UUID you will use for all subsequent requests.

---

### Step 2: Poll for status

```http
GET /api/v1/analyses/{id}
```

Repeat at 2–5 second intervals until `status` is one of the **terminal statuses**.

**Terminal statuses:** `completed` | `partial` | `failed`

**Active statuses (keep polling):** `queued` | `preparing` | `extracting` | `decompiling` | `correlating` | `reporting`

**Example response during processing:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "decompiling",
  "phases": [
    { "phase": "intake",          "status": "completed", "durationMs": 120 },
    { "phase": "profiling",       "status": "completed", "durationMs": 890 },
    { "phase": "extracting",      "status": "completed", "durationMs": 3200 },
    { "phase": "ghidra-analysis", "status": "running",   "startedAt": "2024-11-15T14:22:05.000Z" },
    { "phase": "correlating",     "status": "pending" },
    { "phase": "inferring",       "status": "pending" },
    { "phase": "reconstructing",  "status": "pending" },
    { "phase": "reporting",       "status": "pending" }
  ]
}
```

---

### Step 3: Handle the terminal status

| Terminal status | Meaning | Next step |
|---|---|---|
| `completed` | All phases succeeded; full result available | Fetch result |
| `partial` | Ghidra failed; result based on PE + string evidence only | Fetch result (partial) |
| `failed` | Fatal pipeline failure; no result | Display `errorMessage` to user |

For `failed`, read `errorMessage` from the `AnalysisMeta` response body.

---

### Step 4: Retrieve the result

```http
GET /api/v1/analyses/{id}/result
```

Returns a `CanonicalResult` JSON object.

**Only call this endpoint after the analysis is `completed` or `partial`.** If called while still processing, the server returns `409 ANALYSIS_NOT_READY`. If called after `failed`, the server returns `410 ANALYSIS_FAILED`.

---

## CanonicalResult Structure

The result top-level shape is always:

```json
{
  "analysis": { /* AnalysisMeta */ },
  "binary": { /* BinaryProfile */ },
  "coverage": { /* ToolCoverage */ },
  "evidence": [ /* Evidence[] */ ],
  "capabilities": [ /* Inference[] */ ],
  "candidateComponents": [ /* CandidateResponsibility[] */ ],
  "externalInteractions": [ /* ExternalInteraction[] */ ],
  "dependencies": [ /* string[] */ ],
  "interestingFunctions": [ /* FunctionProfile[] */ ],
  "unknowns": [ /* Unknown[] */ ],
  "risks": [ /* string[] */ ],
  "modernization": [ /* ModernizationRecommendation[] */ ],
  "limitations": [ /* string[] */ ]
}
```

All top-level keys are always present. Arrays may be empty.

For a `partial` analysis, expect:
- `coverage.ghidra = false` and `coverage.ghidraError` set
- `interestingFunctions` may be empty
- Evidence sourced from `ghidra` will be absent
- `capabilities`, `candidateComponents` may be shorter or empty (fewer inferences without Ghidra)

---

## Retrieving Individual Evidence

```http
GET /api/v1/analyses/{id}/evidence/{evidenceId}
```

Returns a single `Evidence` object. Use evidence IDs from `CanonicalResult.evidence[].id`.

Useful for drilling down into the raw data behind an inference or candidate component.

---

## Retrieving Reports

```http
GET /api/v1/analyses/{id}/report?format=json
GET /api/v1/analyses/{id}/report?format=markdown
GET /api/v1/analyses/{id}/report?format=html
```

| `format` | Response `Content-Type` | Use case |
|---|---|---|
| `json` | `application/json` | Same as `/result`; programmatic use |
| `markdown` | `text/markdown` | Human-readable export |
| `html` | `text/html` | Browser display / email |

If `format` is omitted, it defaults to `json`.

---

## Utility Endpoints

### Health check

```http
GET /api/v1/health
```

Returns `{ "status": "ok", "timestamp": "..." }`. Use for liveness probes.

### Diagnostics

```http
GET /api/v1/diagnostics
```

Returns Node.js version, platform, and Ghidra/Java availability. Useful for debugging configuration issues.

### Tool availability

```http
GET /api/v1/tools
```

Returns an array of tool availability records. Check `ghidra.available` to know ahead of time whether Ghidra analysis will run.

---

## Partial Result Handling

When `analysis.status = "partial"`:

1. `coverage.ghidra = false` — Ghidra did not complete.
2. `coverage.ghidraError` — contains the failure reason.
3. `evidence[]` — contains only `pe-parser` and `strings` sourced items.
4. `interestingFunctions` — will be empty.
5. `capabilities` and `candidateComponents` — may be present but will reflect only what can be inferred from PE + string evidence (generally lower confidence, fewer inferences).
6. `limitations[]` — will contain at least one entry describing the Ghidra failure.

**Treat `partial` as a degraded-but-useful result.** Do not treat it as a failure.

---

## Developing Against Fixtures / Mocks

All fixtures in `examples/` conform to the openapi.yaml schema. To develop without a backend:

1. Use the fixture files directly as mock API responses:
   - `examples/analysis-created.json` → `POST /api/v1/analyses/binary` response (`202`)
   - `examples/analysis-processing.json` → `GET /api/v1/analyses/{id}` during processing
   - `examples/analysis-completed.json` → `GET /api/v1/analyses/{id}` when complete
   - `examples/analysis-partial.json` → `GET /api/v1/analyses/{id}` when partial
   - `examples/analysis-failed.json` → `GET /api/v1/analyses/{id}` when failed
   - `examples/analysis-result.json` → `GET /api/v1/analyses/{id}/result`
   - `examples/evidence-detail.json` → `GET /api/v1/analyses/{id}/evidence/{evidenceId}`
   - `examples/error-response.json` → any error response

2. All fixtures use the same fictional binary (`LegacySalesApp.exe`) and the same UUID:
   ```
   a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```

3. Evidence IDs in `analysis-result.json` are internally consistent — every `evidenceId` reference resolves to an entry in the `evidence` array.

4. To mock the full polling lifecycle:
   - Return `analysis-created.json` on the first poll call
   - Return `analysis-processing.json` on intermediate calls
   - Return `analysis-completed.json` on the final call

5. To build a mock server: implement all endpoints listed in `openapi.yaml`. Return the fixture files for happy-path requests.

---

## Common Integration Mistakes

| Mistake | Correct approach |
|---|---|
| Using `analysis.status = "complete"` | Use `"completed"` (not `"complete"`) |
| Polling `/result` before status is terminal | Wait for `completed` or `partial` before calling `/result` |
| Using `components` as the field name | Use `candidateComponents` |
| Expecting Ghidra evidence in a `partial` result | Check `coverage.ghidra` first |
| Treating `hasSignature: true` as a safety indicator | Signature is a fact only, not a safety guarantee |
| Calling `/report` without `?format=` | Default is `json`; explicit is safer |
| Assuming `FUN_*` names are meaningful | They are Ghidra auto-generated placeholders |

---

## Type Reference

Full type definitions are in [`docs/DOMAIN_MODEL.md`](./DOMAIN_MODEL.md).
Full endpoint specification is in [`docs/API_CONTRACT.md`](./API_CONTRACT.md).
Full OpenAPI spec is in [`openapi.yaml`](../openapi.yaml).
