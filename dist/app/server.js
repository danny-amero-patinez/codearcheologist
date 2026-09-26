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
/**
 * Code Archaeologist — Entry point
 *
 * Starts the Express server. Configuration is validated at startup via Zod.
 * SAFETY: This server never executes uploaded binaries. All analysis is static.
 */
const fs = __importStar(require("fs/promises"));
const app_js_1 = require("./app.js");
const config_js_1 = require("../config/config.js");
const logger_js_1 = require("../shared/logger.js");
const logger = (0, logger_js_1.createLogger)('server');
async function main() {
    const config = (0, config_js_1.loadConfig)();
    // Ensure work directory exists
    await fs.mkdir(config.WORK_DIR, { recursive: true });
    const app = (0, app_js_1.createApp)(config);
    app.listen(config.PORT, config.HOST, () => {
        logger.info({ host: config.HOST, port: config.PORT, workDir: config.WORK_DIR }, 'Code Archaeologist API server started');
    });
}
main().catch((err) => {
    console.error('Fatal startup error', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map