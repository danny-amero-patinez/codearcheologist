# Code Archaeologist — Frontend Handoff

> **Status: PROVISIONAL / MVP**
>
> This document describes the current API contract required to build the first frontend integration.
>
> The backend is still under active development. Endpoint shapes, fields, enums and response structures **MAY CHANGE** as the binary-analysis pipeline evolves.
>
> This is a practical integration reference, **NOT** a frozen public API specification.

---

## 1. API Overview

Code Archaeologist analyzes legacy binaries without requiring source code. The current MVP supports static analysis of Windows PE executables.

Basic frontend flow:

1. User selects a binary.
2. Frontend uploads it.
3. Backend creates an analysis job.
4. Frontend polls analysis status.
5. When processing finishes, frontend requests the result.
6. Frontend presents reconstructed findings and evidence.
7. Reports may optionally be viewed/exported.

The backend does **NOT** execute the uploaded program.

## 2. Base URL

Development:

```text
http://localhost:3000/api/v1
```

All endpoints below are relative to `/api/v1`.

## 3. Analysis Lifecycle

Current possible states:

```text
queued
preparing
extracting
decompiling
correlating
reporting
completed
partial
failed
```

These values are provisional and may change.

Terminal states are `completed`, `partial`, and `failed`.

- `completed`: analysis finished normally.
- `partial`: one or more stages failed, but useful results may still be available.
- `failed`: analysis could not produce a usable result.

The frontend **MUST NOT** treat `partial` as equivalent to `failed`.

## 4. Create Binary Analysis

```http
POST /analyses/binary
```

Content type: `multipart/form-data`

File field: `file`

```ts
const formData = new FormData();
formData.append("file", file);

const response = await fetch(
  "http://localhost:3000/api/v1/analyses/binary",
  { method: "POST", body: formData }
);

const data = await response.json();
```

Do not manually generate the multipart boundary when using browser `FormData`.

Conceptual response:

```json
{
  "id": "c1848e7c-53f3-4cbd-97be-997c5f028a01",
  "status": "queued"
}
```

The exact response shape is provisional. Store the `id` for subsequent requests.

## 5. Get Analysis Status

```http
GET /analyses/:id
```

Use this endpoint for polling while analysis is running. Additional phase/progress information may be present, and the frontend should tolerate additional fields.

Stop polling when status becomes `completed`, `partial`, or `failed`.

## 6. Get Analysis Result

```http
GET /analyses/:id/result
```

This is the primary endpoint for the analysis UI. The exact schema is still evolving.

The result may contain:

- binary identity
- analysis/tool coverage
- PE metadata, imports and sections
- strings
- functions and decompilation evidence
- external interactions
- capability hypotheses
- candidate responsibilities
- risks and unknowns
- modernization recommendations
- evidence index

Not every analysis will contain every category. The frontend **MUST** handle missing or empty sections gracefully.

## 7. Evidence Model

Code Archaeologist is evidence-driven. Important conclusions may reference evidence IDs.

Conceptually:

```json
{
  "id": "evidence-123",
  "kind": "function",
  "sourceTool": "ghidra"
}
```

Possible provisional evidence categories include:

```text
pe-header
section
import
export
string
function
call-edge
decompilation
metadata
```

## 8. Get Evidence Detail

```http
GET /analyses/:id/evidence/:evidenceId
```

Use this endpoint when the user requests details for supporting evidence. Evidence response structures may change while the analysis engine evolves.

## 9. Findings and Confidence

The analysis engine distinguishes between:

```text
observed
inferred
unknown
```

The frontend **SHOULD** preserve this distinction visually. Do not present inferred findings as confirmed facts.

Confidence values may include:

```text
high
medium
low
not-applicable
```

These values are provisional. Confidence indicates evidence strength; it is **not a probability**.

## 10. Candidate Responsibilities

The backend may reconstruct candidate technical responsibilities such as:

- Windows installation / software registration
- service or driver lifecycle management
- registry-backed configuration
- filesystem deployment
- process execution
- cryptographic operations

These are inferred technical responsibilities. They are **NOT** recovered original classes, modules, services, source files, function names, or business requirements.

The exact backend object representing this information may change.

## 11. Interesting Functions

The result may expose relevant functions with information such as:

```text
address
name
score
selection reasons
referenced APIs
referenced strings
call relationships
decompilation
linked evidence
```

Names such as `FUN_00409140` are Ghidra-generated identifiers and **MUST NOT** be presented as recovered original source names.

## 12. Analysis Coverage

Current analysis sources may include:

```text
PE parser
string extraction
Ghidra
```

Each stage may succeed or fail independently. If Ghidra fails while other stages succeed, the analysis may be `partial` and should still be viewable.

## 13. Reports

```http
GET /analyses/:id/report?format={format}
```

Currently intended formats:

```text
json
markdown
html
```

The frontend should **not** depend on the generated HTML report for its main UI. Use the structured analysis result for application views.

## 14. Diagnostics

Development environments may expose:

```http
GET /health
GET /diagnostics
GET /tools
```

These are development/troubleshooting endpoints and are not stable user-facing contracts yet.

## 15. Error Handling

The exact error schema is not frozen. Handle unsuccessful HTTP responses defensively and do not couple the UI to one exact error object yet.

## 16. Recommended Frontend Architecture

Because the backend contract is evolving, keep API access behind a small adapter/service layer.

```text
src/
  api/
    analysisApi.ts
  models/
    analysis.ts
  features/
    analysis/
```

Prefer mapping backend responses into frontend view models instead of coupling components directly to raw response structures.

## 17. Minimum MVP Screens

### Upload

Select binary, upload it, and start analysis.

### Processing

Show filename, status, and current phase when available. Poll until a terminal state.

### Results

Prioritize:

- Binary Summary
- Analysis Coverage
- Reconstructed Capabilities
- Candidate Responsibilities
- Interesting Functions
- External Interactions
- Unknowns / Limitations
- Modernization Guidance
- Evidence

Sections without data should be hidden or shown as unavailable.

### Evidence Detail

Allow findings/functions to expose supporting evidence using a drawer, modal, or dedicated section.

## 18. Product Disclaimer

The frontend should communicate:

> Code Archaeologist performs static analysis. The uploaded binary is not executed. Findings include direct observations and bounded inferences from available evidence.

Avoid language implying perfect recovery of original source code or runtime behavior.

## 19. Contract Stability

> **IMPORTANT: THIS API CONTRACT IS NOT FROZEN.**

This API is an active MVP. The following **MAY CHANGE**:

```text
endpoint response shapes
field names
nested structures
status values
confidence values
evidence kinds
candidate responsibility structures
function structures
report structures
error structures
```

The general workflow is expected to remain approximately:

```text
Upload
  ↓
Analysis ID
  ↓
Poll Status
  ↓
Result
  ↓
Evidence / Report
```

Frontend development may proceed against the current API, but these contracts must **NOT** be considered frozen until the backend analysis model stabilizes.

When backend contracts change, this document should be updated accordingly.
