"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
/**
 * Structured logger factory backed by pino.
 */
const pino_1 = __importDefault(require("pino"));
const transport = process.env['NODE_ENV'] !== 'production'
    ? pino_1.default.transport({ target: 'pino-pretty', options: { colorize: true } })
    : undefined;
const rootLogger = (0, pino_1.default)({
    level: process.env['LOG_LEVEL'] ?? 'info',
}, transport);
function createLogger(name) {
    return rootLogger.child({ module: name });
}
//# sourceMappingURL=logger.js.map