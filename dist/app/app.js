"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
/**
 * Express application factory.
 *
 * Wires together middleware, routers, and error handling.
 */
const express_1 = __importDefault(require("express"));
const health_js_1 = require("./routes/health.js");
const analyses_js_1 = require("./routes/analyses.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const requestLogger_js_1 = require("./middleware/requestLogger.js");
function createApp(config) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(requestLogger_js_1.requestLogger);
    // Routes
    app.use('/api/v1', (0, health_js_1.healthRouter)(config));
    app.use('/api/v1/analyses', (0, analyses_js_1.analysesRouter)(config));
    // Centralized error handler — must be last
    app.use(errorHandler_js_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map