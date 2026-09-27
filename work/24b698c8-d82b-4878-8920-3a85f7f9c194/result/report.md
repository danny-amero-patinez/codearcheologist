# Code Archaeologist — Analysis Report

> ⚠️ Static analysis does NOT establish that this binary is safe. The binary was never executed.

> **Analysis ID:** `24b698c8-d82b-4878-8920-3a85f7f9c194`  
> **Status:** completed  
> **Generated:** 2026-09-27T02:50:23.906Z


---

## 1. Executive Reconstruction Summary

No candidate responsibilities were identified at medium or high confidence from available static evidence.


## 2. Binary Identification

| Field | Value |
|-------|-------|
| Filename | `encriptador.exe` |
| SHA-256 | `eae7516e62e42cf204205f1c224a38054e2c170cfc4e338cd6da5e58bb8e7431` |
| PE Type | PE32+ |
| Architecture | x86-64 |
| Subsystem | WINDOWS_CUI |
| Entry Point | `0x0000105F` |
| File Size | 2,805,078 bytes |
| Signed | No |
| Overall Entropy | 5.840 |

## 3. Analysis Coverage & Tool Status

| Tool | Status |
|------|--------|
| PE Parser | ✓ Ran |
| String Extractor | ✓ Ran |
| Ghidra | ✓ Ran |

**Phases:**
- ✓ intake
- ✓ profiling (127ms)
- ✓ extracting (48ms)
- ✓ ghidra-analysis (143068ms)
- ✓ correlating (71ms)
- ✓ inferring (31ms)
- ✓ reconstructing (18ms)
- ✓ reporting (10ms)

## 4. Reconstructed Capabilities

_No capabilities inferred from available evidence._

## 5. Candidate Responsibilities

_No candidate responsibilities identified at medium or high confidence._

## 6. External Interactions

_No external interactions detected._

## 7. Interesting Functions

### `d_print_comp_inner` at `14000a130`

- **Selection score:** 58.5
- **Selection reasons:** references 35 string(s), connectivity=20, named function
- **String references:** `operator `, `operator`, `typeinfo name for `, `non-transaction clone for `, `decltype (`, `global constructors keyed to `, `template`, ` requires `, `TLS wrapper function for `, `TLS init function for `, `hidden alias for `, `reference temporary #`, `vtable for `, `guard variable for `, `java Class for `, `covariant return thunk to `, `virtual thunk to `, `non-virtual thunk to `, `typeinfo fn for `, `template parameter object for `, `global destructors keyed to `, `initializer for module `, `{unnamed type#`, `transaction clone for `, `[friend]`, ` [clone `, `typename`, `java resource `, `typeinfo for `, `construction vtable for `, `VTT for `, ` class`, `{parm#`, `{default arg#`, `false`
- **Called by:** `140011070`, `14000efb0`
- **Calls:** `14000efb0`, `140005fe0`, `140006040`, `14001e698`, `14001e688`, `14001e4b0`, `14000fdb0`, `1400063d0` …+10
- **Evidence:** `evd-fun-1129`, `evd-dec-1130`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
void d_print_comp_inner(char *param_1,undefined8 param_2,uint *param_3)
{
  byte bVar1;
  uint *puVar2;
  undefined8 uVar3;
  byte *pbVar4;
  longlong *plVar5;
  longlong *plVar6;
// …3037 more lines
```

</details>

### `main` at `1400cb380`

- **Selection score:** 39.5
- **Selection reasons:** references 1 import(s), references 21 string(s), connectivity=23, named function
- **API references:** `SetConsoleOutputCP`
- **String references:** `--key`, `============================================================
`, `           ENCRIPTADOR DE CADENAS  -  AES-256-CBC
`, `============================================================

`, `Texto original : `, `Longitud       : `, ` caracteres

`, `CIPHERTEXT (Base64)`, `Descifrado`, `Verificacion   : ERROR (el texto recuperado difiere del original)
`, `Opciones:
  (sin argumentos)      Cifra la cadena de ejemplo.
  encriptador.exe …`, `Texto cifrado  : `, `TEXTO ORIGINAL`, `Error: la opcion -k requiere un valor.
`, `Verificacion   : OK (el texto recuperado coincide con el original)
`, `
Para descifrarlo de nuevo:
`, `  encriptador.exe -k "`, `" -d "`, `Error: modo descifrado requiere el texto cifrado.
`, `Uso: encriptador.exe -d <cifrado>
`, `Esta cadena es una prueba`
- **Called by:** `14000108e`
- **Calls:** `1400b4b40`, `1400ca940`, `1400c1420`, `14001e698`, `1400881d0`, `140001800`, `1400b8180`, `1400053f0` …+13
- **Evidence:** `evd-fun-1131`, `evd-dec-1132`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
int __cdecl main(int _Argc,char **_Argv,char **_Env)
{
  ulonglong uVar1;
  short sVar2;
  char *_Str;
  bool bVar3;
  bool bVar4;
  undefined8 uVar5;
// …331 more lines
```

</details>

### `__pthread_self_lite` at `140023136`

- **Selection score:** 22
- **Selection reasons:** references 8 import(s), connectivity=27, named function
- **API references:** `CreateEventA`, `TlsGetValue`, `GetCurrentProcess`, `DuplicateHandle`, `TlsSetValue`, `GetThreadPriority`, `GetCurrentThread`, `GetCurrentThreadId`
- **Called by:** `140024145`, `1400225ed`, `1400226e5`, `140023706`, `1400233e3` …+10
- **Calls:** `14001e830`, `1400224f1`, `140021e23`, `140021f47`
- **Evidence:** `evd-fun-1133`, `evd-dec-1134`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
LPVOID __pthread_self_lite(void)
{
  DWORD DVar1;
  BOOL BVar2;
  int iVar3;
  LPVOID lpTlsValue;
  HANDLE pvVar4;
  HANDLE hSourceHandle;
// …40 more lines
```

</details>

### `_M_initialize_timepunct` at `14008c530`

- **Selection score:** 21
- **Selection reasons:** references 11 string(s), connectivity=7, named function
- **String references:** `%m/%d/%y`, `%H:%M:%S`, `%a %b %e %T %Y`, `Sunday`, `Tuesday`, `Thursday`, `Saturday`, `January`, `March`, `September`, `November`
- **Called by:** `14008c8f0`, `14008ca90`, `14008ca30`, `14008cbd0`, `14008caf0` …+1
- **Calls:** `1400ca940`
- **Evidence:** `evd-fun-1135`, `evd-dec-1136`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
/* std::__timepunct<char>::_M_initialize_timepunct(int*) */
void std::__timepunct<char>::_M_initialize_timepunct(longlong param_1)
{
  undefined *puVar1;
  undefined8 uVar2;
  undefined *puVar3;
  undefined8 *puVar4;
  uVar2 = DAT_1400d8ff8;
// …84 more lines
```

</details>

### `pthread_cancel` at `1400237f1`

- **Selection score:** 20
- **Selection reasons:** references 7 import(s), connectivity=14, named function
- **API references:** `ResumeThread`, `SuspendThread`, `WaitForSingleObject`, `GetLastError`, `SetThreadContext`, `SetEvent`, `GetThreadContext`
- **Called by:** `140023cbd`
- **Calls:** `140021913`, `140022f28`, `1400232ef`, `1400235a3`, `140020974`, `140020a80`
- **Evidence:** `evd-fun-1137`, `evd-dec-1138`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
undefined8 pthread_cancel(ulonglong param_1)
{
  bool bVar1;
  int iVar2;
  DWORD DVar3;
  undefined8 uVar4;
  longlong lVar5;
  undefined7 extraout_var;
// …112 more lines
```

</details>

### `pthread_create` at `1400244d8`

- **Selection score:** 20
- **Selection reasons:** references 7 import(s), connectivity=14, named function
- **API references:** `CreateEventA`, `CloseHandle`, `ResumeThread`, `_beginthreadex`, `SetThreadPriority`, `Sleep`, `ResetEvent`
- **Calls:** `140021e23`, `140020cc8`, `140021cfc`, `14001e680`, `140023f19`, `140023136`, `140021f47`
- **Evidence:** `evd-fun-1139`, `evd-dec-1140`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
undefined8 pthread_create(undefined8 *param_1,uint *param_2,undefined8 param_3,undefined8 param_4)
{
  DWORD dwMilliseconds;
  undefined8 uVar1;
  HANDLE pvVar2;
  LPVOID pvVar3;
  uint local_34;
  undefined4 *local_30;
// …119 more lines
```

</details>

### `_M_convert_to_wmask` at `140032870`

- **Selection score:** 19.5
- **Selection reasons:** references 12 string(s), connectivity=1, named function
- **String references:** `cntrl`, `graph`, `print`, `space`, `xdigit`, `alnum`, `digit`, `alpha`, `lower`, `upper`, `punct`, `blank`
- **Called by:** `1400b09e0`
- **Evidence:** `evd-fun-1141`, `evd-dec-1142`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
/* std::ctype<wchar_t>::_M_convert_to_wmask(unsigned short) const */
wctype_t __thiscall std::ctype<wchar_t>::_M_convert_to_wmask(undefined8 param_1_00,ushort param_2)
{
  wctype_t wVar1;
  if (param_2 < 0x41) {
    if (param_2 == 0) {
      return 0;
    }
// …71 more lines
```

</details>

### `_M_initialize_timepunct` at `14008cd10`

- **Selection score:** 19.5
- **Selection reasons:** references 10 string(s), connectivity=7, named function
- **String references:** `%H:%M:%S`, `%a %b %e %T %Y`, `Sunday`, `Tuesday`, `Thursday`, `Saturday`, `January`, `March`, `September`, `November`
- **Called by:** `14008d210`, `14008d2d0`, `14008d130`, `14008d0d0`, `14008d270` …+1
- **Calls:** `1400ca940`
- **Evidence:** `evd-fun-1143`, `evd-dec-1144`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
/* std::__timepunct<wchar_t>::_M_initialize_timepunct(int*) */
void std::__timepunct<wchar_t>::_M_initialize_timepunct(longlong param_1)
{
  undefined *puVar1;
  undefined *puVar2;
  undefined *puVar3;
  undefined8 *puVar4;
  puVar2 = PTR_DAT_1400d9098;
// …84 more lines
```

</details>

### `pthread_create_wrapper` at `14002429d`

- **Selection score:** 18
- **Selection reasons:** references 6 import(s), connectivity=13, named function
- **API references:** `CloseHandle`, `TlsSetValue`, `GetCurrentThreadId`, `Sleep`, `_endthreadex`, `__intrinsic_setjmp`
- **Calls:** `140020cc8`, `140021cfc`, `140013090`, `1400224f1`, `140022f72`, `140020974`, `140020a80`
- **Evidence:** `evd-fun-1145`, `evd-dec-1146`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
undefined8
pthread_create_wrapper(undefined4 *param_1,undefined8 param_2,undefined8 param_3,undefined8 param_4)
{
  DWORD DVar1;
  int iVar2;
  undefined8 uVar3;
  HANDLE pvVar4;
  LPVOID pvVar5;
// …214 more lines
```

</details>

### `__gcc_register_frame` at `140001670`

- **Selection score:** 17
- **Selection reasons:** references 3 import(s), references 3 string(s), connectivity=5, near entry point, named function
- **API references:** `GetModuleHandleA`, `LoadLibraryA`, `GetProcAddress`
- **String references:** `libgcc_s_dw2-1.dll`, `__register_frame_info`, `__deregister_frame_info`
- **Calls:** `14000162f`, `140001650`
- **Evidence:** `evd-fun-1147`, `evd-dec-1148`

<details>
<summary>Decompiled pseudocode preview (not original source)</summary>

```c
void __gcc_register_frame(void)
{
  HMODULE hModule;
  code *pcVar1;
  hModule = GetModuleHandleA("libgcc_s_dw2-1.dll");
  if (hModule == (HMODULE)0x0) {
    pcVar1 = _text;
    DAT_1400d0000 = _weak___deregister_frame_info_hmod_libgcc;
// …12 more lines
```

</details>

_…and 10 more functions in the canonical result._

## 8. Dependencies / Runtime Hints (DLL Imports)

- `KERNEL32.dll`
- `api-ms-win-crt-convert-l1-1-0.dll`
- `api-ms-win-crt-environment-l1-1-0.dll`
- `api-ms-win-crt-filesystem-l1-1-0.dll`
- `api-ms-win-crt-heap-l1-1-0.dll`
- `api-ms-win-crt-locale-l1-1-0.dll`
- `api-ms-win-crt-math-l1-1-0.dll`
- `api-ms-win-crt-private-l1-1-0.dll`
- `api-ms-win-crt-runtime-l1-1-0.dll`
- `api-ms-win-crt-stdio-l1-1-0.dll`
- `api-ms-win-crt-string-l1-1-0.dll`
- `api-ms-win-crt-time-l1-1-0.dll`
- `api-ms-win-crt-utility-l1-1-0.dll`

## 9. Unknowns (Actionable Questions)

_No unresolved questions identified._

## 10. Modernization Blueprint

_No modernization recommendations generated._

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

**Total evidence items: 5406**

| Kind | Count |
|------|------:|
| binary-metadata | 1 |
| decompilation | 20 |
| function | 4257 |
| import | 13 |
| pe-section | 20 |
| string | 1095 |

### Evidence Detail

| ID | Kind | Tool | Location | Summary |
|---|---|---|---|---|
| `evd-bin-0000` | binary-metadata | pe-parser |  | PE binary: encriptador.exe (PE32+, x86-64) |
| `evd-pe--0001` | pe-section | pe-parser | 0x00001000 | Section .text: VA=0x00001000 size=844992 |
| `evd-pe--0002` | pe-section | pe-parser | 0x000D0000 | Section .data: VA=0x000D0000 size=12832 |
| `evd-pe--0003` | pe-section | pe-parser | 0x000D4000 | Section .rdata: VA=0x000D4000 size=73288 |
| `evd-pe--0004` | pe-section | pe-parser | 0x000E6000 | Section /4: VA=0x000E6000 size=4 |
| `evd-pe--0005` | pe-section | pe-parser | 0x000E7000 | Section .pdata: VA=0x000E7000 size=49320 |
| `evd-pe--0006` | pe-section | pe-parser | 0x000F4000 | Section .xdata: VA=0x000F4000 size=69048 |
| `evd-pe--0007` | pe-section | pe-parser | 0x00105000 | Section .bss: VA=0x00105000 size=3440 |
| `evd-pe--0008` | pe-section | pe-parser | 0x00106000 | Section .idata: VA=0x00106000 size=6016 |
| `evd-pe--0009` | pe-section | pe-parser | 0x00108000 | Section .tls: VA=0x00108000 size=16 |
| `evd-pe--0010` | pe-section | pe-parser | 0x00109000 | Section .rsrc: VA=0x00109000 size=688 |
| `evd-pe--0011` | pe-section | pe-parser | 0x0010A000 | Section .reloc: VA=0x0010A000 size=5800 |
| `evd-pe--0012` | pe-section | pe-parser | 0x0010C000 | Section /14: VA=0x0010C000 size=208 |
| `evd-pe--0013` | pe-section | pe-parser | 0x0010D000 | Section /29: VA=0x0010D000 size=19522 |
| `evd-pe--0014` | pe-section | pe-parser | 0x00112000 | Section /41: VA=0x00112000 size=2349 |
| `evd-pe--0015` | pe-section | pe-parser | 0x00113000 | Section /55: VA=0x00113000 size=2519 |
| `evd-pe--0016` | pe-section | pe-parser | 0x00114000 | Section /67: VA=0x00114000 size=1072 |
| `evd-pe--0017` | pe-section | pe-parser | 0x00115000 | Section /80: VA=0x00115000 size=219 |
| `evd-pe--0018` | pe-section | pe-parser | 0x00116000 | Section /91: VA=0x00116000 size=1228 |
| `evd-pe--0019` | pe-section | pe-parser | 0x00117000 | Section /107: VA=0x00117000 size=2452 |
| `evd-pe--0020` | pe-section | pe-parser | 0x00118000 | Section /123: VA=0x00118000 size=249 |
| `evd-imp-0021` | import | pe-parser |  | Import DLL: KERNEL32.dll (53 function(s)) |
| `evd-imp-0022` | import | pe-parser |  | Import DLL: api-ms-win-crt-convert-l1-1-0.dll (4 function(s)) |
| `evd-imp-0023` | import | pe-parser |  | Import DLL: api-ms-win-crt-environment-l1-1-0.dll (2 function(s)) |
| `evd-imp-0024` | import | pe-parser |  | Import DLL: api-ms-win-crt-filesystem-l1-1-0.dll (1 function(s)) |
| `evd-imp-0025` | import | pe-parser |  | Import DLL: api-ms-win-crt-heap-l1-1-0.dll (5 function(s)) |
| `evd-imp-0026` | import | pe-parser |  | Import DLL: api-ms-win-crt-locale-l1-1-0.dll (4 function(s)) |
| `evd-imp-0027` | import | pe-parser |  | Import DLL: api-ms-win-crt-math-l1-1-0.dll (2 function(s)) |
| `evd-imp-0028` | import | pe-parser |  | Import DLL: api-ms-win-crt-private-l1-1-0.dll (8 function(s)) |
| `evd-imp-0029` | import | pe-parser |  | Import DLL: api-ms-win-crt-runtime-l1-1-0.dll (19 function(s)) |
| `evd-imp-0030` | import | pe-parser |  | Import DLL: api-ms-win-crt-stdio-l1-1-0.dll (28 function(s)) |
| `evd-imp-0031` | import | pe-parser |  | Import DLL: api-ms-win-crt-string-l1-1-0.dll (16 function(s)) |
| `evd-imp-0032` | import | pe-parser |  | Import DLL: api-ms-win-crt-time-l1-1-0.dll (2 function(s)) |
| `evd-imp-0033` | import | pe-parser |  | Import DLL: api-ms-win-crt-utility-l1-1-0.dll (1 function(s)) |
| `evd-str-0034` | string | strings | +0x4d | String [error-message]: "!This program cannot be run in DOS mode." |
| `evd-str-0035` | string | strings | +0x188 | String [other]: ".text" |
| `evd-str-0036` | string | strings | +0x1af | String [other]: "`.data" |
| `evd-str-0037` | string | strings | +0x1d8 | String [other]: ".rdata" |
| `evd-str-0038` | string | strings | +0x228 | String [other]: ".pdata" |
| `evd-str-0039` | string | strings | +0x24f | String [other]: "@.xdata" |
| `evd-str-0040` | string | strings | +0x277 | String [other]: "@.bss" |
| `evd-str-0041` | string | strings | +0x2a0 | String [other]: ".idata" |
| `evd-str-0042` | string | strings | +0x2c7 | String [other]: "@.tls" |
| `evd-str-0043` | string | strings | +0x2f0 | String [other]: ".rsrc" |
| `evd-str-0044` | string | strings | +0x317 | String [other]: "@.reloc" |
| `evd-str-0045` | string | strings | +0x33f | String [other]: "B/14" |
| `evd-str-0046` | string | strings | +0x367 | String [other]: "B/29" |
| `evd-str-0047` | string | strings | +0x38f | String [other]: "B/41" |
| `evd-str-0048` | string | strings | +0x3b7 | String [other]: "B/55" |
| `evd-str-0049` | string | strings | +0x3df | String [other]: "B/67" |
| `evd-str-0050` | string | strings | +0x407 | String [other]: "B/80" |
| `evd-str-0051` | string | strings | +0x42f | String [other]: "B/91" |
| `evd-str-0052` | string | strings | +0x457 | String [other]: "B/107" |
| `evd-str-0053` | string | strings | +0x47f | String [other]: "B/123" |
| `evd-str-0054` | string | strings | +0x8bf | String [other]: "L$ E" |
| `evd-str-0055` | string | strings | +0xa2d | String [other]: "f=MZt" |
| `evd-str-0056` | string | strings | +0xa42 | String [other]: "@<Hc" |
| `evd-str-0057` | string | strings | +0xc78 | String [other]: "l$0H" |
| `evd-str-0058` | string | strings | +0xd60 | String [other]: "WVSH" |
| `evd-str-0059` | string | strings | +0xd87 | String [other]: "D$8I" |
| `evd-str-0060` | string | strings | +0xda1 | String [other]: "D$8H" |
| `evd-str-0061` | string | strings | +0xdb2 | String [other]: "@[^_" |
| `evd-str-0062` | string | strings | +0xdc0 | String [other]: "T$8E1" |
| `evd-str-0063` | string | strings | +0xdd5 | String [other]: "L$(H" |
| `evd-str-0064` | string | strings | +0xe72 | String [other]: " [^_" |
| `evd-str-0065` | string | strings | +0xeef | String [other]: "L$PH" |
| `evd-str-0066` | string | strings | +0xf02 | String [other]: "T$XL" |
| `evd-str-0067` | string | strings | +0xf07 | String [other]: "T$(K" |
| `evd-str-0068` | string | strings | +0xf10 | String [other]: "D$ H9" |
| `evd-str-0069` | string | strings | +0xf2c | String [other]: "D$ I" |
| `evd-str-0070` | string | strings | +0xf34 | String [other]: "T$(L" |
| `evd-str-0071` | string | strings | +0xf55 | String [other]: "L$PL" |
| `evd-str-0072` | string | strings | +0xf77 | String [other]: "\$(H)" |
| `evd-str-0073` | string | strings | +0xf8e | String [other]: "\$(L" |
| `evd-str-0074` | string | strings | +0xfc0 | String [other]: "UWVSH" |
| `evd-str-0075` | string | strings | +0xff1 | String [other]: "T$hL" |
| `evd-str-0076` | string | strings | +0x1000 | String [other]: "T$hI" |
| `evd-str-0077` | string | strings | +0x1018 | String [other]: "T$(H" |
| `evd-str-0078` | string | strings | +0x1034 | String [other]: "8[^_]" |
| `evd-str-0079` | string | strings | +0x10f0 | String [other]: "AWAVAUATUWVSH" |
| `evd-str-0080` | string | strings | +0x11ad | String [other]: "8[^_]A\A]A^A_" |
| `evd-str-0081` | string | strings | +0x11e7 | String [other]: "T$ H" |
| `evd-str-0082` | string | strings | +0x1269 | String [other]: "L$ H" |
| `evd-str-0083` | string | strings | +0x128a | String [other]: "L$ L" |
| `evd-str-0084` | string | strings | +0x1295 | String [other]: "L$ L)" |
| `evd-str-0085` | string | strings | +0x135b | String [other]: "D$ H" |
| `evd-str-0086` | string | strings | +0x1375 | String [other]: "t$ M" |
| `evd-str-0087` | string | strings | +0x16d6 | String [other]: "or0f" |
| `evd-str-0088` | string | strings | +0x1714 | String [other]: "t$ f" |
| `evd-str-0089` | string | strings | +0x171d | String [other]: "D$`f" |
| `evd-str-0090` | string | strings | +0x182b | String [other]: ")D$PfA" |
| `evd-str-0091` | string | strings | +0x189f | String [other]: ")T$ " |
| `evd-str-0092` | string | strings | +0x18a4 | String [other]: ")d$0" |
| `evd-str-0093` | string | strings | +0x18a9 | String [other]: ")L$@" |
| `evd-str-0094` | string | strings | +0x1aee | String [other]: "[^_]A\A]A^A_" |
| `evd-str-0095` | string | strings | +0x1b00 | String [other]: "AUATUWVSH" |
| `evd-str-0096` | string | strings | +0x1b24 | String [other]: "I`f." |
| `evd-str-0097` | string | strings | +0x1b79 | String [other]: "L$`I" |
| `evd-str-0098` | string | strings | +0x1b89 | String [other]: "L$`H" |
| `evd-str-0099` | string | strings | +0x1b9a | String [other]: "T$ L" |
| `evd-str-0100` | string | strings | +0x1bb6 | String [other]: "([^_]A\A]" |
| `evd-str-0101` | string | strings | +0x1c38 | String [other]: "{`8t" |
| `evd-str-0102` | string | strings | +0x1c48 | String [other]: "T$'H" |
| `evd-str-0103` | string | strings | +0x1c55 | String [other]: "{`8u" |
| `evd-str-0104` | string | strings | +0x1d3d | String [other]: "0[^_" |
| `evd-str-0105` | string | strings | +0x1d6e | String [other]: ")D$ f" |
| `evd-str-0106` | string | strings | +0x1d83 | String [other]: ")D$0f" |
| `evd-str-0107` | string | strings | +0x1f87 | String [other]: "t'B3T" |
| `evd-str-0108` | string | strings | +0x2026 | String [other]: ")D$@H" |
| `evd-str-0109` | string | strings | +0x2042 | String [other]: "T$@L" |
| `evd-str-0110` | string | strings | +0x2065 | String [other]: "t$PH" |
| `evd-str-0111` | string | strings | +0x2080 | String [other]: "D$AI" |
| `evd-str-0112` | string | strings | +0x2088 | String [other]: "T$0L" |
| `evd-str-0113` | string | strings | +0x208d | String [other]: "\$8H" |
| `evd-str-0114` | string | strings | +0x209b | String [other]: "T$IH" |
| `evd-str-0115` | string | strings | +0x20fc | String [other]: "T$GD" |
| `evd-str-0116` | string | strings | +0x2122 | String [other]: "l$/E" |
| `evd-str-0117` | string | strings | +0x22ef | String [other]: "D$P@" |
| `evd-str-0118` | string | strings | +0x2306 | String [other]: "L$@L" |
| `evd-str-0119` | string | strings | +0x2353 | String [other]: "D$PL9" |
| `evd-str-0120` | string | strings | +0x2362 | String [other]: "D$AH" |
| `evd-str-0121` | string | strings | +0x23c9 | String [other]: "T$GH" |
| `evd-str-0122` | string | strings | +0x23d6 | String [other]: "oD$@" |
| `evd-str-0123` | string | strings | +0x23e0 | String [other]: "X[^_]A\A]A^A_" |
| `evd-str-0124` | string | strings | +0x2417 | String [other]: "L$0L" |
| `evd-str-0125` | string | strings | +0x241e | String [other]: ")D$0I" |
| `evd-str-0126` | string | strings | +0x24a5 | String [other]: "D$?H" |
| `evd-str-0127` | string | strings | +0x24c5 | String [other]: "t$@H" |
| `evd-str-0128` | string | strings | +0x256e | String [other]: "D$'A" |
| `evd-str-0129` | string | strings | +0x266c | String [other]: "D2l$'A" |
| `evd-str-0130` | string | strings | +0x26ef | String [other]: "l$'E" |
| `evd-str-0131` | string | strings | +0x2aef | String [other]: "l$'A" |
| `evd-str-0132` | string | strings | +0x2c42 | String [other]: "\$0H" |
| `evd-str-0133` | string | strings | +0x2cbb | String [other]: "T$;f" |
| `evd-str-0134` | string | strings | +0x2cd1 | String [other]: "D$@H9" |
| `evd-str-0135` | string | strings | +0x2ce8 | String [other]: "oD$0" |
| `evd-str-0136` | string | strings | +0x2cf2 | String [other]: "H[^_]A\A]A^A_" |
| `evd-str-0137` | string | strings | +0x2d78 | String [other]: "d$0E1" |
| `evd-str-0138` | string | strings | +0x2d95 | String [other]: "D$ L" |
| `evd-str-0139` | string | strings | +0x2dd6 | String [other]: ")D$ L9" |
| `evd-str-0140` | string | strings | +0x2de5 | String [other]: "H[^_]A\A]" |
| `evd-str-0141` | string | strings | +0x2e81 | String [other]: ")D$ ff." |
| `evd-str-0142` | string | strings | +0x2e95 | String [other]: "D$@H" |
| `evd-str-0143` | string | strings | +0x2e9a | String [other]: "T$0H" |
| `evd-str-0144` | string | strings | +0x2eab | String [other]: ")L$0" |
| `evd-str-0145` | string | strings | +0x2edd | String [other]: ")L$ I" |
| `evd-str-0146` | string | strings | +0x30c4 | String [other]: "D$@D" |
| `evd-str-0147` | string | strings | +0x30d7 | String [other]: "T$8H" |
| `evd-str-0148` | string | strings | +0x3147 | String [other]: "\$@L" |
| `evd-str-0149` | string | strings | +0x3162 | String [other]: "\$@A" |
| `evd-str-0150` | string | strings | +0x319f | String [other]: "\$OL" |
| `evd-str-0151` | string | strings | +0x31a4 | String [other]: "T$@H" |
| `evd-str-0152` | string | strings | +0x31b6 | String [other]: "D$8D" |
| `evd-str-0153` | string | strings | +0x31c1 | String [other]: "T$@D" |
| `evd-str-0154` | string | strings | +0x3280 | String [other]: "<?I9" |
| `evd-str-0155` | string | strings | +0x32de | String [other]: "L;#t" |
| `evd-str-0156` | string | strings | +0x364c | String [other]: "$I9D$" |
| `evd-str-0157` | string | strings | +0x37cd | String [other]: "T$?D" |
| `evd-str-0158` | string | strings | +0x3840 | String [other]: "AVAUATUWVSH" |
| `evd-str-0159` | string | strings | +0x3881 | String [other]: "tME1" |
| `evd-str-0160` | string | strings | +0x38b5 | String [other]: "<=uoH" |
| `evd-str-0161` | string | strings | +0x38d6 | String [other]: "0[^_]A\A]A^" |
| `evd-str-0162` | string | strings | +0x3931 | String [other]: "<9~+<Z" |
| `evd-str-0163` | string | strings | +0x3998 | String [other]: "T$/D" |
| `evd-str-0164` | string | strings | +0x3a31 | String [other]: "D$0H" |
| `evd-str-0165` | string | strings | +0x3a43 | String [other]: "t$8H" |
| `evd-str-0166` | string | strings | +0x3a49 | String [other]: "@~JH" |
| `evd-str-0167` | string | strings | +0x3a7b | String [other]: ")D$0" |
| `evd-str-0168` | string | strings | +0x3a80 | String [other]: ")D$ " |
| `evd-str-0169` | string | strings | +0x3a8b | String [other]: "l$(H" |
| `evd-str-0170` | string | strings | +0x3a90 | String [other]: "D$ I)" |
| `evd-str-0171` | string | strings | +0x3b54 | String [other]: "oC H" |
| `evd-str-0172` | string | strings | +0x3b70 | String [other]: "L$pH" |
| `evd-str-0173` | string | strings | +0x3b8d | String [other]: "l$pH" |
| `evd-str-0174` | string | strings | +0x3b9e | String [other]: "L$xH" |
| `evd-str-0175` | string | strings | +0x3bc2 | String [other]: "oF H" |
| `evd-str-0176` | string | strings | +0x3c30 | String [other]: "T$`H)" |
| `evd-str-0177` | string | strings | +0x3c6f | String [other]: "[^_]A\A]A^" |
| `evd-str-0178` | string | strings | +0x3d2a | String [other]: "D$XH" |
| `evd-str-0179` | string | strings | +0x3d38 | String [other]: "\|$XH" |
| `evd-str-0180` | string | strings | +0x3d55 | String [other]: "D$HH" |
| `evd-str-0181` | string | strings | +0x3d5a | String [other]: "D$`H" |
| `evd-str-0182` | string | strings | +0x3d5f | String [other]: "\|$PH" |
| `evd-str-0183` | string | strings | +0x3d6e | String [other]: "D$Pf" |
| `evd-str-0184` | string | strings | +0x3d7f | String [other]: "D$hH" |
| `evd-str-0185` | string | strings | +0x3de4 | String [other]: "D$(H)" |
| `evd-str-0186` | string | strings | +0x3e0e | String [other]: "\|$$H" |
| `evd-str-0187` | string | strings | +0x3e6c | String [other]: "D$$H" |
| `evd-str-0188` | string | strings | +0x3ebe | String [other]: "T$`H" |
| `evd-str-0189` | string | strings | +0x3ecb | String [other]: "D$(H" |
| `evd-str-0190` | string | strings | +0x3f3b | String [other]: "\|$0A" |
| `evd-str-0191` | string | strings | +0x3feb | String [other]: "L$0I" |
| `evd-str-0192` | string | strings | +0x406e | String [other]: "T$8H)" |
| `evd-str-0193` | string | strings | +0x40aa | String [other]: "T$XH" |
| `evd-str-0194` | string | strings | +0x417f | String [other]: "D$ @" |
| `evd-str-0195` | string | strings | +0x4195 | String [other]: "t$0f" |
| `evd-str-0196` | string | strings | +0x41e3 | String [other]: "P[^_" |
| `evd-str-0197` | string | strings | +0x4208 | String [other]: "L$pL" |
| `evd-str-0198` | string | strings | +0x4215 | String [other]: "t$xH" |
| `evd-str-0199` | string | strings | +0x421a | String [other]: "l$pL" |

_…5206 additional evidence items omitted from this table. See canonical JSON for full detail._
