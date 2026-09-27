# BOB IDE PROJECT BRIEF V2.1

## Code Archaeologist --- Evidence-Driven Binary Archaeology API

**Status:** Hackathon MVP specification\
**Primary deliverable:** Backend/API only\
**Primary input:** Windows PE executables (`.exe`)\
**Primary goal:** Reconstruct useful, traceable knowledge about legacy
software when source code is unavailable.\
**Priority:** A compelling, technically defensible hackathon demo. Do
not spend MVP effort on a frontend.

------------------------------------------------------------------------

# 1. Product thesis

Code Archaeologist is **not a Ghidra wrapper, decompiler viewer, malware
scanner, vulnerability scanner, or source-code recovery promise**.

It is an evidence-driven binary archaeology system for engineers who
inherit legacy software without source code or trustworthy
documentation.

The system accepts a legacy executable as an inert artifact, extracts
low-level static evidence, correlates that evidence, reconstructs
bounded higher-level knowledge about the program, explicitly identifies
what cannot be established, and produces an actionable modernization
blueprint.

The core product question is:

> **Given only this binary, what can an engineer responsibly learn about
> the system, why should they believe it, what remains unknown, and what
> should they investigate next before replacing or modernizing it?**

## Non-negotiable product rule

> **A successful analysis is not one that extracts Ghidra data. A
> successful analysis is one that transforms traceable low-level
> evidence into useful, bounded, and reproducible knowledge about the
> legacy system.**

Every architectural and implementation decision should support that
rule.

------------------------------------------------------------------------

# 2. Hackathon positioning

The demo must tell a simple story:

> "A company has an important Windows application from years ago. The
> source repository and documentation are gone. They only have the
> executable. Code Archaeologist analyzes the binary without running it,
> reconstructs evidence-backed capabilities and candidate
> responsibilities, shows exactly why each conclusion was reached,
> identifies unknowns instead of hallucinating, and creates an
> investigation and modernization blueprint for the engineers who must
> replace it."

The product must therefore optimize for:

1.  **Differentiation** --- more than raw Ghidra output.
2.  **Trust** --- every conclusion links back to evidence.
3.  **Explainability** --- engineers can inspect why an inference
    exists.
4.  **Usefulness** --- output guides real modernization work.
5.  **Demo clarity** --- a reviewer should understand the value in
    minutes.
6.  **Reproducibility** --- the same evidence should produce the same
    deterministic inference.
7.  **Honest uncertainty** --- "unknown" is a valid and important
    result.

Do not broaden the MVP into generic repository scanning. The previous
source-analysis prototype is not the focus of this version.

------------------------------------------------------------------------

# 3. Scope

## 3.1 In scope for MVP

-   REST API written in TypeScript/Node.js.
-   Upload and analyze Windows PE executables.
-   Static analysis only.
-   SHA-256 and binary identity.
-   PE metadata extraction.
-   Architecture and format identification.
-   PE sections.
-   Imports and exports.
-   Extracted strings with filtering and provenance.
-   Ghidra headless integration.
-   Function inventory.
-   Function addresses and names when available.
-   Call relationships when extractable.
-   References between functions, imports, and strings.
-   Selective Ghidra decompilation.
-   Evidence normalization.
-   Deterministic inference rules.
-   Confidence scoring with transparent reasons.
-   Candidate capability reconstruction.
-   Candidate responsibility/component clustering.
-   External-interaction reconstruction.
-   Dependency/runtime hints.
-   Unknowns and limitations.
-   Investigation recommendations.
-   Modernization blueprint.
-   JSON as the canonical report format.
-   Markdown and HTML derived from the canonical report.
-   Job status and analysis phases.
-   Windows as a first-class development environment.
-   Linux compatibility where practical.
-   Automated tests.
-   Sample fixtures/dummy evidence for tests when real binaries are
    inappropriate.

## 3.2 Explicitly out of scope for MVP

-   Frontend/UI application.
-   Dynamic execution of uploaded binaries.
-   Sandboxing and behavioral execution.
-   Malware detonation.
-   Exploit generation.
-   Automatic patching of executables.
-   Claiming to recover original source code.
-   Claiming reconstructed class/function names are original unless
    symbols prove it.
-   Full decompilation of every function.
-   Generic GitHub/repository analysis.
-   Semgrep/Trivy source scanning as a primary feature.
-   LLM-generated facts.
-   Autonomous code migration from binary to a new application.
-   Perfect architecture recovery.
-   Full support for every executable format.

------------------------------------------------------------------------

# 4. Safety boundary: never execute the uploaded binary

**The uploaded executable MUST NEVER be launched, imported, loaded as an
application, or otherwise intentionally executed.**

The binary is treated strictly as untrusted data.

Allowed operations include:

-   hashing;
-   reading bytes;
-   parsing PE structures;
-   extracting strings;
-   passing the artifact to static-analysis tooling such as Ghidra in
    analysis mode.

The API must never call the uploaded executable through `spawn`, `exec`,
`execFile`, PowerShell, `cmd`, Wine, or equivalent mechanisms.

Static-analysis tools are external dependencies and must be invoked with
controlled arguments. User-controlled filenames must never be
interpolated into shell commands.

------------------------------------------------------------------------

# 5. Conceptual pipeline

``` text
                    Legacy .exe
                        |
                        v
              [1] Safe Intake
            validate / hash / store
                        |
                        v
              [2] Binary Profile
          PE / arch / sections / metadata
                        |
          +-------------+-------------+
          |                           |
          v                           v
 [3] Lightweight Evidence      [4] Ghidra Headless
 imports / exports / strings   functions / calls / refs
          |                    selective decompilation
          +-------------+-------------+
                        |
                        v
                [5] Evidence Graph
         normalized, stable, traceable IDs
                        |
                        v
              [6] Inference Engine
       deterministic correlation rules
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
      Observed       Inferred       Unknown
          |             |             |
          +-------------+-------------+
                        |
                        v
          [7] System Reconstruction
 capabilities / candidate components /
 dependencies / external interactions
                        |
                        v
          [8] Modernization Blueprint
 risks / investigation sequence /
 recovery priorities / next evidence
                        |
                        v
                 Canonical JSON
                  /          \
                 v            v
             Markdown        HTML
```

Each stage must produce inspectable artifacts or structured data. A
later stage must not silently destroy provenance from an earlier stage.

------------------------------------------------------------------------

# 6. Key domain distinction: observation vs inference vs unknown

The system must distinguish these concepts everywhere.

## 6.1 Observed

Directly supported by extracted evidence.

Examples:

-   `WINHTTP.dll` is imported.
-   `HttpSendRequestW` appears in the import table.
-   the string `/api/licenses/validate` exists at a specific location;
-   function `FUN_140012340` references a specific string;
-   a PE section named `.rsrc` exists.

Observed facts must not be phrased as behavioral certainty beyond what
the evidence establishes.

Bad:

> "The application validates licenses online."

Good:

> "The binary imports HTTP APIs and contains a license-validation path."

## 6.2 Inferred

A higher-level conclusion derived from one or more observations using a
known rule.

Example:

> "The application appears to perform remote license validation."

An inference MUST include:

-   unique ID;
-   statement;
-   confidence;
-   rule ID;
-   supporting evidence IDs;
-   explanation;
-   limitations/counter-signals when relevant.

## 6.3 Unknown

Something important that available evidence cannot establish.

Example:

> "The database engine could not be determined."

An unknown SHOULD include:

-   why it matters;
-   what evidence is missing;
-   suggested way to resolve it;
-   related evidence IDs when useful.

**Never replace an unknown with a guess just to make the report look
complete.**

------------------------------------------------------------------------

# 7. Evidence model

All useful raw findings must be normalized into a common evidence model.

Suggested contract:

``` ts
type EvidenceKind =
  | "binary-metadata"
  | "pe-section"
  | "import"
  | "export"
  | "string"
  | "function"
  | "function-call"
  | "reference"
  | "decompilation"
  | "runtime-hint"
  | "signature"
  | "resource";

interface Evidence {
  id: string;                 // stable within analysis, e.g. ev-000123
  kind: EvidenceKind;
  sourceTool: string;         // pe-parser, strings, ghidra, etc.
  summary: string;
  rawValue?: string;
  location?: {
    address?: string;
    functionAddress?: string;
    section?: string;
    offset?: number;
  };
  relations?: string[];       // IDs of related evidence
  tags: string[];
  metadata: Record<string, unknown>;
}
```

Requirements:

-   IDs must be stable within one report.
-   Inferences reference evidence by ID, never by copied prose alone.
-   Evidence must retain source tool.
-   Addresses should be represented consistently as hexadecimal strings.
-   Raw decompilation should be bounded/truncated according to
    configured limits.
-   Sensitive-looking strings such as credentials/tokens must be
    redacted in human-readable reports while preserving enough metadata
    to explain the finding.

------------------------------------------------------------------------

# 8. Evidence graph / correlation

Do not treat imports, strings, and functions as independent flat lists.

The API should construct relationships such as:

``` text
ev-001 import HttpSendRequestW
       ^
       |
ev-100 function FUN_140012340
       |
       +------> ev-210 string "/api/licenses/validate"
```

Useful relations include:

-   function calls function;
-   function references string;
-   function references import;
-   function belongs to/uses section;
-   string referenced by function;
-   import referenced by function;
-   decompilation belongs to function.

This correlation is central to the product.

------------------------------------------------------------------------

# 9. Ghidra integration

Ghidra is an evidence extractor, **not the product output**.

## 9.1 Headless operation

Use Ghidra headless analysis.

Support:

-   Windows launcher: `support/analyzeHeadless.bat`
-   Linux launcher: `support/analyzeHeadless`

`GHIDRA_HOME` must be configurable.

Do not hardcode `/opt/ghidra` as the only usable environment.

The application should validate Ghidra availability at startup or
through a health/tool-status endpoint and return a clear diagnostic.

## 9.2 Windows execution

Windows is first-class.

If `.bat` invocation requires `cmd.exe`, implement it explicitly and
safely rather than assuming Unix execution semantics.

Paths containing spaces must work.

Do not construct unsafe shell command strings from user input.

## 9.3 Ghidra script

Create a project-owned Ghidra script that emits structured
machine-readable output, preferably JSON, rather than scraping human
console text.

It should extract, where practical:

-   program language/architecture;
-   entry point;
-   functions;
-   function address;
-   recovered function name;
-   whether name appears auto-generated;
-   callers/callees;
-   referenced imports/external functions;
-   referenced strings;
-   useful references;
-   bounded decompilation for selected functions.

The script output becomes raw evidence input for the Node application.

## 9.4 Selective decompilation

Do NOT decompile every function.

Use a configurable limit:

``` env
MAX_GHIDRA_FUNCTIONS=20
```

Function selection should score "interestingness".

Possible signals:

-   entry point proximity;
-   references to networking APIs;
-   database APIs;
-   filesystem APIs;
-   registry APIs;
-   cryptography APIs;
-   process/service APIs;
-   authentication/security-related strings;
-   URLs/hosts;
-   SQL-like strings;
-   configuration filenames;
-   high connectivity in call graph;
-   number of interesting references.

Store the reasons a function was selected.

Example:

``` json
{
  "address": "0x00473B90",
  "selectionScore": 18,
  "selectionReasons": [
    "references:http-api",
    "references:license-string",
    "calls:external-network-function"
  ]
}
```

------------------------------------------------------------------------

# 10. Lightweight binary analysis before Ghidra

Ghidra should not be required for information that can be obtained
cheaply.

Before or alongside Ghidra, extract:

-   filename;
-   byte size;
-   SHA-256;
-   PE type;
-   machine architecture;
-   subsystem;
-   entry point;
-   sections and relevant flags;
-   imports;
-   exports;
-   resources when feasible;
-   signature presence/status when feasible;
-   printable strings;
-   runtime/compiler hints when evidence supports them.

Do not make compiler/runtime identification claims without evidence. Use
confidence where appropriate.

------------------------------------------------------------------------

# 11. String processing

Raw strings are noisy. Implement normalization/filtering.

Interesting categories may include:

-   URLs;
-   hostnames;
-   IP-like values;
-   file paths;
-   configuration filenames;
-   registry paths;
-   SQL keywords/statements;
-   database-related identifiers;
-   protocol markers;
-   authentication/security terms;
-   error messages;
-   service names;
-   DLL/runtime identifiers.

Retain provenance and address/offset when available.

Do not dump tens of thousands of irrelevant strings into the final
report.

------------------------------------------------------------------------

# 12. Deterministic inference engine

For MVP, the core reconstruction MUST NOT depend on an LLM.

Implement explicit, testable rules.

Suggested structure:

``` ts
interface InferenceRule {
  id: string;
  title: string;
  evaluate(context: EvidenceContext): InferenceResult[];
}
```

Each inference result:

``` ts
interface Inference {
  id: string;
  ruleId: string;
  statement: string;
  category: string;
  confidence: "low" | "medium" | "high";
  confidenceScore: number; // 0..1
  evidenceIds: string[];
  explanation: string;
  limitations: string[];
}
```

## 12.1 Example rule: relational database access

Signals might include:

-   ODBC/OLE DB/database client import;
-   SQL-related external calls;
-   SQL statement strings;
-   connection-string fragments;
-   multiple signals referenced by the same function/cluster.

Example reasoning:

``` text
ODBC import
+ SQLConnect/SQLExecDirect
+ SQL-looking strings
+ references converge in related functions
------------------------------------------------
Inference: relational database interaction
Confidence: HIGH
```

A single string `"SELECT"` should NOT produce high confidence.

## 12.2 Example rule: HTTP/network communication

Signals:

-   WinHTTP/WinINet/Winsock imports;
-   URL/hostname strings;
-   HTTP method/path strings;
-   same functions referencing these signals.

## 12.3 Example rule: local configuration

Signals:

-   file APIs;
-   `.ini`, `.cfg`, `.xml`, `.json`, registry paths;
-   configuration-related strings;
-   correlated references.

## 12.4 Additional useful MVP capability families

Implement a manageable but compelling initial rule set for:

-   relational database interaction;
-   HTTP/network communication;
-   local configuration;
-   filesystem interaction;
-   Windows Registry interaction;
-   cryptography/security primitives;
-   process/service interaction;
-   possible authentication/credential handling;
-   logging/diagnostic behavior.

Do not claim actual runtime behavior merely because an API is imported.
Phrase inference carefully.

------------------------------------------------------------------------

# 13. Confidence model

Confidence must be explainable, not arbitrary decoration.

Prefer multiple independent and correlated signals.

Example policy:

-   **Low:** weak or isolated signal.
-   **Medium:** multiple supporting signals but incomplete correlation.
-   **High:** multiple independent signals that converge in the same
    relevant functions/relationships.

The report should explain why a confidence level was assigned.

Do not output `0.93` if there is no reproducible scoring model behind
it.

If a numeric score is used, document its deterministic calculation.

------------------------------------------------------------------------

# 14. Candidate component / responsibility reconstruction

The system may group related functions/evidence into **candidate
responsibility clusters**.

Examples:

-   database interaction;
-   remote licensing/validation;
-   local configuration;
-   file persistence;
-   authentication-related behavior.

Do NOT fabricate original architecture.

Bad:

``` text
Original class: LicenseService
Original method: ValidateLicense()
```

unless symbols genuinely establish those names.

Good:

``` text
Candidate responsibility: Remote licensing / validation
Functions:
- FUN_00473B90
- FUN_00473D20
- FUN_00474110
Confidence: medium
Evidence: [...]
```

Every candidate cluster must state that it is reconstructed/inferred
unless directly supported by symbols.

------------------------------------------------------------------------

# 15. External interactions

Produce a structured view of possible boundaries outside the binary.

Examples:

``` ts
interface ExternalInteraction {
  id: string;
  type:
    | "network"
    | "database"
    | "filesystem"
    | "registry"
    | "process"
    | "service"
    | "other";
  statement: string;
  confidence: Confidence;
  evidenceIds: string[];
  endpoints?: string[];
  limitations: string[];
}
```

Examples:

-   possible HTTP service;
-   relational database boundary;
-   local configuration file;
-   registry configuration;
-   filesystem output;
-   Windows service/process interaction.

------------------------------------------------------------------------

# 16. Unknowns engine

Unknowns are a first-class product feature.

The system should generate useful unknowns based on detected boundaries.

Example:

``` json
{
  "id": "unk-003",
  "question": "Which database engine is used?",
  "status": "unknown",
  "whyItMatters": "The database is a major dependency for replacement planning.",
  "relatedEvidenceIds": ["ev-101", "ev-202"],
  "missingEvidence": [
    "database-specific client library",
    "recoverable connection configuration"
  ],
  "suggestedResolution": [
    "Inspect configuration files from an existing installation.",
    "Inspect the deployed database server or DSN configuration."
  ]
}
```

This should make the report useful even where static analysis reaches
its limit.

------------------------------------------------------------------------

# 17. Modernization blueprint

This is a core deliverable, not an afterthought.

The blueprint must be based only on established
observations/inferences/unknowns.

It should answer:

1.  What system boundaries should engineers investigate first?
2.  Which dependencies appear most important?
3.  Which unknowns block safe replacement?
4.  What artifacts should be recovered from an existing installation?
5.  What characterization tests should be created before replacement?
6.  What migration sequence is suggested by the evidence?
7.  Which parts have weak evidence and require human validation?

Suggested structure:

``` ts
interface ModernizationBlueprint {
  summary: string;
  priorities: ModernizationPriority[];
  investigationSequence: InvestigationStep[];
  artifactsToRecover: ArtifactRecommendation[];
  characterizationTargets: CharacterizationTarget[];
  risks: ModernizationRisk[];
}
```

A modernization recommendation MUST reference the
inference/unknown/evidence that motivated it.

Avoid generic advice such as "use microservices", "move to cloud", or
"rewrite in a modern language" unless evidence and user requirements
justify it.

The MVP is an archaeology and decision-support tool, not an
architecture-opinion generator.

------------------------------------------------------------------------

# 18. Canonical analysis result

JSON is the source of truth.

Suggested high-level shape:

``` json
{
  "analysis": {
    "id": "analysis-uuid",
    "status": "completed",
    "createdAt": "...",
    "completedAt": "...",
    "toolVersions": {}
  },
  "binary": {
    "name": "SistemaVentas2009.exe",
    "sha256": "...",
    "sizeBytes": 2938472,
    "format": "PE32",
    "architecture": "x86",
    "subsystem": "Windows GUI",
    "entryPoint": "0x00401320"
  },
  "evidence": [],
  "capabilities": [],
  "candidateComponents": [],
  "externalInteractions": [],
  "dependencies": [],
  "interestingFunctions": [],
  "unknowns": [],
  "risks": [],
  "modernization": {},
  "limitations": []
}
```

Markdown and HTML must be generated from this model, not independently
reconstructed from raw Ghidra files.

------------------------------------------------------------------------

# 19. API endpoints

Use versioned routes.

## POST `/api/v1/analyses/binary`

Multipart upload:

``` text
file=<binary>
```

Response:

``` json
{
  "analysisId": "uuid",
  "status": "queued"
}
```

Use one analysis ID consistently for API status and work directory. **Do
not generate unrelated UUIDs for job ID and work directory.**

## GET `/api/v1/analyses/:id`

Returns job state and phase progress.

Example phases:

``` text
queued
intake
profiling
extracting
ghidra-analysis
correlating
inferring
reconstructing
reporting
completed
```

Failed phase should include actionable diagnostics.

## GET `/api/v1/analyses/:id/result`

Returns canonical JSON result after completion.

## GET `/api/v1/analyses/:id/report?format=json|markdown|html`

Returns the requested representation.

`json` should be the canonical result or a faithful representation of
it.

## GET `/api/v1/health`

Basic service health.

## GET `/api/v1/tools`

Return external-tool readiness, e.g.:

``` json
{
  "ghidra": {
    "status": "available",
    "home": "C:\\Tools\\ghidra_12.1.4_PUBLIC",
    "launcher": "...\\support\\analyzeHeadless.bat"
  }
}
```

Do not expose secrets or unnecessary host information.

------------------------------------------------------------------------

# 20. Job model and persistence

For hackathon MVP, filesystem-backed job artifacts are acceptable if
cleanly abstracted.

Suggested layout:

``` text
work/
  <analysis-id>/
    input/
      original.exe
    raw/
      pe.json
      strings.json
      ghidra.json
      ghidra-stderr.txt
    normalized/
      evidence.json
      inferences.json
    result/
      analysis.json
      report.md
      report.html
    meta.json
```

Use the same `<analysis-id>` everywhere.

Persist enough state that completed reports survive process-level
request boundaries.

Clean temporary Ghidra projects when safe.

------------------------------------------------------------------------

# 21. Error handling and graceful degradation

Errors must distinguish:

-   invalid upload;
-   unsupported binary;
-   file too large;
-   PE parse failure;
-   Ghidra unavailable;
-   Ghidra timeout;
-   Ghidra analysis failure;
-   Ghidra output parse failure;
-   report generation failure;
-   internal error.

Where possible, preserve partial evidence.

Example: if optional signature inspection fails but PE parsing and
Ghidra succeed, complete with a warning.

If Ghidra is required for reconstruction and unavailable, return a clear
tool error rather than a generic 500.

Store tool stderr for diagnostics, but sanitize what is exposed through
the public API.

------------------------------------------------------------------------

# 22. Configuration

Support environment configuration.

Suggested variables:

``` env
PORT=3000
WORK_DIR=./work

GHIDRA_HOME=C:\Tools\ghidra_12.1.4_PUBLIC
ANALYSIS_TIMEOUT_MS=300000
MAX_GHIDRA_FUNCTIONS=20
MAX_BINARY_BYTES=104857600

JOB_RETENTION_MS=3600000
MAX_QUEUE_DEPTH=10
```

If `.env` files are supported, explicitly load them before configuration
is evaluated.

Provide `.env.example`.

Never commit `.env`.

Defaults are allowed for non-secret portable values, but OS-specific
external-tool paths should be clearly documented and validated.

------------------------------------------------------------------------

# 23. Cross-platform requirements

Primary hackathon development target:

-   Windows 10/11;
-   Node.js 20+;
-   modern supported JDK required by installed Ghidra;
-   Ghidra installed locally.

Also keep Linux compatibility where practical.

Requirements:

-   no Unix-only path assumptions;
-   no hardcoded `/opt/ghidra` requirement;
-   Windows `.bat` launcher supported;
-   spaces in paths supported;
-   UTF-8 throughout;
-   child processes inherit or receive appropriate Unicode environment;
-   use Node `path` APIs.

------------------------------------------------------------------------

# 24. Security requirements

Even though this is a hackathon MVP, binary upload is
security-sensitive.

Implement:

-   upload size limit;
-   generated storage filename instead of trusting original filename;
-   path traversal prevention;
-   MIME/extension alone is not trusted for format validation;
-   PE signature/magic validation;
-   no execution of uploaded binary;
-   no shell interpolation of user values;
-   timeout external tools;
-   bounded output;
-   bounded concurrency;
-   cleanup policy;
-   error sanitization.

The system should clearly state:

> Static analysis does not establish that a binary is safe.

------------------------------------------------------------------------

# 25. Report requirements

The HTML/Markdown report should prioritize understanding over raw dumps.

Recommended sections:

1.  **Executive Reconstruction Summary**
2.  **Binary Identification**
3.  **Analysis Coverage & Tool Status**
4.  **Reconstructed Capabilities**
5.  **Candidate Responsibility Components**
6.  **External Interactions**
7.  **Interesting Functions**
8.  **Dependencies / Runtime Hints**
9.  **Unknowns**
10. **Modernization Blueprint**
11. **Limitations**
12. **Evidence Index**

For every inferred item display:

-   classification;
-   confidence;
-   explanation;
-   evidence links/IDs;
-   limitations.

The Evidence Index should let a reviewer trace a high-level statement
down to imports, strings, functions, references, or metadata.

Avoid rendering huge raw decompilations by default.

------------------------------------------------------------------------

# 26. Dummy acceptance scenario

This scenario exists to communicate expected product behavior. It is NOT
expected to match a specific real binary byte-for-byte.

Assume input:

``` text
SistemaVentas2009.exe
```

Static extraction observes:

``` text
PE32
x86
Windows GUI

Imports:
  ODBC32.dll
    SQLConnectA
    SQLExecDirectA

  WININET.dll
    InternetConnectA
    HttpSendRequestA

  KERNEL32.dll
    CreateFileA
    WriteFile

Strings:
  "SELECT * FROM clientes"
  "INSERT INTO ventas"
  "/api/licencias/validar"
  "config.ini"
  "Server="
  "User ID="
```

Ghidra correlates:

``` text
FUN_00452A10
  -> SQLConnectA
  -> SQLExecDirectA
  -> "SELECT * FROM clientes"

FUN_00473B90
  -> InternetConnectA
  -> HttpSendRequestA
  -> "/api/licencias/validar"

FUN_00461C20
  -> CreateFileA
  -> "config.ini"
  -> "Server="
```

A good Code Archaeologist result is NOT merely the above lists.

It should produce something conceptually like:

``` text
CAPABILITY: Relational database interaction
Classification: inferred
Confidence: HIGH

Why:
- ODBC32.dll observed
- SQLConnectA observed
- SQLExecDirectA observed
- SQL strings observed
- signals converge in FUN_00452A10

Limitation:
- Database engine is not established by current evidence.
```

And:

``` text
CAPABILITY: Remote communication possibly related to license validation
Classification: inferred
Confidence: HIGH

Why:
- InternetConnectA observed
- HttpSendRequestA observed
- "/api/licencias/validar" observed
- signals converge in FUN_00473B90

Limitation:
- Static analysis does not establish the actual server contacted at runtime.
```

And:

``` text
CANDIDATE RESPONSIBILITY:
Remote licensing / validation

Functions:
- FUN_00473B90

Evidence:
- ev-...
- ev-...
- ev-...

Confidence: MEDIUM/HIGH according to deterministic scoring.
```

And an explicit unknown:

``` text
UNKNOWN:
Which relational database engine is used?

Why it matters:
Database compatibility and schema recovery are prerequisites for replacement.

How to resolve:
- Recover config.ini from an installed system.
- Inspect ODBC DSN configuration.
- Inspect the existing database environment.
```

And a modernization step:

``` text
PRIORITY 1 — Recover the database boundary

Evidence suggests relational database access through ODBC.

Recommended investigation:
1. Recover deployed configuration.
2. Identify DBMS and DSN.
3. Recover schema/stored procedures.
4. Capture representative queries/workflows.
5. Build characterization tests before replacing persistence behavior.
```

If the implementation cannot produce this *kind* of traceable
reconstruction from the dummy fixture, the core MVP is not complete.

------------------------------------------------------------------------

# 27. Negative acceptance scenarios

The system must also prove that it does NOT overclaim.

## Scenario A: isolated SQL-looking string

Evidence:

``` text
"SELECT"
```

No DB imports, calls, connection strings, or correlated references.

Expected:

-   MAY create low-confidence evidence/tag.
-   MUST NOT claim high-confidence database access.

## Scenario B: HTTP library imported but no usage correlation

Evidence:

``` text
WINHTTP.dll
```

Expected:

-   observed import;
-   possible network capability at low confidence;
-   MUST NOT claim a specific remote service.

## Scenario C: no evidence of database engine

Evidence supports ODBC, but nothing identifies SQL Server/MySQL/etc.

Expected:

``` text
Database interaction: inferred
Database engine: UNKNOWN
```

Never guess the engine.

## Scenario D: Ghidra auto-generated names

Expected:

-   retain `FUN_...` or equivalent;
-   label as recovered/auto-generated;
-   do not invent original method/class names.

------------------------------------------------------------------------

# 28. Testing requirements

Use automated tests from the start.

## Unit tests

At minimum:

-   PE metadata normalization;
-   evidence ID creation;
-   string classification;
-   inference rules;
-   confidence calculation;
-   unknown generation;
-   component clustering;
-   modernization rule generation;
-   report mapping;
-   path handling.

## Inference tests

Each deterministic rule must have:

-   positive high-confidence fixture;
-   medium/partial fixture;
-   negative fixture;
-   contradictory/noisy fixture when relevant.

Example:

``` text
ODBC + SQL calls + SQL strings + correlation => high
ODBC + SQL call => medium
"SELECT" alone => no high-confidence DB inference
```

## API integration tests

Test:

-   valid upload;
-   invalid file;
-   oversized file;
-   job polling;
-   completed result;
-   report formats;
-   tool unavailable;
-   failed analysis;
-   warnings/partial completion.

## Ghidra adapter tests

Keep Ghidra-specific execution behind an adapter so most tests do not
require a full Ghidra run.

Provide fixture JSON representing Ghidra output.

Also provide at least one documented manual end-to-end test with a known
legitimate PE executable.

------------------------------------------------------------------------

# 29. Architecture expectations

Prefer clear separation of responsibilities.

Suggested modules:

``` text
src/
  app/
  config/
  modules/
    analyses/
      api/
      application/
      domain/
      infrastructure/

    binary/
      domain/
      pe/
      strings/

    ghidra/
      adapter/
      scripts/

    evidence/
      domain/
      correlation/

    inference/
      rules/
      scoring/

    reconstruction/
      capabilities/
      components/
      interactions/
      unknowns/

    modernization/

    reports/
      json/
      markdown/
      html/

  shared/
    errors/
    process/
    filesystem/
    logging/
```

This is guidance, not a requirement to create unnecessary abstraction.

The important dependency direction is:

``` text
external tools -> normalized evidence -> inference/reconstruction -> reports
```

Report generation must not contain business inference logic.

Ghidra parsing must not contain modernization logic.

Controllers must not contain analysis logic.

------------------------------------------------------------------------

# 30. Observability

Log meaningful phase transitions:

``` text
analysis=<id> phase=intake status=started
analysis=<id> phase=profiling status=completed
analysis=<id> phase=ghidra-analysis status=started
analysis=<id> phase=ghidra-analysis status=completed durationMs=...
analysis=<id> phase=inferring status=completed inferences=...
```

Do not log huge binary data, full decompilation, or potentially
sensitive strings unnecessarily.

Record tool versions in the final result when possible.

------------------------------------------------------------------------

# 31. Performance / bounded analysis

This is a hackathon system and must finish predictably.

Use:

-   upload limit;
-   analysis timeout;
-   queue depth;
-   bounded Ghidra function selection;
-   bounded strings;
-   bounded decompilation size;
-   controlled concurrency.

A useful partial analysis is better than an unbounded "analyze
everything" process.

------------------------------------------------------------------------

# 32. LLM / Granite integration policy

An LLM is **optional enrichment**, not the source of truth for MVP.

If IBM Granite or another model is later added, it may:

-   summarize established findings;
-   rewrite technical evidence for readability;
-   help generate a human-friendly executive summary;
-   explain modernization steps already justified by structured
    evidence.

It MUST NOT:

-   create new binary facts;
-   invent dependencies;
-   invent original names/classes;
-   upgrade confidence without deterministic evidence;
-   hide uncertainty;
-   replace evidence IDs.

Any model-generated narrative must be downstream of the canonical
structured analysis.

A strong later architecture is:

``` text
Binary evidence
      |
Deterministic reconstruction
      |
Canonical JSON
      |
Optional Granite explanation layer
```

not:

``` text
binary dump -> LLM -> trust whatever it says
```

------------------------------------------------------------------------

# 33. Definition of done for hackathon MVP

The API is considered MVP-complete only when all of the following are
true:

-   [ ] Accepts a valid Windows PE executable.
-   [ ] Never executes the uploaded binary.
-   [ ] Uses one stable analysis ID.
-   [ ] Calculates SHA-256.
-   [ ] Extracts PE profile.
-   [ ] Extracts useful imports/exports/strings.
-   [ ] Runs Ghidra headlessly on Windows.
-   [ ] Produces structured Ghidra output.
-   [ ] Selects a bounded set of interesting functions.
-   [ ] Captures function/import/string relationships.
-   [ ] Normalizes all findings into traceable evidence.
-   [ ] Produces deterministic capability inferences.
-   [ ] Produces explainable confidence.
-   [ ] Produces candidate responsibility clusters.
-   [ ] Produces external-interaction candidates.
-   [ ] Produces explicit unknowns.
-   [ ] Produces evidence-backed modernization priorities.
-   [ ] Returns canonical JSON.
-   [ ] Generates Markdown from canonical JSON.
-   [ ] Generates HTML from canonical JSON.
-   [ ] Includes evidence index.
-   [ ] Handles Ghidra/tool failures clearly.
-   [ ] Includes automated rule/API tests.
-   [ ] Passes negative anti-hallucination tests.
-   [ ] Demonstrates at least one real legitimate executable end-to-end.
-   [ ] Documentation explains installation and Ghidra/JDK requirements.
-   [ ] `.env.example` exists.
-   [ ] Project builds and tests successfully on the documented
    environment.

------------------------------------------------------------------------

# 34. Implementation milestones for Bob

Bob should work incrementally and leave the project runnable after each
milestone.

## Milestone 1 --- Foundation and safe binary intake

Implement:

-   project setup;
-   config;
-   API;
-   upload;
-   validation;
-   hashing;
-   job model;
-   work directory;
-   PE profile;
-   basic strings/imports;
-   health/tools endpoints;
-   tests.

**Acceptance:** upload a PE and retrieve a structured profile.

## Milestone 2 --- Ghidra evidence extraction

Implement:

-   cross-platform Ghidra launcher;
-   project-owned Ghidra script;
-   structured output;
-   functions;
-   calls/references;
-   string/import relationships;
-   interesting-function scoring;
-   selective decompilation;
-   tests/fixtures.

**Acceptance:** a real PE produces normalized function-level evidence.

## Milestone 3 --- Archaeology engine

Implement:

-   evidence graph;
-   inference rules;
-   confidence model;
-   capability reconstruction;
-   external interactions;
-   candidate components;
-   unknowns;
-   anti-overclaim tests.

**Acceptance:** dummy scenario produces traceable conclusions and
negative scenarios do not overclaim.

## Milestone 4 --- Modernization and reports

Implement:

-   modernization blueprint;
-   canonical result;
-   Markdown;
-   HTML;
-   evidence index;
-   complete API integration tests;
-   README/demo instructions.

**Acceptance:** one API call + polling produces a judge-ready report
from a real executable.

Do not start a frontend during these milestones.

------------------------------------------------------------------------

# 35. Bob working rules

While implementing this brief:

1.  Read and plan before coding.
2.  Keep a concise implementation plan/checklist.
3.  Implement milestone-by-milestone.
4.  Run build/tests after meaningful changes.
5.  Do not silently change the product scope.
6.  Do not replace deterministic inference with an LLM shortcut.
7.  Do not invent evidence to make demo output richer.
8.  Prefer graceful degradation to opaque failure.
9.  Document external prerequisites.
10. Preserve Windows compatibility continuously.
11. If a requirement is ambiguous, choose the interpretation that
    maximizes traceability and minimizes unsupported claims.
12. Keep raw-tool adapters separate from product/domain logic.
13. Every high-level conclusion must be traceable to evidence.
14. Every unknown must remain unknown until evidence resolves it.
15. The final README must include exact setup, Ghidra/JDK configuration,
    build, test, run, and demo commands.

------------------------------------------------------------------------

# 36. Judge-facing success criteria

When evaluating whether a feature is worth implementing, prioritize
features that help demonstrate these questions clearly:

### "Why isn't this just Ghidra?"

Because Ghidra extracts low-level program information; Code
Archaeologist correlates that information into evidence-backed system
understanding, explicit uncertainty, and modernization guidance.

### "Why isn't this just an AI summary of a decompiler?"

Because the canonical reconstruction is deterministic and traceable.
Every inference has evidence and a reproducible rule. AI, if present, is
only a downstream explanation layer.

### "What problem does this solve?"

Engineers frequently inherit legacy applications with incomplete source,
documentation, or institutional knowledge. The system provides a
defensible starting map for investigation and replacement.

### "Can I trust it?"

The system separates observed facts, inferred conclusions, and unknowns.
It exposes confidence and supporting evidence instead of hiding
uncertainty.

### "What do I do after reading the report?"

The modernization blueprint converts discoveries and unknowns into an
ordered investigation plan.

------------------------------------------------------------------------

# 37. Final product principle

Code Archaeologist should behave less like a scanner that says:

> "I found 4,000 functions and 12,000 strings."

and more like an experienced engineer who says:

> "Here is what the artifact proves. Here is what the combined evidence
> strongly suggests. Here is what we still cannot know. Here is exactly
> where those conclusions came from. And here is what your team should
> investigate next before replacing this system."

That distinction is the product.
