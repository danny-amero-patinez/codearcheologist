# API Contract

## Base URL and Versioning

All endpoints are prefixed with `/api/v1`. There is no authentication requirement in Phase 0.

Default port: `3000` (configurable via `PORT` env var).
Default host: `127.0.0.1` (configurable via `HOST` env var).

Example base URL: `http://127.0.0.1:3000/api/v1`

---

## Content Negotiation

- All JSON request bodies: `Content-Type: application/json`
- File upload: `Content-Type: multipart/form-data`
- All JSON responses: `Content-Type: application/json`
- Markdown report response: `Content-Type: text/markdown`
- HTML report response: `Content-Type: text/html`

---

## Error Envelope

All error responses use the following envelope, regardless of status code:

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human-readable description",
    "details": {}
  }
}
```

`details` is optional and may contain additional diagnostic information.

### Error Codes

| HTTP Status | `error.code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request is malformed (missing field, wrong type) |
| 404 | `NOT_FOUND` | Analysis or evidence ID not found |
| 413 | `FILE_TOO_LARGE` | Uploaded binary exceeds `MAX_BINARY_BYTES` (default 100 MB) |
| 422 | `UNPROCESSABLE_BINARY` | File is not a valid PE binary |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 501 | `NOT_IMPLEMENTED` | Endpoint exists but is not yet implemented |

---

## Async / Polling Semantics

Binary analysis is asynchronous. The upload endpoint returns immediately with status `202 Accepted` and an `AnalysisMeta` object. The client polls `GET /api/v1/analyses/{id}` until the status reaches a terminal state.

**Terminal statuses:** `completed` | `partial` | `failed`

**Active statuses:** `queued` | `preparing` | `extracting` | `decompiling` | `correlating` | `reporting`

Once a terminal status is reached it never changes.

Recommended polling interval: 2–5 seconds. There is no server-sent-events or WebSocket push in this API version.

---

## Endpoints

---

### GET /api/v1/health

**Purpose:** Liveness check. Returns `200 OK` if the server is running.

**Request:** No parameters, no body.

**Response `200 OK`:**

```json
{
  "status": "ok",
  "timestamp": "2024-11-15T14:22:00.000Z"
}
```

| Field | Type | Description |
|---|---|---|
| `status` | `"ok"` | Always `"ok"` when this endpoint responds |
| `timestamp` | ISO 8601 string | Server time at response |

---

### GET /api/v1/diagnostics

**Purpose:** Returns environment and tool availability information for debugging.

**Request:** No parameters, no body.

**Response `200 OK`:**

```json
{
  "status": "ok",
  "node": "v20.11.0",
  "platform": "linux",
  "ghidra": {
    "status": "available",
    "version": "11.0",
    "home": "/opt/ghidra"
  },
  "java": {
    "status": "available",
    "version": "17.0.9"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `status` | `"ok"` | Always `"ok"` when this endpoint responds |
| `node` | string | Node.js version string |
| `platform` | string | OS platform |
| `ghidra.status` | `"available"` \| `"unavailable"` \| `"unchecked"` | Ghidra availability |
| `ghidra.version` | string? | Ghidra version if available |
| `ghidra.home` | string? | `GHIDRA_HOME` path if configured |
| `java.status` | `"available"` \| `"unavailable"` \| `"unchecked"` | Java availability |
| `java.version` | string? | Java version if available |

---

### GET /api/v1/tools

**Purpose:** Returns availability status for each analysis tool.

**Request:** No parameters, no body.

**Response `200 OK`:**

```json
{
  "tools": [
    { "name": "pe-parser",  "available": true },
    { "name": "strings",    "available": true },
    { "name": "ghidra",     "available": false, "reason": "GHIDRA_HOME not configured" }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `tools` | array | One entry per supported tool |
| `tools[].name` | `"pe-parser"` \| `"strings"` \| `"ghidra"` | Tool identifier |
| `tools[].available` | boolean | Whether the tool is ready |
| `tools[].reason` | string? | Present only when `available` is `false` |

---

### POST /api/v1/analyses/binary

**Purpose:** Submit a Windows PE binary for analysis.

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Form field name: **`file`** (required)
- The uploaded file must be a Windows PE binary (`.exe`, `.dll`, `.sys`, etc.)
- Maximum size: `MAX_BINARY_BYTES` (default 100 MB)

**Example `curl`:**
```
curl -X POST http://127.0.0.1:3000/api/v1/analyses/binary \
  -F "file=@LegacySalesApp.exe"
```

**Response `202 Accepted`** — analysis accepted, processing started:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "queued",
  "createdAt": "2024-11-15T14:22:00.000Z",
  "updatedAt": "2024-11-15T14:22:00.000Z",
  "originalFilename": "LegacySalesApp.exe",
  "storedFilename": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.bin",
  "fileSizeBytes": 2097152,
  "sha256": "e3b0c44298fc1c149afb....",
  "phases": [
    { "phase": "intake",         "status": "completed" },
    { "phase": "profiling",      "status": "pending" },
    { "phase": "extracting",     "status": "pending" },
    { "phase": "ghidra-analysis","status": "pending" },
    { "phase": "correlating",    "status": "pending" },
    { "phase": "inferring",      "status": "pending" },
    { "phase": "reconstructing", "status": "pending" },
    { "phase": "reporting",      "status": "pending" }
  ]
}
```

See [AnalysisMeta](#analysismeta-shape) for full field descriptions.

**Error Responses:**

| Status | `error.code` | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | No `file` field in the multipart body |
| 413 | `FILE_TOO_LARGE` | File exceeds `MAX_BINARY_BYTES` |
| 422 | `UNPROCESSABLE_BINARY` | File header does not match PE signature |

---

### GET /api/v1/analyses/{id}

**Purpose:** Poll the status and phase progress of an analysis.

**Path Parameter:**

| Name | Type | Description |
|---|---|---|
| `id` | UUID string | Analysis ID returned by the upload endpoint |

**Response `200 OK`:**

Returns an `AnalysisMeta` object. See [AnalysisMeta shape](#analysismeta-shape).

**Error Responses:**

| Status | `error.code` | Condition |
|---|---|---|
| 404 | `NOT_FOUND` | No analysis with the given ID exists |

---

### GET /api/v1/analyses/{id}/result

**Purpose:** Retrieve the full canonical result once the analysis is complete.

**Path Parameter:**

| Name | Type | Description |
|---|---|---|
| `id` | UUID string | Analysis ID |

**Precondition:** Analysis status must be `completed` or `partial`. Returns `404` if the analysis does not exist. Returns `409 Conflict` if the status is not yet terminal, or `410 Gone` if the status is `failed`.

**Response `200 OK`:**

Returns a `CanonicalResult` object. See [CanonicalResult shape](#canonicalresult-shape) and [`examples/analysis-result.json`](../examples/analysis-result.json).

**Error Responses:**

| Status | `error.code` | Condition |
|---|---|---|
| 404 | `NOT_FOUND` | Analysis ID does not exist |
| 409 | `ANALYSIS_NOT_READY` | Analysis is still in progress |
| 410 | `ANALYSIS_FAILED` | Analysis reached `failed` status; no result available |

---

### GET /api/v1/analyses/{id}/evidence/{evidenceId}

**Purpose:** Retrieve a single evidence item by its stable ID.

**Path Parameters:**

| Name | Type | Description |
|---|---|---|
| `id` | UUID string | Analysis ID |
| `evidenceId` | string | Evidence ID (stable, from the `evidence` array in `CanonicalResult`) |

**Response `200 OK`:**

Returns a single `Evidence` object. See [`examples/evidence-detail.json`](../examples/evidence-detail.json).

**Error Responses:**

| Status | `error.code` | Condition |
|---|---|---|
| 404 | `NOT_FOUND` | Analysis or evidence ID does not exist |
| 409 | `ANALYSIS_NOT_READY` | Analysis is still in progress |

---

### GET /api/v1/analyses/{id}/report

**Purpose:** Retrieve a formatted report for the analysis.

**Path Parameter:**

| Name | Type | Description |
|---|---|---|
| `id` | UUID string | Analysis ID |

**Query Parameter:**

| Name | Type | Default | Description |
|---|---|---|---|
| `format` | `"json"` \| `"markdown"` \| `"html"` | `"json"` | Report format |

**Responses:**

| `format` value | HTTP Status | `Content-Type` | Body |
|---|---|---|---|
| `json` | 200 | `application/json` | `CanonicalResult` JSON |
| `markdown` | 200 | `text/markdown` | Markdown report |
| `html` | 200 | `text/html` | HTML report |

**Error Responses:**

| Status | `error.code` | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Unknown `format` value |
| 404 | `NOT_FOUND` | Analysis ID does not exist |
| 409 | `ANALYSIS_NOT_READY` | Analysis is still in progress |
| 410 | `ANALYSIS_FAILED` | Analysis failed; no report available |

---

## AnalysisMeta Shape

Returned by `POST /api/v1/analyses/binary` and `GET /api/v1/analyses/{id}`.

```json
{
  "id": "string (UUID v4)",
  "status": "queued | preparing | extracting | decompiling | correlating | reporting | completed | partial | failed",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "originalFilename": "string",
  "storedFilename": "string",
  "fileSizeBytes": 0,
  "sha256": "string (hex, 64 chars)",
  "phases": [
    {
      "phase": "intake | profiling | extracting | ghidra-analysis | correlating | inferring | reconstructing | reporting",
      "status": "pending | running | completed | failed | skipped",
      "startedAt": "ISO 8601 (optional)",
      "completedAt": "ISO 8601 (optional)",
      "durationMs": 0,
      "error": "string (optional, only when status=failed)"
    }
  ],
  "errorMessage": "string (optional, top-level error, only when status=failed)"
}
```

---

## CanonicalResult Shape

The top-level keys of `CanonicalResult` are fixed. All arrays may be empty but the keys must be present.

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

See [`docs/DOMAIN_MODEL.md`](./DOMAIN_MODEL.md) for full type definitions of each sub-object.
