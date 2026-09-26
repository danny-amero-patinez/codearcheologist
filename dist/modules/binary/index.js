"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractStrings = exports.computeSha256 = exports.parsePe = void 0;
/**
 * Binary module public API.
 *
 * SAFETY: This module reads bytes ONLY. The binary is never executed.
 */
var peParser_js_1 = require("./peParser.js");
Object.defineProperty(exports, "parsePe", { enumerable: true, get: function () { return peParser_js_1.parsePe; } });
Object.defineProperty(exports, "computeSha256", { enumerable: true, get: function () { return peParser_js_1.computeSha256; } });
var stringExtractor_js_1 = require("./stringExtractor.js");
Object.defineProperty(exports, "extractStrings", { enumerable: true, get: function () { return stringExtractor_js_1.extractStrings; } });
//# sourceMappingURL=index.js.map