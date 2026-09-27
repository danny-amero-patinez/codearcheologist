# Code Archaeologist — Analysis Report

> ⚠️ Static analysis does NOT establish that this binary is safe. The binary was never executed.

> **Analysis ID:** `78eff58e-a180-4f3f-80d8-b2884269afb4`  
> **Status:** completed  
> **Generated:** 2026-09-27T02:24:28.743Z


---

## 1. Executive Reconstruction Summary

Static evidence suggests this binary contains 2 candidate responsibilities related to: _Filesystem deployment and file management_, _External process creation and management_. These conclusions are based on correlated imports, strings, call-graph edges, and function-level references; they do not establish runtime execution paths.
Confidence breakdown: 1 at high confidence, 1 at medium confidence.

**Unresolved questions (5):**
- Which service or driver name is managed?
- Which process or executable is launched, and for what purpose?
- Which server or endpoint is contacted?
- Which database engine is used?
- How are credentials stored and transmitted?

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
| Description | VeraCrypt Setup |
| Original Filename | `VeraCrypt Setup.exe` |

## 3. Analysis Coverage & Tool Status

| Tool | Status |
|------|--------|
| PE Parser | ✓ Ran |
| String Extractor | ✓ Ran |
| Ghidra | ✓ Ran |

**Phases:**
- ✓ intake
- ✓ profiling (12317ms)
- ✓ extracting (122ms)
- ✓ ghidra-analysis (91343ms)
- ✓ correlating (73ms)
- ✓ inferring (27ms)
- ✓ reconstructing (12ms)
- ✓ reporting (10ms)

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
- **Inferred:** File write/copy/move/delete APIs are imported.
- **Inferred:** System path resolution APIs (GetSystemDirectoryW, GetTempPathW, etc.) are imported.
- **Inferred:** Deployment path strings (System32, temp, install) are present.
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
- **Inferred:** Process creation APIs (CreateProcessW, ShellExecuteW, etc.) are imported.
- **Inferred:** Command-line strings correlated to process-launching code.
- **Inferred:** The binary creates or manages external processes.
- **Unknown:** Static analysis cannot determine which processes are launched or under what conditions.
- **Unknown:** CreateThread indicates concurrency, not necessarily external process launching.

**Limitations:**
- Static analysis cannot determine which binaries are launched or their arguments.
- Static analysis cannot determine which processes are launched or under what conditions.
- CreateThread indicates concurrency, not necessarily external process launching.


## 6. External Interactions

### service — **[LOW]**

Potential service management: service-related evidence is present, but corroborated API usage was not established.

**Evidence:** `evd-str-1159`, `evd-str-1442`

- _Static analysis cannot confirm which service names are managed or their configurations._

### filesystem — **[HIGH]**

Static evidence strongly supports filesystem interaction through correlated filesystem APIs and path evidence.

**Evidence:** `evd-str-3605`, `evd-str-3696`, `evd-str-3849`, `evd-str-3919`

- _Static analysis cannot enumerate specific files accessed at runtime._
- _File paths may be computed dynamically and are not recoverable statically._

### process — **[MEDIUM]**

Static evidence suggests the binary may create or manage external processes.

**Evidence:** `evd-str-2549`, `evd-str-2562`, `evd-str-3078`, `evd-str-3099`, `evd-str-3235`, `evd-str-3236`, `evd-str-3238`, `evd-str-3239`, `evd-str-3507`, `evd-str-3508`, `evd-str-3514`, `evd-str-3515`, `evd-str-3516`, `evd-str-3521`, `evd-str-3527`, `evd-str-3528`, `evd-str-3529`, `evd-str-3530`, `evd-str-3531`, `evd-str-3532`, `evd-str-3540`, `evd-str-3541`, `evd-str-3542`, `evd-str-3543`, `evd-str-3544`, `evd-str-3623`, `evd-str-3625`, `evd-str-3628`, `evd-str-3630`, `evd-str-3632`, `evd-str-3663`, `evd-str-3684`, `evd-str-3690`, `evd-str-3694`, `evd-str-3773`, `evd-str-3856`, `evd-str-3915`

- _Static analysis cannot determine which processes are launched or their arguments._

### network — **[LOW]**

Potential network interaction: endpoint or URL evidence is present, but network API usage was not corroborated.

**Evidence:** `evd-str-1797`, `evd-str-1798`, `evd-str-3812`

- _Static analysis cannot confirm which hosts or ports are contacted at runtime._
- _Network payloads cannot be recovered by static analysis._

### database — **[LOW]**

Potential database interaction: SQL or database-like strings are present, but executed database access was not established.

**Evidence:** `evd-str-1520`, `evd-str-1820`, `evd-str-1845`, `evd-str-1847`, `evd-str-1848`, `evd-str-3478`, `evd-str-3549`, `evd-str-3841`, `evd-str-3933`, `evd-str-4481`, `evd-str-4486`, `evd-str-4492`, `evd-str-4495`, `evd-str-4576`, `evd-str-4676`, `evd-str-4677`, `evd-str-4746`, `evd-str-4827`

- _Static analysis cannot identify the database engine, connection string, or schema._


## 7. Interesting Functions

### `FUN_00425540` at `00425540` _(auto-generated name)_

- **Selection score:** 119.5
- **Selection reasons:** references 9 import(s), references 65 string(s), connectivity=26
- **API references:** `IsUserAnAdmin`, `LoadCursorW`, `SetCursor`, `CoInitializeEx`, `CoUninitialize`, `Sleep`, `UrlUnescapeW`, `CoCreateInstance`, `ShellExecuteW`
- **String references:** `zh-cn`, `donate`, `Donation.html`, `https://amcrypto.jp`, `localizations`, `Language%20Packs.html`, `beginnerstutorial`, `tutorial`, `releasenotes`, `history`, `hwacceleration`, `Hardware%20Acceleration.html`, `parallelization`, `Parallelization.html`, `Documentation.html`, `onlinehelp`, `https://veracrypt.jp/%s/Documentation.html`, `keyfiles`, `Keyfiles.html`, `keyfilesextensions`, `Avoid%20Third-Party%20File%20Extensions.html`, `introcontainer`, `Creating%20New%20Volumes.html`, `introsysenc`, `System%20Encryption.html`, `hiddensysenc`, `VeraCrypt%20Hidden%20Operating%20System.html`, `sysencprogressinfo`, `hiddenvolume`, `Hidden%20Volume.html`, `serpent`, `Serpent.html`, `twofish`, `Twofish.html`, `Kuznyechik.html`, `camellia`, `Camellia.html`, `cascades`, `Cascades.html`, `hashalgorithms`, `Hash%20Algorithms.html`, `isoburning`, `https://cdburnerxp.se/en/home`, `sysfavorites`, `System%20Favorite%20Volumes.html`, `favorites`, `Favorite%20Volumes.html`, `hiddenvolprotection`, `Protection%20of%20Hidden%20Volumes.html`, `FAQ.html`, `downloads`, `Downloads.html`, `News.html`, `contact`, `Contact.html`, `memoryprotection`, `VeraCrypt%20Memory%20Protection.html`, `https://veracrypt.jp`, `Release%20Notes.html`, `Beginner%27s%20Tutorial.html`, `https://veracrypt.jp/%s/%s`, `docs\html\`, `file:///%sdocs/html/en/%s`, `file:///%sdocs/html/%s/%s`, `open`
- **Called by:** `0040dd60`, `0042b710`, `00424eb0`, `0040cfd0`, `0042cf20`
- **Calls:** `00405860`, `00451665`, `0041f3f0`, `0041ed80`, `00405a00`, `0042bc10`, `00403d20`, `004535b0` …+4
- **Evidence:** `evd-fun-4928`, `evd-dec-4929`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
/* WARNING: Function: __alloca_probe replaced with injection: alloca_probe */
/* WARNING: Function: __security_check_cookie replaced with injection: security_check_cookie */
/* WARNING: Removing unreachable block (ram,0x004261bb) */
/* WARNING: Type propagation algorithm not settling */
void FUN_00425540(byte *param_1)
{
  byte bVar1;
  char cVar2;
// …1343 more lines
```

</details>

### `FUN_0040dd60` at `0040dd60` _(auto-generated name)_

- **Selection score:** 109
- **Selection reasons:** references 21 import(s), references 42 string(s), connectivity=58
- **API references:** `SetTextAlign`, `CreateSolidBrush`, `GetWindowTextLengthW`, `SetWindowTextW`, `SetDlgItemTextW`, `SendMessageW`, `TextOutW`, `DestroyWindow`, `SetBkColor`, `GetDlgItem`, `EnableWindow`, `BeginPaint`, `GetParent`, `FillRect`, `SetTextColor`, `EndPaint`, `SelectObject`, `CreateFontIndirectW`, `ReleaseDC`, `EndDialog`, `SHGetSpecialFolderPathW`
- **String references:** `SELECT_DEST_DIR`, `DISABLE_SCREEN_PROTECTION_WARNING`, `memoryprotection`, `DISABLE_MEMORY_PROTECTION_WARNING`, `donate`, `IDD_INSTL_DLG`, `SETUP_WIZARD_PAGE_%d`, `Please read the license terms`, `You must accept these license terms before you can use, extract, or install Vera…`, `IMPORTANT: By checking the checkbox below, you accept these license terms and si…`, `I &accept the license terms`, `CANCEL`, `UPGRADE`, `REPAIR_REINSTALL`, `SETUP_MODE_TITLE`, `SETUP_MODE_INFO`, `SETUP_MODE_HELP_EXTRACT`, `SETUP_MODE_HELP_INSTALL`, `SETUP_MODE_HELP_UPGRADE`, `VeraCrypt\`, `EXTRACTION_OPTIONS_TITLE`, `EXTRACTION_OPTIONS_INFO`, `AUTO_FOLDER_CREATION`, `EXTRACT`, `EXTRACTING_VERB`, `EXTRACTION_PROGRESS_INFO`, `EXTRACTION_IN_PROGRESS`, `SETUP_OPTIONS_TITLE`, `SETUP_OPTIONS_INFO`, `SETUP_UPGRADE_DESTINATION`, `\VeraCrypt`, `INSTALL`, `SETUP_PROGRESS_TITLE`, `SETUP_PROGRESS_INFO`, `INSTALL_IN_PROGRESS`, `EXTRACTION_FINISHED_TITLE_DON`, `SETUP_FINISHED_UPGRADE_TITLE_DON`, `SETUP_FINISHED_TITLE_DON`, `SETUP_FINISHED_INFO_DON`, `Please consider making a donation.`, `Times New Roman`, `CANNOT_DISPLAY_LICENSE`
- **Calls:** `004055d0`, `004271c0`, `00403d20`, `00427000`, `00425190`, `0040cea0`, `00427080`, `004535b0` …+29
- **Evidence:** `evd-fun-4930`, `evd-dec-4931`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
/* WARNING: Function: __security_check_cookie replaced with injection: security_check_cookie */
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
undefined4 FUN_0040dd60(HWND param_1,uint param_2,uint param_3)
{
  WCHAR WVar1;
  int iVar2;
  HDC hdc;
  HBRUSH hbr;
// …839 more lines
```

</details>

### `FUN_0040cfd0` at `0040cfd0` _(auto-generated name)_

- **Selection score:** 96
- **Selection reasons:** references 28 import(s), references 24 string(s), connectivity=59
- **API references:** `SetBkMode`, `InvalidateRect`, `MapDialogRect`, `CryptAcquireContextW`, `ShowWindow`, `GetWindowRect`, `MoveWindow`, `SetWindowPos`, `CreateSolidBrush`, `GetStockObject`, `SetWindowTextW`, `ShellExecuteW`, `SendMessageW`, `DestroyWindow`, `GetDlgItem`, `GetModuleFileNameW`, `EnableWindow`, `MultiByteToWideChar`, `BeginPaint`, `GetWindowTextW`, `GetClientRect`, `CryptGenRandom`, `FillRect`, `EndPaint`, `CreateDialogParamW`, `PostMessageW`, `ReleaseDC`, `EndDialog`
- **String references:** `CONFIRM_EXIT_UNIVERSAL`, `open`, `AFTER_UPGRADE_RELEASE_NOTES`, `releasenotes`, `AFTER_INSTALL_TUTORIAL`, `beginnerstutorial`, `CONFIRM_DISABLE_FAST_STARTUP`, `HiberbootEnabled`, `SYSTEM\CurrentControlSet\Control\Session Manager\Power`, `CONFIRM_RESTART`, `UPGRADE_OK_REBOOT_REQUIRED`, `TC_INSTALLER_IS_RUNNING`, `IDD_INSTL_DLG`, `VeraCrypt Setup 1.26.29`, `Microsoft Enhanced Cryptographic Provider v1.0`, `TRAVELER_LIMITATIONS_NOTE`, `TRAVELER_UAC_NOTE`, `SetupUILanguage`, `Software\VeraCrypt`, `FINALIZE`, `EXTRACTION_FAILED`, `IDCLOSE`, `INSTALL_FAILED`, `EXTRACTION_FINISHED_INFO`
- **Calls:** `00429580`, `0040f5b0`, `0042a6c0`, `00426a60`, `0042b830`, `00427080`, `0042bb00`, `0042b6a0` …+23
- **Evidence:** `evd-fun-4932`, `evd-dec-4933`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
/* WARNING: Function: __security_check_cookie replaced with injection: security_check_cookie */
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
HGDIOBJ FUN_0040cfd0(HWND param_1,uint param_2,HDC param_3,HWND param_4)
{
  HDC hDC;
  HBRUSH hbr;
  char *pcVar1;
  int iVar2;
// …475 more lines
```

</details>

### `FUN_00407fa0` at `00407fa0` _(auto-generated name)_

- **Selection score:** 84.5
- **Selection reasons:** references 14 import(s), references 35 string(s), connectivity=52
- **API references:** `SetCurrentDirectoryW`, `FormatMessageW`, `MoveFileExW`, `GetLastError`, `LocalFree`, `GetModuleFileNameW`, `CopyFileW`, `FindClose`, `MessageBoxW`, `FindNextFileW`, `DeleteFileW`, `GetWindowsDirectoryW`, `GetSystemDirectoryW`, `FindFirstFileW`
- **String references:** `VeraCrypt Setup`, `C:\Windows\System32`, `Drivers\`, `C:\Windows`, `%s%s`, `INSTALLING`, `REMOVING`, `Dveracrypt.sys`, `Averacrypt.sys`, `veracrypt-arm64.sys`, `veracrypt-x64.sys`, `Averacrypt.cat`, `veracrypt-arm64.cat`, `veracrypt-x64.cat`, `AVeraCrypt.exe`, `VeraCrypt-arm64.exe`, `VeraCrypt-x64.exe`, `AVeraCryptExpander.exe`, `VeraCryptExpander-arm64.exe`, `VeraCryptExpander-x64.exe`, `AVeraCrypt Format.exe`, `VeraCrypt Format-arm64.exe`, `VeraCrypt Format-x64.exe`, `DoFilesInstall:923`, `DoFilesInstall:949`, `VeraCrypt.exe`, `VeraCrypt System Favorite Volumes.xml`, `VeraCryptSystemFavorites`, `/SkipMount`, `0x%.8X`, `UNINSTALL_OF_FAILED`, `INSTALL_OF_FAILED`, `VeraCrypt User Guide*.pdf`, `docs\html\en\ru`, `Language*.xml`
- **Called by:** `0040be10`, `00409140`
- **Calls:** `00403d20`, `00427e50`, `00427dd0`, `00405370`, `0042bbc0`, `0042cb40`, `004535b0`, `004273a0` …+28
- **Evidence:** `evd-fun-4934`, `evd-dec-4935`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
/* WARNING: Function: __security_check_cookie replaced with injection: security_check_cookie */
/* WARNING: Type propagation algorithm not settling */
undefined4 FUN_00407fa0(HWND param_1,wchar_t *param_2)
{
  WCHAR WVar1;
  short sVar2;
  wchar_t wVar3;
  int iVar4;
// …862 more lines
```

</details>

### `FUN_00428fb0` at `00428fb0` _(auto-generated name)_

- **Selection score:** 67.5
- **Selection reasons:** references 16 import(s), references 21 string(s), connectivity=36
- **API references:** `GetModuleHandleW`, `CoInitializeEx`, `GetModuleFileNameW`, `SetUnhandledExceptionFilter`, `GetClassInfoW`, `RegisterClassW`, `GetCurrentProcess`, `VirtualLock`, `MessageBoxW`, `LoadCursorW`, `LoadLibraryExW`, `GetSystemMetrics`, `InitCommonControlsEx`, `GetProcAddress`, `SetErrorMode`, `InitializeCriticalSection`
- **String references:** `IsWow64Process`, `kernel32`, `IsWow64Process2`, `SetDefaultDllDirectories`, `kernel32.dll`, `Riched20.dll`, `Language`, `#32770`, `VeraCryptCustomDlg`, `VeraCryptSplashDlg`, `docs\VeraCrypt User Guide.%S.chm`, `docs\VeraCrypt User Guide.chm`, `VeraCrypt requires at least Windows 10 version 1809 (October 2018 Update) to run…`, `VeraCrypt requires a 64-bit version of Windows to run.`, `VeraCrypt requires KB2533623 to be installed on Windows 7 and Windows Server 200…`, `SHA-2 support missing from Windows.

Please Install KB3033929 or KB4474419`, `UNSUPPORTED_OS`, `InitApp:3975`, `INIT_REGISTER`, `InitApp:3993`, `InitApp:4005`
- **Called by:** `0040c560`
- **Calls:** `0042cee0`, `0042e400`, `004236d0`, `00403cb0`, `00422ad0`, `0042cb40`, `00405370`, `0045370a` …+11
- **Evidence:** `evd-fun-4936`, `evd-dec-4937`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
/* WARNING: Function: __security_check_cookie replaced with injection: security_check_cookie */
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
void FUN_00428fb0(HINSTANCE param_1)
{
  byte bVar1;
  code *pcVar2;
  char cVar3;
  HMODULE pHVar4;
// …242 more lines
```

</details>

### `FUN_00417ce0` at `00417ce0` _(auto-generated name)_

- **Selection score:** 59
- **Selection reasons:** references 2 import(s), references 34 string(s), connectivity=53
- **API references:** `GetLastError`, `CreateDirectoryW`
- **String references:** `ADMIN_PRIVILEGES_WARN_DEVICES`, `\EFI\Microsoft\Boot\bootmgfw.efi`, `\EFI\VeraCrypt\DcsBoot.efi`, `VeraCrypt BootLoader (DcsBoot)`, `\EFI\Microsoft\Boot\bootmgfw_ms.vc`, `bootmgfw.pdb`, `\EFI\VeraCrypt\DcsProp`, `\EFI\Boot\bootx64.efi`, `\EFI\Boot\original_bootx64.vc_backup`, `\EFI\VeraCrypt`, `\EFI\VeraCrypt\PlatformInfo`, `VeraCrypt`, `\DcsProp`, `\EFI\VeraCrypt\DcsBoot`, `\DcsBoot`, `\EFI\Boot\original_bootx64_vc_backup.efi`, `\DcsBoot.efi`, `\DcsInt.efi`, `\DcsCfg.efi`, `\LegacySpeaker.efi`, `\EFI\VeraCrypt\DcsBml.dcs`, `Invalid partition table`, `Error loading operating system`, `Missing operating system`, `DcsBoot`, `DcsInt`, `DcsCfg`, `LegacySpeaker`, `DcsRe`, `DcsInfo`, `VeraCrypt::BootEncryption::InstallBootLoader:4152`, `WINDOWS_EFI_BOOT_LOADER_MISSING`, `VeraCrypt::BootEncryption::InstallBootLoader:4329`, `ERROR_MBR_PROTECTED`
- **Called by:** `00419020`
- **Calls:** `004076e0`, `0041c640`, `00452bf3`, `0045ce30`, `00419170`, `0041c950`, `0042a6c0`, `00418eb2` …+42
- **Evidence:** `evd-fun-4938`, `evd-dec-4939`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
/* WARNING: Function: __alloca_probe replaced with injection: alloca_probe */
/* WARNING: Function: __security_check_cookie replaced with injection: security_check_cookie */
void __thiscall
FUN_00417ce0(undefined1 *param_1,void *param_2,char param_3,undefined4 param_4,int param_5,
            int param_6)
{
  char ****ppppcVar1;
  char cVar2;
// …702 more lines
```

</details>

### `FUN_00409140` at `00409140` _(auto-generated name)_

- **Selection score:** 57.5
- **Selection reasons:** references 8 import(s), references 25 string(s), connectivity=37
- **API references:** `InvalidateRect`, `RegOpenKeyExW`, `RegCloseKey`, `MessageBoxW`, `RegQueryValueExW`, `SendMessageW`, `GetWindowsDirectoryW`, `GetDlgItem`
- **String references:** `SOFTWARE\VeraCrypt_MSI`, `ProductGuid`, `CANT_INSTALL_WITH_EXE_OVER_MSI`, `INSTALL_FAILED`, `DoInstall:2267`, `CANT_CREATE_FOLDER`, `VeraCrypt.exe`, `VeraCrypt-x86.exe`, `VeraCrypt-x64.exe`, `VeraCrypt-arm64.exe`, `VeraCrypt Format.exe`, `VeraCrypt Format-x86.exe`, `VeraCrypt Format-x64.exe`, `VeraCrypt Format-arm64.exe`, `VeraCryptExpander.exe`, `VeraCryptExpander-x86.exe`, `VeraCryptExpander-x64.exe`, `VeraCryptExpander-arm64.exe`, `VeraCrypt Setup.exe`, `CLOSE_TC_FIRST`, `DoInstall:2320`, `FAILED_TO_DISABLE_PAGING_FILES`, `VeraCryptService`, `\VeraCrypt Setup.exe`, `veracrypt`
- **Calls:** `004055d0`, `00409f33`, `004064e0`, `00403cb0`, `0040c3c0`, `0040f5b0`, `00405370`, `0040a370` …+21
- **Evidence:** `evd-fun-4940`, `evd-dec-4941`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
/* WARNING: Function: __alloca_probe replaced with injection: alloca_probe */
/* WARNING: Function: __security_check_cookie replaced with injection: security_check_cookie */
void FUN_00409140(HWND param_1)
{
  HWND hWnd;
  DWORD DVar1;
  LSTATUS LVar2;
  LPCWSTR lpText;
// …486 more lines
```

</details>

### `FUN_0040a370` at `0040a370` _(auto-generated name)_

- **Selection score:** 55.5
- **Selection reasons:** references 4 import(s), references 29 string(s), connectivity=14
- **API references:** `RegCloseKey`, `RegCreateKeyExW`, `SHChangeNotify`, `RegSetValueExW`
- **String references:** `Software\Microsoft\Windows\CurrentVersion\Uninstall\VeraCrypt`, `1.26.29`, `DisplayVersion`, `https://amcrypto.jp`, `URLInfoAbout`, `Software\Classes\VeraCryptVolume`, `ADDING_REG`, `VeraCrypt Volume`, `AMCrypto.VeraCrypt`, `AppUserModelID`, `Software\Classes\VeraCryptVolume\DefaultIcon`, `%sVeraCrypt.exe,1`, `Software\Classes\VeraCryptVolume\Shell\open\command`, `"%sVeraCrypt.exe" /v "%%1"`, `Software\Classes\.hc`, `VeraCryptVolume`, `"%sVeraCrypt Setup.exe" /u`, `UninstallString`, `"%sVeraCrypt Setup.exe" /c`, `ModifyPath`, `"%sVeraCrypt Setup.exe"`, `DisplayIcon`, `VeraCrypt`, `DisplayName`, `AM Crypto`, `Publisher`, `DoRegInstall:1350`, `REG_INSTALL_FAILED`, `COM_REG_FAILED`
- **Called by:** `00409140`
- **Calls:** `00403620`, `00403d20`, `00403cb0`, `00427e90`, `00405370`, `0040c310`, `00451665`, `0042cb40` …+1
- **Evidence:** `evd-fun-4942`, `evd-dec-4943`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
/* WARNING: Function: __security_check_cookie replaced with injection: security_check_cookie */
bool FUN_0040a370(undefined4 param_1,short *param_2,int param_3)
{
  short sVar1;
  wchar_t wVar2;
  LSTATUS LVar3;
  wchar_t *pwVar4;
  uint uVar5;
// …373 more lines
```

</details>

### `FUN_004045c0` at `004045c0` _(auto-generated name)_

- **Selection score:** 53
- **Selection reasons:** references 2 import(s), references 30 string(s), connectivity=22
- **API references:** `MessageBoxW`, `GetModuleFileNameW`
- **String references:** `VeraCrypt Setup 1.26.29.exe`, `MakeSelfExtractingPackage:176`, `VeraCrypt`, `Cannot copy 'VeraCrypt Setup.exe' to the package`, `-x64`, `%s%s`, `Cannot allocate memory for uncompressed data`, `Cannot allocate memory for uncompressed data.
Failed also to delete package file`, `VCINSTRT`, `Cannot write the start marker
Failed also to delete package file`, `Cannot write the start marker`, `Cannot write the total size of the uncompressed data.
Failed also to delete pack…`, `Cannot write the total size of the uncompressed data`, `Cannot allocate memory for compressed data.
Failed also to delete package file`, `Cannot allocate memory for compressed data`, `Cannot write the total size of the compressed data.
Failed also to delete packag…`, `Cannot write the total size of the compressed data`, `Cannot write compressed data to the package.
Failed also to delete package file`, `Cannot write compressed data to the package`, `Cannot write the end marker.
Failed also to delete package file`, `Cannot write the end marker`, `MakeSelfExtractingPackage:395`, `Cannot load the package to compute CRC.
Failed also to delete package file`, `Cannot load the package to compute CRC`, `Self-extracting package successfully created (%s)`, `Failed to compress the data.
Failed also to delete package file`, `Failed to compress the data`, `Cannot load file 
'%s'`, `
Failed also to delete package file`, `File not found:

'%s'`
- **Called by:** `0040c560`
- **Calls:** `00453030`, `00444600`, `00403d20`, `00456c90`, `00421990`, `00403cb0`, `00428710`, `0042a760` …+11
- **Evidence:** `evd-fun-4944`, `evd-dec-4945`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
/* WARNING: Function: __alloca_probe replaced with injection: alloca_probe */
/* WARNING: Function: __security_check_cookie replaced with injection: security_check_cookie */
undefined4 FUN_004045c0(undefined4 param_1,short *param_2,int param_3)
{
  short sVar1;
  char *pcVar2;
  undefined1 uVar3;
  undefined1 extraout_AH;
// …398 more lines
```

</details>

### `FUN_0040ada0` at `0040ada0` _(auto-generated name)_

- **Selection score:** 47
- **Selection reasons:** references 5 import(s), references 22 string(s), connectivity=15
- **API references:** `RegOpenKeyExW`, `RegCloseKey`, `RegDeleteKeyW`, `SHChangeNotify`, `RegDeleteKeyExW`
- **String references:** `COM_DEREG_FAILED`, `REMOVING_REG`, `Software\Microsoft\Windows\CurrentVersion\Uninstall\VeraCrypt`, `Software\VeraCrypt`, `Software\VeraCrypt\Diagnostics\EfiBootLoader`, `Software\VeraCrypt\Diagnostics`, `Software\Classes\VeraCryptVolume\Shell\open\command`, `Software\Classes\VeraCryptVolume\Shell\open`, `Software\Classes\VeraCryptVolume\Shell`, `Software\Classes\VeraCryptVolume\DefaultIcon`, `Software\Classes\VeraCryptVolume`, `VeraCrypt`, `Software\Classes\.hc`, `SeTakeOwnershipPrivilege`, `Local Settings\Software\Microsoft\Windows\Shell\MuiCache`, `Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.hc`, `Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Compatibility Assist…`, `Software\Microsoft\Windows\CurrentVersion\Explorer\StartPage\NewShortcuts`, `SYSTEM`, `ControlSet`, `Enum\Root\LEGACY_VERACRYPT`, `services\veracrypt`
- **Called by:** `0040be10`, `00409140`
- **Calls:** `004279c0`, `0042e580`, `00403a60`, `00406780`, `00451665`, `0040c2a0`, `0042e500`, `0042c220`
- **Evidence:** `evd-fun-4946`, `evd-dec-4947`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
/* WARNING: Function: __security_check_cookie replaced with injection: security_check_cookie */
undefined4 FUN_0040ada0(undefined4 param_1,int param_2)
{
  int iVar1;
  LSTATUS LVar2;
  HKEY local_8c;
  undefined1 local_88 [128];
  uint local_8;
// …44 more lines
```

</details>

_…and 10 more functions in the canonical result._

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

**Evidence:** `evd-str-3605`, `evd-str-3696`, `evd-str-3849`, `evd-str-3919`

### [MEDIUM] Document external process dependencies

The binary launches external processes. Identify all child processes, their arguments, and the conditions under which they are invoked. Document whether the binary waits for completion or runs them asynchronously.

**Rationale:** Process-creation APIs were correlated in static evidence. Child executable identities and invocation arguments cannot be confirmed from static analysis.

**Recommended steps:**
1. Identify child executable evidence from string and API references in this analysis.
1. Recover executable dependencies from the deployed system.
1. Document invocation arguments and conditions through runtime monitoring.
1. Determine whether child processes are waited for or run asynchronously.

**Artifacts to recover:**
- external executable dependencies
- child process invocation documentation

**Evidence:** `evd-str-2549`, `evd-str-2562`, `evd-str-3078`, `evd-str-3099`, `evd-str-3235`, `evd-str-3236`, `evd-str-3238`, `evd-str-3239`, `evd-str-3507`, `evd-str-3508`, `evd-str-3514`, `evd-str-3515`, `evd-str-3516`, `evd-str-3521`, `evd-str-3527`, `evd-str-3528`, `evd-str-3529`, `evd-str-3530`, `evd-str-3531`, `evd-str-3532`, `evd-str-3540`, `evd-str-3541`, `evd-str-3542`, `evd-str-3543`, `evd-str-3544`, `evd-str-3623`, `evd-str-3625`, `evd-str-3628`, `evd-str-3630`, `evd-str-3632`, `evd-str-3663`, `evd-str-3684`, `evd-str-3690`, `evd-str-3694`, `evd-str-3773`, `evd-str-3856`, `evd-str-3915`

### Investigation Sequence

Recommended order to resolve unresolved dependencies before replacement:

1. Document file layout and side effects
2. Document external process dependencies

### Artifacts to Recover from a Deployed Installation

- installed directory layout
- configuration files
- log files
- data files
- external executable dependencies
- child process invocation documentation


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
|------|------:|
| binary-metadata | 1 |
| decompilation | 20 |
| function | 2694 |
| import | 1 |
| pe-section | 7 |
| string | 4919 |

### Evidence Detail

| ID | Kind | Tool | Location | Summary |
|---|---|---|---|---|
| `evd-bin-0000` | binary-metadata | pe-parser |  | PE binary: VeraCrypt.Setup.1.26.29.exe (PE32, x86) |
| `evd-pe--0001` | pe-section | pe-parser | 0x00001000 | Section .text: VA=0x00001000 size=505418 |
| `evd-pe--0002` | pe-section | pe-parser | 0x0007D000 | Section .rdata: VA=0x0007D000 size=122542 |
| `evd-pe--0003` | pe-section | pe-parser | 0x0009B000 | Section .data: VA=0x0009B000 size=27476 |
| `evd-pe--0004` | pe-section | pe-parser | 0x000A2000 | Section .didat: VA=0x000A2000 size=792 |
| `evd-pe--0005` | pe-section | pe-parser | 0x000A3000 | Section .fptable: VA=0x000A3000 size=128 |
| `evd-pe--0006` | pe-section | pe-parser | 0x000A4000 | Section .rsrc: VA=0x000A4000 size=21033280 |
| `evd-pe--0007` | pe-section | pe-parser | 0x014B4000 | Section .reloc: VA=0x014B4000 size=23112 |
| `evd-imp-0008` | import | pe-parser |  | Import DLL: KERNEL32.dll (159 function(s)) |
| `evd-str-0009` | string | strings | +0x4d | String [error-message]: "!This program cannot be run in DOS mode." |
| `evd-str-0010` | string | strings | +0x100 | String [other]: "Rich" |
| `evd-str-0011` | string | strings | +0x218 | String [other]: ".text" |
| `evd-str-0012` | string | strings | +0x23f | String [other]: "`.rdata" |
| `evd-str-0013` | string | strings | +0x267 | String [other]: "@.data" |
| `evd-str-0014` | string | strings | +0x290 | String [other]: ".didat" |
| `evd-str-0015` | string | strings | +0x2b8 | String [other]: ".fptable" |
| `evd-str-0016` | string | strings | +0x2e0 | String [other]: ".rsrc" |
| `evd-str-0017` | string | strings | +0x307 | String [other]: "@.reloc" |
| `evd-str-0018` | string | strings | +0x963 | String [other]: "Y_^[" |
| `evd-str-0019` | string | strings | +0x9b0 | String [other]: "PQVW" |
| `evd-str-0020` | string | strings | +0xa66 | String [other]: "SVWP" |
| `evd-str-0021` | string | strings | +0x115f | String [other]: "hHcI" |
| `evd-str-0022` | string | strings | +0x127d | String [other]: "[_^]" |
| `evd-str-0023` | string | strings | +0x162d | String [other]: "f;0u?" |
| `evd-str-0024` | string | strings | +0x1646 | String [other]: "f;0t" |
| `evd-str-0025` | string | strings | +0x1772 | String [other]: "t%F;s" |
| `evd-str-0026` | string | strings | +0x1972 | String [other]: "QVVV" |
| `evd-str-0027` | string | strings | +0x19b8 | String [other]: "PVVV" |
| `evd-str-0028` | string | strings | +0x23f1 | String [other]: "?=u%" |
| `evd-str-0029` | string | strings | +0x249c | String [other]: "93tKh" |
| `evd-str-0030` | string | strings | +0x25c9 | String [other]: "?{u\" |
| `evd-str-0031` | string | strings | +0x27dd | String [other]: "?}t<" |
| `evd-str-0032` | string | strings | +0x2880 | String [other]: "?=uFW" |
| `evd-str-0033` | string | strings | +0x2d20 | String [other]: "Juu3" |
| `evd-str-0034` | string | strings | +0x2d37 | String [other]: "Ju^3" |
| `evd-str-0035` | string | strings | +0x2d41 | String [other]: "Pj@j" |
| `evd-str-0036` | string | strings | +0x3186 | String [other]: "_^[]" |
| `evd-str-0037` | string | strings | +0x33a2 | String [other]: "t$Ph" |
| `evd-str-0038` | string | strings | +0x33e4 | String [other]: ":u=h" |
| `evd-str-0039` | string | strings | +0x37bc | String [other]: "Vhpy@" |
| `evd-str-0040` | string | strings | +0x47c5 | String [other]: "_[^]" |
| `evd-str-0041` | string | strings | +0x491a | String [other]: "u Ph4" |
| `evd-str-0042` | string | strings | +0x4c4f | String [other]: ">_^[" |
| `evd-str-0043` | string | strings | +0x4f9a | String [other]: "PVVj" |
| `evd-str-0044` | string | strings | +0x589d | String [other]: "w'QR" |
| `evd-str-0045` | string | strings | +0x59aa | String [other]: "PPPPPP" |
| `evd-str-0046` | string | strings | +0x5a1f | String [other]: "u1SW" |
| `evd-str-0047` | string | strings | +0x5b52 | String [other]: "SPVG" |
| `evd-str-0048` | string | strings | +0x6272 | String [other]: "u"RS" |
| `evd-str-0049` | string | strings | +0x6299 | String [other]: "u*h*" |
| `evd-str-0050` | string | strings | +0x66ee | String [other]: "Vtrh," |
| `evd-str-0051` | string | strings | +0x699c | String [other]: "uahH" |
| `evd-str-0052` | string | strings | +0x6aee | String [other]: "h<iI" |
| `evd-str-0053` | string | strings | +0x6b5f | String [other]: "HVRP" |
| `evd-str-0054` | string | strings | +0x6c1c | String [other]: "SVWf" |
| `evd-str-0055` | string | strings | +0x6e4d | String [other]: "hd "" |
| `evd-str-0056` | string | strings | +0x702f | String [other]: "t,Wh" |
| `evd-str-0057` | string | strings | +0x7265 | String [other]: "h( "" |
| `evd-str-0058` | string | strings | +0x72f7 | String [other]: "Ph  "" |
| `evd-str-0059` | string | strings | +0x7616 | String [other]: "Wuph" |
| `evd-str-0060` | string | strings | +0x7835 | String [other]: "0f;1u" |
| `evd-str-0061` | string | strings | +0x7b22 | String [other]: "Shpy@" |
| `evd-str-0062` | string | strings | +0x81e8 | String [other]: "u Ph" |
| `evd-str-0063` | string | strings | +0x861a | String [other]: "PSh4" |
| `evd-str-0064` | string | strings | +0x86b4 | String [other]: "tHh`" |
| `evd-str-0065` | string | strings | +0x8cbc | String [other]: "ukh " |
| `evd-str-0066` | string | strings | +0xa16a | String [other]: "u Shl" |
| `evd-str-0067` | string | strings | +0xa1bb | String [other]: "u-h " |
| `evd-str-0068` | string | strings | +0xa6e1 | String [other]: "uyWh" |
| `evd-str-0069` | string | strings | +0xaa62 | String [other]: "tRhT" |
| `evd-str-0070` | string | strings | +0xb734 | String [other]: "uoQP" |
| `evd-str-0071` | string | strings | +0xb842 | String [other]: "tff;" |
| `evd-str-0072` | string | strings | +0xb990 | String [other]: ";/uF" |
| `evd-str-0073` | string | strings | +0xb9f7 | String [other]: "t'j$" |
| `evd-str-0074` | string | strings | +0xba32 | String [other]: "j\h(" |
| `evd-str-0075` | string | strings | +0xbafa | String [other]: "RPh " |
| `evd-str-0076` | string | strings | +0xbc6c | String [other]: "PVVh" |
| `evd-str-0077` | string | strings | +0xbcc0 | String [other]: "t$h\" |
| `evd-str-0078` | string | strings | +0xbd80 | String [other]: "jsW+" |
| `evd-str-0079` | string | strings | +0xc22f | String [other]: "wVSVW" |
| `evd-str-0080` | string | strings | +0xc574 | String [other]: "t Vh" |
| `evd-str-0081` | string | strings | +0xc5da | String [other]: "t3Vh0" |
| `evd-str-0082` | string | strings | +0xc6a5 | String [other]: "`t(j" |
| `evd-str-0083` | string | strings | +0xc742 | String [other]: "u0h@" |
| `evd-str-0084` | string | strings | +0xda75 | String [other]: "tNh " |
| `evd-str-0085` | string | strings | +0xe063 | String [other]: "h A@" |
| `evd-str-0086` | string | strings | +0xebd1 | String [other]: "<>tc< t_j<S" |
| `evd-str-0087` | string | strings | +0xebf7 | String [other]: "u$j<P" |
| `evd-str-0088` | string | strings | +0xedeb | String [other]: "wPj"S" |
| `evd-str-0089` | string | strings | +0xee12 | String [other]: "t);u" |
| `evd-str-0090` | string | strings | +0xee1b | String [other]: "x ;u" |
| `evd-str-0091` | string | strings | +0xee94 | String [other]: "@j<Q" |
| `evd-str-0092` | string | strings | +0xf1f3 | String [other]: "@SVW" |
| `evd-str-0093` | string | strings | +0xf6b3 | String [other]: "uPjx" |
| `evd-str-0094` | string | strings | +0xff20 | String [other]: "PQVS" |
| `evd-str-0095` | string | strings | +0xff64 | String [other]: "wNQR" |
| `evd-str-0096` | string | strings | +0x1027b | String [other]: "~@ f" |
| `evd-str-0097` | string | strings | +0x108f1 | String [other]: "w`;G" |
| `evd-str-0098` | string | strings | +0x10f1f | String [other]: "h4~I" |
| `evd-str-0099` | string | strings | +0x10fe5 | String [other]: "4HVP" |
| `evd-str-0100` | string | strings | +0x111c6 | String [other]: "w@QR" |
| `evd-str-0101` | string | strings | +0x11b55 | String [other]: "wJQR" |
| `evd-str-0102` | string | strings | +0x11d8e | String [other]: "w/QR" |
| `evd-str-0103` | string | strings | +0x11f6f | String [other]: "t/VW" |
| `evd-str-0104` | string | strings | +0x12149 | String [other]: "t2VW" |
| `evd-str-0105` | string | strings | +0x12763 | String [other]: "8SVW" |
| `evd-str-0106` | string | strings | +0x1281f | String [other]: "v$PQ" |
| `evd-str-0107` | string | strings | +0x13116 | String [other]: "wsQR" |
| `evd-str-0108` | string | strings | +0x133c3 | String [other]: "hP~I" |
| `evd-str-0109` | string | strings | +0x13d9d | String [other]: "w^QR" |
| `evd-str-0110` | string | strings | +0x13ee6 | String [other]: "jbPVVhH "" |
| `evd-str-0111` | string | strings | +0x13f2a | String [other]: "PVVh` "" |
| `evd-str-0112` | string | strings | +0x13f3d | String [other]: "h$ H" |
| `evd-str-0113` | string | strings | +0x13f5a | String [other]: "h( H" |
| `evd-str-0114` | string | strings | +0x13f77 | String [other]: "h4 H" |
| `evd-str-0115` | string | strings | +0x13f94 | String [other]: "h< H" |
| `evd-str-0116` | string | strings | +0x13fb2 | String [other]: "hD H" |
| `evd-str-0117` | string | strings | +0x13fd2 | String [other]: "hL H" |
| `evd-str-0118` | string | strings | +0x13ff2 | String [other]: "hT H" |
| `evd-str-0119` | string | strings | +0x14012 | String [other]: "h` H" |
| `evd-str-0120` | string | strings | +0x14032 | String [other]: "hl H" |
| `evd-str-0121` | string | strings | +0x14052 | String [other]: "hx H" |
| `evd-str-0122` | string | strings | +0x140a1 | String [other]: "hX "" |
| `evd-str-0123` | string | strings | +0x14283 | String [other]: "QPhp!H" |
| `evd-str-0124` | string | strings | +0x143c8 | String [other]: "hp!H" |
| `evd-str-0125` | string | strings | +0x1440b | String [other]: "PVhp!H" |
| `evd-str-0126` | string | strings | +0x14567 | String [other]: "h4!H" |
| `evd-str-0127` | string | strings | +0x14588 | String [other]: "hh"H" |
| `evd-str-0128` | string | strings | +0x145a9 | String [other]: "h,"H" |
| `evd-str-0129` | string | strings | +0x145eb | String [other]: "hx!H" |
| `evd-str-0130` | string | strings | +0x14ef1 | String [other]: "Ph8 "" |
| `evd-str-0131` | string | strings | +0x15f8c | String [other]: "wdRQ" |
| `evd-str-0132` | string | strings | +0x16017 | String [other]: "Wjbj" |
| `evd-str-0133` | string | strings | +0x16029 | String [other]: "jbVj" |
| `evd-str-0134` | string | strings | +0x16030 | String [other]: "hH "" |
| `evd-str-0135` | string | strings | +0x16a19 | String [other]: "A 9y$" |
| `evd-str-0136` | string | strings | +0x16e44 | String [other]: "hP8H" |
| `evd-str-0137` | string | strings | +0x16eda | String [other]: "h,0H" |
| `evd-str-0138` | string | strings | +0x16edf | String [other]: "hH0H" |
| `evd-str-0139` | string | strings | +0x16f34 | String [other]: "tAh\|0H" |
| `evd-str-0140` | string | strings | +0x170b1 | String [other]: "h\0H" |
| `evd-str-0141` | string | strings | +0x171b7 | String [other]: "6hp!H" |
| `evd-str-0142` | string | strings | +0x17315 | String [other]: "hx%H" |
| `evd-str-0143` | string | strings | +0x17348 | String [other]: "Phx%H" |
| `evd-str-0144` | string | strings | +0x17475 | String [other]: "WVhx%H" |
| `evd-str-0145` | string | strings | +0x1798f | String [other]: "h`5H" |
| `evd-str-0146` | string | strings | +0x179b3 | String [other]: "Ph`5H" |
| `evd-str-0147` | string | strings | +0x17a07 | String [other]: "Bhx%H" |
| `evd-str-0148` | string | strings | +0x17ab1 | String [other]: "WVh`5H" |
| `evd-str-0149` | string | strings | +0x17b6a | String [other]: "hp6H" |
| `evd-str-0150` | string | strings | +0x17e2b | String [other]: "h 7H" |
| `evd-str-0151` | string | strings | +0x17e3a | String [other]: "ht7H" |
| `evd-str-0152` | string | strings | +0x181a9 | String [other]: "u>h0" |
| `evd-str-0153` | string | strings | +0x181c6 | String [other]: "u!hP" |
| `evd-str-0154` | string | strings | +0x18304 | String [other]: "h(-H" |
| `evd-str-0155` | string | strings | +0x18310 | String [other]: "h8-H" |
| `evd-str-0156` | string | strings | +0x1831c | String [other]: "hH-H" |
| `evd-str-0157` | string | strings | +0x18328 | String [other]: "hd-H" |
| `evd-str-0158` | string | strings | +0x18334 | String [other]: "hp-H" |
| `evd-str-0159` | string | strings | +0x18370 | String [other]: "hP6H" |
| `evd-str-0160` | string | strings | +0x18489 | String [other]: "~@(f" |
| `evd-str-0161` | string | strings | +0x185ae | String [other]: "hl "" |
| `evd-str-0162` | string | strings | +0x18a58 | String [other]: "wHQR" |
| `evd-str-0163` | string | strings | +0x18d2f | String [other]: "tBh $H" |
| `evd-str-0164` | string | strings | +0x18d36 | String [other]: "ht#H" |
| `evd-str-0165` | string | strings | +0x18d3b | String [other]: "hx#H" |
| `evd-str-0166` | string | strings | +0x18dc3 | String [other]: "t9hH$H" |
| `evd-str-0167` | string | strings | +0x18e46 | String [other]: "hX$H" |
| `evd-str-0168` | string | strings | +0x18e53 | String [other]: "h`$H" |
| `evd-str-0169` | string | strings | +0x18e69 | String [other]: "t9hp$H" |
| `evd-str-0170` | string | strings | +0x18ef4 | String [other]: "hx$H" |
| `evd-str-0171` | string | strings | +0x18f01 | String [other]: "h\|$H" |
| `evd-str-0172` | string | strings | +0x19519 | String [other]: "t4Qht#H" |
| `evd-str-0173` | string | strings | +0x199e9 | String [other]: "hT3H" |
| `evd-str-0174` | string | strings | +0x19a11 | String [other]: "hx3H" |
| `evd-str-0175` | string | strings | +0x19a9e | String [other]: "hX3H" |
| `evd-str-0176` | string | strings | +0x19adc | String [other]: "h(3H" |
| `evd-str-0177` | string | strings | +0x19dfd | String [other]: "hH@H" |
| `evd-str-0178` | string | strings | +0x19ecc | String [other]: "hX9H" |
| `evd-str-0179` | string | strings | +0x19edc | String [other]: "hh9H" |
| `evd-str-0180` | string | strings | +0x19efa | String [other]: "hx9H" |
| `evd-str-0181` | string | strings | +0x1a025 | String [other]: "h(9H" |
| `evd-str-0182` | string | strings | +0x1a079 | String [other]: "h4:H" |
| `evd-str-0183` | string | strings | +0x1a376 | String [other]: "t&hd:H" |
| `evd-str-0184` | string | strings | +0x1a6eb | String [other]: "u`Pj" |
| `evd-str-0185` | string | strings | +0x1ab6d | String [hostname]: "t.PVW" |
| `evd-str-0186` | string | strings | +0x1abfd | String [other]: "h<;H" |
| `evd-str-0187` | string | strings | +0x1ac1e | String [other]: "h\|;H" |
| `evd-str-0188` | string | strings | +0x1ac4e | String [other]: "h<<H" |
| `evd-str-0189` | string | strings | +0x1ac90 | String [other]: "h$?H" |
| `evd-str-0190` | string | strings | +0x1b1e1 | String [other]: "Wh$%H" |
| `evd-str-0191` | string | strings | +0x1b214 | String [other]: "Ph $H" |
| `evd-str-0192` | string | strings | +0x1b235 | String [other]: "PhH$H" |
| `evd-str-0193` | string | strings | +0x1b256 | String [other]: "PhH%H" |
| `evd-str-0194` | string | strings | +0x1b26a | String [other]: "pLhX$H" |
| `evd-str-0195` | string | strings | +0x1b27f | String [other]: "pPh`$H" |
| `evd-str-0196` | string | strings | +0x1b2a1 | String [other]: "Php$H" |
| `evd-str-0197` | string | strings | +0x1b2b5 | String [other]: "plhx$H" |
| `evd-str-0198` | string | strings | +0x1b2ca | String [other]: "pph\|$H" |
| `evd-str-0199` | string | strings | +0x1b395 | String [other]: "hP%H" |

_…7442 additional evidence items omitted from this table. See canonical JSON for full detail._
