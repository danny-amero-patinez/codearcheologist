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
exports.createApp = createApp;
/**
 * Express application factory.
 *
 * Wires together middleware, routers, and error handling.
 */
const path = __importStar(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const health_js_1 = require("./routes/health.js");
const analyses_js_1 = require("./routes/analyses.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const requestLogger_js_1 = require("./middleware/requestLogger.js");
function createApp(config) {
    const app = (0, express_1.default)();
    // Allow requests from the Astro frontend on any localhost port (dev + preview).
    // In production the frontend is served by this same Express instance, so
    // same-origin requests need no CORS header — the list below covers local dev.
    app.use((0, cors_1.default)({
        origin: [
            'http://localhost:4321',
            'http://localhost:4322',
            'http://127.0.0.1:4321',
            'http://127.0.0.1:4322',
        ],
        methods: ['GET', 'POST'],
    }));
    app.use(express_1.default.json());
    app.use(requestLogger_js_1.requestLogger);
    // Routes
    app.use('/api/v1', (0, health_js_1.healthRouter)(config));
    app.use('/api/v1/analyses', (0, analyses_js_1.analysesRouter)(config));
    // Serve the compiled Astro frontend from <appRoot>/public/.
    // In production (container) the Dockerfile copies frontend/dist → /app/public/.
    // In local dev this directory may not exist; Express silently skips missing roots.
    const frontendDir = path.resolve(__dirname, '..', '..', 'public');
    app.use(express_1.default.static(frontendDir));
    // SPA fallback: serve index.html for any unmatched GET so client-side routing works.
    app.get('*', (_req, res, next) => {
        const indexPath = path.join(frontendDir, 'index.html');
        res.sendFile(indexPath, (err) => {
            if (err)
                next(); // no index.html (dev mode) — fall through to 404
        });
    });
    // Centralized error handler — must be last
    app.use(errorHandler_js_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map