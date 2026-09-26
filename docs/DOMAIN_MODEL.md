# Domain Model

This document defines every domain type used in the Code Archaeologist API. All types map directly to `src/shared/types.ts`. Where API field names differ from TypeScript type names, both are noted.

**Safety invariant:** The uploaded binary is **never executed**. All types here represent static analysis artifacts only.

---

## Type Index

- [AnalysisStatus](#analysisstatus)
- [AnalysisPhase](#analysisphase)
- [PhaseRecord](#phaserecord)
- [AnalysisMeta](#analysismeta)
- [BinaryProfile](#binaryprofile)
- [ToolCoverage](#toolcoverage)
- [EvidenceKind](#evidencekind)
- [EvidenceSource](#evidencesource)
- [Evidence](#evidence)
- [ExtractedString / StringCategory](#extractedstring--stringcategory)
- [FunctionProfile](#functionprofile)
- [ConfidenceLevel](#confidencelevel)
- [InferenceClassification](#inferenceclassification)
- [Inference (Capability)](#inference-capability)
- [CandidateResponsibility (candidateComponents)](#candidateresponsibility--candidatecomponents)
- [ExternalInteraction](#externalinteraction)
- [Unknown](#unknown)
- [ModernizationRecommendation](#modernizationrecommendation)
- [CanonicalResult](#canonicalresult)
- [ErrorResponse](#errorresponse)
- [Status Transitions](#status-transitions)
- [Relationships](#relationships)
- [Invariants](#invariants)

---

## AnalysisStatus

The lifecycle status of an analysis. Transitions are one-directional and terminal states are irreversible.

```
type AnalysisStatus =
  | 'queued'
  | 'preparing'
  | 'extracting'
  | 'decompiling'
  | 'correlating'
  | 'reporting'
  | 'completed'
  | 'partial'
  | 'failed'
```

| Value | Meaning |
|---|---|
| `queued` | Analysis accepted, waiting to start |
| `preparing` | Intake phase running (validating binary, writing meta.json) |
| `extracting` | PE parsing and string extraction in progress |
| `decompiling` | Ghidra analysis in progress |
| `correlating` | Cross-tool evidence correlation in progress |
| `reporting` | Inference, reconstruction, and report generation in progress |
| `completed` | All phases succeeded; full result available |
| `partial` | Some phases failed (Ghidra); partial result available |
| `failed` | Pipeline failed fatally; no result available |

**Terminal statuses:** `completed`, `partial`, `failed`

---

## AnalysisPhase

The named phases within the pipeline. Phases execute in the listed order.

```
type AnalysisPhase =
  | 'intake'
  | 'profiling'
  | 'extracting'
  | 'ghidra-analysis'
  | 'correlating'
  | 'inferring'
  | 'reconstructing'
  | 'reporting'
```

---

## PhaseRecord

Tracks the execution state of a single pipeline phase.

```json
{
  "phase": "AnalysisPhase",
  "status": "pending | running | completed | failed | skipped",
  "startedAt": "ISO 8601 (optional)",
  "completedAt": "ISO 8601 (optional)",
  "durationMs": 1234,
  "error": "string (optional)"
}
```

| Field | Type | Description |
|---|---|---|
| `phase` | `AnalysisPhase` | Phase identifier |
| `status` | enum | Current execution state of this phase |
| `startedAt` | ISO 8601? | When the phase started |
| `completedAt` | ISO 8601? | When the phase finished |
| `durationMs` | number? | Wall-clock duration in milliseconds |
| `error` | string? | Error message when `status = "failed"` |

---

## AnalysisMeta

The top-level record for a single analysis. Written to `{WORK_DIR}/{id}/meta.json` and returned by the status endpoint.

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "completed",
  "createdAt": "2024-11-15T14:22:00.000Z",
  "updatedAt": "2024-11-15T14:25:12.000Z",
  "originalFilename": "LegacySalesApp.exe",
  "storedFilename": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.bin",
  "fileSizeBytes": 2097152,
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "phases": [ /* PhaseRecord[] */ ],
  "errorMessage": null
}
```

| Field | Type | Description |
|---|---|---|
| `id` | UUID v4 string | Canonical analysis identifier. Immutable after creation. |
| `status` | `AnalysisStatus` | Current lifecycle status |
| `createdAt` | ISO 8601 | When the upload was accepted |
| `updatedAt` | ISO 8601 | When the record was last modified |
| `originalFilename` | string | Filename as supplied by the client |
| `storedFilename` | string | Actual filename on disk (typically `{id}.bin`) |
| `fileSizeBytes` | integer | File size in bytes |
| `sha256` | string | SHA-256 hex digest of the binary |
| `phases` | `PhaseRecord[]` | One entry per pipeline phase, in execution order |
| `errorMessage` | string? | Top-level error message when `status = "failed"` |

---

## BinaryProfile

Structural information extracted from the PE binary by the PE parser.

```json
{
  "originalFilename": "LegacySalesApp.exe",
  "storedFilename": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.bin",
  "fileSizeBytes": 2097152,
  "sha256": "e3b0c44...",
  "peType": "PE32",
  "architecture": "x86",
  "subsystem": "WINDOWS_GUI",
  "entryPoint": "0x00401000",
  "sections": [ /* PeSection[] */ ],
  "imports": [ /* ImportEntry[] */ ],
  "exports": [ /* ExportEntry[] */ ],
  "versionInfo": { /* VersionInfo | null */ },
  "hasSignature": false,
  "overallEntropy": 5.82
}
```

| Field | Type | Description |
|---|---|---|
| `peType` | `"PE32"` \| `"PE32+"` \| `"unknown"` | PE format variant |
| `architecture` | `"x86"` \| `"x86-64"` \| `"ARM"` \| `"ARM64"` \| `"unknown"` | CPU architecture |
| `subsystem` | `"WINDOWS_GUI"` \| `"WINDOWS_CUI"` \| `"NATIVE"` \| `"WINDOWS_CE_GUI"` \| `"EFI_APPLICATION"` \| `"unknown"` | Windows subsystem |
| `entryPoint` | hex string | Entry point virtual address |
| `sections` | `PeSection[]` | PE sections |
| `imports` | `ImportEntry[]` | DLL imports |
| `exports` | `ExportEntry[]` | Exported symbols |
| `versionInfo` | `VersionInfo?` | Embedded version resource (if present) |
| `hasSignature` | boolean | Whether an Authenticode signature is embedded. **Does not imply safety.** |
| `overallEntropy` | number? | Shannon entropy of the whole file. **High entropy is a clue, not proof of packing or malice.** |

### PeSection

```json
{
  "name": ".text",
  "virtualAddress": "0x00401000",
  "virtualSize": 102400,
  "rawSize": 102912,
  "characteristics": ["IMAGE_SCN_CNT_CODE", "IMAGE_SCN_MEM_EXECUTE"],
  "entropy": 5.92
}
```

### ImportEntry

```json
{
  "dll": "KERNEL32.dll",
  "functions": ["CreateFileW", "ReadFile", "WriteFile", "CloseHandle"]
}
```

### ExportEntry

```json
{
  "ordinal": 1,
  "name": "InitModule",
  "address": "0x00402A00"
}
```

### VersionInfo

All fields are optional strings from the PE version resource.

```json
{
  "fileVersion": "3.2.1.0",
  "productVersion": "3.2.1",
  "companyName": "Acme Corp",
  "productName": "Legacy Sales Application",
  "description": "Sales order management",
  "originalFilename": "LegacySalesApp.exe",
  "legalCopyright": "Copyright © 2008 Acme Corp",
  "internalName": "SalesApp"
}
```

---

## ToolCoverage

Records which analysis tools ran successfully.

```json
{
  "peParser": true,
  "strings": true,
  "ghidra": false,
  "ghidraError": "Ghidra timed out after 180000ms"
}
```

| Field | Type | Description |
|---|---|---|
| `peParser` | boolean | PE parser completed successfully |
| `strings` | boolean | String extractor completed successfully |
| `ghidra` | boolean | Ghidra analysis completed successfully |
| `ghidraError` | string? | Error message if Ghidra failed |

---

## EvidenceKind

```
type EvidenceKind =
  | 'binary-metadata'
  | 'pe-section'
  | 'import'
  | 'export'
  | 'string'
  | 'function'
  | 'function-call'
  | 'reference'
  | 'decompilation'
  | 'metadata'
```

| Kind | Source | Description |
|---|---|---|
| `binary-metadata` | pe-parser | Top-level PE header info |
| `pe-section` | pe-parser | A PE section record |
| `import` | pe-parser | A DLL import entry |
| `export` | pe-parser | An export entry |
| `string` | strings | An extracted string |
| `function` | ghidra | A function identified by Ghidra |
| `function-call` | ghidra | A call edge between functions |
| `reference` | ghidra | A data/code cross-reference |
| `decompilation` | ghidra | Decompiled pseudo-C for a function |
| `metadata` | pe-parser | Embedded metadata (version info, etc.) |

---

## EvidenceSource

```
type EvidenceSource = 'pe-parser' | 'strings' | 'ghidra'
```

---

## Evidence

An atomic, directly-observable fact extracted from the binary. Evidence is never inferred — it is always `classification: "observed"`.

```json
{
  "id": "evd-001",
  "kind": "import",
  "sourceTool": "pe-parser",
  "classification": "observed",
  "summary": "Imports CreateFileW from KERNEL32.dll",
  "location": {
    "address": null,
    "offset": 4096,
    "functionAddress": null
  },
  "data": {
    "dll": "KERNEL32.dll",
    "function": "CreateFileW"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Stable ID for this evidence item within the analysis |
| `kind` | `EvidenceKind` | Type of evidence |
| `sourceTool` | `EvidenceSource` | Which tool produced this evidence |
| `classification` | `"observed"` | Always `"observed"` — evidence is never inferred |
| `summary` | string | Human-readable one-line description |
| `location` | object? | Optional location info |
| `location.address` | hex string? | Virtual address if applicable |
| `location.offset` | integer? | File offset if applicable |
| `location.functionAddress` | hex string? | Containing function address if applicable |
| `data` | any | Raw evidence payload (schema varies by `kind`) |

**Evidence IDs are stable within an analysis** and may be referenced by `Inference`, `CandidateResponsibility`, `ExternalInteraction`, and `ModernizationRecommendation` objects.

---

## ExtractedString / StringCategory

Extracted strings are stored as `Evidence` with `kind: "string"` and `data` of type `ExtractedString`.

```json
{
  "value": "Software\\Acme\\LegacySalesApp",
  "encoding": "utf-16le",
  "offset": 204800,
  "section": ".rdata",
  "category": "registry-path"
}
```

### StringCategory Values

```
'url' | 'hostname' | 'ip' | 'file-path' | 'registry-path' | 'sql' |
'protocol' | 'authentication' | 'error-message' | 'service-name' |
'dll-name' | 'installer-metadata' | 'config-filename' | 'other'
```

---

## FunctionProfile

A function identified by Ghidra, enriched with call graph and evidence linkage. Only functions meeting a minimum `selectionScore` are included in `interestingFunctions`.

```json
{
  "address": "0x00404200",
  "name": "FUN_00404200",
  "autoGenerated": true,
  "callers": ["0x00401A10", "0x00402B30"],
  "callees": ["0x00403100", "0x00403200"],
  "apiReferences": ["CreateFileW", "ReadFile"],
  "stringReferences": ["config.ini"],
  "evidenceIds": ["evd-045", "evd-046"],
  "decompilationEvidenceIds": ["evd-047"],
  "selectionScore": 0.72,
  "selectionReasons": ["imports high-value API", "references config filename"]
}
```

| Field | Type | Description |
|---|---|---|
| `address` | hex string | Function entry point virtual address |
| `name` | string | Ghidra name (often auto-generated `FUN_*`) |
| `autoGenerated` | boolean | `true` when Ghidra auto-named the function |
| `callers` | hex string[] | Addresses of calling functions |
| `callees` | hex string[] | Addresses of called functions |
| `apiReferences` | string[] | API symbols called by this function |
| `stringReferences` | string[] | String literals referenced by this function |
| `evidenceIds` | string[] | Evidence IDs from this function |
| `decompilationEvidenceIds` | string[] | Evidence IDs for decompilation snippets |
| `selectionScore` | 0–1 float | Heuristic relevance score |
| `selectionReasons` | string[] | Human-readable reasons for selection |

**Invariant:** `autoGenerated: true` for names matching pattern `FUN_[0-9a-f]+`. A `FUN_*` name is **not** the original source name.

---

## ConfidenceLevel

```
type ConfidenceLevel = 'low' | 'medium' | 'high' | 'not-applicable'
```

| Value | Meaning |
|---|---|
| `low` | Weak signal; plausible but not substantiated |
| `medium` | Multiple corroborating evidence items; credible |
| `high` | Strong, direct evidence from multiple independent sources |
| `not-applicable` | Confidence does not apply in context |

See [`EVIDENCE_AND_INFERENCE.md`](./EVIDENCE_AND_INFERENCE.md) for confidence assignment rules and anti-overclaim constraints.

---

## InferenceClassification

```
type InferenceClassification = 'observed' | 'inferred' | 'unknown'
```

Used in `CandidateResponsibility.rationale` to distinguish directly-observed facts from conclusions derived by inference, and from gaps where no determination was possible.

---

## Inference (Capability)

An inferred conclusion derived from one or more evidence items. Stored in `CanonicalResult.capabilities`.

```json
{
  "id": "inf-001",
  "ruleId": "RULE_FILE_IO",
  "category": "filesystem",
  "statement": "The binary reads and writes files, consistent with data persistence.",
  "classification": "inferred",
  "confidence": "medium",
  "evidenceIds": ["evd-012", "evd-013", "evd-014"],
  "rationale": [
    "Imports CreateFileW, ReadFile, WriteFile from KERNEL32.dll",
    "String reference 'config.ini' found in .rdata section"
  ],
  "limitations": [
    "Cannot determine what data is read or written without execution."
  ],
  "counterEvidence": []
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Stable inference ID |
| `ruleId` | string | Identifier of the inference rule that produced this |
| `category` | string | Functional category (e.g. `"filesystem"`, `"network"`, `"ui"`) |
| `statement` | string | The inferred conclusion |
| `classification` | `"inferred"` | Always `"inferred"` |
| `confidence` | `ConfidenceLevel` | Confidence in the conclusion |
| `evidenceIds` | string[] | Evidence items supporting this inference |
| `rationale` | string[] | Reasoning chain |
| `limitations` | string[] | What cannot be concluded |
| `counterEvidence` | string[]? | Evidence that weakens this inference |

---

## CandidateResponsibility / candidateComponents

A candidate functional responsibility cluster. The **API field name** is `candidateComponents`; the TypeScript type name is `CandidateResponsibility`.

```json
{
  "id": "comp-001",
  "name": "Order Persistence",
  "kind": "candidate-responsibility",
  "confidence": "medium",
  "summary": "Cluster of functions likely responsible for reading and writing order records to disk.",
  "functions": [
    { "address": "0x00404200", "name": "FUN_00404200", "autoGenerated": true },
    { "address": "0x00404500", "name": "SaveOrderRecord", "autoGenerated": false }
  ],
  "evidenceIds": ["evd-012", "evd-013"],
  "rationale": [
    { "classification": "observed",  "text": "Imports CreateFileW, WriteFile, ReadFile" },
    { "classification": "inferred",  "text": "String 'orders.dat' suggests a specific data file" },
    { "classification": "unknown",   "text": "File format cannot be determined statically" }
  ],
  "externalInteractions": ["ext-001"],
  "limitations": [
    "Function grouping is heuristic. Actual call structure may differ.",
    "Cannot determine transaction semantics without runtime tracing."
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Stable component ID |
| `name` | string | Human-readable candidate name |
| `kind` | `"candidate-responsibility"` | Always `"candidate-responsibility"` |
| `confidence` | `ConfidenceLevel` | Confidence that this grouping represents a real responsibility |
| `summary` | string | One-paragraph description |
| `functions` | array | Functions grouped into this responsibility |
| `functions[].address` | hex string | Function address |
| `functions[].name` | string | Function name (may be auto-generated) |
| `functions[].autoGenerated` | boolean | Whether the name is Ghidra-generated |
| `evidenceIds` | string[] | Evidence IDs supporting the grouping |
| `rationale` | array | Reasoning steps with `observed`/`inferred`/`unknown` classification |
| `externalInteractions` | string[]? | IDs of `ExternalInteraction` objects related to this component |
| `limitations` | string[] | Explicit limitations and caveats |

---

## ExternalInteraction

A resource or system outside the binary that it appears to interact with.

```json
{
  "id": "ext-001",
  "kind": "filesystem",
  "description": "Reads and writes files in a data directory, likely persisting order records.",
  "confidence": "medium",
  "evidenceIds": ["evd-012", "evd-013"],
  "limitations": ["Specific file paths cannot be determined without runtime observation."]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Stable interaction ID |
| `kind` | `"filesystem"` \| `"registry"` \| `"process"` \| `"service"` \| `"network"` \| `"database"` | Interaction category |
| `description` | string | What interaction is believed to occur |
| `confidence` | `ConfidenceLevel` | Confidence level |
| `evidenceIds` | string[] | Supporting evidence IDs |
| `limitations` | string[] | What cannot be determined |

---

## Unknown

A specific question that the static analysis cannot answer. Unknowns are first-class output — they communicate the limits of the analysis.

```json
{
  "id": "unk-001",
  "question": "What database system does this binary communicate with?",
  "whyItMatters": "Understanding the database dependency is essential for migration planning.",
  "missingEvidence": "No database driver DLL imports found; SQL strings present but schema unknown.",
  "howToResolve": [
    "Run the binary in a monitored environment to observe database connections.",
    "Inspect configuration files for connection strings."
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Stable unknown ID |
| `question` | string | The unanswered question |
| `whyItMatters` | string | Why this gap is significant |
| `missingEvidence` | string | What evidence is absent |
| `howToResolve` | string[] | Suggestions for resolving the gap |

---

## ModernizationRecommendation

An actionable modernization suggestion derived from the analysis.

```json
{
  "id": "mod-001",
  "priority": "high",
  "title": "Replace flat-file persistence with a relational database",
  "description": "The binary appears to persist data in custom binary files. Migrating to a relational database would improve reliability, querying capability, and tooling support.",
  "evidenceIds": ["evd-012", "evd-013"],
  "relatedResponsibilityIds": ["comp-001"]
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Stable recommendation ID |
| `priority` | `"high"` \| `"medium"` \| `"low"` | Modernization priority |
| `title` | string | Short title |
| `description` | string | Detailed recommendation |
| `evidenceIds` | string[] | Evidence IDs that motivated this recommendation |
| `relatedResponsibilityIds` | string[] | `CandidateResponsibility` IDs this applies to |

---

## CanonicalResult

The complete analysis output. Returned by `GET /api/v1/analyses/{id}/result`.

```json
{
  "analysis": { /* AnalysisMeta */ },
  "binary": { /* BinaryProfile */ },
  "coverage": { /* ToolCoverage */ },
  "evidence": [ /* Evidence[] */ ],
  "capabilities": [ /* Inference[] */ ],
  "candidateComponents": [ /* CandidateResponsibility[] */ ],
  "externalInteractions": [ /* ExternalInteraction[] */ ],
  "dependencies": [ /* string[] — DLL names */ ],
  "interestingFunctions": [ /* FunctionProfile[] */ ],
  "unknowns": [ /* Unknown[] */ ],
  "risks": [ /* string[] — risk notes */ ],
  "modernization": [ /* ModernizationRecommendation[] */ ],
  "limitations": [ /* string[] — global limitations */ ]
}
```

All top-level keys are always present. Arrays may be empty.

**Invariant:** Every `evidenceId` referenced by any `capabilities`, `candidateComponents`, `externalInteractions`, or `modernization` entry must have a corresponding entry in the `evidence` array.

---

## ErrorResponse

All error responses use this envelope.

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Analysis 'a1b2c3d4-...' not found",
    "details": null
  }
}
```

| Field | Type | Description |
|---|---|---|
| `error.code` | string | Machine-readable error code |
| `error.message` | string | Human-readable description |
| `error.details` | any? | Optional additional context |

---

## Status Transitions

```
                  ┌─────────┐
        upload    │ queued  │
   ──────────────►│         │
                  └────┬────┘
                       │
                  ┌────▼──────┐
                  │ preparing │
                  └────┬──────┘
                       │
                  ┌────▼──────┐
                  │extracting │
                  └────┬──────┘
                       │
                  ┌────▼──────────┐   Ghidra failed +
                  │ decompiling   │   PE evidence exists
                  └────┬──────────┘──────────────────┐
                       │                              │
                  ┌────▼──────┐                  ┌────▼─────┐
                  │correlating│                  │ partial  │◄─ terminal
                  └────┬──────┘                  └──────────┘
                       │
                  ┌────▼──────┐
                  │ reporting │
                  └────┬──────┘
                       │
              ┌────────┴────────┐
              │                 │
         ┌────▼─────┐      ┌────▼─────┐
         │completed │      │  failed  │
         └──────────┘      └──────────┘
         (terminal)        (terminal)
```

Any phase failure (except Ghidra with existing evidence) transitions to `failed`.

---

## Relationships

```
AnalysisMeta ──1:1──► CanonicalResult
CanonicalResult ──1:n──► Evidence
CanonicalResult ──1:n──► Inference (capabilities)
CanonicalResult ──1:n──► CandidateResponsibility (candidateComponents)
CanonicalResult ──1:n──► ExternalInteraction
CanonicalResult ──1:n──► FunctionProfile (interestingFunctions)
CanonicalResult ──1:n──► Unknown
CanonicalResult ──1:n──► ModernizationRecommendation

Inference ──n:m──► Evidence (via evidenceIds)
CandidateResponsibility ──n:m──► Evidence (via evidenceIds)
CandidateResponsibility ──n:m──► ExternalInteraction (via externalInteractions)
ModernizationRecommendation ──n:m──► Evidence (via evidenceIds)
ModernizationRecommendation ──n:m──► CandidateResponsibility (via relatedResponsibilityIds)
```

---

## Invariants

1. `AnalysisMeta.id` is assigned at intake and never changes.
2. Terminal statuses (`completed`, `partial`, `failed`) are irreversible.
3. `Evidence.classification` is always `"observed"`. Never `"inferred"`.
4. `Inference.classification` is always `"inferred"`.
5. Every `evidenceId` reference in `CanonicalResult` must resolve to an entry in `evidence[]`.
6. `CandidateResponsibility.kind` is always `"candidate-responsibility"`.
7. `FunctionProfile.autoGenerated = true` when the name matches `FUN_[0-9a-f]+`.
8. `BinaryProfile.hasSignature = true` does **not** imply the binary is safe.
9. `BinaryProfile.overallEntropy` being high does **not** imply packing or malice.
10. `CanonicalResult` always contains all top-level keys; arrays may be empty but keys must not be absent.
