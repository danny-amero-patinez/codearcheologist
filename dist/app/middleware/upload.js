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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUploadMiddleware = createUploadMiddleware;
/**
 * Multer upload configuration.
 *
 * SAFETY: Multer stores the file to a temp path on disk.
 * The temp file is later moved into the job input directory.
 * The uploaded binary is NEVER executed.
 *
 * Security:
 * - MAX_BINARY_BYTES enforced via Multer limits (prevents disk exhaustion)
 * - Files are stored with generated names, not user-supplied names
 * - User-supplied filename is recorded for display only
 */
const multer_1 = __importDefault(require("multer"));
const os = __importStar(require("os"));
function createUploadMiddleware(config) {
    return (0, multer_1.default)({
        dest: os.tmpdir(),
        limits: {
            fileSize: config.MAX_BINARY_BYTES,
            files: 1,
        },
        // Accept any file — PE validation is done by byte inspection in the parser
        fileFilter: (_req, _file, cb) => cb(null, true),
    });
}
//# sourceMappingURL=upload.js.map