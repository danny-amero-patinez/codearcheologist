"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnprocessableError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
/**
 * Shared error utilities.
 */
class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode, code) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource) {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
class UnprocessableError extends AppError {
    constructor(message) {
        super(message, 422, 'UNPROCESSABLE_BINARY');
    }
}
exports.UnprocessableError = UnprocessableError;
//# sourceMappingURL=errors.js.map