/**
 * Centralized Express error handler.
 *
 * Returns standard error envelopes without leaking stack traces in production.
 */
import { type ErrorRequestHandler } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
}
export declare const errorHandler: ErrorRequestHandler;
//# sourceMappingURL=errorHandler.d.ts.map