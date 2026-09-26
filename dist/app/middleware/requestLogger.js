"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_js_1 = require("../../shared/logger.js");
const logger = (0, logger_js_1.createLogger)('http');
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        logger.info({
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: Date.now() - start,
        }, 'request');
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map