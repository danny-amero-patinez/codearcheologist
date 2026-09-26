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
exports.validateGhidraOutput = validateGhidraOutput;
/**
 * Validates and parses the JSON output produced by CodeArchaeologistScript.java.
 */
const fs = __importStar(require("fs/promises"));
/**
 * Reads, parses, and validates the Ghidra output JSON file.
 * Throws a descriptive error on any validation failure.
 */
async function validateGhidraOutput(outputJsonPath) {
    let content;
    try {
        content = await fs.readFile(outputJsonPath, 'utf8');
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Ghidra output file not found or unreadable at "${outputJsonPath}": ${msg}`);
    }
    if (content.trim().length === 0) {
        throw new Error(`Ghidra output file is empty: "${outputJsonPath}"`);
    }
    let parsed;
    try {
        parsed = JSON.parse(content);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Ghidra output is not valid JSON at "${outputJsonPath}": ${msg}`);
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error(`Ghidra output must be a JSON object, got: ${typeof parsed}`);
    }
    const obj = parsed;
    if (!Array.isArray(obj['functions'])) {
        throw new Error(`Ghidra output missing required "functions" array. Keys present: ${Object.keys(obj).join(', ')}`);
    }
    return parsed;
}
//# sourceMappingURL=validator.js.map