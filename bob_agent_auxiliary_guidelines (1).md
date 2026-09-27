# BOB AGENT - AUXILIARY DEVELOPMENT GUIDELINES

**Target Audience:** IBM Bob 2.0 (Agent Mode)
**Project:** Code Archaeologist (Local Node.js MVP)

As the expert development agent, you must strictly adhere to the following non-functional requirements, security constraints, and architectural guidelines when executing the Master Prompts for this project.

## 1. Security & File System Boundaries (CRITICAL)
- **Zero Execution Rule:** Never write code that attempts to execute, spawn, or load the uploaded `.exe` file as a running program. Treat the binary as an inert artifact.
- **Path Traversal Prevention:** When handling the `analysisId` (UUID) or filenames, strictly sanitize inputs. Use `path.basename()` and `path.resolve()` carefully. Reject any requests containing `..` or slashes in IDs.
- **Command Injection Prevention:** In the Ghidra local adapter (`child_process.spawn`), **never** interpolate user-provided strings into the shell command. Pass arguments strictly as an array to the spawn function.
- **File Limits:** Enforce the `MAX_BINARY_BYTES` strictly using Multer's built-in limits configuration to prevent DoS via disk exhaustion.

## 2. Concurrency & Optimization
- **Ghidra Process Management:** Ghidra is resource-heavy. You must implement a queuing mechanism (e.g., `p-queue` with `concurrency: 1`) to ensure only one instance of `analyzeHeadless` runs at a time.
- **Strict Timeouts:** Implement a hard timeout for the Ghidra child process (e.g., 5 minutes). If the timeout is reached, you must forcefully kill the child process (`process.kill()`) and update the job status to `failed` with a timeout reason.
- **Asynchronous I/O:** All file system operations reading or writing JSON evidence or metadata must use asynchronous methods (`fs.promises` / `fs/promises`) to avoid blocking the Express event loop.

## 3. Architecture & Clean Code
- **Stateless API, Stateful File System:** The Node.js application memory should not hold the state of the analysis. The source of truth is always the `/work/<uuid>/` directory. The `GET /api/v1/analyses/:id` endpoint must read the current state directly from the `meta.json` or directory structure.
- **Error Handling:** Use a centralized Express error-handling middleware. Do not leak stack traces to the frontend in production mode. Return standard HTTP status codes (400 for bad input, 404 for missing analysis, 422 for unprocessable binary, 500 for internal/Ghidra errors).
- **TypeScript Strictness:** Ensure all interfaces (`Evidence`, `InferenceResult`, `ModernizationBlueprint`) are strictly typed. Avoid the use of `any`; use `unknown` if a type is genuinely indeterminable.

## 4. Testing Rules (Anti-Hallucination)
- **Deterministic Testing:** When writing Jest tests for the `Inference Engine`, do not mock the logic. Pass raw JavaScript objects representing extracted evidence and assert that the outputs match expected strict rules.
- **Negative Scenarios:** Always include negative tests to prove the engine does NOT overclaim (e.g., finding a single string like "SELECT" should not trigger a High-Confidence Database inference).

## 5. Frontend Constraints
- **Keep it Vanilla/Lightweight:** The frontend must be a simple, static SPA served by Express `express.static('public')`. Use native `fetch` API for polling.
- **Resilience:** The frontend polling mechanism must handle server disconnects or 500 errors gracefully, informing the user that the analysis failed without crashing the UI.

**Instruction to Bob:** Acknowledge these guidelines and apply them silently and consistently across all phases of code generation requested by the user.