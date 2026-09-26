"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_js_1 = require("../../shared/logger.js");
const logger = (0, logger_js_1.createLogger)('errorHandler');
// Multer error codes that map to 400
const MULTER_CLIENT_ERRORS = new Set([
    'LIMIT_PART_COUNT',
    'LIMIT_FILE_SIZE',
    'LIMIT_FILE_COUNT',
    'LIMIT_FIELD_KEY',
    'LIMIT_FIELD_VALUE',
    'LIMIT_FIELD_COUNT',
    'LIMIT_UNEXPECTED_FILE',
]);
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express requires 4-arg signature
const errorHandler = (err, _req, res, _next) => {
    // Handle Multer errors (missing boundary, unexpected field, etc.)
    if (err.code && MULTER_CLIENT_ERRORS.has(err.code)) {
        logger.error({ status: 400, code: err.code, message: err.message }, 'Request error');
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
        return;
    }
    // "Multipart: Boundary not found" — Multer parser error without a code
    if (err.message && err.message.includes('Boundary not found')) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Multipart boundary not found. Use multipart/form-data.' } });
        return;
    }
    const status = err.statusCode ?? 500;
    const code = err.code ?? 'INTERNAL_ERROR';
    logger.error({ status, code, message: err.message }, 'Request error');
    res.status(status).json({
        error: {
            code,
            message: status === 500 ? 'Internal server error' : err.message,
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map