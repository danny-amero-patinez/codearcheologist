/**
 * String extractor unit tests.
 */
import { extractStrings } from '../../../modules/binary/stringExtractor';

describe('extractStrings', () => {
  test('extracts ASCII strings from a buffer', () => {
    const buf = Buffer.from('hello world\0garbage\0this is a test string');
    const strings = extractStrings(buf, 100);
    const values = strings.map(s => s.value);
    expect(values).toContain('hello world');
    expect(values).toContain('this is a test string');
  });

  test('respects maxStrings limit', () => {
    // Build a buffer with many strings
    const parts: string[] = [];
    for (let i = 0; i < 100; i++) {
      parts.push(`string_number_${i}\0`);
    }
    const buf = Buffer.from(parts.join(''));
    const strings = extractStrings(buf, 10);
    expect(strings.length).toBeLessThanOrEqual(10);
  });

  test('categorises URLs', () => {
    const buf = Buffer.from('\0\0\0\0http://example.com/api/v1\0');
    const strings = extractStrings(buf, 100);
    const url = strings.find(s => s.value.includes('http://example.com'));
    expect(url).toBeDefined();
    expect(url?.category).toBe('url');
  });

  test('categorises registry paths', () => {
    const buf = Buffer.from('\0\0\0\0Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\0');
    const strings = extractStrings(buf, 100);
    const reg = strings.find(s => s.value.includes('Software'));
    expect(reg?.category).toBe('registry-path');
  });

  test('categorises SQL-like strings', () => {
    const buf = Buffer.from('\0\0\0\0SELECT * FROM clientes\0');
    const strings = extractStrings(buf, 100);
    const sql = strings.find(s => s.value.includes('SELECT'));
    expect(sql?.category).toBe('sql');
  });

  test('categorises DLL names', () => {
    const buf = Buffer.from('\0\0\0\0KERNEL32.dll\0');
    const strings = extractStrings(buf, 100);
    const dll = strings.find(s => s.value === 'KERNEL32.dll');
    expect(dll?.category).toBe('dll-name');
  });

  test('deduplicates identical strings', () => {
    const repeated = 'hello world\0hello world\0hello world\0';
    const buf = Buffer.from(repeated);
    const strings = extractStrings(buf, 100);
    const count = strings.filter(s => s.value === 'hello world').length;
    expect(count).toBe(1);
  });

  test('records byte offset', () => {
    const prefix = Buffer.alloc(10, 0);
    const str = Buffer.from('test_value');
    const buf = Buffer.concat([prefix, str]);
    const strings = extractStrings(buf, 100);
    const found = strings.find(s => s.value === 'test_value');
    expect(found).toBeDefined();
    expect(found?.offset).toBe(10);
  });

  test('does not extract strings shorter than minimum length', () => {
    const buf = Buffer.from('abc\0xyz\0longstring\0');
    const strings = extractStrings(buf, 100);
    const values = strings.map(s => s.value);
    expect(values).not.toContain('abc');
    expect(values).not.toContain('xyz');
    expect(values).toContain('longstring');
  });
});
