"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePe = parsePe;
exports.computeSha256 = computeSha256;
/**
 * PE Parser — reads Windows PE structures from a Buffer.
 *
 * SAFETY: This module reads bytes only. The binary is NEVER executed or spawned.
 *
 * Supports PE32 (32-bit) and PE32+ (64-bit) executables.
 * Extracts: header, sections, imports, exports, version resources.
 */
const crypto = __importStar(require("crypto"));
// ── PE constants ─────────────────────────────────────────────────────────────
const MZ_MAGIC = 0x5a4d; // 'MZ'
const PE_SIGNATURE = 0x00004550; // 'PE\0\0'
const OPTIONAL_HDR_PE32 = 0x010b;
const OPTIONAL_HDR_PE32_PLUS = 0x020b;
const MACHINE_I386 = 0x014c;
const MACHINE_AMD64 = 0x8664;
const MACHINE_ARM = 0x01c0;
const MACHINE_ARM64 = 0xaa64;
const SUBSYSTEM_NATIVE = 1;
const SUBSYSTEM_WINDOWS_GUI = 2;
const SUBSYSTEM_WINDOWS_CUI = 3;
const SUBSYSTEM_WINDOWS_CE_GUI = 9;
const SUBSYSTEM_EFI_APPLICATION = 10;
const SECTION_CHAR_CODE = 0x00000020;
const SECTION_CHAR_EXEC = 0x20000000;
const SECTION_CHAR_READ = 0x40000000;
const SECTION_CHAR_WRITE = 0x80000000;
// ── Section characteristic labels ────────────────────────────────────────────
function sectionCharacteristics(flags) {
    const chars = [];
    if (flags & SECTION_CHAR_CODE)
        chars.push('IMAGE_SCN_CNT_CODE');
    if (flags & 0x00000040)
        chars.push('IMAGE_SCN_CNT_INITIALIZED_DATA');
    if (flags & 0x00000080)
        chars.push('IMAGE_SCN_CNT_UNINITIALIZED_DATA');
    if (flags & SECTION_CHAR_EXEC)
        chars.push('IMAGE_SCN_MEM_EXECUTE');
    if (flags & SECTION_CHAR_READ)
        chars.push('IMAGE_SCN_MEM_READ');
    if (flags & SECTION_CHAR_WRITE)
        chars.push('IMAGE_SCN_MEM_WRITE');
    return chars;
}
// ── Entropy ───────────────────────────────────────────────────────────────────
function shannonEntropy(buf) {
    if (buf.length === 0)
        return 0;
    const freq = new Array(256).fill(0);
    for (let i = 0; i < buf.length; i++) {
        const b = buf[i] ?? 0;
        freq[b]++;
    }
    let h = 0;
    for (const f of freq) {
        if (f === 0)
            continue;
        const p = f / buf.length;
        h -= p * Math.log2(p);
    }
    return Math.round(h * 100) / 100;
}
// ── RVA → file offset ─────────────────────────────────────────────────────────
function rvaToOffset(rva, sections) {
    for (const s of sections) {
        if (rva >= s.virtualAddress && rva < s.virtualAddress + s.virtualSize) {
            return rva - s.virtualAddress + s.rawOffset;
        }
    }
    return -1;
}
// ── Import parsing ─────────────────────────────────────────────────────────────
function parseImports(buf, importDirRva, importDirSize, sections, is64) {
    if (importDirRva === 0 || importDirSize === 0)
        return [];
    const imports = [];
    let offset = rvaToOffset(importDirRva, sections);
    if (offset < 0)
        return [];
    // Each import descriptor = 20 bytes
    while (offset + 20 <= buf.length) {
        const originalFirstThunk = buf.readUInt32LE(offset);
        const nameRva = buf.readUInt32LE(offset + 12);
        const firstThunk = buf.readUInt32LE(offset + 16);
        // Zero terminator
        if (originalFirstThunk === 0 && nameRva === 0 && firstThunk === 0)
            break;
        const nameOffset = rvaToOffset(nameRva, sections);
        if (nameOffset < 0) {
            offset += 20;
            continue;
        }
        const dllName = readCString(buf, nameOffset);
        if (!dllName) {
            offset += 20;
            continue;
        }
        const functions = [];
        const thunkRva = originalFirstThunk !== 0 ? originalFirstThunk : firstThunk;
        let thunkOffset = rvaToOffset(thunkRva, sections);
        if (thunkOffset >= 0) {
            while (thunkOffset + (is64 ? 8 : 4) <= buf.length) {
                const thunkVal = is64
                    ? buf.readBigUInt64LE(thunkOffset)
                    : BigInt(buf.readUInt32LE(thunkOffset));
                if (thunkVal === 0n)
                    break;
                const isOrdinal = is64
                    ? (thunkVal & 0x8000000000000000n) !== 0n
                    : (thunkVal & 0x80000000n) !== 0n;
                if (isOrdinal) {
                    const ord = Number(thunkVal & 0xffffn);
                    functions.push(`#${ord}`);
                }
                else {
                    const hintRva = Number(thunkVal & (is64 ? 0x7fffffffffffffffn : 0x7fffffffn));
                    const hintOffset = rvaToOffset(hintRva, sections);
                    if (hintOffset >= 0 && hintOffset + 2 <= buf.length) {
                        // Skip 2-byte hint, then read name
                        const fnName = readCString(buf, hintOffset + 2);
                        if (fnName)
                            functions.push(fnName);
                    }
                }
                thunkOffset += is64 ? 8 : 4;
            }
        }
        imports.push({ dll: dllName, functions });
        offset += 20;
    }
    return imports;
}
// ── Export parsing ────────────────────────────────────────────────────────────
function parseExports(buf, exportDirRva, sections) {
    if (exportDirRva === 0)
        return [];
    const offset = rvaToOffset(exportDirRva, sections);
    if (offset < 0 || offset + 40 > buf.length)
        return [];
    const numFunctions = buf.readUInt32LE(offset + 20);
    const numNames = buf.readUInt32LE(offset + 24);
    const addressTableRva = buf.readUInt32LE(offset + 28);
    const namePointerRva = buf.readUInt32LE(offset + 32);
    const ordinalTableRva = buf.readUInt32LE(offset + 36);
    const base = buf.readUInt32LE(offset + 16);
    const exports = [];
    const addressOffset = rvaToOffset(addressTableRva, sections);
    const nameOffset = rvaToOffset(namePointerRva, sections);
    const ordinalOffset = rvaToOffset(ordinalTableRva, sections);
    if (addressOffset < 0)
        return [];
    // Build name map: ordinal → name
    const nameMap = new Map();
    if (nameOffset >= 0 && ordinalOffset >= 0) {
        for (let i = 0; i < numNames; i++) {
            const nameRva = buf.readUInt32LE(nameOffset + i * 4);
            const ordinal = buf.readUInt16LE(ordinalOffset + i * 2);
            const no = rvaToOffset(nameRva, sections);
            if (no >= 0)
                nameMap.set(ordinal, readCString(buf, no) ?? '');
        }
    }
    for (let i = 0; i < numFunctions && i < 1000; i++) {
        const fnRva = buf.readUInt32LE(addressOffset + i * 4);
        if (fnRva === 0)
            continue;
        const ordinal = base + i;
        const exportName = nameMap.get(i);
        const entry = {
            ordinal,
            address: `0x${fnRva.toString(16).toUpperCase().padStart(8, '0')}`,
        };
        if (exportName !== undefined)
            entry.name = exportName;
        exports.push(entry);
    }
    return exports;
}
// ── String helpers ────────────────────────────────────────────────────────────
function readCString(buf, offset, maxLen = 256) {
    if (offset < 0 || offset >= buf.length)
        return null;
    const end = Math.min(offset + maxLen, buf.length);
    let i = offset;
    while (i < end && buf[i] !== 0)
        i++;
    if (i === offset)
        return null;
    return buf.slice(offset, i).toString('ascii');
}
// ── Version resource parsing (best-effort) ────────────────────────────────────
function parseVersionInfo(buf, sections) {
    // Find .rsrc section
    const rsrc = sections.find(s => s.name === '.rsrc');
    if (!rsrc || rsrc.rawOffset === 0)
        return undefined;
    // Walk resource directory looking for RT_VERSION (type 16)
    try {
        return walkResourceDir(buf, rsrc.rawOffset, rsrc.rawOffset, 0, 16);
    }
    catch {
        return undefined;
    }
}
function walkResourceDir(buf, base, offset, depth, targetType) {
    if (offset + 16 > buf.length)
        return undefined;
    // Resource directory header: 4+4+2+2+2+2 = 16 bytes
    const namedEntries = buf.readUInt16LE(offset + 12);
    const idEntries = buf.readUInt16LE(offset + 14);
    const total = namedEntries + idEntries;
    for (let i = 0; i < total && i < 64; i++) {
        const eOffset = offset + 16 + i * 8;
        if (eOffset + 8 > buf.length)
            break;
        const id = buf.readUInt32LE(eOffset);
        const dataOffset = buf.readUInt32LE(eOffset + 4);
        if (depth === 0 && (id & 0x7fffffff) !== targetType)
            continue;
        if (dataOffset & 0x80000000) {
            // Subdirectory
            const subDir = base + (dataOffset & 0x7fffffff);
            const result = walkResourceDir(buf, base, subDir, depth + 1, targetType);
            if (result)
                return result;
        }
        else if (depth >= 2) {
            // Data entry
            const dataEntry = base + dataOffset;
            if (dataEntry + 16 > buf.length)
                continue;
            const rva = buf.readUInt32LE(dataEntry);
            const size = buf.readUInt32LE(dataEntry + 4);
            // RVA here is relative to section virtual address; adjust
            const rsrcSection = buf.slice(base - 0); // already at raw offset
            void rsrcSection; // unused, offset already handled
            if (rva > 0 && size > 0) {
                return extractVersionStrings(buf, base, rva, size);
            }
        }
    }
    return undefined;
}
function extractVersionStrings(buf, rsrcBase, _rva, _size) {
    // Best-effort: scan the section for VS_VERSION_INFO pattern and extract UTF-16LE strings
    const vi = {};
    const fields = [
        ['FileVersion', 'fileVersion'],
        ['ProductVersion', 'productVersion'],
        ['CompanyName', 'companyName'],
        ['ProductName', 'productName'],
        ['FileDescription', 'description'],
        ['OriginalFilename', 'originalFilename'],
        ['LegalCopyright', 'legalCopyright'],
        ['InternalName', 'internalName'],
    ];
    const sectionBuf = buf.slice(rsrcBase);
    for (const [field, key] of fields) {
        const fieldUtf16 = Buffer.from(field, 'utf16le');
        let pos = 0;
        while (pos < sectionBuf.length - fieldUtf16.length) {
            if (sectionBuf.slice(pos, pos + fieldUtf16.length).equals(fieldUtf16)) {
                // Skip field name + null terminator (2 bytes) then read value
                let valStart = pos + fieldUtf16.length + 2;
                // Align to 4 bytes
                valStart = (valStart + 3) & ~3;
                const value = readUtf16String(sectionBuf, valStart, 128);
                if (value)
                    vi[key] = value;
                break;
            }
            pos++;
        }
    }
    return Object.keys(vi).length > 0 ? vi : undefined;
}
function readUtf16String(buf, offset, maxChars) {
    if (offset + 2 > buf.length)
        return null;
    let i = offset;
    const chars = [];
    while (i + 1 < buf.length && chars.length < maxChars) {
        const cp = buf.readUInt16LE(i);
        if (cp === 0)
            break;
        chars.push(String.fromCharCode(cp));
        i += 2;
    }
    const s = chars.join('').trim();
    return s.length > 0 ? s : null;
}
// ── Signature detection (best-effort) ────────────────────────────────────────
function hasAuthenticode(buf, certDirRva, certDirSize) {
    // In PE, the certificate directory RVA is a file offset (not an RVA)
    return certDirRva > 0 && certDirSize > 0 && certDirRva + certDirSize <= buf.length;
}
function parsePe(buf, sha256) {
    // 1. MZ header
    if (buf.length < 64)
        throw new Error('File too small to be a valid PE');
    if (buf.readUInt16LE(0) !== MZ_MAGIC)
        throw new Error('Missing MZ signature');
    const peOffset = buf.readUInt32LE(60);
    if (peOffset + 24 > buf.length)
        throw new Error('PE offset out of range');
    // 2. PE signature
    if (buf.readUInt32LE(peOffset) !== PE_SIGNATURE)
        throw new Error('Missing PE signature');
    // 3. COFF header (after PE signature)
    const coffOffset = peOffset + 4;
    const machine = buf.readUInt16LE(coffOffset);
    const numSections = buf.readUInt16LE(coffOffset + 2);
    const optHeaderSize = buf.readUInt16LE(coffOffset + 16);
    // 4. Optional header
    const optOffset = coffOffset + 20;
    if (optOffset + 2 > buf.length)
        throw new Error('Optional header missing');
    const magic = buf.readUInt16LE(optOffset);
    let peType;
    let is64;
    if (magic === OPTIONAL_HDR_PE32) {
        peType = 'PE32';
        is64 = false;
    }
    else if (magic === OPTIONAL_HDR_PE32_PLUS) {
        peType = 'PE32+';
        is64 = true;
    }
    else
        throw new Error(`Unknown optional header magic: 0x${magic.toString(16)}`);
    // Architecture
    let architecture = 'unknown';
    if (machine === MACHINE_I386)
        architecture = 'x86';
    else if (machine === MACHINE_AMD64)
        architecture = 'x86-64';
    else if (machine === MACHINE_ARM)
        architecture = 'ARM';
    else if (machine === MACHINE_ARM64)
        architecture = 'ARM64';
    // Entry point and image base
    const entryPointRva = buf.readUInt32LE(optOffset + 16);
    const entryPoint = `0x${entryPointRva.toString(16).toUpperCase().padStart(8, '0')}`;
    // Subsystem (offset varies: PE32 = 68, PE32+ = 68 same)
    const subsystemCode = buf.readUInt16LE(optOffset + 68);
    let subsystem = 'unknown';
    if (subsystemCode === SUBSYSTEM_NATIVE)
        subsystem = 'NATIVE';
    else if (subsystemCode === SUBSYSTEM_WINDOWS_GUI)
        subsystem = 'WINDOWS_GUI';
    else if (subsystemCode === SUBSYSTEM_WINDOWS_CUI)
        subsystem = 'WINDOWS_CUI';
    else if (subsystemCode === SUBSYSTEM_WINDOWS_CE_GUI)
        subsystem = 'WINDOWS_CE_GUI';
    else if (subsystemCode === SUBSYSTEM_EFI_APPLICATION)
        subsystem = 'EFI_APPLICATION';
    // Number of data directories
    const numDataDirs = buf.readUInt32LE(optOffset + (is64 ? 108 : 92));
    // Data directory offsets (relative to optional header start)
    const dataDirBase = optOffset + (is64 ? 112 : 96);
    const importDirRva = numDataDirs > 1 ? buf.readUInt32LE(dataDirBase + 8) : 0;
    const importDirSize = numDataDirs > 1 ? buf.readUInt32LE(dataDirBase + 12) : 0;
    const exportDirRva = numDataDirs > 0 ? buf.readUInt32LE(dataDirBase) : 0;
    const resourceRva = numDataDirs > 2 ? buf.readUInt32LE(dataDirBase + 16) : 0;
    const certDirOffset = numDataDirs > 4 ? buf.readUInt32LE(dataDirBase + 32) : 0; // file offset
    const certDirSize = numDataDirs > 4 ? buf.readUInt32LE(dataDirBase + 36) : 0;
    void resourceRva; // used via sections below
    // 5. Section headers
    const sectionHeaderBase = optOffset + optHeaderSize;
    const rawSections = [];
    for (let i = 0; i < numSections && i < 96; i++) {
        const sBase = sectionHeaderBase + i * 40;
        if (sBase + 40 > buf.length)
            break;
        // Section name: 8 bytes, null-padded
        let name = buf.slice(sBase, sBase + 8).toString('ascii').replace(/\0+$/, '');
        if (!name)
            name = `section_${i}`;
        const virtualSize = buf.readUInt32LE(sBase + 8);
        const virtualAddress = buf.readUInt32LE(sBase + 12);
        const rawSize = buf.readUInt32LE(sBase + 16);
        const rawOffset = buf.readUInt32LE(sBase + 20);
        const characteristics = buf.readUInt32LE(sBase + 36);
        rawSections.push({ name, virtualAddress, virtualSize: virtualSize || rawSize, rawOffset, rawSize, characteristics });
    }
    // 6. Build section profiles with entropy
    const sections = rawSections.map(s => {
        const sectionBuf = (s.rawOffset > 0 && s.rawSize > 0 && s.rawOffset + s.rawSize <= buf.length)
            ? buf.slice(s.rawOffset, s.rawOffset + s.rawSize)
            : Buffer.alloc(0);
        const sec = {
            name: s.name,
            virtualAddress: `0x${s.virtualAddress.toString(16).toUpperCase().padStart(8, '0')}`,
            virtualSize: s.virtualSize,
            rawSize: s.rawSize,
            characteristics: sectionCharacteristics(s.characteristics),
        };
        if (sectionBuf.length > 0)
            sec.entropy = shannonEntropy(sectionBuf);
        return sec;
    });
    // 7. Imports / exports
    const imports = parseImports(buf, importDirRva, importDirSize, rawSections, is64);
    const exports = parseExports(buf, exportDirRva, rawSections);
    // 8. Version info
    const versionInfo = parseVersionInfo(buf, rawSections);
    // 9. Signature
    const hasSignature = hasAuthenticode(buf, certDirOffset, certDirSize);
    // 10. Overall entropy
    const overallEntropy = shannonEntropy(buf);
    const profileBase = {
        fileSizeBytes: buf.length,
        sha256,
        peType,
        architecture,
        subsystem,
        entryPoint,
        sections,
        imports,
        exports,
        hasSignature,
        overallEntropy,
    };
    return {
        rawSections,
        profile: versionInfo !== undefined
            ? { ...profileBase, versionInfo }
            : profileBase,
    };
}
function computeSha256(buf) {
    return crypto.createHash('sha256').update(buf).digest('hex');
}
//# sourceMappingURL=peParser.js.map