/**
 * PE Parser unit tests.
 *
 * Tests use minimal hand-crafted PE buffers to validate parsing logic
 * without needing a real binary file.
 */
import { parsePe, computeSha256 } from '../../../modules/binary/peParser';

// ── Minimal PE32 builder ──────────────────────────────────────────────────────

/**
 * Builds a minimal valid PE32 buffer (enough to pass structural validation).
 * This is a synthetic buffer for testing the parser, NOT a real executable.
 */
function buildMinimalPe32(): Buffer {
  const buf = Buffer.alloc(0x400, 0);

  // MZ header
  buf.writeUInt16LE(0x5a4d, 0);      // 'MZ'
  buf.writeUInt32LE(0x80, 60);       // e_lfanew = 0x80

  // PE signature at 0x80
  buf.writeUInt32LE(0x00004550, 0x80); // 'PE\0\0'

  // COFF header (at 0x84)
  buf.writeUInt16LE(0x014c, 0x84);   // Machine = i386
  buf.writeUInt16LE(1, 0x86);        // NumberOfSections = 1
  buf.writeUInt32LE(0, 0x88);        // TimeDateStamp
  buf.writeUInt32LE(0, 0x8c);        // PointerToSymbolTable
  buf.writeUInt32LE(0, 0x90);        // NumberOfSymbols
  buf.writeUInt16LE(0xe0, 0x94);     // SizeOfOptionalHeader = 224 (standard PE32)
  buf.writeUInt16LE(0x0002, 0x96);   // Characteristics

  // Optional header (at 0x98)
  buf.writeUInt16LE(0x010b, 0x98);   // Magic = PE32
  buf.writeUInt8(0x0e, 0x9a);        // MajorLinkerVersion
  buf.writeUInt8(0x00, 0x9b);        // MinorLinkerVersion
  buf.writeUInt32LE(0x1000, 0x9c);   // SizeOfCode
  buf.writeUInt32LE(0x0000, 0xa0);   // SizeOfInitializedData
  buf.writeUInt32LE(0x0000, 0xa4);   // SizeOfUninitializedData
  buf.writeUInt32LE(0x1000, 0xa8);   // AddressOfEntryPoint
  buf.writeUInt32LE(0x1000, 0xac);   // BaseOfCode
  buf.writeUInt32LE(0x0000, 0xb0);   // BaseOfData (PE32 only)
  buf.writeUInt32LE(0x400000, 0xb4); // ImageBase
  buf.writeUInt32LE(0x1000, 0xb8);   // SectionAlignment
  buf.writeUInt32LE(0x0200, 0xbc);   // FileAlignment
  buf.writeUInt16LE(5, 0xc0);        // MajorOSVersion
  buf.writeUInt16LE(0, 0xc2);        // MinorOSVersion
  buf.writeUInt16LE(0, 0xc4);        // MajorImageVersion
  buf.writeUInt16LE(0, 0xc6);        // MinorImageVersion
  buf.writeUInt16LE(5, 0xc8);        // MajorSubsystemVersion
  buf.writeUInt16LE(0, 0xca);        // MinorSubsystemVersion
  buf.writeUInt32LE(0, 0xcc);        // Win32VersionValue
  buf.writeUInt32LE(0x3000, 0xd0);   // SizeOfImage
  buf.writeUInt32LE(0x400, 0xd4);    // SizeOfHeaders
  buf.writeUInt32LE(0, 0xd8);        // CheckSum
  buf.writeUInt16LE(2, 0xdc);        // Subsystem = WINDOWS_GUI
  buf.writeUInt16LE(0, 0xde);        // DllCharacteristics
  buf.writeUInt32LE(0x100000, 0xe0); // SizeOfStackReserve
  buf.writeUInt32LE(0x1000, 0xe4);   // SizeOfStackCommit
  buf.writeUInt32LE(0x100000, 0xe8); // SizeOfHeapReserve
  buf.writeUInt32LE(0x1000, 0xec);   // SizeOfHeapCommit
  buf.writeUInt32LE(0, 0xf0);        // LoaderFlags
  buf.writeUInt32LE(16, 0xf4);       // NumberOfRvaAndSizes = 16

  // Data directories (16 × 8 bytes = 128 bytes starting at 0xf8)
  // All zero = no imports, exports, etc.

  // Section header at 0x98 + 0xe0 = 0x178
  const sectionBase = 0x98 + 0xe0;
  buf.write('.text\0\0\0', sectionBase, 'ascii');  // Name
  buf.writeUInt32LE(0x1000, sectionBase + 8);      // VirtualSize
  buf.writeUInt32LE(0x1000, sectionBase + 12);     // VirtualAddress
  buf.writeUInt32LE(0x200, sectionBase + 16);      // SizeOfRawData
  buf.writeUInt32LE(0x200, sectionBase + 20);      // PointerToRawData
  buf.writeUInt32LE(0x60000020, sectionBase + 36); // Characteristics = CODE|EXEC|READ

  return buf;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('parsePe', () => {
  test('parses a minimal valid PE32 buffer', () => {
    const buf = buildMinimalPe32();
    const sha256 = computeSha256(buf);
    const result = parsePe(buf, sha256);

    expect(result.profile.peType).toBe('PE32');
    expect(result.profile.architecture).toBe('x86');
    expect(result.profile.subsystem).toBe('WINDOWS_GUI');
    expect(result.profile.entryPoint).toBe('0x00001000');
    expect(result.profile.sha256).toBe(sha256);
    expect(result.profile.sections).toHaveLength(1);
    expect(result.profile.sections[0]?.name).toBe('.text');
  });

  test('rejects a buffer with no MZ signature', () => {
    const buf = Buffer.alloc(512, 0);
    expect(() => parsePe(buf, 'abc')).toThrow('Missing MZ signature');
  });

  test('rejects a buffer that is too small', () => {
    const buf = Buffer.alloc(32, 0);
    buf.writeUInt16LE(0x5a4d, 0); // MZ but too small
    expect(() => parsePe(buf, 'abc')).toThrow();
  });

  test('rejects a buffer with MZ but no PE signature', () => {
    const buf = Buffer.alloc(512, 0);
    buf.writeUInt16LE(0x5a4d, 0);  // MZ
    buf.writeUInt32LE(0x40, 60);   // e_lfanew points to offset 0x40
    buf.writeUInt32LE(0xDEADBEEF, 0x40); // Wrong PE signature
    expect(() => parsePe(buf, 'abc')).toThrow('Missing PE signature');
  });

  test('SHA-256 is deterministic', () => {
    const buf = Buffer.from('hello world');
    const h1 = computeSha256(buf);
    const h2 = computeSha256(buf);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  test('section characteristics include CODE for .text', () => {
    const buf = buildMinimalPe32();
    const { profile } = parsePe(buf, computeSha256(buf));
    const text = profile.sections.find(s => s.name === '.text');
    expect(text).toBeDefined();
    expect(text?.characteristics).toContain('IMAGE_SCN_CNT_CODE');
    expect(text?.characteristics).toContain('IMAGE_SCN_MEM_EXECUTE');
    expect(text?.characteristics).toContain('IMAGE_SCN_MEM_READ');
  });
});
