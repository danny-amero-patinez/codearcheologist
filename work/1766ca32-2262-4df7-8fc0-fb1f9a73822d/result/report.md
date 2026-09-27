# Code Archaeologist — Analysis Report

> ⚠️ Static analysis does NOT establish that this binary is safe. The binary was never executed.

> **Analysis ID:** `1766ca32-2262-4df7-8fc0-fb1f9a73822d`  
> **Status:** partial  
> **Generated:** 2026-09-27T02:33:43.366Z


---

## 1. Executive Reconstruction Summary

Static evidence suggests this binary contains 2 candidate responsibilities related to: _Filesystem deployment and file management_, _Network communication_. These conclusions are based on correlated imports, strings and PE metadata; they do not establish runtime execution paths.
Confidence breakdown: 1 at high confidence, 1 at medium confidence.

The highest-priority modernization concerns are: _Inventory endpoints and authentication before replacement_. Runtime side effects, exact service names, registry contents, and OS contracts remain unresolved and should be recovered from a deployed installation before replacement.

⚠️ Ghidra function-level analysis did not run for this analysis. Function profiles, call graph edges, and decompilation evidence are unavailable. Reconstruction depth is limited to PE metadata and string extraction.

**Unresolved questions (2):**
- Which server or endpoint is contacted?
- How are credentials stored and transmitted?

## 2. Binary Identification

| Field | Value |
|-------|-------|
| Filename | `auditoria-api.exe` |
| SHA-256 | `ef48e5258591d3ca12ca9eac8e4085fb7d4727c3db96c1181520a6b2863d2acd` |
| PE Type | PE32+ |
| Architecture | x86-64 |
| Subsystem | WINDOWS_CUI |
| Entry Point | `0x00001440` |
| File Size | 3,681,317 bytes |
| Signed | No |
| Overall Entropy | 6.020 |

## 3. Analysis Coverage & Tool Status

| Tool | Status |
|------|--------|
| PE Parser | ✓ Ran |
| String Extractor | ✓ Ran |
| Ghidra | ✗ Failed: Ghidra timed out after 180000ms |

**Phases:**
- ✓ intake
- ✓ profiling (153ms)
- ✓ extracting (32ms)
- ✗ ghidra-analysis (180026ms) — Ghidra timed out after 180000ms
- ✓ correlating (50ms)
- ✓ inferring (52ms)
- ✓ reconstructing (28ms)
- ✓ reporting (24ms)

## 4. Reconstructed Capabilities

### filesystem — **[HIGH]**

**Statement:** The binary performs filesystem deployment operations (writing, copying, or moving files to system locations).

**Rationale:**
- File write/copy/move/delete APIs are imported.
- System path resolution APIs (GetSystemDirectoryW, GetTempPathW, etc.) are imported.

**Evidence:** _no evidence IDs_

**Limitations:**
- Static analysis cannot determine which files are deployed or whether deployment succeeds.
- CreateFileW alone is not sufficient evidence of deployment behavior.

### network — **[MEDIUM]**

**Statement:** The binary communicates over the network using Winsock APIs.

**Rationale:**
- Network APIs from the Winsock family are imported.

**Evidence:** _no evidence IDs_

**Limitations:**
- Static analysis cannot determine what data is transmitted or received.
- Static analysis cannot confirm which endpoints are contacted at runtime.
- SendMessageW/PostMessageW (Windows messaging) were not counted as network evidence.

### authentication — **[LOW]**

**Statement:** The binary handles authentication or credential management.

**Rationale:**
- Authentication-related strings (password, login, token) are present.

**Evidence:** `evd-str-0160`, `evd-str-0179`, `evd-str-0187`

**Limitations:**
- Static analysis cannot determine whether credentials are handled securely.
- Generic authentication strings alone are insufficient for high-confidence claims.
- Credential APIs may be present in third-party libraries that are not always invoked.


## 5. Candidate Responsibilities

### Filesystem deployment and file management — **[HIGH]**

The binary performs filesystem deployment operations (writing, copying, or moving files to system locations).

**Evidence:** _no evidence IDs_

**Analysis:**
- **Inferred:** File write/copy/move/delete APIs are imported.
- **Inferred:** System path resolution APIs (GetSystemDirectoryW, GetTempPathW, etc.) are imported.
- **Inferred:** The binary performs filesystem deployment operations (writing, copying, or moving files to system locations).
- **Unknown:** Static analysis cannot determine which files are deployed or whether deployment succeeds.
- **Unknown:** CreateFileW alone is not sufficient evidence of deployment behavior.

**Limitations:**
- Static analysis cannot enumerate which files are created, copied, or deleted.
- Exact deployment paths are not recoverable without runtime tracing.
- Static analysis cannot determine which files are deployed or whether deployment succeeds.
- CreateFileW alone is not sufficient evidence of deployment behavior.

### Network communication — **[MEDIUM]**

The binary communicates over the network using Winsock APIs.

**Evidence:** _no evidence IDs_

**Analysis:**
- **Inferred:** Network APIs from the Winsock family are imported.
- **Inferred:** The binary communicates over the network using Winsock APIs.
- **Unknown:** Static analysis cannot determine what data is transmitted or received.
- **Unknown:** Static analysis cannot confirm which endpoints are contacted at runtime.
- **Unknown:** SendMessageW/PostMessageW (Windows messaging) were not counted as network evidence.

**Limitations:**
- Static analysis cannot determine what data is transmitted.
- Endpoints and hostnames cannot be confirmed without runtime observation.
- Static analysis cannot determine what data is transmitted or received.
- Static analysis cannot confirm which endpoints are contacted at runtime.
- SendMessageW/PostMessageW (Windows messaging) were not counted as network evidence.


## 6. External Interactions

### filesystem — **[HIGH]**

Static evidence strongly supports filesystem interaction through correlated filesystem APIs and path evidence.

**Evidence:** _no evidence IDs_

- _Static analysis cannot enumerate specific files accessed at runtime._
- _File paths may be computed dynamically and are not recoverable statically._

### network — **[MEDIUM]**

Static evidence suggests the binary may perform network communication.

**Evidence:** _no evidence IDs_

- _Static analysis cannot confirm which hosts or ports are contacted at runtime._
- _Network payloads cannot be recovered by static analysis._


## 7. Interesting Functions

_No function profiles available (Ghidra analysis required)._

## 8. Dependencies / Runtime Hints (DLL Imports)

- `KERNEL32.dll`
- `WS2_32.dll`
- `libcrypto-3-x64.dll`
- `libpq.dll`
- `msvcrt.dll`

## 9. Unknowns (Actionable Questions)

### ❓ Which server or endpoint is contacted?

**Why it matters:** Replacement requires knowledge of all external dependencies and authentication mechanisms.

**Missing evidence:** No concrete hostname or IP address was statically recoverable from code paths.

**How to resolve:**
- Run the binary in a network-monitored sandbox and capture DNS queries and TCP connections.
- Inspect configuration files and registry entries for URL or hostname settings.
- Check embedded string literals for URL patterns.

### ❓ How are credentials stored and transmitted?

**Why it matters:** Security assessment and replacement require understanding credential handling.

**Missing evidence:** Credential storage mechanism (registry, file, memory) not determined statically.

**How to resolve:**
- Audit credential API usage (CredWrite, CredRead) in disassembly.
- Monitor registry and file access for credential storage patterns.


## 10. Modernization Blueprint

### [HIGH] Inventory endpoints and authentication before replacement

The binary communicates over the network. Capture all hostnames, IP addresses, ports, and protocols used at runtime. Document authentication mechanisms (API keys, tokens, certificates). Replacement must preserve all external service contracts and handle TLS correctly.

**Rationale:** Network-communication APIs were correlated in static evidence. Actual endpoints, authentication credentials, and runtime traffic cannot be confirmed from static analysis.

**Recommended steps:**
1. Inventory actual endpoints and protocols from URL/hostname string evidence in this analysis.
1. Recover certificate and configuration material from the deployed system where applicable.
1. Document the authentication mechanism (API keys, tokens, certificates, Windows auth).
1. Capture runtime network traffic in a controlled environment to identify all endpoints.
1. Validate runtime traffic separately before designing the replacement communication layer.

**Artifacts to recover:**
- endpoint and hostname configuration
- TLS certificates
- authentication configuration
- network policy or firewall rules

**Evidence:** _no evidence IDs_

### [MEDIUM] Document file layout and side effects

The binary reads and writes files. Enumerate all file paths accessed at runtime using process monitoring. Document side effects (created, modified, deleted files) so the replacement can replicate or improve on the file management behavior.

**Rationale:** Filesystem APIs and file-path strings were correlated in static evidence. Exact runtime file operations cannot be confirmed without dynamic tracing.

**Recommended steps:**
1. Map observed path and file-path string evidence already collected in this analysis.
1. Recover the deployed directory layout from a live installation.
1. Identify configuration, data, and log files.
1. Validate read, write, and delete behavior using process monitoring before replacement.

**Artifacts to recover:**
- installed directory layout
- configuration files
- log files
- data files

**Evidence:** _no evidence IDs_

### Investigation Sequence

Recommended order to resolve unresolved dependencies before replacement:

1. Document file layout and side effects
2. Inventory endpoints and authentication before replacement

### Artifacts to Recover from a Deployed Installation

- installed directory layout
- configuration files
- log files
- data files
- endpoint and hostname configuration
- TLS certificates
- authentication configuration
- network policy or firewall rules


## 11. Limitations

- The uploaded binary was NEVER executed. All conclusions are from static analysis only.
- Static analysis cannot establish the runtime behavior, safety, or trustworthiness of this binary.
- Decompiled pseudocode and function names (especially FUN_*) are approximations, not original source code.
- Missing debug symbols mean function names and types are partially or fully unknown.
- Confidence levels reflect signal strength in the static evidence, not runtime certainty.
- Inferences marked as HIGH confidence still require validation by dynamic analysis or source code review.
- Call graph edges may be incomplete due to indirect calls, virtual dispatch, or obfuscation.
- Packed, encrypted, or self-modifying code may hide capabilities not visible in static analysis.

## 12. Evidence Index

**Total evidence items: 1389**

| Kind | Count |
|------|------:|
| binary-metadata | 1 |
| import | 5 |
| pe-section | 17 |
| string | 1366 |

### Evidence Detail

| ID | Kind | Tool | Location | Summary |
|---|---|---|---|---|
| `evd-bin-0000` | binary-metadata | pe-parser |  | PE binary: auditoria-api.exe (PE32+, x86-64) |
| `evd-pe--0001` | pe-section | pe-parser | 0x00001000 | Section .text: VA=0x00001000 size=1497008 |
| `evd-pe--0002` | pe-section | pe-parser | 0x0016F000 | Section .data: VA=0x0016F000 size=9952 |
| `evd-pe--0003` | pe-section | pe-parser | 0x00172000 | Section .rdata: VA=0x00172000 size=93520 |
| `evd-pe--0004` | pe-section | pe-parser | 0x00189000 | Section .pdata: VA=0x00189000 size=54384 |
| `evd-pe--0005` | pe-section | pe-parser | 0x00197000 | Section .xdata: VA=0x00197000 size=87448 |
| `evd-pe--0006` | pe-section | pe-parser | 0x001AD000 | Section .bss: VA=0x001AD000 size=3296 |
| `evd-pe--0007` | pe-section | pe-parser | 0x001AE000 | Section .idata: VA=0x001AE000 size=7088 |
| `evd-pe--0008` | pe-section | pe-parser | 0x001B0000 | Section .tls: VA=0x001B0000 size=32 |
| `evd-pe--0009` | pe-section | pe-parser | 0x001B1000 | Section .reloc: VA=0x001B1000 size=6028 |
| `evd-pe--0010` | pe-section | pe-parser | 0x001B3000 | Section /4: VA=0x001B3000 size=128 |
| `evd-pe--0011` | pe-section | pe-parser | 0x001B4000 | Section /19: VA=0x001B4000 size=12181 |
| `evd-pe--0012` | pe-section | pe-parser | 0x001B7000 | Section /31: VA=0x001B7000 size=1381 |
| `evd-pe--0013` | pe-section | pe-parser | 0x001B8000 | Section /45: VA=0x001B8000 size=1480 |
| `evd-pe--0014` | pe-section | pe-parser | 0x001B9000 | Section /57: VA=0x001B9000 size=744 |
| `evd-pe--0015` | pe-section | pe-parser | 0x001BA000 | Section /70: VA=0x001BA000 size=151 |
| `evd-pe--0016` | pe-section | pe-parser | 0x001BB000 | Section /81: VA=0x001BB000 size=468 |
| `evd-pe--0017` | pe-section | pe-parser | 0x001BC000 | Section /97: VA=0x001BC000 size=1211 |
| `evd-imp-0018` | import | pe-parser |  | Import DLL: libcrypto-3-x64.dll (5 function(s)) |
| `evd-imp-0019` | import | pe-parser |  | Import DLL: libpq.dll (18 function(s)) |
| `evd-imp-0020` | import | pe-parser |  | Import DLL: KERNEL32.dll (70 function(s)) |
| `evd-imp-0021` | import | pe-parser |  | Import DLL: msvcrt.dll (95 function(s)) |
| `evd-imp-0022` | import | pe-parser |  | Import DLL: WS2_32.dll (19 function(s)) |
| `evd-str-0023` | string | strings | +0x4d | String [error-message]: "!This program cannot be run in DOS mode." |
| `evd-str-0024` | string | strings | +0x188 | String [other]: ".text" |
| `evd-str-0025` | string | strings | +0x1af | String [other]: "`.data" |
| `evd-str-0026` | string | strings | +0x1d8 | String [other]: ".rdata" |
| `evd-str-0027` | string | strings | +0x1ff | String [other]: "@.pdata" |
| `evd-str-0028` | string | strings | +0x227 | String [other]: "@.xdata" |
| `evd-str-0029` | string | strings | +0x24f | String [other]: "@.bss" |
| `evd-str-0030` | string | strings | +0x278 | String [other]: ".idata" |
| `evd-str-0031` | string | strings | +0x29f | String [other]: "@.tls" |
| `evd-str-0032` | string | strings | +0x2c8 | String [other]: ".reloc" |
| `evd-str-0033` | string | strings | +0x317 | String [other]: "B/19" |
| `evd-str-0034` | string | strings | +0x33f | String [other]: "B/31" |
| `evd-str-0035` | string | strings | +0x367 | String [other]: "B/45" |
| `evd-str-0036` | string | strings | +0x38f | String [other]: "B/57" |
| `evd-str-0037` | string | strings | +0x3b7 | String [other]: "B/70" |
| `evd-str-0038` | string | strings | +0x3df | String [other]: "B/81" |
| `evd-str-0039` | string | strings | +0x407 | String [other]: "B/97" |
| `evd-str-0040` | string | strings | +0x620 | String [other]: "AWAVAUATUWVSH" |
| `evd-str-0041` | string | strings | +0x6f5 | String [other]: "X[^_]A\A]A^A_" |
| `evd-str-0042` | string | strings | +0x7d8 | String [other]: "8MZuCHcP<H" |
| `evd-str-0043` | string | strings | +0x8ca | String [other]: "D$LH" |
| `evd-str-0044` | string | strings | +0xaba | String [other]: "D$8H" |
| `evd-str-0045` | string | strings | +0xaed | String [other]: "t$0H" |
| `evd-str-0046` | string | strings | +0xaf2 | String [other]: "\|$(H" |
| `evd-str-0047` | string | strings | +0xb28 | String [other]: "L$8L" |
| `evd-str-0048` | string | strings | +0xb54 | String [other]: "L9T$(" |
| `evd-str-0049` | string | strings | +0xbce | String [other]: "L9t$(t" |
| `evd-str-0050` | string | strings | +0xbfa | String [other]: "L9\|$(" |
| `evd-str-0051` | string | strings | +0xc2a | String [other]: "H9D$0" |
| `evd-str-0052` | string | strings | +0xc60 | String [other]: "D$XI9" |
| `evd-str-0053` | string | strings | +0xc6e | String [other]: "T$XL" |
| `evd-str-0054` | string | strings | +0xc76 | String [other]: "T$PD" |
| `evd-str-0055` | string | strings | +0xc96 | String [other]: "L9t$(D" |
| `evd-str-0056` | string | strings | +0xc9e | String [other]: "\$HL" |
| `evd-str-0057` | string | strings | +0xca3 | String [other]: "T$Pt" |
| `evd-str-0058` | string | strings | +0xcc0 | String [other]: "\$HH" |
| `evd-str-0059` | string | strings | +0xcc5 | String [other]: "D$@H" |
| `evd-str-0060` | string | strings | +0xd03 | String [other]: "D$@I9" |
| `evd-str-0061` | string | strings | +0xd11 | String [other]: "d$@H" |
| `evd-str-0062` | string | strings | +0xd45 | String [other]: "L9t$(" |
| `evd-str-0063` | string | strings | +0xd8f | String [other]: "D$HH" |
| `evd-str-0064` | string | strings | +0xda0 | String [other]: "H9t$(L" |
| `evd-str-0065` | string | strings | +0xda7 | String [other]: "T$Ht" |
| `evd-str-0066` | string | strings | +0xdbe | String [other]: "T$HH" |
| `evd-str-0067` | string | strings | +0xdc3 | String [other]: "D$@L" |
| `evd-str-0068` | string | strings | +0xe35 | String [other]: "D$PH9" |
| `evd-str-0069` | string | strings | +0xe43 | String [other]: "\|$PH" |
| `evd-str-0070` | string | strings | +0xe56 | String [other]: "T$HM" |
| `evd-str-0071` | string | strings | +0xe6b | String [other]: "T$HL9T$(t" |
| `evd-str-0072` | string | strings | +0xe8c | String [other]: "T$PH" |
| `evd-str-0073` | string | strings | +0xecc | String [other]: "D$PI9" |
| `evd-str-0074` | string | strings | +0xeed | String [other]: "T$HI" |
| `evd-str-0075` | string | strings | +0xf23 | String [other]: "T$PL" |
| `evd-str-0076` | string | strings | +0xf62 | String [other]: "T$(D" |
| `evd-str-0077` | string | strings | +0xfc3 | String [other]: "H;D$P" |
| `evd-str-0078` | string | strings | +0xfea | String [other]: "t$0I)" |
| `evd-str-0079` | string | strings | +0x100a | String [other]: "h[^_]A\A]A^A_" |
| `evd-str-0080` | string | strings | +0x102a | String [other]: "H;D$X" |
| `evd-str-0081` | string | strings | +0x10c2 | String [other]: "D$8L" |
| `evd-str-0082` | string | strings | +0x115f | String [other]: "3H9t$(t" |
| `evd-str-0083` | string | strings | +0x11af | String [other]: "H9\|$(" |
| `evd-str-0084` | string | strings | +0x1216 | String [other]: "D$0I9" |
| `evd-str-0085` | string | strings | +0x1224 | String [other]: "t$0I" |
| `evd-str-0086` | string | strings | +0x1242 | String [other]: "H9\|$(t" |
| `evd-str-0087` | string | strings | +0x125b | String [other]: "D$0H" |
| `evd-str-0088` | string | strings | +0x12b9 | String [other]: "H9t$(t" |
| `evd-str-0089` | string | strings | +0x12e6 | String [other]: "D$0H9" |
| `evd-str-0090` | string | strings | +0x12f4 | String [other]: "\|$0I" |
| `evd-str-0091` | string | strings | +0x1312 | String [other]: "L9\|$(t" |
| `evd-str-0092` | string | strings | +0x1362 | String [other]: "D$8E1" |
| `evd-str-0093` | string | strings | +0x1438 | String [other]: "L;\|$(" |
| `evd-str-0094` | string | strings | +0x147e | String [other]: "l$0H" |
| `evd-str-0095` | string | strings | +0x14a0 | String [other]: "L9\|$(D" |
| `evd-str-0096` | string | strings | +0x14a8 | String [other]: "L$8t" |
| `evd-str-0097` | string | strings | +0x14c0 | String [other]: "L$8H" |
| `evd-str-0098` | string | strings | +0x14c5 | String [other]: "D$0L" |
| `evd-str-0099` | string | strings | +0x1593 | String [other]: "H;D$0s@H" |
| `evd-str-0100` | string | strings | +0x15ce | String [other]: "D$PH" |
| `evd-str-0101` | string | strings | +0x15f3 | String [other]: "D$XH" |
| `evd-str-0102` | string | strings | +0x1689 | String [other]: "l$PA" |
| `evd-str-0103` | string | strings | +0x1703 | String [other]: "=u>H" |
| `evd-str-0104` | string | strings | +0x1773 | String [other]: "l$@H" |
| `evd-str-0105` | string | strings | +0x17bc | String [other]: "\$PH" |
| `evd-str-0106` | string | strings | +0x182c | String [other]: "T$HL9" |
| `evd-str-0107` | string | strings | +0x183e | String [other]: "D$PI" |
| `evd-str-0108` | string | strings | +0x1882 | String [other]: "D$HL" |
| `evd-str-0109` | string | strings | +0x1887 | String [other]: "\|$@M" |
| `evd-str-0110` | string | strings | +0x1899 | String [other]: "D$PL9" |
| `evd-str-0111` | string | strings | +0x18b4 | String [other]: "D$@B" |
| `evd-str-0112` | string | strings | +0x18e2 | String [other]: "L$@f" |
| `evd-str-0113` | string | strings | +0x1958 | String [other]: "D$ I9" |
| `evd-str-0114` | string | strings | +0x1966 | String [other]: "L$ I" |
| `evd-str-0115` | string | strings | +0x19a2 | String [other]: "D$PL" |
| `evd-str-0116` | string | strings | +0x19c2 | String [other]: "D$ L" |
| `evd-str-0117` | string | strings | +0x19c7 | String [other]: "\|$@H" |
| `evd-str-0118` | string | strings | +0x1ac3 | String [other]: "oD$PK" |
| `evd-str-0119` | string | strings | +0x1ad1 | String [other]: "oD$`" |
| `evd-str-0120` | string | strings | +0x1af6 | String [other]: "L$PH" |
| `evd-str-0121` | string | strings | +0x1b0d | String [other]: "oD$P" |
| `evd-str-0122` | string | strings | +0x1c10 | String [other]: "AWAVATUWVSH" |
| `evd-str-0123` | string | strings | +0x1cb9 | String [other]: "[^_]A\A^A_" |
| `evd-str-0124` | string | strings | +0x1cd6 | String [other]: "t$pH" |
| `evd-str-0125` | string | strings | +0x1d3d | String [other]: "\$`L" |
| `evd-str-0126` | string | strings | +0x1d78 | String [other]: "L$@H" |
| `evd-str-0127` | string | strings | +0x1da2 | String [other]: "T$8L" |
| `evd-str-0128` | string | strings | +0x1dd6 | String [other]: "T$8H" |
| `evd-str-0129` | string | strings | +0x1df9 | String [other]: "T$8L;T$@t" |
| `evd-str-0130` | string | strings | +0x1eb1 | String [other]: "\|$pH" |
| `evd-str-0131` | string | strings | +0x1ed4 | String [other]: "\|$hH" |
| `evd-str-0132` | string | strings | +0x1ee3 | String [other]: "L$`H" |
| `evd-str-0133` | string | strings | +0x1eec | String [other]: "D$pH9" |
| `evd-str-0134` | string | strings | +0x1f16 | String [other]: "L$`L" |
| `evd-str-0135` | string | strings | +0x1f1b | String [other]: "D$pI" |
| `evd-str-0136` | string | strings | +0x1f86 | String [other]: "L$`H9" |
| `evd-str-0137` | string | strings | +0x1f94 | String [other]: "D$pH" |
| `evd-str-0138` | string | strings | +0x1fd4 | String [other]: "\|$hI9" |
| `evd-str-0139` | string | strings | +0x206e | String [other]: "\$XH" |
| `evd-str-0140` | string | strings | +0x20ae | String [other]: "\$XL" |
| `evd-str-0141` | string | strings | +0x20dd | String [other]: "T$8N" |
| `evd-str-0142` | string | strings | +0x229b | String [other]: "T$@L" |
| `evd-str-0143` | string | strings | +0x22bc | String [other]: "T$@I9" |
| `evd-str-0144` | string | strings | +0x22ce | String [other]: "D$pL" |
| `evd-str-0145` | string | strings | +0x2315 | String [other]: "D$pf" |
| `evd-str-0146` | string | strings | +0x23a2 | String [other]: "oL( " |
| `evd-str-0147` | string | strings | +0x23a9 | String [other]: "oD(0A" |
| `evd-str-0148` | string | strings | +0x23bb | String [other]: "L+ A" |
| `evd-str-0149` | string | strings | +0x23c1 | String [other]: "D+0E9" |
| `evd-str-0150` | string | strings | +0x2598 | String [other]: "L$@L" |
| `evd-str-0151` | string | strings | +0x25de | String [other]: "\|$ I" |
| `evd-str-0152` | string | strings | +0x25e9 | String [other]: "D$(H" |
| `evd-str-0153` | string | strings | +0x2ebc | String [other]: "bind" |
| `evd-str-0154` | string | strings | +0x2ffc | String [other]: " workersL" |
| `evd-str-0155` | string | strings | +0x30f9 | String [other]: " db=L" |
| `evd-str-0156` | string | strings | +0x31f5 | String [other]: " poof" |
| `evd-str-0157` | string | strings | +0x32ed | String [other]: " scrypt=fD" |
| `evd-str-0158` | string | strings | +0x35d1 | String [other]: " jwt_ttlL" |
| `evd-str-0159` | string | strings | +0x3753 | String [other]: " jwt_secK" |
| `evd-str-0160` | string | strings | +0x3761 | String [authentication]: "secret=<K" |
| `evd-str-0161` | string | strings | +0x3b35 | String [other]: "H;L$Ht" |
| `evd-str-0162` | string | strings | +0x3b7b | String [other]: "H;L$@t" |
| `evd-str-0163` | string | strings | +0x3c33 | String [other]: "H;L$0t" |
| `evd-str-0164` | string | strings | +0x3c53 | String [other]: "H;L$(t" |
| `evd-str-0165` | string | strings | +0x3c98 | String [other]: "[^_]A\A]A^A_" |
| `evd-str-0166` | string | strings | +0x425c | String [other]: "<unsH" |
| `evd-str-0167` | string | strings | +0x4274 | String [other]: "set>" |
| `evd-str-0168` | string | strings | +0x44cc | String [other]: " workersC" |
| `evd-str-0169` | string | strings | +0x455d | String [other]: "4 db=H9" |
| `evd-str-0170` | string | strings | +0x45e3 | String [other]: "4 poofG" |
| `evd-str-0171` | string | strings | +0x466a | String [other]: " scrypt=H" |
| `evd-str-0172` | string | strings | +0x486a | String [other]: " jwt_ttlK" |
| `evd-str-0173` | string | strings | +0x48af | String [other]: "L$`I9" |
| `evd-str-0174` | string | strings | +0x490b | String [other]: "T$hL" |
| `evd-str-0175` | string | strings | +0x491f | String [other]: "T$hI" |
| `evd-str-0176` | string | strings | +0x493a | String [other]: "\$pL" |
| `evd-str-0177` | string | strings | +0x4953 | String [other]: "T$hH" |
| `evd-str-0178` | string | strings | +0x4966 | String [other]: "\$pH" |
| `evd-str-0179` | string | strings | +0x496b | String [authentication]: "secret=<I9" |
| `evd-str-0180` | string | strings | +0x498a | String [other]: "\$hL" |
| `evd-str-0181` | string | strings | +0x498f | String [other]: "T$`H" |
| `evd-str-0182` | string | strings | +0x49a2 | String [other]: "T$`L" |
| `evd-str-0183` | string | strings | +0x49c5 | String [other]: "D$`I9" |
| `evd-str-0184` | string | strings | +0x4d1e | String [other]: "D$`H" |
| `evd-str-0185` | string | strings | +0x4dd9 | String [other]: "T$`I" |
| `evd-str-0186` | string | strings | +0x4df8 | String [other]: " jwt_secI" |
| `evd-str-0187` | string | strings | +0x4e06 | String [authentication]: "secret=<I" |
| `evd-str-0188` | string | strings | +0x4e60 | String [other]: "L$pL" |
| `evd-str-0189` | string | strings | +0x4e79 | String [other]: "D$hI" |
| `evd-str-0190` | string | strings | +0x4ea5 | String [other]: "D$Pf" |
| `evd-str-0191` | string | strings | +0x4eb2 | String [other]: "T$XI9" |
| `evd-str-0192` | string | strings | +0x4eef | String [other]: "D$`L" |
| `evd-str-0193` | string | strings | +0x506a | String [other]: "L$xL" |
| `evd-str-0194` | string | strings | +0x506f | String [other]: "T$pL" |
| `evd-str-0195` | string | strings | +0x507e | String [other]: "D$hL" |
| `evd-str-0196` | string | strings | +0x5083 | String [other]: "T$pI" |
| `evd-str-0197` | string | strings | +0x508b | String [other]: "L$xM" |
| `evd-str-0198` | string | strings | +0x50bf | String [other]: "L$hL" |
| `evd-str-0199` | string | strings | +0x50d3 | String [other]: "L$hI" |

_…1189 additional evidence items omitted from this table. See canonical JSON for full detail._
