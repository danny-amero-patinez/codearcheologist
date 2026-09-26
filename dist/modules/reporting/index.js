"use strict";
/**
 * Reporting module — generates canonical result and reports.
 *
 * Responsibilities:
 * - Build the CanonicalResult JSON from all reconstruction outputs
 * - Generate Markdown report from canonical result (NOT independently recomputed)
 * - Generate HTML report from canonical result (NOT independently recomputed)
 * - Provide evidence index
 * - Ensure candidate responsibilities are prominent, not buried
 *
 * Invariants:
 * - Markdown and HTML are DERIVED from canonical JSON — never the other way around
 * - Partial analysis must be clearly marked as partial
 * - Limitations section must always be present
 * - No huge raw decompilation blocks in default reports
 * - Static analysis safety disclaimer must be included in all reports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHtmlReport = exports.generateMarkdownReport = exports.buildModernizationRecommendations = exports.buildCanonicalResult = void 0;
var resultBuilder_js_1 = require("./resultBuilder.js");
Object.defineProperty(exports, "buildCanonicalResult", { enumerable: true, get: function () { return resultBuilder_js_1.buildCanonicalResult; } });
var modernizationBuilder_js_1 = require("./modernizationBuilder.js");
Object.defineProperty(exports, "buildModernizationRecommendations", { enumerable: true, get: function () { return modernizationBuilder_js_1.buildModernizationRecommendations; } });
var markdownReport_js_1 = require("./markdownReport.js");
Object.defineProperty(exports, "generateMarkdownReport", { enumerable: true, get: function () { return markdownReport_js_1.generateMarkdownReport; } });
var htmlReport_js_1 = require("./htmlReport.js");
Object.defineProperty(exports, "generateHtmlReport", { enumerable: true, get: function () { return htmlReport_js_1.generateHtmlReport; } });
//# sourceMappingURL=index.js.map