# Evidence and Inference

This document defines the evidence taxonomy, provenance rules, stable ID assignment, deduplication, function profile semantics, inference classification, confidence assignment, candidate responsibility semantics, and anti-overclaim rules.

**Safety invariant:** Static analysis does **not** establish that a binary is safe. The binary is **never executed**. Every claim in this document is about observable static artifacts — not runtime behavior.

---

## Evidence Taxonomy

Evidence is an atomic, directly-observable fact extracted from the binary without interpretation. Evidence is always `classification: "observed"`. It is never inferred, guessed, or interpolated.

### Evidence Kinds

| Kind | Source | What it represents |
|---|---|---|
| `binary-metadata` | `pe-parser` | PE header fields (architecture, subsystem, entry point, etc.) |
| `pe-section` | `pe-parser` | A PE section record (name, VA, size, characteristics, entropy) |
| `import` | `pe-parser` | A single imported function from a named DLL |
| `export` | `pe-parser` | A single exported symbol |
| `string` | `strings` | A printable string found in the binary |
| `function` | `ghidra` | A function identified by Ghidra |
| `function-call` | `ghidra` | A call edge from one function to another |
| `reference` | `ghidra` | A data or code cross-reference |
| `decompilation` | `ghidra` | Pseudo-C decompilation snippet for a function |
| `metadata` | `pe-parser` | Embedded version info resource fields |

### Evidence Sources

| Source | Tool | Phase |
|---|---|---|
| `pe-parser` | Built-in PE parser | `profiling` |
| `strings` | Built-in string scanner | `extracting` |
| `ghidra` | Ghidra headless | `ghidra-analysis` |

---

## Evidence Provenance

Each evidence record carries a `sourceTool` field that identifies which tool produced it. This enables traceability: a reviewer can always trace any inference back to the specific tool that produced the underlying evidence.

Evidence provenance rules:
1. The `sourceTool` field must always accurately reflect the producing tool.
2. Evidence must never be attributed to a tool that did not produce it.
3. When `ghidra` is the source, the evidence is only present if `ToolCoverage.ghidra = true`.

---

## Stable Evidence IDs

Evidence IDs are assigned during phase 5 (`correlating`) and are stable for the lifetime of the analysis.

**ID format:** `evd-{n}` where `n` is a zero-padded 3-digit integer (e.g. `evd-001`, `evd-042`, `evd-999`).

**Stability invariant:** Once assigned, an evidence ID never changes and is never reused for a different evidence item within the same analysis.

These IDs are referenced by:
- `Inference.evidenceIds`
- `CandidateResponsibility.evidenceIds`
- `ExternalInteraction.evidenceIds`
- `ModernizationRecommendation.evidenceIds`
- `FunctionProfile.evidenceIds`
- `FunctionProfile.decompilationEvidenceIds`

---

## Deduplication

During phase 5 (`correlating`), duplicate evidence items are removed:

1. **Import deduplication:** If the same DLL + function combination appears in both PE import table evidence and Ghidra API references evidence, keep only the `pe-parser` source. The PE parser is the authoritative source for import data.

2. **String deduplication:** Identical string values at the same file offset are deduplicated to a single record. If two tools identify the same string, the `strings` source takes precedence.

3. **Function deduplication:** Functions may appear in both `function` evidence and call-edge `function-call` evidence. These are different kinds and are *not* deduplicated — they represent different observations.

---

## String Categorisation

The string extractor assigns a `StringCategory` to each extracted string using heuristic pattern matching. Categorisation is an aid to analysis, not a hard classification.

| Category | Pattern | Example |
|---|---|---|
| `url` | Matches `http://` or `https://` | `https://api.example.com/orders` |
| `hostname` | Domain-like patterns | `db.internal.corp` |
| `ip` | IPv4 patterns | `192.168.1.100` |
| `file-path` | `C:\`, `%SystemRoot%`, `\\?\`, etc. | `C:\ProgramData\Acme\config.ini` |
| `registry-path` | `HKEY_`, `Software\`, `SYSTEM\` etc. | `Software\Acme\LegacySalesApp` |
| `sql` | SQL keyword patterns | `SELECT * FROM Orders WHERE` |
| `protocol` | Named protocol patterns | `HTTPS`, `FTP`, `ODBC` |
| `authentication` | Credential-related keywords | `Password`, `Username`, `Login` |
| `error-message` | Error/exception text | `Failed to open database connection` |
| `service-name` | Windows service name patterns | `AcmeSalesService` |
| `dll-name` | `.dll` suffix | `msvcrt.dll` |
| `installer-metadata` | NSIS/MSI metadata patterns | `Nullsoft Install System` |
| `config-filename` | Config file patterns | `config.ini`, `settings.xml` |
| `other` | Does not match any above | (generic strings) |

**Categorisation is not evidence classification.** A string with `category: "authentication"` does not prove the binary handles authentication. See Anti-Overclaim Rules.

---

## Function Profiles

Function profiles (`FunctionProfile`) are produced by the Ghidra analysis phase. They are included in `CanonicalResult.interestingFunctions` when they meet a minimum `selectionScore`.

### Selection Score

The `selectionScore` (0.0–1.0) is a heuristic relevance score. A function scores higher when it:
- Calls high-value Windows APIs (file I/O, network, registry, crypto)
- References categorised strings (URLs, file paths, SQL)
- Has multiple callers (central to the call graph)
- Has decompilation available

Functions below the selection threshold are still analysed (for call edges, API references) but are not included in `interestingFunctions`.

### Auto-Generated Names

Ghidra assigns names like `FUN_00404200` when it cannot determine a symbol name. The `autoGenerated` flag signals this.

**Invariant: A `FUN_*` name is not the original source name.** It is a Ghidra placeholder. Rationale text and summaries must never present an auto-generated name as if it were a meaningful name.

### Call Edge Normalisation

`function-call` evidence records capture a call edge as `caller address → callee address`. During phase 5 (`correlating`), addresses are resolved to function names where available. If a callee address cannot be resolved to a name, the address itself is used.

### API References

`FunctionProfile.apiReferences` lists Windows API symbols called by the function. These are derived from:
1. Import entries resolved via the call graph (preferred)
2. Ghidra API reference analysis

---

## Observed / Inferred / Unknown

Three classification values describe the epistemic status of any claim:

| Classification | Meaning | Where used |
|---|---|---|
| `observed` | Directly visible in the binary; no interpretation needed | `Evidence.classification` (always) |
| `inferred` | Derived from evidence; involves interpretation | `Inference.classification` (always), `CandidateResponsibility.rationale[].classification` |
| `unknown` | Cannot be determined from static evidence | `CandidateResponsibility.rationale[].classification`, `Unknown` records |

**Rules:**
- `Evidence` is **always** `observed`. Never add an inferred evidence record.
- `Inference` is **always** `inferred`. Never mark an inference as `observed`.
- `Unknown` records describe gaps — specific questions the analysis cannot answer.

---

## Confidence Semantics

`ConfidenceLevel` values: `low` | `medium` | `high` | `not-applicable`

### Assignment Principles

| Level | When to use |
|---|---|
| `low` | Single weak signal; pattern consistent with the conclusion but not specific |
| `medium` | Multiple corroborating signals from different evidence kinds |
| `high` | Strong, direct, specific evidence from multiple independent sources |
| `not-applicable` | Confidence does not apply in this context |

**Default to the lowest justified confidence level.** Upgrade confidence only when multiple independent signals converge.

### Confidence Escalation Requirements

To escalate from `low` to `medium`:
- At least two independent evidence items from different `EvidenceKind` values must support the inference.

To escalate from `medium` to `high`:
- Evidence from at least two different `EvidenceSource` tools must converge.
- The evidence must be specific (not generic keyword matches).

---

## Anti-Overclaim Rules

The following rules are **mandatory** and must be enforced in inference rules, rationale text, and report generation.

### Windows Messaging ≠ Network

`SendMessageW` and `SendDlgItemMessageW` are Windows inter-window messaging APIs. They send messages to window handles, not to network destinations.

**Rule:** The presence of `SendMessageW` or `SendDlgItemMessageW` imports is **NOT** network evidence. Do not produce a network `ExternalInteraction` or network `Inference` citing only these APIs.

### One URL String ≠ Medium/High Network Confidence

A single URL string in `.rdata` may be an error message, documentation artifact, or dead code path.

**Rule:** A single URL string alone does **NOT** justify `medium` or `high` confidence for a network capability inference. A URL string may contribute to a `low` confidence network inference when combined with other evidence (e.g. Winsock imports).

### Generic Auth Strings ≠ High-Confidence Authentication

Strings like `"Password"`, `"Username"`, `"Login"`, `"Enter credentials"` are present in many binaries — including error messages and UI labels — and do not prove authentication handling.

**Rule:** Generic authentication strings alone do **NOT** justify `high` confidence for an authentication inference. High confidence requires specific API evidence (e.g. `CredReadW`, `LsaLogonUser`, `BCryptHashData` with auth-related strings).

### Generic SQL Strings ≠ High-Confidence Database

A SQL keyword (e.g. `"SELECT"`, `"FROM"`) found in a string does not prove the binary makes database queries. It may be an embedded error message or a template string.

**Rule:** Generic SQL strings alone do **NOT** justify `high` confidence for a database inference. Convergence with ODBC API imports (`SQLConnect`, `SQLExecDirectW`) or a database driver DLL import is required for `medium` or higher.

### CryptAcquireContextW Alone ≠ Application-Level Encryption

`CryptAcquireContextW` acquires a handle to a cryptographic service provider. It is a prerequisite for many crypto operations, including hashing, random number generation, and certificate operations. It does not prove the binary encrypts user data.

**Rule:** `CryptAcquireContextW` alone is **NOT** proof of application-level encryption. Other crypto API evidence (`CryptEncrypt`, `BCryptEncrypt`, key management APIs) must be present to infer encryption at `medium` or higher.

### Registry APIs Alone ≠ Installer Behavior

Reading or writing registry keys (e.g. `RegOpenKeyExW`, `RegSetValueExW`) is routine behavior for any configured application. It does not indicate the binary is an installer.

**Rule:** Registry API imports alone do **NOT** justify an installer `Inference` or an `ExternalInteraction` with `kind: "installer"`. Installer-specific evidence (NSIS/MSI metadata strings, `MsiExec`, installer metadata version strings) is required.

### CreateFileW Alone ≠ Config-File Behavior

`CreateFileW` is a generic file I/O API used for any file operation. Its presence does not indicate configuration file reading.

**Rule:** `CreateFileW` alone is **NOT** sufficient to produce an inference about configuration file access. A specific config filename string (e.g. `"config.ini"`, `"settings.xml"`) or registry-path string referencing known config locations must also be present.

### High Entropy ≠ Packed or Malicious

High Shannon entropy in PE sections or the whole file may indicate compressed resources, encryption, or packed code — but it may also indicate legitimate compressed data (e.g. embedded images, compressed databases, encrypted communication).

**Rule:** High entropy is **NOT** proof of packing or malicious intent. Entropy values must be reported as observations, not conclusions. If high entropy is noted in a risk or limitation, it must be qualified with explicit uncertainty language (e.g. "may indicate" rather than "indicates").

### Digital Signature ≠ Safety

An Authenticode signature (`hasSignature: true`) indicates the binary was signed at the time of analysis. It does not indicate the binary is safe, legitimate, or free of malicious code.

**Rule:** `hasSignature: true` must **NOT** be used as evidence that the binary is safe. The signature is reported as an observable fact only. Safety cannot be determined by static analysis.

### FUN_* Name ≠ Original Source Name

Names matching the pattern `FUN_[0-9a-f]+` are auto-generated Ghidra placeholders. They carry no semantic meaning about the original developer's intent.

**Rule:** Auto-generated function names must **NOT** be presented as meaningful identifiers. Rationale text must not reference a `FUN_*` name as if it were a source symbol name. When an auto-generated name must be mentioned, it must be qualified (e.g. "function at `0x00404200` (auto-named `FUN_00404200`)").

---

## Candidate Responsibility Semantics

`CandidateResponsibility` (API: `candidateComponents`) objects are heuristic clusters. Naming conventions:

- The `name` field is a human-readable label for the candidate responsibility (e.g. `"Order Persistence"`, `"User Authentication"`, `"Report Generation"`).
- It is a **candidate** — a plausible grouping, not a proven architecture.
- The `confidence` field reflects the confidence that this grouping is real and distinct.
- The `rationale` array must include at least one `observed` entry (the evidence it is based on) and should include one `unknown` entry when gaps exist.

### Clustering Principles

1. **Evidence-first.** Start from evidence, not from an assumed architecture. Group functions that share evidence (call each other, reference the same strings, use the same APIs).
2. **Single responsibility.** A candidate responsibility should represent one coherent functional concern. Do not create monolithic clusters.
3. **Explicit boundaries.** State what is *not* included in the cluster, especially when functions could plausibly belong to multiple clusters.
4. **Confidence bounds.** If the only evidence for a cluster is auto-generated function names, confidence must be `low`.

---

## Traceability Invariants

1. Every `evidenceId` referenced by any object in `CanonicalResult` must have a corresponding entry in `CanonicalResult.evidence[]`.
2. Every `Inference` must cite at least one `evidenceId`.
3. Every `CandidateResponsibility` must cite at least one `evidenceId`.
4. Every `ExternalInteraction` must cite at least one `evidenceId`.
5. Every `ModernizationRecommendation` must cite at least one `evidenceId`.
6. `FunctionProfile.evidenceIds` must only reference evidence records from the `ghidra` source tool.
7. If `ToolCoverage.ghidra = false`, there must be no evidence records with `sourceTool: "ghidra"` in the result.
8. Rationale text must be traceable to specific evidence; it must not contain unsupported assertions.
