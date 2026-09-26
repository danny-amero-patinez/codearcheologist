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
exports.store = exports.ghidraQueue = exports.getDiagnostics = exports.runPipeline = exports.intake = void 0;
/**
 * Analysis module public API.
 */
var pipeline_js_1 = require("./pipeline.js");
Object.defineProperty(exports, "intake", { enumerable: true, get: function () { return pipeline_js_1.intake; } });
Object.defineProperty(exports, "runPipeline", { enumerable: true, get: function () { return pipeline_js_1.runPipeline; } });
Object.defineProperty(exports, "getDiagnostics", { enumerable: true, get: function () { return pipeline_js_1.getDiagnostics; } });
Object.defineProperty(exports, "ghidraQueue", { enumerable: true, get: function () { return pipeline_js_1.ghidraQueue; } });
exports.store = __importStar(require("./jobStore.js"));
//# sourceMappingURL=index.js.map