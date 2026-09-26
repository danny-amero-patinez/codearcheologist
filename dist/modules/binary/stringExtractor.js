"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractStrings = extractStrings;
const MIN_STRING_LEN = 4;
// ── Category patterns ─────────────────────────────────────────────────────────
const URL_RE = /^https?:\/\//i;
const HOSTNAME_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const IP_RE = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const REGISTRY_PATH_RE = /^(?:HKEY_|HKLM\\|HKCU\\|HKCR\\|HKU\\|Software\\|SYSTEM\\)/i;
const SQL_RE = /\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|JOIN)\b/i;
const FILE_PATH_RE = /^(?:[A-Za-z]:\\|\\\\|\.\\|\.\.\\|\/)/;
const CONFIG_FILENAME_RE = /\.(ini|cfg|conf|config|xml|json|yaml|yml|properties)$/i;
const DLL_RE = /\.dll$/i;
const SYS_RE = /\.sys$/i;
const PROTOCOL_RE = /^(?:ftp|smtp|pop3|imap|ldap|http|https|tcp|udp):\/\//i;
const AUTH_RE = /\b(?:password|passwd|credential|token|apikey|api[_-]key|secret|auth(?:entication|orization)?)\b/i;
const ERROR_MSG_RE = /\b(?:error|failed|failure|exception|invalid|cannot|unable|denied)\b/i;
const SERVICE_NAME_RE = /\b(?:service|driver|daemon|svc)\b/i;
const INSTALLER_RE = /\b(?:install|uninstall|setup|upgrade|update|deploy)\b/i;
function categorise(value) {
    if (URL_RE.test(value))
        return 'url';
    if (REGISTRY_PATH_RE.test(value))
        return 'registry-path';
    if (SQL_RE.test(value))
        return 'sql';
    if (FILE_PATH_RE.test(value))
        return 'file-path';
    if (CONFIG_FILENAME_RE.test(value))
        return 'config-filename';
    if (DLL_RE.test(value) || SYS_RE.test(value))
        return 'dll-name';
    if (PROTOCOL_RE.test(value))
        return 'protocol';
    if (AUTH_RE.test(value))
        return 'authentication';
    if (HOSTNAME_RE.test(value) && !IP_RE.test(value))
        return 'hostname';
    if (IP_RE.test(value))
        return 'ip';
    if (ERROR_MSG_RE.test(value))
        return 'error-message';
    if (SERVICE_NAME_RE.test(value))
        return 'service-name';
    if (INSTALLER_RE.test(value))
        return 'installer-metadata';
    return 'other';
}
// ── ASCII string extraction ────────────────────────────────────────────────────
function extractAscii(buf, maxStrings) {
    const results = [];
    let i = 0;
    while (i < buf.length && results.length < maxStrings) {
        // Find start of printable ASCII run
        if (buf[i] >= 0x20 && buf[i] < 0x7f) {
            const start = i;
            while (i < buf.length && buf[i] >= 0x20 && buf[i] < 0x7f)
                i++;
            const len = i - start;
            if (len >= MIN_STRING_LEN) {
                const value = buf.slice(start, start + len).toString('ascii');
                results.push({
                    value,
                    encoding: 'ascii',
                    offset: start,
                    category: categorise(value),
                });
            }
        }
        else {
            i++;
        }
    }
    return results;
}
// ── UTF-16LE string extraction ────────────────────────────────────────────────
function extractUtf16le(buf, maxStrings) {
    const results = [];
    let i = 0;
    while (i + 1 < buf.length && results.length < maxStrings) {
        const cp = buf.readUInt16LE(i);
        if (cp >= 0x20 && cp < 0x7f) {
            // Possible UTF-16LE string — collect characters
            const start = i;
            const chars = [];
            while (i + 1 < buf.length) {
                const c = buf.readUInt16LE(i);
                if (c === 0) {
                    i += 2;
                    break;
                }
                if (c < 0x20 || c > 0x7e)
                    break;
                chars.push(String.fromCharCode(c));
                i += 2;
            }
            if (chars.length >= MIN_STRING_LEN) {
                const value = chars.join('');
                results.push({
                    value,
                    encoding: 'utf-16le',
                    offset: start,
                    category: categorise(value),
                });
            }
        }
        else {
            i += 2;
        }
    }
    return results;
}
// ── Deduplication ─────────────────────────────────────────────────────────────
function dedup(strings) {
    const seen = new Set();
    return strings.filter(s => {
        if (seen.has(s.value))
            return false;
        seen.add(s.value);
        return true;
    });
}
// ── Public API ────────────────────────────────────────────────────────────────
function extractStrings(buf, maxStrings) {
    const ascii = extractAscii(buf, maxStrings);
    const utf16 = extractUtf16le(buf, maxStrings);
    const combined = dedup([...ascii, ...utf16]);
    return combined.slice(0, maxStrings);
}
//# sourceMappingURL=stringExtractor.js.map