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
exports.loadConfig = loadConfig;
/**
 * Application configuration.
 *
 * Loads and validates environment variables using Zod.
 * Fails fast at startup if required config is missing or invalid.
 */
const zod_1 = require("zod");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const configSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().int().min(1).max(65535).default(3000),
    HOST: zod_1.z.string().default('127.0.0.1'),
    WORK_DIR: zod_1.z.string().default('./work'),
    MAX_BINARY_BYTES: zod_1.z.coerce.number().int().positive().default(104_857_600), // 100 MB
    MAX_GHIDRA_FUNCTIONS: zod_1.z.coerce.number().int().positive().default(20),
    MAX_STRINGS: zod_1.z.coerce.number().int().positive().default(5000),
    GHIDRA_TIMEOUT_MS: zod_1.z.coerce.number().int().positive().default(180_000), // 3 min
    GHIDRA_HOME: zod_1.z.string().optional(),
});
function loadConfig() {
    const result = configSchema.safeParse(process.env);
    if (!result.success) {
        console.error('Invalid configuration:', result.error.format());
        process.exit(1);
    }
    return result.data;
}
//# sourceMappingURL=config.js.map