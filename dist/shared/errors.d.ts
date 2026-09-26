/**
 * Shared error utilities.
 */
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(message: string, statusCode: number, code: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class UnprocessableError extends AppError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map