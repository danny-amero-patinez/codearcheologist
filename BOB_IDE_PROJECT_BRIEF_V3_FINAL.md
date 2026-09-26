# BOB IDE MASTER PROJECT BRIEF V3

## Code Archaeologist --- Evidence-Driven Binary Archaeology API

**Status:** Hackathon MVP --- clean-room rebuild specification\
**Implementation agent:** IBM Bob IDE\
**Primary deliverable:** Backend/API only\
**Primary input:** Windows PE executables (`.exe`)\
**Primary development target:** Windows 11\
**Secondary target:** Linux portability\
**Runtime:** Node.js 22+, TypeScript, Express, Zod\
**Static analysis:** PE parsing + strings + Ghidra headless\
**Core principle:** deterministic, evidence-backed reconstruction\
**Priority:** Produce a working, tested, judge-ready MVP with the
smallest reliable implementation. Do not spend budget on optional polish
while an acceptance criterion remains unsatisfied.

------------------------------------------------------------------------

# 0. READ THIS FIRST --- EXECUTION RULES FOR BOB

This document is the authoritative specification for the project.

Before writing code:

1.  Read this entire brief.
2.  Create a concise internal implementation checklist mapped to the
    milestones below.
3.  Implement milestone by milestone without asking for confirmation
    unless a truly blocking ambiguity makes implementation impossible.
4.  Run build/tests after each meaningful milestone.
5.  Fix failures before stacking more functionality on top of a broken
    milestone.
6.  Prefer simple, deterministic code over speculative abstractions.
7.  Do not perform broad refactors, cosmetic cleanup, speculative
    architecture, optional infrastructure, or unrelated enhancements
    while any acceptance criterion in this document remains unsatisfied.
8.  Do not add a frontend.
9.  Do not add a database, cloud queue, authentication system, external
    LLM, dynamic sandbox, malware execution, or unrelated
    source-repository scanning.
10. Do not stop after producing raw Ghidra output. The reconstruction
    layer is the product.
11. Preserve Windows compatibility continuously. Paths containing spaces
    are a required test case.
12. At the end, run the full build and test suite and report:

-   files created/changed;
-   implemented milestones;
-   build/test results;
-   exact local setup/run/demo commands;
-   known limitations.

**Budget rule:** if implementation budget becomes constrained, spend
effort in this order:

1.  Safe intake + working PE analysis.
2.  Correct Ghidra integration.
3.  Evidence normalization and traceability.
4.  Function-level correlation and candidate responsibility
    reconstruction.
5.  Canonical result and reports.
6.  Focused tests and end-to-end smoke test.
7.  Documentation.
8.  Cosmetic improvements only if everything above is complete.

Do not consume significant effort on code style refactors, generalized
frameworks, optional features, or UI.

------------------------------------------------------------------------

# 1. PRODUCT THESIS

Code Archaeologist is an **evidence-driven binary archaeology system for
engineers who inherit legacy software without source code or trustworthy
documentation**.

It is **not**:

-   a Ghidra wrapper;
-   a decompiler viewer;
-   a malware scanner;
-   a vulnerability scanner;
-   a source-code recovery promise;
-   an AI system that guesses what a binary does;
-   a tool that executes unknown binaries.

The system accepts a legacy executable as an inert artifact, extracts
low-level static evidence, correlates that evidence, reconstructs
bounded higher-level knowledge about the program, explicitly identifies
what cannot be established, and produces an actionable investigation and
modernization blueprint.

The central product question is:

> **Given only this binary, what can an engineer responsibly learn about
> the system, why should they believe it, what remains unknown, and what
> should they investigate next before replacing or modernizing it?**

## Non-negotiable product rule

> **A successful analysis is not one that extracts Ghidra data. A
> successful analysis transforms traceable low-level evidence into
> useful, bounded, reproducible knowledge about the legacy system.**

A useful mental model is:

``` text
Ghidra tells us what is inside the binary.

Code Archaeologist tries to reconstruct what that evidence means
for the engineers who have to replace it.
```

The intended pipeline is:

``` text
Binary
  ↓
Raw evidence
  ↓
Normalized evidence
  ↓
Function profiles
  ↓
Correlated function clusters
  ↓
Candidate responsibilities
  ↓
Observed / Inferred / Unknown
  ↓
Investigation & modernization blueprint
```

------------------------------------------------------------------------

# 2. HACKATHON POSITIONING

The demo story should be understandable in minutes:

> A company has an important Windows application from years ago. The
> source repository and documentation are gone. They only have the
> executable. Code Archaeologist analyzes the binary without running it,
> reconstructs evidence-backed capabilities and candidate
> responsibilities, shows exactly why each conclusion was reached,
> identifies unknowns instead of hallucinating, and creates an
> investigation and modernization blueprint for the engineers who must
> replace it.

Optimize for:

1.  **Differentiation** --- more than raw Ghidra output.
2.  **Trust** --- every material conclusion links back to evidence.
3.  **Explainability** --- engineers can inspect why an inference
    exists.
4.  **Usefulness** --- output guides real modernization work.
5.  **Demo clarity** --- value is obvious quickly.
6.  **Reproducibility** --- the same evidence produces the same
    deterministic inference.
7.  **Honest uncertainty** --- `unknown` is a valid and important
    result.

Do not broaden this MVP into repository/source scanning. The product is
binary archaeology when source is unavailable.

------------------------------------------------------------------------

# 3. SCOPE

## 3.1 In scope

-   REST API in TypeScript/Node.js.
-   Upload and analyze Windows PE executables.
-   Static analysis only.
-   SHA-256 and binary identity.
-   PE format validation using actual bytes/structures, not filename
    alone.
-   PE32 and PE32+ identification.
-   Architecture, subsystem, entry point.
-   PE sections.
-   Imports and exports.
-   Useful resources/version metadata when feasible.
-   Signature presence when feasible; do not equate presence with trust.
-   Printable string extraction with filtering, offsets/provenance, and
    bounds.
-   Ghidra headless integration.
-   Function inventory.
-   Function addresses/names.
-   Explicit marker for auto-generated names such as `FUN_...`.
-   Call relationships.
-   References between functions, imports/external symbols, and strings.
-   Selective bounded decompilation.
-   Normalized evidence with stable IDs.
-   Deterministic inference rules.
-   Function profiles.
-   Function correlation/clustering.
-   Candidate capability hypotheses.
-   Candidate responsibility reconstruction.
-   External interactions.
-   Explicit unknowns.
-   Evidence-backed modernization/investigation guidance.
-   Canonical JSON result.
-   Markdown report derived from canonical result.
-   HTML report derived from canonical result.
-   Job phases/status.
-   Windows first-class support.
-   Linux compatibility where practical.
-   Automated tests.
-   Real benign PE end-to-end smoke test instructions.

## 3.2 Explicitly out of scope

-   Frontend/UI.
-   User accounts.
-   Cloud deployment.
-   Persistence database.
-   Distributed queues.
-   Repository/GitHub/source ZIP analysis.
-   Semgrep/Trivy source scanning.
-   Dynamic execution.
-   Sandboxing.
-   Malware detonation.
-   Debugging the uploaded executable.
-   Exploit generation.
-   Automatic patching/rewrite.
-   Automatic source-code recreation.
-   Autonomous migration into a replacement application.
-   Full decompilation of every function.
-   Perfect architecture recovery.
-   Claims that reconstructed responsibilities are original source
    modules/classes.
-   Mandatory external LLM/API credentials.
-   LLM-generated facts.

------------------------------------------------------------------------

# 4. SAFETY BOUNDARY --- NEVER EXECUTE THE UPLOADED BINARY

The uploaded executable MUST NEVER be intentionally launched or
executed.

Treat it strictly as untrusted data.

Allowed:

-   reading bytes;
-   hashing;
-   parsing PE structures;
-   extracting strings;
-   passing the artifact to Ghidra in static-analysis mode.

Forbidden:

-   launching the uploaded `.exe`;
-   `spawn`/`exec`/`execFile` on the uploaded executable itself;
-   PowerShell/cmd/Wine execution of the uploaded binary;
-   importing/loading it as an application;
-   dynamic instrumentation.

Static-analysis tooling may be launched with controlled arguments.

Never interpolate user-controlled filenames into an unsafe shell
command.

Static analysis does **not** establish that a binary is safe. State this
clearly in reports.

------------------------------------------------------------------------

# 5. REQUIRED TECHNOLOGY AND PROJECT SHAPE

Use:

-   Node.js 22+
-   TypeScript
-   Express
-   Zod
-   structured logging
-   filesystem-based local job artifacts/metadata for MVP
-   a maintained PE parsing approach or a small well-tested parser
-   Ghidra headless
-   project-owned Ghidra script
-   deterministic rule-based reconstruction

Keep the architecture modular but small.

Suggested conceptual modules:

``` text
src/
  app/
  config/
  shared/
  modules/
    analysis/
    binary/
    evidence/
    ghidra/
    inference/
    reconstruction/
    reporting/
```

Adapt names if useful, but do not build an enterprise abstraction maze.

------------------------------------------------------------------------

# 6. CONFIGURATION

Provide `.env.example`.

Recommended variables:

``` env
PORT=3000
HOST=127.0.0.1
WORK_DIR=./work

MAX_BINARY_BYTES=104857600
MAX_GHIDRA_FUNCTIONS=20
MAX_STRINGS=5000
GHIDRA_TIMEOUT_MS=180000

GHIDRA_HOME=
```

Validate config at startup with Zod.

The application must not hardcode `/opt/ghidra`.

`GHIDRA_HOME` must work on Windows paths containing spaces.

------------------------------------------------------------------------

# 6A. PHASE 0 --- DOCUMENTATION-FIRST / CONTRACT-FIRST FOUNDATION

**This phase is mandatory and happens before production
implementation.**

The purpose is not retrospective documentation. The purpose is to
establish the architecture and externally observable contracts that
implementation must satisfy.

After Phase 0, another Bob/agent/developer who has only the contract
artifacts must be able to independently start:

-   a React web client;
-   a mock API/server;
-   black-box API/integration tests;
-   automated test tooling;
-   other API consumers;

without waiting for the backend to be finished and without reading
`src/`.

## 6A.1 Required Phase 0 artifacts

Create:

``` text
docs/
  ARCHITECTURE.md
  API_CONTRACT.md
  DOMAIN_MODEL.md
  ANALYSIS_PIPELINE.md
  EVIDENCE_AND_INFERENCE.md
  INTEGRATION_GUIDE.md
  TESTING_CONTRACT.md

openapi.yaml

examples/
  analysis-created.json
  analysis-processing.json
  analysis-completed.json
  analysis-partial.json
  analysis-failed.json
  analysis-result.json
  evidence-detail.json
  error-response.json
```

Additional concise ADRs/schema files are allowed when genuinely useful,
but do not turn Phase 0 into a documentation bureaucracy.

## 6A.2 `docs/ARCHITECTURE.md`

Define before implementation:

-   product purpose and boundaries;
-   major modules/responsibilities;
-   dependency direction;
-   complete analysis pipeline;
-   raw artifact flow;
-   canonical result flow;
-   external tools;
-   filesystem job storage;
-   Ghidra boundary;
-   reconstruction boundary;
-   reporting boundary;
-   failure/graceful-degradation model;
-   important architectural decisions and invariants.

The architecture must reflect this brief, not invent additional product
scope.

## 6A.3 `docs/API_CONTRACT.md`

Specify every public endpoint before implementing controllers.

For every endpoint document:

-   HTTP method;
-   path;
-   request;
-   path/query parameters;
-   multipart requirements;
-   success responses;
-   status codes;
-   error responses;
-   representative examples;
-   asynchronous/polling semantics.

The documented API must agree with `openapi.yaml`.

## 6A.4 `docs/DOMAIN_MODEL.md`

Define the implementation-independent domain contracts, including at
minimum:

-   Analysis;
-   AnalysisStatus;
-   AnalysisPhase;
-   BinaryProfile;
-   ToolCoverage;
-   Evidence;
-   EvidenceKind;
-   FunctionProfile;
-   Capability;
-   CandidateResponsibility / `candidateComponents` compatibility
    representation;
-   ExternalInteraction;
-   Unknown;
-   ModernizationRecommendation;
-   ErrorResponse.

Document relationships and invariants, especially:

-   one canonical analysis ID;
-   valid status transitions;
-   evidence ID referential integrity;
-   observed/inferred/unknown semantics;
-   auto-generated function-name semantics;
-   completed/partial/failed meaning.

## 6A.5 `docs/ANALYSIS_PIPELINE.md`

Document each phase with:

-   purpose;
-   inputs;
-   outputs/artifacts;
-   status transition;
-   failure behavior;
-   whether failure is fatal or allows `partial`;
-   relevant timeout/bounds.

Cover at least:

``` text
intake
profiling
extracting
ghidra-analysis
correlating
inferring
reconstructing
reporting
```

Document Ghidra degradation explicitly.

## 6A.6 `docs/EVIDENCE_AND_INFERENCE.md`

This is the contract for reconstruction logic.

Document:

-   evidence taxonomy;
-   evidence provenance;
-   stable evidence IDs;
-   deduplication expectations;
-   function profiles;
-   call-edge normalization;
-   observed/inferred/unknown;
-   confidence semantics;
-   candidate responsibility semantics;
-   clustering principles;
-   responsibility/capability rules;
-   anti-overclaim rules;
-   traceability invariants;
-   known false-positive exclusions such as `SendMessageW != network`.

The production inference engine must implement these documented rules
rather than inventing a different semantic model later.

## 6A.7 `docs/INTEGRATION_GUIDE.md`

Write this specifically so a separate frontend developer/agent can work
without the backend.

Include:

-   base URL/versioning;
-   upload flow;
-   exact multipart field name;
-   analysis-created response;
-   polling lifecycle;
-   terminal statuses;
-   retrieving canonical result;
-   retrieving evidence;
-   retrieving reports;
-   partial/failure handling;
-   representative request/response flows;
-   how to develop against fixtures/mocks before the API exists.

The guide must not require knowledge of Ghidra internals.

## 6A.8 `docs/TESTING_CONTRACT.md`

Define externally observable behavior so another agent can independently
build black-box tests before the API is complete.

Include:

-   contract invariants;
-   happy-path lifecycle;
-   invalid upload cases;
-   not-found behavior;
-   error envelope;
-   polling/status expectations;
-   partial-analysis expectations;
-   evidence lookup behavior;
-   report behavior;
-   schema validation expectations;
-   externally observable acceptance criteria.

Keep internal unit-test details separate from this external contract.

## 6A.9 `openapi.yaml` is a PRIMARY CONTRACT

Create a valid OpenAPI specification for the complete public API
**before implementing it**.

It must include:

-   all public endpoints;
-   multipart binary upload;
-   path/query parameters;
-   schemas/components;
-   enums;
-   canonical error schema;
-   success/error responses;
-   representative examples;
-   report format query values;
-   asynchronous analysis lifecycle models.

The OpenAPI document must be usable by another developer to:

-   generate types/client code if desired;
-   build a mock server;
-   implement a React client;
-   write contract tests.

Do not generate `openapi.yaml` retrospectively from controllers.

Implementation must conform to OpenAPI, not the other way around.

## 6A.10 Representative fixtures

Create realistic, internally consistent fixtures under `examples/`.

At minimum:

``` text
analysis-created.json
analysis-processing.json
analysis-completed.json
analysis-partial.json
analysis-failed.json
analysis-result.json
evidence-detail.json
error-response.json
```

Requirements:

-   fixtures conform to OpenAPI/domain contracts;
-   IDs referenced by `analysis-result.json` are internally valid;
-   evidence references resolve where applicable;
-   fixtures demonstrate observed/inferred/unknown;
-   completed/partial/failed are semantically distinct;
-   fixtures are generic examples, not production hardcoding;
-   client/test developers can use them as mock responses.

## 6A.11 Contract validation and freeze

Before production implementation:

1.  Check that `openapi.yaml`, `docs/`, and `examples/` agree.
2.  Validate OpenAPI syntax/schema if practical with a lightweight local
    tool/library.
3.  Validate example JSON against the documented/OpenAPI schemas where
    practical.
4.  Check terminology and enums are consistent.
5.  Check every endpoint described in docs exists in OpenAPI.
6.  Check every fixture uses the same contracts.
7.  Resolve inconsistencies now.

Then treat these artifacts as the implementation contract.

This is a **contract freeze**, not an immutable forever-version.

If implementation later proves that a public contract genuinely must
change:

``` text
1. identify and explain the required change
2. update the authoritative contract first
   - openapi.yaml
   - affected docs
   - affected examples
3. validate contract consistency
4. then change production implementation
5. update/add contract tests
```

Never silently change a public response because the implementation found
another shape easier.

## 6A.12 Parallel-development readiness gate

Before leaving Phase 0, answer this internally:

> Could another developer/agent with only `openapi.yaml`, `docs/`, and
> `examples/` implement a mock server, React client, or black-box API
> test suite without reading `src/` and without a running backend?

If the answer is no, Phase 0 is incomplete.

## 6A.13 Phase 0 acceptance

Phase 0 passes only when:

-   [ ] required documentation exists;
-   [ ] complete OpenAPI contract exists;
-   [ ] required fixtures exist;
-   [ ] terminology/enums agree;
-   [ ] examples conform to the contracts;
-   [ ] API lifecycle is unambiguous;
-   [ ] partial/failure semantics are documented;
-   [ ] reconstruction/evidence semantics are documented;
-   [ ] a frontend can be built against mocks;
-   [ ] black-box tests can be authored independently;
-   [ ] no production implementation was used as the source from which
    the contracts were retrospectively derived.

**Only after this gate passes should production implementation begin.**

The intended workflow is:

``` text
PRODUCT BRIEF
      ↓
ARCHITECTURE + DOMAIN CONTRACTS
      ↓
OPENAPI + EXAMPLES
      ↓
CONTRACT VALIDATION / FREEZE
      ↓
PARALLEL DEVELOPMENT CAN BEGIN
      ├──────────────┬────────────────┐
      ↓              ↓                ↓
   BACKEND        WEB CLIENT      BLACK-BOX TESTS
      ↓              ↓                ↓
      └──────────────┴────────────────┘
                     ↓
                INTEGRATION
```

Documentation-first does not mean excessive prose. Prefer precise
contracts, schemas, examples, invariants, and diagrams over verbose
narrative.

# 7. API CONTRACT

Prefix:

``` text
/api/v1
```

Implement:

``` text
GET  /api/v1/health
GET  /api/v1/diagnostics
GET  /api/v1/tools

POST /api/v1/analyses/binary

GET  /api/v1/analyses/:id
GET  /api/v1/analyses/:id/result
GET  /api/v1/analyses/:id/evidence/:evidenceId

GET  /api/v1/analyses/:id/report?format=json
GET  /api/v1/analyses/:id/report?format=markdown
GET  /api/v1/analyses/:id/report?format=html
```

`POST /analyses/binary` uses multipart/form-data with field:

``` text
file
```

Use **one canonical analysis UUID** generated once. The same ID must be
used for:

-   API response;
-   job metadata;
-   logs;
-   work directory;
-   artifacts;
-   result.

Do not generate a second ID in another layer.

Recommended statuses:

``` text
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

A Ghidra failure must not cause preliminary PE evidence to disappear.

If lightweight analysis succeeds but Ghidra fails, the job should
normally become `partial`, not `completed` and not necessarily `failed`.

------------------------------------------------------------------------

# 8. JOB ARTIFACT LAYOUT

Use an isolated directory per analysis:

``` text
work/
  <analysis-id>/
    input/
      binary.exe
    raw/
      pe.json
      strings.json
      ghidra.json
      ghidra.stdout.log
      ghidra.stderr.log
    result/
      analysis.json
      report.md
      report.html
    ghidra-project/
```

Exact naming may vary, but preserve raw artifacts and make diagnostics
inspectable.

------------------------------------------------------------------------

# 9. WINDOWS-FIRST GHIDRA INTEGRATION --- IMPLEMENT CORRECTLY THE FIRST TIME

This section contains known pitfalls from a previous implementation. Do
not repeat them.

## 9.1 Required versions and diagnostics

Target:

-   Ghidra 12.x or compatible current installation.
-   JDK 21+.
-   Node 22+.

Diagnostics must report at least:

``` json
{
  "ghidra": {
    "status": "available",
    "home": "...",
    "launcher": "...",
    "version": "..."
  },
  "java": {
    "status": "available",
    "version": "..."
  }
}
```

Detect Java actually used by the process environment. A machine may have
Java 8 and JDK 21 installed simultaneously. Do not assume `javac` and
`java` resolve to the same installation.

If Java is incompatible, report a clear diagnostic instead of failing
opaquely.

## 9.2 Launcher detection

Windows:

``` text
<GHIDRA_HOME>\support\analyzeHeadless.bat
```

Linux:

``` text
<GHIDRA_HOME>/support/analyzeHeadless
```

Validate the launcher exists before analysis.

## 9.3 Windows `.bat` invocation

Paths containing spaces MUST work.

Do not naïvely build a quoted shell string.

Use a safe, tested Windows strategy for invoking the `.bat` launcher and
passing arguments without argument shifting.

Capture:

-   exact logical argument list in debug diagnostics;
-   exit code;
-   stdout;
-   stderr;
-   duration;
-   timeout.

Do not use user-controlled strings to construct arbitrary shell syntax.

## 9.4 Ghidra project and import

Create an isolated Ghidra project per analysis.

Import the uploaded PE into Ghidra headlessly.

Use a bounded timeout.

Preserve stdout/stderr even when exit code is non-zero.

## 9.5 Project-owned Ghidra script

Store the Ghidra script in the repository.

The build process MUST copy non-TypeScript runtime assets such as
`.java` Ghidra scripts into the distribution directory.

`tsc` does not copy `.java` assets automatically.

Before launching Ghidra, validate that the script path and script file
actually exist in the built runtime.

The application must work after:

``` text
npm run build
npm start
```

---not only through a TypeScript development runner.

## 9.6 Correct postScript argument contract

Use Ghidra's actual post-script contract:

``` text
-postScript CodeArchaeologistScript.java <output-json-path> <max-functions>
```

Do **not** insert a literal `-scriptArgs` token between the script name
and its arguments.

The Ghidra script should receive conceptually:

``` text
args[0] = output JSON path
args[1] = maximum selected/decompiled functions
```

Validate argument count and parsing inside the script and emit a useful
error if invalid.

## 9.7 Structured output

The Ghidra script must write machine-readable JSON to the requested
output path.

After Ghidra exits successfully:

1.  verify `ghidra.json` exists;
2.  verify it is non-empty;
3.  parse it;
4.  validate its shape;
5.  only then mark the Ghidra phase successful.

Exit code `0` without the required output artifact is a Ghidra-phase
failure.

## 9.8 Ghidra raw contract

Extract where practical:

``` json
{
  "programLanguage": "x86/little/32/default",
  "entryPoint": "0x...",
  "totalFunctions": 0,
  "functions": [
    {
      "address": "0x...",
      "name": "FUN_...",
      "autoGenerated": true,
      "callers": ["0x..."],
      "callees": ["0x..."],
      "referencedImports": [],
      "referencedStrings": [],
      "references": [],
      "selectionScore": 0,
      "selectionReasons": [],
      "decompilation": null
    }
  ]
}
```

Adapt fields as necessary, but preserve equivalent information.

## 9.9 Call-edge normalization

Known pitfall: low-level extraction may produce values such as:

``` text
0x24
0xc0
0xbe
0x115
0x2
0x20
```

that are not meaningful internal function entry points.

Before graph clustering/correlation, normalize call edges.

An internal call edge should normally target a known Ghidra function
entry address.

External calls should map to known external/import symbols when
available.

Do not let arbitrary constants, ordinals, or unresolved references
become graph nodes merely because they look like addresses.

This filtering is mandatory before using connectivity as evidence.

------------------------------------------------------------------------

# 10. LIGHTWEIGHT ANALYSIS BEFORE GHIDRA

Ghidra should not be required for cheap facts.

Extract:

-   original upload filename;
-   stored filename;
-   byte size;
-   SHA-256;
-   PE type;
-   machine architecture;
-   subsystem;
-   entry point;
-   sections;
-   imports;
-   exports;
-   resources/version metadata when practical;
-   signature presence when practical;
-   printable strings;
-   runtime/compiler hints only when evidence supports them.

High entropy is a clue, not proof of packing or maliciousness.

Signature presence is not proof of trust.

------------------------------------------------------------------------

# 11. STRING EXTRACTION

Strings are noisy. Bound and normalize them.

Capture when available:

-   value;
-   encoding;
-   file offset/address;
-   category;
-   source/provenance.

Interesting categories include:

-   URLs;
-   hostnames;
-   IP-like values;
-   file paths;
-   config filenames;
-   registry paths;
-   SQL-like statements;
-   database identifiers;
-   protocol markers;
-   authentication/security terms;
-   error messages;
-   service/driver names;
-   DLL/runtime identifiers;
-   installer/uninstaller metadata.

Do not dump tens of thousands of irrelevant strings into human reports.

Potential secrets should not be unnecessarily exposed in rendered
reports.

------------------------------------------------------------------------

# 12. NORMALIZED EVIDENCE MODEL

Every material observation needs a stable evidence ID.

Suggested evidence kinds:

``` text
binary-metadata
pe-section
import
export
string
function
function-call
reference
decompilation
metadata
```

Suggested shape:

``` ts
interface Evidence {
  id: string;
  kind: string;
  sourceTool: "pe-parser" | "strings" | "ghidra";
  classification: "observed";
  summary: string;
  location?: {
    address?: string;
    offset?: number;
    functionAddress?: string;
  };
  data: unknown;
}
```

IDs must be stable within an analysis and valid everywhere they are
referenced.

Every candidate responsibility, inference, external interaction, and
modernization recommendation must trace back to valid evidence IDs.

Avoid double-counting the same underlying observation merely because it
appears in several representations.

Example: a single API reference observed in Ghidra should not magically
become three independent signals because it appears as a reference
object, a function annotation, and a decompilation line.

------------------------------------------------------------------------

# 13. OBSERVED / INFERRED / UNKNOWN

This distinction is mandatory.

## Observed

Directly extracted facts:

-   imported API;
-   literal string;
-   function address;
-   call edge;
-   registry path;
-   PE section;
-   decompiled operation, treated as approximate pseudocode evidence.

## Inferred

A bounded interpretation produced by deterministic correlation:

-   likely installation/registration responsibility;
-   likely service/driver lifecycle management;
-   probable filesystem deployment behavior.

## Unknown

Questions static evidence does not resolve:

-   exact runtime sequence;
-   actual server contacted;
-   original class/module names;
-   exact business purpose;
-   database engine when evidence is generic;
-   credential storage behavior without adequate evidence.

Never silently convert an unknown into a fact.

------------------------------------------------------------------------

# 14. FUNCTION PROFILES --- CORE RECONSTRUCTION INPUT

Build a normalized profile for each interesting/relevant function.

Conceptually:

``` ts
interface FunctionProfile {
  address: string;
  name: string;
  autoGenerated: boolean;

  callers: string[];
  callees: string[];

  apiReferences: string[];
  stringReferences: string[];
  evidenceIds: string[];

  decompilationEvidenceIds: string[];

  selectionScore: number;
  selectionReasons: string[];
}
```

Function profiles should correlate evidence by function address, not
merely aggregate globally.

The reconstruction engine should reason about **where signals
converge**.

------------------------------------------------------------------------

# 15. SELECTIVE DECOMPILATION

Do not decompile every function.

Default:

``` env
MAX_GHIDRA_FUNCTIONS=20
```

Score interesting functions using explainable signals such as:

-   relevant external API references;
-   relevant strings;
-   call relationships;
-   entry-point proximity;
-   meaningful recovered symbols;
-   high connectivity **after call-edge normalization**;
-   number/diversity of relevant evidence types.

Store selection reasons.

Auto-generated names like `FUN_00409140` are identifiers, not recovered
business names.

Decompilation is supporting pseudocode, not recovered source code.

Bound decompilation size in outputs.

------------------------------------------------------------------------

# 16. DETERMINISTIC INFERENCE ENGINE

The MVP must work without an LLM.

Use explicit testable rules.

Suggested structure:

``` ts
interface InferenceRule {
  id: string;
  evaluate(context: EvidenceContext): InferenceResult[];
}
```

Each inference should contain:

``` ts
interface Inference {
  id: string;
  ruleId: string;
  category: string;
  statement: string;
  classification: "inferred";
  confidence: "low" | "medium" | "high" | "not-applicable";
  evidenceIds: string[];
  rationale: string[];
  limitations: string[];
  counterEvidence?: string[];
}
```

Avoid fake precision. Prefer named confidence bands over arbitrary
percentages in judge-facing output.

Confidence must be deterministic and explainable.

Multiple **independent, correlated** signals can increase confidence.

A single generic string should not.

------------------------------------------------------------------------

# 17. CANDIDATE RESPONSIBILITIES --- THE MAIN PRODUCT DIFFERENTIATOR

A candidate responsibility is a reconstructed **technical
responsibility**, not a claim about an original source module/class.

Good examples when supported:

-   Windows installation and software registration
-   Windows Registry configuration persistence
-   Windows service or driver lifecycle management
-   Filesystem and deployment operations
-   Process execution and management
-   Network or remote communication
-   Cryptographic operations
-   Authentication/credential handling
-   Relational database interaction

Do not invent names such as:

``` text
InstallationManager
NetworkService
DatabaseRepository
AuthController
```

unless literal symbol evidence establishes those names.

A candidate should conceptually contain:

``` ts
interface CandidateResponsibility {
  id: string;
  name: string;
  kind: "candidate-responsibility";
  confidence: "low" | "medium" | "high";
  summary: string;

  functions: Array<{
    address: string;
    name: string;
    autoGenerated: boolean;
  }>;

  evidenceIds: string[];
  rationale: Array<{
    classification: "observed" | "inferred" | "unknown";
    text: string;
  }>;

  externalInteractions?: string[];
  limitations: string[];
}
```

Adapt to the project schema if needed.

------------------------------------------------------------------------

# 18. FUNCTION CORRELATION AND CLUSTERING

The system does not need sophisticated graph science for MVP.

A deterministic clustering approach is enough.

Use evidence such as:

-   valid caller/callee relationships;
-   shared relevant API families;
-   shared contextual strings;
-   related registry paths;
-   related service/driver identifiers;
-   related filesystem/deployment paths;
-   decompilation observations.

Possible approach:

1.  Build function profiles.
2.  Filter invalid call edges.
3.  Assign responsibility-specific signals to functions.
4.  Link functions through valid calls and strong shared contextual
    evidence.
5.  Build small connected/weighted clusters per responsibility.
6.  Produce a candidate only when minimum evidence criteria are
    satisfied.

Do not group functions merely because both have high connectivity.

Do not create one giant component from generic Win32 APIs.

Prefer small explainable clusters.

------------------------------------------------------------------------

# 19. REQUIRED RESPONSIBILITY RULES

These are baseline rules. Implement them conservatively.

## 19.1 Windows installation and software registration

Strong signals include combinations of:

APIs:

``` text
RegCreateKeyExW
RegSetValueExW
RegDeleteKeyExW
RegDeleteKeyW
RegOpenKeyExW
RegCloseKey
```

Contextual strings/paths:

``` text
Software\Microsoft\Windows\CurrentVersion\Uninstall
DisplayName
DisplayVersion
Publisher
UninstallString
ModifyPath
DisplayIcon
AppUserModelID
Software\Classes
INSTALL_FAILED
Setup
Installer
Uninstall
```

File associations and installer metadata strengthen the inference.

High confidence should require convergence across multiple independent
signal types and preferably function-level correlation.

## 19.2 Windows Registry configuration persistence

Signals:

``` text
RegOpenKeyExW
RegQueryValueExW
RegCreateKeyExW
RegSetValueExW
RegDeleteKeyExW
```

plus application-specific registry paths/values correlated to the same
functions.

Registry API presence alone does not establish the semantic purpose.

## 19.3 Windows service/driver lifecycle

Strong APIs:

``` text
OpenSCManagerW
CreateServiceW
OpenServiceW
StartServiceW
QueryServiceStatus
ControlService
DeleteService
CloseServiceHandle
```

Contextual strings:

``` text
service names
driver names
.sys paths
DRIVER_INSTALL_FAILED
DRIVER_UNINSTALL_FAILED
STOPPING_DRIVER
REMOVING_DRIVER
```

A combination of SCM APIs + service/driver strings is strong evidence.

## 19.4 Filesystem/deployment

Relevant APIs:

``` text
CreateFileW
ReadFile
WriteFile
DeleteFileW
CopyFileW
MoveFileExW
CreateDirectoryW
GetTempPathW
GetWindowsDirectoryW
GetSystemDirectoryW
SHGetFolderPathW
```

Contextual paths such as Windows/System32/temp/install destinations
strengthen deployment-specific inference.

## 19.5 Process execution/management

Relevant APIs may include:

``` text
CreateProcessW
CreateProcessA
ShellExecuteW
ShellExecuteExW
OpenProcess
CreateThread
TerminateProcess
```

Command-line strings correlated to a function may support a low/medium
hypothesis even when direct API evidence is absent, but do not
overclaim.

## 19.6 Network/remote communication

This rule MUST avoid a known false positive.

**The following are Win32 window/message APIs, NOT network APIs:**

``` text
SendMessageW
SendMessageA
SendDlgItemMessageW
SendDlgItemMessageA
PostMessageW
PostMessageA
```

They MUST NOT count as network evidence.

Actual network families include examples such as:

WinHTTP:

``` text
WinHttpOpen
WinHttpConnect
WinHttpOpenRequest
WinHttpSendRequest
WinHttpReceiveResponse
```

WinINet:

``` text
InternetOpen
InternetConnect
HttpOpenRequest
HttpSendRequest
InternetReadFile
```

Winsock:

``` text
WSAStartup
socket
connect
send
recv
getaddrinfo
```

Other explicit HTTP/network client libraries may be recognized when
identifiable.

A URL string alone is **not sufficient** for medium/high confidence
network behavior.

A URL may be documentation, metadata, help text, copyright information,
or an update link never contacted by the observed function.

High confidence should require network API/library evidence correlated
with endpoint/protocol strings in the same or related function cluster.

## 19.7 Relational database interaction

Strong signals include:

``` text
ODBC32.dll
SQLConnect*
SQLDriverConnect*
SQLExecDirect*
SQLPrepare*
SQLExecute*
```

or identifiable database client libraries/APIs plus SQL/config strings.

Generic strings containing `SELECT`, `INSERT`, `UPDATE`, `DELETE`,
`Server=`, or `User ID=` alone must remain low confidence.

Do not claim a specific database engine without engine-specific
evidence.

## 19.8 Authentication/credentials

Generic words such as:

``` text
password
user
login
auth
token
```

alone are insufficient for high confidence.

Require stronger correlated evidence such as credential APIs, protocol
flows, configuration/storage operations, or clearly related function
behavior.

Do not claim secure or insecure credential storage from generic static
strings.

## 19.9 Cryptographic operations

Recognize relevant cryptographic API/library evidence, but remain
precise.

For example:

``` text
CryptAcquireContextW
BCrypt*
NCrypt*
CryptEncrypt
CryptDecrypt
CryptHashData
```

A single `CryptAcquireContextW` plus documentation strings containing
`AES` does **not** prove that a particular application data flow
performs AES encryption.

It may support a bounded cryptographic-operation hypothesis, normally
medium/low depending on correlation.

Do not infer what data is encrypted unless evidence supports it.

------------------------------------------------------------------------

# 20. ANTI-FALSE-POSITIVE RULES

These are mandatory acceptance behaviors.

``` text
SendMessageW / SendDlgItemMessageW
    != network communication evidence

one URL
    != meaningful network capability

generic password/login strings
    != high-confidence authentication capability

generic SQL-looking strings
    != high-confidence database capability

CryptAcquireContextW alone
    != proof of application-level encryption behavior

registry APIs alone
    != proof of installer behavior

CreateFileW alone
    != proof of configuration-file behavior

high entropy
    != proof of packing or malware

digital signature presence
    != proof of trust/safety

FUN_* name
    != original source function name
```

Tests must cover these.

------------------------------------------------------------------------

# 21. CAPABILITY HYPOTHESES

Capabilities are broader than candidate responsibilities.

They may include:

-   filesystem operations;
-   process interaction;
-   registry access;
-   service management;
-   network communication;
-   database access;
-   cryptographic operations;
-   authentication/credential handling;
-   local configuration.

Improve confidence using function-level correlation.

Do not let global string counts dominate confidence.

Where a previous lightweight heuristic conflicts with richer Ghidra
evidence, the final result should explain or appropriately lower
confidence rather than blindly preserve the earlier score.

------------------------------------------------------------------------

# 22. EXTERNAL INTERACTIONS

Reconstruct candidate interactions with:

-   filesystem;
-   registry;
-   processes;
-   services/drivers;
-   network endpoints;
-   databases.

Each must include:

-   confidence;
-   evidence IDs;
-   limitations.

Do not say an endpoint was contacted at runtime merely because it
appears as a string.

Say it was **observed as an endpoint/string candidate** unless network
behavior is corroborated.

------------------------------------------------------------------------

# 23. INTERESTING FUNCTIONS

Expose a useful shortlist.

For each function include:

-   address;
-   name;
-   `autoGenerated`;
-   selection score;
-   selection reasons;
-   callers;
-   normalized callees;
-   key API references;
-   key string references;
-   linked candidate responsibilities;
-   evidence IDs;
-   bounded decompilation observation/excerpt where appropriate.

Do not dump giant pseudocode blocks.

If a function appears in several responsibilities, show that
relationship.

------------------------------------------------------------------------

# 24. UNKNOWNS

Unknowns should be actionable.

Example:

``` text
Question:
Which relational database engine is used?

Why it matters:
Database compatibility and schema recovery are prerequisites for replacement planning.

Missing evidence:
Database-specific client library or recoverable connection configuration.

How to resolve:
- inspect deployed configuration;
- inspect ODBC DSNs;
- inspect the existing database environment.
```

Do not generate an unknown merely because a generic heuristic fired
weakly. Unknowns should be meaningful to modernization work.

------------------------------------------------------------------------

# 25. MODERNIZATION / INVESTIGATION BLUEPRINT

The blueprint is evidence-constrained, not an invented rewrite
specification.

Priorities should be derived from reconstructed responsibilities and
important unknowns.

Examples:

For installation/registration:

-   enumerate registry keys;
-   recover installer metadata;
-   document deployed files;
-   characterize install/upgrade/uninstall behavior.

For service/driver lifecycle:

-   identify service/driver names;
-   map SCM operations;
-   determine binary paths/startup types;
-   document install/start/stop/uninstall sequence;
-   identify OS-specific contracts.

For filesystem/deployment:

-   identify created/copied/moved/deleted files;
-   document target directories and formats;
-   map side effects to lifecycle phases.

For network:

-   only if sufficiently supported, inventory endpoint candidates;
-   determine protocols and authentication through authorized follow-up
    investigation;
-   define integration/characterization tests.

For cryptography:

-   identify algorithms/key management only when evidence supports them;
-   otherwise explicitly state what must be investigated.

Every recommendation should map to supporting responsibility/evidence.

Do not prioritize unsupported business-value assumptions.

------------------------------------------------------------------------

# 26. CANONICAL RESULT

The JSON result is the source of truth.

Markdown and HTML must be generated from it, not independently
recomputed.

Recommended top-level shape:

``` json
{
  "analysis": {},
  "binary": {},
  "coverage": {},
  "evidence": [],
  "capabilities": [],
  "candidateComponents": [],
  "externalInteractions": [],
  "dependencies": [],
  "interestingFunctions": [],
  "unknowns": [],
  "risks": [],
  "modernization": [],
  "limitations": []
}
```

The existing field name `candidateComponents` is acceptable even though
the semantic objects are candidate responsibilities. Document this
clearly if retained for compatibility.

------------------------------------------------------------------------

# 27. REPORT REQUIREMENTS

Generate:

-   JSON;
-   Markdown;
-   HTML.

Recommended sections:

1.  Executive Reconstruction Summary
2.  Binary Identification
3.  Analysis Coverage & Tool Status
4.  Reconstructed Capabilities
5.  Candidate Responsibilities
6.  External Interactions
7.  Interesting Functions
8.  Dependencies / Runtime Hints
9.  Unknowns
10. Modernization Blueprint
11. Limitations
12. Evidence Index

Candidate responsibilities should be prominent, not buried after raw
evidence.

For each candidate display:

-   name;
-   confidence;
-   summary;
-   associated functions;
-   observed evidence;
-   inferred conclusion;
-   unknowns/limitations;
-   APIs;
-   contextual strings;
-   call relationships;
-   evidence IDs.

Reports should make traceability obvious.

Do not render huge raw decompilation by default.

------------------------------------------------------------------------

# 28. ERROR HANDLING AND GRACEFUL DEGRADATION

Phases should be individually observable.

Conceptual phases:

``` text
intake
profiling
extracting
ghidra-analysis
correlating
inferring
reconstructing
reporting
```

Persist phase status/duration/error information.

If Ghidra fails:

-   retain PE/import/string evidence;
-   retain stdout/stderr;
-   explain the failure;
-   produce a partial result when possible;
-   do not pretend function-level reconstruction succeeded.

If Ghidra succeeds but output is missing/invalid:

-   treat the Ghidra phase as failed;
-   return partial when lightweight analysis exists.

Do not mark an analysis `completed` when a required phase silently
failed.

------------------------------------------------------------------------

# 29. LOGGING

Structured logs should include where useful:

-   analysis ID;
-   phase;
-   tool;
-   duration;
-   status;
-   exit code.

Never log the entire binary.

Avoid logging huge decompilation/string dumps.

Persist Ghidra stdout/stderr as job artifacts for diagnostics.

Record tool versions in the result where practical.

------------------------------------------------------------------------

# 30. PERFORMANCE / BOUNDS

The system must finish predictably.

Use:

-   upload size limit;
-   Ghidra timeout;
-   bounded strings;
-   bounded selected functions;
-   bounded decompilation;
-   bounded report output;
-   controlled concurrency.

A useful partial analysis is better than an unbounded analysis.

------------------------------------------------------------------------

# 31. TEST STRATEGY

Do not wait until the very end to write every test.

Use focused unit/fixture tests plus API/integration tests.

At minimum test:

## Foundation

-   valid PE accepted;
-   invalid file rejected;
-   max size enforced;
-   one canonical job ID;
-   SHA-256 deterministic;
-   work directory uses same ID.

## Ghidra launcher

-   Windows launcher detection;
-   Linux launcher detection;
-   paths containing spaces;
-   Java diagnostic;
-   missing Ghidra;
-   timeout;
-   non-zero exit;
-   exit 0 + missing output treated as failure;
-   Ghidra script asset exists after build;
-   postScript argument ordering contains no `-scriptArgs`.

## Evidence

-   evidence IDs unique;
-   referenced evidence IDs exist;
-   function evidence retains addresses;
-   auto-generated names marked;
-   invalid tiny/unresolved callees do not become internal graph edges.

## Reconstruction

1.  Registry APIs + uninstall metadata + related functions →
    installation responsibility.
2.  SCM APIs + service/driver strings → service/driver lifecycle
    responsibility.
3.  File/deployment APIs + system/temp paths → filesystem/deployment
    responsibility.
4.  Related calls + shared strong responsibility evidence → functions
    can cluster.
5.  Candidate contains valid functions and evidence IDs.
6.  Candidate rationale contains observed/inferred/unknown separation.
7.  No Ghidra → lightweight partial result still works.

## Negative/anti-overclaim tests

1.  `SendMessageW` and `SendDlgItemMessageW` → **not network evidence**.
2.  Lone URL → no medium/high-confidence network responsibility.
3.  Generic `password`/`login` strings → no high-confidence auth.
4.  Generic SQL strings → no high-confidence database.
5.  `CryptAcquireContextW` alone → no claim about specific encrypted
    business data.
6.  `FUN_...` → never presented as recovered original source name.
7.  Registry API alone → not enough for installer responsibility.

## Reporting

-   JSON canonical result valid;
-   Markdown generated from canonical result;
-   HTML generated from canonical result;
-   candidate responsibilities visible;
-   evidence IDs visible;
-   limitations visible;
-   partial analysis clearly marked.

------------------------------------------------------------------------

# 32. REAL-BINARY ACCEPTANCE TARGET

Use a known benign Windows PE for manual smoke testing.

A useful reference case is a VeraCrypt executable/installer because it
contains rich evidence.

The implementation must not hardcode VeraCrypt-specific strings or
outcomes.

When analyzing a suitable VeraCrypt binary, defensible reconstruction
may include, if the evidence is actually present:

## Windows installation and software registration

Possible evidence:

``` text
RegCreateKeyExW
RegSetValueExW
RegDeleteKeyExW
Software\Microsoft\Windows\CurrentVersion\Uninstall\VeraCrypt
DisplayVersion
DisplayName
Publisher
UninstallString
ModifyPath
DisplayIcon
Software\Classes\VeraCryptVolume
AppUserModelID
```

## Windows service/driver lifecycle

Possible evidence:

``` text
OpenSCManagerW
CreateServiceW
OpenServiceW
StartServiceW
QueryServiceStatus
ControlService
DeleteService
VeraCryptService
DRIVER_INSTALL_FAILED
STOPPING_DRIVER
REMOVING_DRIVER
```

These are examples of expected evidence-driven responsibilities, **not
fixtures to hardcode into production rules as VeraCrypt special cases**.

The test succeeds when generic rules reconstruct defensible
responsibilities from the evidence.

Network must **not** become medium/high merely because VeraCrypt
contains URLs and `SendMessageW`.

------------------------------------------------------------------------

# 33. DUMMY DOMAIN ACCEPTANCE SCENARIO

For deterministic fixture tests, assume a hypothetical legacy
executable:

``` text
SistemaVentas2009.exe
```

Evidence:

``` text
PE32
x86
Windows GUI

ODBC32.dll:
  SQLConnectA
  SQLExecDirectA

WININET.dll:
  InternetConnectA
  HttpSendRequestA

KERNEL32.dll:
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

Function correlation:

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

Good result:

``` text
CAPABILITY: Relational database interaction
Classification: inferred
Confidence: HIGH

Why:
- ODBC client evidence observed
- SQLConnectA observed
- SQLExecDirectA observed
- SQL strings observed
- signals converge in FUN_00452A10

Limitation:
- database engine is not established by current evidence
```

And:

``` text
CAPABILITY: Remote communication possibly related to license validation
Classification: inferred
Confidence: HIGH

Why:
- InternetConnectA observed
- HttpSendRequestA observed
- endpoint/path string observed
- signals converge in FUN_00473B90

Limitation:
- static analysis does not establish the runtime server or exact protocol exchange
```

This illustrates correlation. Do not hardcode this fixture into
production output.

------------------------------------------------------------------------

# 34. OPTIONAL LLM / GRANITE POLICY

Do not add an LLM for this MVP unless every deterministic acceptance
criterion is already satisfied and substantial budget remains.

If later added:

``` text
Binary evidence
      ↓
Deterministic reconstruction
      ↓
Canonical JSON
      ↓
Optional Granite explanation
```

An LLM may:

-   summarize established findings;
-   improve readability;
-   explain already-justified modernization steps.

It must not:

-   invent binary facts;
-   invent dependencies;
-   invent original names/classes;
-   upgrade confidence without evidence;
-   hide uncertainty;
-   replace evidence IDs.

------------------------------------------------------------------------

# 35. KNOWN PITFALLS --- DO NOT REPEAT

A previous implementation exposed these integration mistakes. Treat
these as regression requirements.

## ID handling

**Wrong:** route creates one UUID and job service creates another.\
**Correct:** generate exactly one canonical analysis ID.

## Ghidra path

**Wrong:** hardcode `/opt/ghidra`.\
**Correct:** `GHIDRA_HOME`, Windows `.bat`, Linux launcher detection.

## Java

**Wrong:** assume any installed Java is compatible.\
**Correct:** detect/report actual `java` version; target JDK 21+.

## Windows quoting

**Wrong:** naïve `.bat` command string fails on paths with spaces.\
**Correct:** safe tested invocation preserving argument boundaries.

## Build assets

**Wrong:** Ghidra Java script exists in `src` but not `dist`.\
**Correct:** copy runtime assets during build and validate them.

## postScript args

**Wrong:**

``` text
-postScript CodeArchaeologistScript.java -scriptArgs output.json 20
```

**Correct:**

``` text
-postScript CodeArchaeologistScript.java output.json 20
```

## Ghidra success

**Wrong:** exit code 0 means success even if no `ghidra.json`.\
**Correct:** validate output artifact.

## Job status

**Wrong:** mark job `completed` after Ghidra failure.\
**Correct:** `partial` when lightweight analysis survives.

## Reconstruction

**Wrong:** thousands of Ghidra evidence objects but
`candidateComponents = []`.\
**Correct:** build function profiles, correlate evidence, reconstruct
responsibilities.

## Network classification

**Wrong:** classify `SendMessageW` / `SendDlgItemMessageW` as network
APIs.\
**Correct:** these are Win32 messaging APIs; exclude them from network
rules.

## Call graph

**Wrong:** treat tiny unresolved numeric targets as normal internal
function nodes.\
**Correct:** internal edges should resolve to known function entry
points.

## Confidence

**Wrong:** generic strings produce impressive-looking confidence.\
**Correct:** confidence comes from independent correlated evidence.

------------------------------------------------------------------------

# 36. IMPLEMENTATION MILESTONES

The implementation sequence is mandatory:

``` text
Phase 0: Contracts/documentation
        ↓
Milestone 1: Foundation
        ↓
Milestone 2: Ghidra
        ↓
Milestone 3: Evidence/function profiles
        ↓
Milestone 4: Reconstruction
        ↓
Milestone 5: Reports/modernization
        ↓
Milestone 6: Stabilization
```

Phase 0 is completed before production implementation. Afterward, leave
the project runnable after every implementation milestone.

## Milestone 1 --- Foundation and safe intake

Implement:

-   project setup;
-   config;
-   Express API;
-   upload;
-   validation;
-   canonical job ID;
-   hashing;
-   work directory;
-   PE profile;
-   imports/exports;
-   basic strings;
-   health/diagnostics/tools endpoints;
-   tests.

Acceptance:

> Upload a PE and retrieve a structured lightweight profile.

Run build/tests before continuing.

## Milestone 2 --- Ghidra evidence extraction

Implement:

-   cross-platform launcher;
-   Java/Ghidra diagnostics;
-   Windows paths-with-spaces support;
-   project-owned Ghidra script;
-   build asset copy;
-   correct postScript arguments;
-   structured `ghidra.json`;
-   functions;
-   callers/callees;
-   import/string references;
-   selective decompilation;
-   raw logs;
-   output validation;
-   tests.

Acceptance:

> A real PE produces validated normalized function-level evidence
> through the built application.

Run:

``` text
npm run build
npm test
```

before continuing.

## Milestone 3 --- Evidence normalization and function profiles

Implement:

-   evidence IDs;
-   provenance;
-   deduplication;
-   function profiles;
-   valid call-edge normalization;
-   evidence lookup;
-   interesting-function selection.

Acceptance:

> Every relevant function can be traced to APIs/strings/calls/evidence
> IDs without bogus internal call nodes.

## Milestone 4 --- Reconstruction engine

Implement:

-   capability rules;
-   responsibility rules;
-   deterministic confidence;
-   function correlation/clustering;
-   candidate responsibilities;
-   external interactions;
-   unknowns;
-   anti-overclaim rules/tests.

Acceptance:

> Rich evidence produces non-empty candidate responsibilities when
> justified; weak evidence does not overclaim.

## Milestone 5 --- Modernization and reports

Implement:

-   evidence-backed modernization blueprint;
-   canonical result;
-   JSON;
-   Markdown;
-   HTML;
-   evidence index;
-   API integration;
-   README/demo instructions.

Acceptance:

> One upload + polling flow produces a judge-ready report from a real
> benign executable.

## Milestone 6 --- Final stabilization

Run:

``` text
npm run build
npm test
```

Then perform/document a real benign PE smoke test.

Fix only issues required by acceptance criteria.

Do not add another major feature after this milestone.

------------------------------------------------------------------------

# 37. DEFINITION OF DONE

The MVP is complete only when:

-   [ ] Valid Windows PE upload works.
-   [ ] Uploaded binary is never executed.
-   [ ] One canonical analysis ID is used everywhere.
-   [ ] SHA-256 is calculated.
-   [ ] PE profile is extracted.
-   [ ] Imports/exports/useful strings are extracted.
-   [ ] Ghidra runs headlessly on Windows.
-   [ ] Windows paths containing spaces work.
-   [ ] Actual Java/Ghidra diagnostics are available.
-   [ ] Ghidra script is included in built runtime.
-   [ ] Correct postScript argument contract is used.
-   [ ] `ghidra.json` is validated before Ghidra success.
-   [ ] Ghidra stdout/stderr are retained.
-   [ ] Bounded interesting functions are selected.
-   [ ] Function/import/string relationships are captured.
-   [ ] Invalid call targets are filtered before clustering.
-   [ ] Evidence has stable traceable IDs.
-   [ ] Function profiles are built.
-   [ ] Deterministic capability inference works.
-   [ ] Candidate responsibilities are reconstructed when justified.
-   [ ] Candidate responsibilities contain real functions/evidence IDs.
-   [ ] Observed/inferred/unknown are separated.
-   [ ] Confidence is explainable.
-   [ ] External interactions are bounded and evidence-backed.
-   [ ] Unknowns are explicit.
-   [ ] Modernization priorities derive from evidence.
-   [ ] JSON canonical result works.
-   [ ] Markdown report works.
-   [ ] HTML report works.
-   [ ] Evidence index works.
-   [ ] Ghidra failure gracefully yields partial results when possible.
-   [ ] `SendMessageW` is not treated as network evidence.
-   [ ] Lone URL does not produce high-confidence network behavior.
-   [ ] Generic auth strings do not produce high-confidence auth.
-   [ ] Generic SQL strings do not produce high-confidence DB behavior.
-   [ ] Auto-generated Ghidra names are clearly marked.
-   [ ] Automated tests cover positive and negative rules.
-   [ ] Build passes.
-   [ ] Tests pass.
-   [ ] README documents exact Windows/JDK/Ghidra setup and demo
    commands.
-   [ ] At least one real benign PE is documented as an end-to-end smoke
    test.

------------------------------------------------------------------------

# 38. JUDGE-FACING QUESTIONS THE PRODUCT MUST ANSWER

## Why isn't this just Ghidra?

Because Ghidra extracts low-level program information. Code
Archaeologist correlates that information into evidence-backed
responsibilities, explicit uncertainty, and modernization guidance.

## Why isn't this just an AI summary of decompiler output?

Because the canonical reconstruction is deterministic and traceable.
Every material inference has evidence and a reproducible rule.

## What problem does this solve?

Engineers may inherit legacy applications with missing source,
documentation, or institutional knowledge. Code Archaeologist provides a
defensible starting map for investigation and replacement.

## Can I trust it?

It separates observed facts, inferred conclusions, and unknowns; exposes
confidence and evidence; and deliberately avoids unsupported claims.

## What do I do after reading the report?

Use the modernization blueprint and unknowns as an ordered investigation
plan.

------------------------------------------------------------------------

# 39. FINAL PRODUCT PRINCIPLE

Code Archaeologist should behave less like a scanner that says:

> I found 4,000 functions and 12,000 strings.

and more like an experienced engineer who says:

> Here is what the artifact proves. Here is what the combined evidence
> strongly suggests. Here is what we still cannot know. Here is exactly
> where those conclusions came from. And here is what your team should
> investigate next before replacing this system.

That distinction is the product.

------------------------------------------------------------------------

# 40. FINAL INSTRUCTION TO BOB

Implement this as a **clean, working hackathon MVP**, not as a
speculative platform.

Use the simplest architecture that satisfies the contracts above.

Do not stop at extraction.

Do not spend the remaining budget on polish while reconstruction,
traceability, reports, or tests are incomplete.

After satisfying the acceptance criteria:

1.  run the build;
2.  run all tests;
3.  report failures and fix them;
4.  provide exact setup/run/demo commands;
5.  summarize remaining limitations.

**Do not add another major feature after satisfying these criteria. This
is the final MVP implementation/stabilization pass.**
