/**
 * Call edge normalizer — filters invalid call graph edges from Ghidra output.
 *
 * Section 9.9 of brief: raw numeric constants (e.g. 0x24, 0x2, 0xbe) must NOT
 * become graph nodes. Only edges that resolve to known function entry addresses
 * or recognised import symbols are kept.
 */
import { type GhidraFunction } from '../ghidra/validator.js';
import { type ImportEntry } from '../../shared/types.js';

// Addresses below this threshold are almost certainly not real function entry
// points — they are raw numeric constants, thunks, or garbage from Ghidra.
const MIN_VALID_ADDRESS = 0x1000n;

export interface NormalizedEdges {
  callers: string[];
  callees: string[];
}

/**
 * Filters call graph edges to retain only edges that resolve to:
 * - A known function entry address (internal call)
 * - OR a known import symbol name (external call, stored as the symbol name)
 *
 * Addresses smaller than 0x1000 are rejected as likely numeric constants.
 *
 * @param functions  - Ghidra function list (raw output)
 * @param imports    - PE import table entries
 * @returns Map from function address → { callers, callees } (all validated)
 */
export function normalizeCallEdges(
  functions: GhidraFunction[],
  imports: ImportEntry[],
): Map<string, NormalizedEdges> {
  // Build set of known function entry addresses (hex strings as Ghidra emits them)
  const knownAddresses = new Set<string>(functions.map(fn => fn.address));

  // Build set of known import names (for external edge validation)
  const knownImportNames = new Set<string>();
  for (const imp of imports) {
    for (const fn of imp.functions) {
      knownImportNames.add(fn);
    }
  }

  const result = new Map<string, NormalizedEdges>();

  for (const fn of functions) {
    const validCallers = fn.callers.filter(addr => isValidInternalEdge(addr, knownAddresses));
    const validCallees = fn.callees.filter(addr =>
      isValidInternalEdge(addr, knownAddresses) || isValidExternalEdge(addr, knownImportNames),
    );

    result.set(fn.address, { callers: validCallers, callees: validCallees });
  }

  return result;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Returns true if `addr` is a plausible internal function entry address:
 * - Is present in the known function address set
 * - Has a numeric value >= MIN_VALID_ADDRESS
 */
function isValidInternalEdge(addr: string, knownAddresses: Set<string>): boolean {
  if (!knownAddresses.has(addr)) return false;
  return parseAddress(addr) >= MIN_VALID_ADDRESS;
}

/**
 * Returns true if `addr` looks like an external import symbol name.
 * Ghidra sometimes stores external callees as symbol names rather than addresses.
 */
function isValidExternalEdge(addr: string, knownImportNames: Set<string>): boolean {
  return knownImportNames.has(addr);
}

/**
 * Parses a hex or decimal address string to BigInt for numeric comparison.
 * Returns 0n on parse failure.
 */
function parseAddress(addr: string): bigint {
  try {
    const trimmed = addr.trim();
    if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
      return BigInt(trimmed);
    }
    // Ghidra typically emits addresses as plain hex without 0x prefix (e.g. "00401000")
    if (/^[0-9a-fA-F]+$/.test(trimmed)) {
      return BigInt('0x' + trimmed);
    }
    return BigInt(trimmed);
  } catch {
    return 0n;
  }
}
