# Code Archaeologist — Analysis Report

> ⚠️ Static analysis does NOT establish that this binary is safe. The binary was never executed.

> **Analysis ID:** `c1607fe0-0504-49e2-a9d1-afaf7d642e3e`  
> **Status:** decompiling  
> **Generated:** 2026-09-26T19:44:24.866Z


---

## 1. Executive Reconstruction Summary

- **Binary:** VeraCrypt.Setup.1.26.29.exe
- **SHA-256:** `dca9ddec7934fc0b1c25ac8984db7d504bfe9f37c21861ac91c67a98ecd3964b`
- **Type:** PE32 | x86 | WINDOWS_GUI
- **Inferred Capabilities:** 6
- **Candidate Responsibilities:** 2
- **Unknowns:** 5

## 2. Binary Identification

| Field | Value |
|-------|-------|
| Filename | `VeraCrypt.Setup.1.26.29.exe` |
| SHA-256 | `dca9ddec7934fc0b1c25ac8984db7d504bfe9f37c21861ac91c67a98ecd3964b` |
| PE Type | PE32 |
| Architecture | x86 |
| Subsystem | WINDOWS_GUI |
| Entry Point | `0x000272F0` |
| File Size | 40,832,408 bytes |
| Signed | Yes (signature present — not verified) |
| Overall Entropy | 7.560 |
| Company | AM Crypto |
| Product | VeraCrypt |
| Version | 1.26.29 |

## 3. Analysis Coverage & Tool Status

| Tool | Status |
|------|--------|
| PE Parser | ✓ Ran |
| String Extractor | ✓ Ran |
| Ghidra | ✓ Ran |

**Phases:**
- ✓ intake
- ✓ profiling (16052ms)
- ✓ extracting (330ms)
- ✓ ghidra-analysis (143613ms)
- ✓ correlating (136ms)
- ⟳ inferring
- ○ reconstructing
- ○ reporting

## 4. Reconstructed Capabilities

### service — **[LOW]**

**Statement:** The binary manages Windows service or driver lifecycle (install, start, stop, delete).

**Rationale:**
- Service-related strings (.sys paths, driver error strings) are present.

**Evidence:** `evd-str-1159`, `evd-str-1442`

**Limitations:**
- Static analysis cannot confirm which services are actually managed at runtime.
- SCM API imports may be present in libraries that are not always invoked.

### filesystem — **[HIGH]**

**Statement:** The binary performs filesystem deployment operations (writing, copying, or moving files to system locations).

**Rationale:**
- File write/copy/move/delete APIs are imported.
- System path resolution APIs (GetSystemDirectoryW, GetTempPathW, etc.) are imported.
- Deployment path strings (System32, temp, install) are present.

**Evidence:** `evd-str-3605`, `evd-str-3696`, `evd-str-3849`, `evd-str-3919`

**Limitations:**
- Static analysis cannot determine which files are deployed or whether deployment succeeds.
- CreateFileW alone is not sufficient evidence of deployment behavior.

### process — **[MEDIUM]**

**Statement:** The binary creates or manages external processes.

**Rationale:**
- Process creation APIs (CreateProcessW, ShellExecuteW, etc.) are imported.
- Command-line strings correlated to process-launching code.

**Evidence:** `evd-str-2549`, `evd-str-2562`, `evd-str-3078`, `evd-str-3099`, `evd-str-3235`, `evd-str-3236`, `evd-str-3238`, `evd-str-3239`, `evd-str-3507`, `evd-str-3508`, `evd-str-3514`, `evd-str-3515`, `evd-str-3516`, `evd-str-3521`, `evd-str-3527`, `evd-str-3528`, `evd-str-3529`, `evd-str-3530`, `evd-str-3531`, `evd-str-3532`, `evd-str-3540`, `evd-str-3541`, `evd-str-3542`, `evd-str-3543`, `evd-str-3544`, `evd-str-3623`, `evd-str-3625`, `evd-str-3628`, `evd-str-3630`, `evd-str-3632`, `evd-str-3663`, `evd-str-3684`, `evd-str-3690`, `evd-str-3694`, `evd-str-3773`, `evd-str-3856`, `evd-str-3915`

**Limitations:**
- Static analysis cannot determine which processes are launched or under what conditions.
- CreateThread indicates concurrency, not necessarily external process launching.

### network — **[LOW]**

**Statement:** URL or endpoint strings are present, but no network API was identified.

**Rationale:**
- URL or hostname strings found, but no network API (WinHTTP/WinINet/Winsock) is imported.

**Evidence:** `evd-str-1797`, `evd-str-1798`, `evd-str-3812`

**Limitations:**
- A URL string alone does not confirm network activity.
- The URL may be a resource reference, error message, or documentation string.

### database — **[LOW]**

**Statement:** The binary interacts with a database via ODBC or similar interface.

**Rationale:**
- SQL statement strings or ODBC connection string fragments are present.

**Evidence:** `evd-str-1520`, `evd-str-1820`, `evd-str-1845`, `evd-str-1847`, `evd-str-1848`, `evd-str-3478`, `evd-str-3549`, `evd-str-3841`, `evd-str-3933`, `evd-str-4481`, `evd-str-4486`, `evd-str-4492`, `evd-str-4495`, `evd-str-4576`, `evd-str-4676`, `evd-str-4677`, `evd-str-4746`, `evd-str-4827`

**Limitations:**
- Static analysis cannot determine which database engine or schema is used.
- SQL strings may be error messages or documentation, not executed queries.
- Generic SQL strings alone are not sufficient for high-confidence database inference.

### authentication — **[LOW]**

**Statement:** The binary handles authentication or credential management.

**Rationale:**
- Authentication-related strings (password, login, token) are present.

**Evidence:** `evd-str-1328`, `evd-str-1329`, `evd-str-1338`, `evd-str-1574`, `evd-str-1575`, `evd-str-3274`, `evd-str-3288`, `evd-str-3355`, `evd-str-4501`, `evd-str-4505`, `evd-str-4519`, `evd-str-4525`, `evd-str-4573`, `evd-str-4574`, `evd-str-4577`, `evd-str-4578`, `evd-str-4579`, `evd-str-4610`, `evd-str-4618`, `evd-str-4619`, `evd-str-4647`, `evd-str-4671`, `evd-str-4676`, `evd-str-4677`, `evd-str-4809`

**Limitations:**
- Static analysis cannot determine whether credentials are handled securely.
- Generic authentication strings alone are insufficient for high-confidence claims.
- Credential APIs may be present in third-party libraries that are not always invoked.


## 5. Candidate Responsibilities

### Filesystem deployment and file management — **[HIGH]**

The binary performs filesystem deployment operations (writing, copying, or moving files to system locations).

**Evidence:** `evd-str-3605`, `evd-str-3696`, `evd-str-3849`, `evd-str-3919`

**Analysis:**
- **Observed:** File write/copy/move/delete APIs are imported.
- **Observed:** System path resolution APIs (GetSystemDirectoryW, GetTempPathW, etc.) are imported.
- **Observed:** Deployment path strings (System32, temp, install) are present.
- **Inferred:** The binary performs filesystem deployment operations (writing, copying, or moving files to system locations).
- **Unknown:** Static analysis cannot determine which files are deployed or whether deployment succeeds.
- **Unknown:** CreateFileW alone is not sufficient evidence of deployment behavior.

**Limitations:**
- Static analysis cannot enumerate which files are created, copied, or deleted.
- Exact deployment paths are not recoverable without runtime tracing.
- Static analysis cannot determine which files are deployed or whether deployment succeeds.
- CreateFileW alone is not sufficient evidence of deployment behavior.

### External process creation and management — **[MEDIUM]**

The binary creates or manages external processes.

**Evidence:** `evd-str-2549`, `evd-str-2562`, `evd-str-3078`, `evd-str-3099`, `evd-str-3235`, `evd-str-3236`, `evd-str-3238`, `evd-str-3239`, `evd-str-3507`, `evd-str-3508`, `evd-str-3514`, `evd-str-3515`, `evd-str-3516`, `evd-str-3521`, `evd-str-3527`, `evd-str-3528`, `evd-str-3529`, `evd-str-3530`, `evd-str-3531`, `evd-str-3532`, `evd-str-3540`, `evd-str-3541`, `evd-str-3542`, `evd-str-3543`, `evd-str-3544`, `evd-str-3623`, `evd-str-3625`, `evd-str-3628`, `evd-str-3630`, `evd-str-3632`, `evd-str-3663`, `evd-str-3684`, `evd-str-3690`, `evd-str-3694`, `evd-str-3773`, `evd-str-3856`, `evd-str-3915`

**Analysis:**
- **Observed:** Process creation APIs (CreateProcessW, ShellExecuteW, etc.) are imported.
- **Observed:** Command-line strings correlated to process-launching code.
- **Inferred:** The binary creates or manages external processes.
- **Unknown:** Static analysis cannot determine which processes are launched or under what conditions.
- **Unknown:** CreateThread indicates concurrency, not necessarily external process launching.

**Limitations:**
- Static analysis cannot determine which binaries are launched or their arguments.
- Static analysis cannot determine which processes are launched or under what conditions.
- CreateThread indicates concurrency, not necessarily external process launching.


## 6. External Interactions

### service — **[LOW]**

The binary installs, starts, stops, or deletes Windows services or drivers.

**Evidence:** `evd-str-1159`, `evd-str-1442`

- _Static analysis cannot confirm which service names are managed or their configurations._

### filesystem — **[HIGH]**

The binary reads, writes, or manages files on the local filesystem.

**Evidence:** `evd-str-3605`, `evd-str-3696`, `evd-str-3849`, `evd-str-3919`

- _Static analysis cannot enumerate specific files accessed at runtime._
- _File paths may be computed dynamically and are not recoverable statically._

### process — **[MEDIUM]**

The binary creates or manages external processes.

**Evidence:** `evd-str-2549`, `evd-str-2562`, `evd-str-3078`, `evd-str-3099`, `evd-str-3235`, `evd-str-3236`, `evd-str-3238`, `evd-str-3239`, `evd-str-3507`, `evd-str-3508`, `evd-str-3514`, `evd-str-3515`, `evd-str-3516`, `evd-str-3521`, `evd-str-3527`, `evd-str-3528`, `evd-str-3529`, `evd-str-3530`, `evd-str-3531`, `evd-str-3532`, `evd-str-3540`, `evd-str-3541`, `evd-str-3542`, `evd-str-3543`, `evd-str-3544`, `evd-str-3623`, `evd-str-3625`, `evd-str-3628`, `evd-str-3630`, `evd-str-3632`, `evd-str-3663`, `evd-str-3684`, `evd-str-3690`, `evd-str-3694`, `evd-str-3773`, `evd-str-3856`, `evd-str-3915`

- _Static analysis cannot determine which processes are launched or their arguments._

### network — **[LOW]**

The binary communicates over the network.

**Evidence:** `evd-str-1797`, `evd-str-1798`, `evd-str-3812`

- _Static analysis cannot confirm which hosts or ports are contacted at runtime._
- _Network payloads cannot be recovered by static analysis._

### database — **[LOW]**

The binary queries or updates a database.

**Evidence:** `evd-str-1520`, `evd-str-1820`, `evd-str-1845`, `evd-str-1847`, `evd-str-1848`, `evd-str-3478`, `evd-str-3549`, `evd-str-3841`, `evd-str-3933`, `evd-str-4481`, `evd-str-4486`, `evd-str-4492`, `evd-str-4495`, `evd-str-4576`, `evd-str-4676`, `evd-str-4677`, `evd-str-4746`, `evd-str-4827`

- _Static analysis cannot identify the database engine, connection string, or schema._


## 7. Interesting Functions

| Address | Name | Auto-Generated | APIs | Strings | Score |
|---------|------|---------------|------|---------|-------|
| `00425540` | `FUN_00425540` | Yes | CoUninitialize, UrlUnescapeW, IsUserAnAdmin… | `zh-cn`, `donate` | 119.5 |
| `0040dd60` | `FUN_0040dd60` | Yes | CreateSolidBrush, GetDlgItem, SetWindowTextW… | `SELECT_DEST_DIR`, `DISABLE_SCREEN_PROTECTION_WARN` | 109 |
| `0040cfd0` | `FUN_0040cfd0` | Yes | MoveWindow, MapDialogRect, MultiByteToWideChar… | `CONFIRM_EXIT_UNIVERSAL`, `open` | 96 |
| `00407fa0` | `FUN_00407fa0` | Yes | FindClose, SetCurrentDirectoryW, GetWindowsDirectoryW… | `VeraCrypt Setup`, `C:\Windows\System32` | 84.5 |
| `00428fb0` | `FUN_00428fb0` | Yes | GetSystemMetrics, GetCurrentProcess, GetModuleHandleW… | `IsWow64Process`, `kernel32` | 67.5 |
| `00417ce0` | `FUN_00417ce0` | Yes | GetLastError, CreateDirectoryW | `ADMIN_PRIVILEGES_WARN_DEVICES`, `\EFI\Microsoft\Boot\bootmgfw.e` | 59 |
| `00409140` | `FUN_00409140` | Yes | GetWindowsDirectoryW, RegQueryValueExW, InvalidateRect… | `SOFTWARE\VeraCrypt_MSI`, `ProductGuid` | 57.5 |
| `0040a370` | `FUN_0040a370` | Yes | RegCloseKey, RegSetValueExW, RegCreateKeyExW… | `Software\Microsoft\Windows\Cur`, `1.26.29` | 55.5 |
| `004045c0` | `FUN_004045c0` | Yes | GetModuleFileNameW, MessageBoxW | `VeraCrypt Setup 1.26.29.exe`, `MakeSelfExtractingPackage:176` | 53 |
| `0040ada0` | `FUN_0040ada0` | Yes | RegDeleteKeyW, RegCloseKey, SHChangeNotify… | `COM_DEREG_FAILED`, `REMOVING_REG` | 47 |
| `0042c7c0` | `FUN_0042c7c0` | Yes | MessageBoxW | `OUTOFMEMORY`, `NOT_FOUND` | 46.5 |
| `0042ac50` | `FUN_0042ac50` | Yes | SetWindowPos, GetSystemMetrics, EnableMenuItem… | `VeraCrypt` | 43.5 |
| `00403620` | `FUN_00403620` | Yes | EnterCriticalSection, InitializeCriticalSectionEx, FormatMessageW… | `%sVeraCrypt.exe`, `%sVeraCrypt Format.exe` | 42 |
| `0040c560` | `FUN_0040c560` | Yes | GetSystemDirectoryW, RegQueryValueExW, DeleteFileW… | `VeraCrypt Setup`, `SETUP_ADMIN` | 40.5 |
| `0040b1a3` | `FUN_0040b1a3` | Yes | SendMessageW, GetDlgItem, SendDlgItemMessageW… | `STOPPING_DRIVER`, `STOPPING` | 40 |
| `0042d560` | `FUN_0042d560` | Yes | MessageBoxA, MessageBoxW, MultiByteToWideChar | `entry`, `localization` | 38.5 |
| `004241a0` | `FUN_004241a0` | Yes | GetLastError, GetCurrentThread, OpenThreadToken… | `SeIncreaseQuotaPrivilege` | 37.5 |
| `00405b00` | `FUN_00405b00` | Yes | GetTokenInformation, InitializeAcl, SetSecurityDescriptorOwner… | — | 36 |
| `0042b870` | `FUN_0042b870` | Yes | SelectObject, GetDC, GetCurrentObject… | — | 36 |
| `00424eb0` | `FUN_00424eb0` | Yes | SetWindowPos, SendMessageW, SetDlgItemTextW… | `IDD_ABOUT_DLG`, `amcrypto.jp` | 35.5 |

## 8. Dependencies / Runtime Hints (DLL Imports)

- `KERNEL32.dll`

## 9. Unknowns (Actionable Questions)

### ❓ Which service or driver name is managed?

**Why it matters:** Service names and configurations must be documented for replacement or migration.

**Missing evidence:** Service name strings were not conclusively matched to SCM API call sites.

**How to resolve:**
- Run the binary and monitor Service Control Manager calls using Process Monitor.
- Search for service name strings adjacent to SCM API call sites in disassembly.

### ❓ Which process or executable is launched, and for what purpose?

**Why it matters:** Process dependencies must be documented before replacement to avoid missing capabilities.

**Missing evidence:** The specific executable path or command line is not statically deterministic.

**How to resolve:**
- Run the binary in a process-monitored sandbox and capture child process creation events.
- Search for embedded executable names and command-line argument patterns in strings.

### ❓ Which server or endpoint is contacted?

**Why it matters:** Replacement requires knowledge of all external dependencies and authentication mechanisms.

**Missing evidence:** No concrete hostname or IP address was statically recoverable from code paths.

**How to resolve:**
- Run the binary in a network-monitored sandbox and capture DNS queries and TCP connections.
- Inspect configuration files and registry entries for URL or hostname settings.
- Check embedded string literals for URL patterns.

### ❓ Which database engine is used?

**Why it matters:** Replacement requires knowing the database technology, schema, and query patterns.

**Missing evidence:** No database engine identifier string or connection string was found in static analysis.

**How to resolve:**
- Run the binary in a monitored environment and capture ODBC or network database traffic.
- Search for DSN= or Driver={ connection string fragments in configuration files.
- Check application configuration files (.ini, .xml, .config) for database settings.

### ❓ How are credentials stored and transmitted?

**Why it matters:** Security assessment and replacement require understanding credential handling.

**Missing evidence:** Credential storage mechanism (registry, file, memory) not determined statically.

**How to resolve:**
- Audit credential API usage (CredWrite, CredRead) in disassembly.
- Monitor registry and file access for credential storage patterns.


## 10. Modernization Blueprint

### [MEDIUM] Document file layout and side effects

The binary reads and writes files. Enumerate all file paths accessed at runtime using process monitoring. Document side effects (created, modified, deleted files) so the replacement can replicate or improve on the file management behavior.

**Evidence:** `evd-str-3605`, `evd-str-3696`, `evd-str-3849`, `evd-str-3919`

### [MEDIUM] Document external process dependencies

The binary launches external processes. Identify all child processes, their arguments, and the conditions under which they are invoked. Document whether the binary waits for completion or runs them asynchronously.

**Evidence:** `evd-str-2549`, `evd-str-2562`, `evd-str-3078`, `evd-str-3099`, `evd-str-3235`, `evd-str-3236`, `evd-str-3238`, `evd-str-3239`, `evd-str-3507`, `evd-str-3508`, `evd-str-3514`, `evd-str-3515`, `evd-str-3516`, `evd-str-3521`, `evd-str-3527`, `evd-str-3528`, `evd-str-3529`, `evd-str-3530`, `evd-str-3531`, `evd-str-3532`, `evd-str-3540`, `evd-str-3541`, `evd-str-3542`, `evd-str-3543`, `evd-str-3544`, `evd-str-3623`, `evd-str-3625`, `evd-str-3628`, `evd-str-3630`, `evd-str-3632`, `evd-str-3663`, `evd-str-3684`, `evd-str-3690`, `evd-str-3694`, `evd-str-3773`, `evd-str-3856`, `evd-str-3915`


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

**Total evidence items: 7642**

| Kind | Count |
|------|-------|
| binary-metadata | 1 |
| decompilation | 20 |
| function | 2694 |
| import | 1 |
| pe-section | 7 |
| string | 4919 |
