"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_RULES = exports.cryptographicOperationsRule = exports.authenticationCredentialsRule = exports.databaseInteractionRule = exports.networkCommunicationRule = exports.processExecutionRule = exports.filesystemDeploymentRule = exports.serviceDriverLifecycleRule = exports.registryConfigPersistenceRule = exports.windowsInstallationRule = void 0;
/**
 * Inference rules — deterministic, testable, anti-overclaim.
 *
 * Each rule evaluates an EvidenceContext and returns zero or more Inference
 * objects.  Rules MUST NOT fire at medium/high confidence based on weak signals.
 * See module-level anti-overclaim notes in index.ts.
 *
 * SAFETY INVARIANT: The binary was never executed. All claims are static.
 */
const uuid_1 = require("uuid");
// ── Helpers ───────────────────────────────────────────────────────────────────
/** All API names imported across all DLLs (lowercased for comparison). */
function allImportedApis(imports) {
    const apis = new Set();
    for (const entry of imports) {
        for (const fn of entry.functions) {
            apis.add(fn.toLowerCase());
        }
    }
    return apis;
}
/** Returns evidence IDs that mention any of the given API names. */
function evidenceIdsForApis(evidence, apis) {
    const lowerApis = apis.map(a => a.toLowerCase());
    const ids = [];
    for (const ev of evidence) {
        if (ev.kind === 'import' || ev.kind === 'function-call') {
            const summary = ev.summary.toLowerCase();
            if (lowerApis.some(a => summary.includes(a))) {
                ids.push(ev.id);
            }
        }
    }
    return ids;
}
/** Returns evidence IDs for string evidence that match any of the given patterns. */
function evidenceIdsForStrings(evidence, patterns) {
    const ids = [];
    for (const ev of evidence) {
        if (ev.kind === 'string') {
            const summary = ev.summary.toLowerCase();
            if (patterns.some(p => p.test(summary))) {
                ids.push(ev.id);
            }
        }
    }
    return ids;
}
/** Check whether any imported API name (case-insensitive) matches any of the given names. */
function hasApis(importedApis, names) {
    return names.some(n => importedApis.has(n.toLowerCase()));
}
function makeInference(opts) {
    return {
        id: (0, uuid_1.v4)(),
        ruleId: opts.ruleId,
        category: opts.category,
        statement: opts.statement,
        classification: 'inferred',
        confidence: opts.confidence,
        evidenceIds: opts.evidenceIds,
        rationale: opts.rationale,
        limitations: opts.limitations,
    };
}
// ── Rule: windows-installation ────────────────────────────────────────────────
const REGISTRY_INSTALL_APIS = [
    'RegCreateKeyExW', 'RegSetValueExW', 'RegDeleteKeyExW', 'RegOpenKeyExW',
];
const UNINSTALL_STRING_PATTERNS = [
    /software\\microsoft\\windows\\currentversion\\uninstall/i,
    /displayname/i,
    /displayversion/i,
    /publisher/i,
    /uninstallstring/i,
];
exports.windowsInstallationRule = {
    id: 'windows-installation',
    evaluate(ctx) {
        const imported = allImportedApis(ctx.imports);
        const hasRegistryApis = hasApis(imported, REGISTRY_INSTALL_APIS);
        const apiEvidenceIds = evidenceIdsForApis(ctx.evidence, REGISTRY_INSTALL_APIS);
        const stringEvidenceIds = evidenceIdsForStrings(ctx.evidence, UNINSTALL_STRING_PATTERNS);
        const hasUninstallStrings = stringEvidenceIds.length > 0;
        // Anti-overclaim: registry APIs alone → LOW at most
        let confidence;
        if (hasRegistryApis && hasUninstallStrings) {
            confidence = 'high';
        }
        else if (hasRegistryApis && !hasUninstallStrings) {
            confidence = 'low';
        }
        else {
            return [];
        }
        const allEvidenceIds = [...new Set([...apiEvidenceIds, ...stringEvidenceIds])];
        return [makeInference({
                ruleId: 'windows-installation',
                category: 'installation',
                statement: 'The binary appears to implement Windows installation or uninstallation behavior.',
                confidence,
                evidenceIds: allEvidenceIds,
                rationale: [
                    hasRegistryApis ? 'Registry write/delete APIs (RegCreateKeyExW, RegSetValueExW) are imported.' : '',
                    hasUninstallStrings ? 'Uninstall registry path strings (Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall) are present.' : '',
                ].filter(Boolean),
                limitations: [
                    'Static analysis cannot determine whether installation code is actually reached at runtime.',
                    'Registry APIs alone are not sufficient evidence of installation behavior.',
                ],
            })];
    },
};
// ── Rule: registry-config-persistence ────────────────────────────────────────
const REGISTRY_PERSIST_APIS = ['RegOpenKeyExW', 'RegQueryValueExW', 'RegSetValueExW'];
exports.registryConfigPersistenceRule = {
    id: 'registry-config-persistence',
    evaluate(ctx) {
        const imported = allImportedApis(ctx.imports);
        const hasReadWrite = hasApis(imported, REGISTRY_PERSIST_APIS);
        if (!hasReadWrite)
            return [];
        // Do not fire if windows-installation already explains this registry evidence
        const stringEvidenceIds = evidenceIdsForStrings(ctx.evidence, UNINSTALL_STRING_PATTERNS);
        const hasUninstallStrings = stringEvidenceIds.length > 0;
        if (hasUninstallStrings) {
            // Let windows-installation rule cover it
            return [];
        }
        const hasReadApi = hasApis(imported, ['RegQueryValueExW']);
        const hasWriteApi = hasApis(imported, ['RegSetValueExW']);
        if (!hasReadApi || !hasWriteApi)
            return [];
        const apiEvidenceIds = evidenceIdsForApis(ctx.evidence, REGISTRY_PERSIST_APIS);
        return [makeInference({
                ruleId: 'registry-config-persistence',
                category: 'persistence',
                statement: 'The binary reads and writes registry values, suggesting configuration or settings persistence.',
                confidence: 'medium',
                evidenceIds: apiEvidenceIds,
                rationale: [
                    'Both RegQueryValueExW (read) and RegSetValueExW (write) are imported, indicating read+write registry pattern.',
                ],
                limitations: [
                    'Static analysis cannot determine which registry keys are accessed at runtime.',
                    'Registry read/write could serve many purposes beyond configuration persistence.',
                ],
            })];
    },
};
// ── Rule: service-driver-lifecycle ────────────────────────────────────────────
const SCM_APIS = [
    'OpenSCManagerW', 'CreateServiceW', 'OpenServiceW', 'StartServiceW',
    'ControlService', 'DeleteService', 'CloseServiceHandle',
];
const SERVICE_STRING_PATTERNS = [
    /\.sys$/i,
    /driver_install_failed/i,
    /stopping_driver/i,
    /service name/i,
];
exports.serviceDriverLifecycleRule = {
    id: 'service-driver-lifecycle',
    evaluate(ctx) {
        const imported = allImportedApis(ctx.imports);
        const hasScmApis = hasApis(imported, SCM_APIS);
        const apiEvidenceIds = evidenceIdsForApis(ctx.evidence, SCM_APIS);
        const stringEvidenceIds = evidenceIdsForStrings(ctx.evidence, SERVICE_STRING_PATTERNS);
        const hasServiceStrings = stringEvidenceIds.length > 0;
        if (!hasScmApis && !hasServiceStrings)
            return [];
        let confidence;
        if (hasScmApis && hasServiceStrings) {
            confidence = 'high';
        }
        else if (hasScmApis) {
            confidence = 'medium';
        }
        else {
            confidence = 'low';
        }
        const allEvidenceIds = [...new Set([...apiEvidenceIds, ...stringEvidenceIds])];
        return [makeInference({
                ruleId: 'service-driver-lifecycle',
                category: 'service',
                statement: 'The binary manages Windows service or driver lifecycle (install, start, stop, delete).',
                confidence,
                evidenceIds: allEvidenceIds,
                rationale: [
                    hasScmApis ? 'Service Control Manager APIs (OpenSCManagerW, CreateServiceW, etc.) are imported.' : '',
                    hasServiceStrings ? 'Service-related strings (.sys paths, driver error strings) are present.' : '',
                ].filter(Boolean),
                limitations: [
                    'Static analysis cannot confirm which services are actually managed at runtime.',
                    'SCM API imports may be present in libraries that are not always invoked.',
                ],
            })];
    },
};
// ── Rule: filesystem-deployment ───────────────────────────────────────────────
const FILE_DEPLOY_APIS = [
    'CreateFileW', 'WriteFile', 'DeleteFileW', 'CopyFileW', 'MoveFileExW', 'CreateDirectoryW',
];
const DEPLOY_PATH_APIS = ['GetTempPathW', 'GetWindowsDirectoryW', 'GetSystemDirectoryW', 'SHGetFolderPathW'];
const DEPLOY_STRING_PATTERNS = [
    /system32/i,
    /\\temp\\/i,
    /\\install/i,
    /\\program files/i,
];
exports.filesystemDeploymentRule = {
    id: 'filesystem-deployment',
    evaluate(ctx) {
        const imported = allImportedApis(ctx.imports);
        const hasFileApis = hasApis(imported, FILE_DEPLOY_APIS);
        if (!hasFileApis)
            return [];
        // Anti-overclaim: CreateFileW alone is not sufficient for medium/high
        const hasWriteOrCopyOrMove = hasApis(imported, ['WriteFile', 'CopyFileW', 'MoveFileExW', 'DeleteFileW', 'CreateDirectoryW']);
        const hasDeployPathApis = hasApis(imported, DEPLOY_PATH_APIS);
        const stringEvidenceIds = evidenceIdsForStrings(ctx.evidence, DEPLOY_STRING_PATTERNS);
        const hasDeployStrings = stringEvidenceIds.length > 0;
        const hasDeploySignals = hasWriteOrCopyOrMove || hasDeployPathApis || hasDeployStrings;
        if (!hasDeploySignals)
            return [];
        const apiEvidenceIds = evidenceIdsForApis(ctx.evidence, [...FILE_DEPLOY_APIS, ...DEPLOY_PATH_APIS]);
        const allEvidenceIds = [...new Set([...apiEvidenceIds, ...stringEvidenceIds])];
        const confidence = (hasWriteOrCopyOrMove && (hasDeployPathApis || hasDeployStrings)) ? 'high' : 'medium';
        return [makeInference({
                ruleId: 'filesystem-deployment',
                category: 'filesystem',
                statement: 'The binary performs filesystem deployment operations (writing, copying, or moving files to system locations).',
                confidence,
                evidenceIds: allEvidenceIds,
                rationale: [
                    hasWriteOrCopyOrMove ? 'File write/copy/move/delete APIs are imported.' : '',
                    hasDeployPathApis ? 'System path resolution APIs (GetSystemDirectoryW, GetTempPathW, etc.) are imported.' : '',
                    hasDeployStrings ? 'Deployment path strings (System32, temp, install) are present.' : '',
                ].filter(Boolean),
                limitations: [
                    'Static analysis cannot determine which files are deployed or whether deployment succeeds.',
                    'CreateFileW alone is not sufficient evidence of deployment behavior.',
                ],
            })];
    },
};
// ── Rule: process-execution ────────────────────────────────────────────────────
const PROCESS_APIS = [
    'CreateProcessW', 'CreateProcessA', 'ShellExecuteW', 'ShellExecuteExW',
    'CreateThread', 'TerminateProcess',
];
const CMDLINE_STRING_PATTERNS = [
    /\.exe/i,
    /cmd\.exe/i,
    /powershell/i,
    /\/c\s/i,
];
exports.processExecutionRule = {
    id: 'process-execution',
    evaluate(ctx) {
        const imported = allImportedApis(ctx.imports);
        const hasProcessApis = hasApis(imported, PROCESS_APIS);
        if (!hasProcessApis)
            return [];
        const apiEvidenceIds = evidenceIdsForApis(ctx.evidence, PROCESS_APIS);
        const stringEvidenceIds = evidenceIdsForStrings(ctx.evidence, CMDLINE_STRING_PATTERNS);
        const hasCmdlineStrings = stringEvidenceIds.length > 0;
        const confidence = hasCmdlineStrings ? 'medium' : 'low';
        const allEvidenceIds = [...new Set([...apiEvidenceIds, ...stringEvidenceIds])];
        return [makeInference({
                ruleId: 'process-execution',
                category: 'process',
                statement: 'The binary creates or manages external processes.',
                confidence,
                evidenceIds: allEvidenceIds,
                rationale: [
                    'Process creation APIs (CreateProcessW, ShellExecuteW, etc.) are imported.',
                    hasCmdlineStrings ? 'Command-line strings correlated to process-launching code.' : '',
                ].filter(Boolean),
                limitations: [
                    'Static analysis cannot determine which processes are launched or under what conditions.',
                    'CreateThread indicates concurrency, not necessarily external process launching.',
                ],
            })];
    },
};
// ── Rule: network-communication ───────────────────────────────────────────────
/**
 * CRITICAL: SendMessageW, SendDlgItemMessageW, PostMessageW, SendMessageA,
 * PostMessageA are Windows messaging APIs — NOT network APIs. They MUST NOT
 * count as network evidence.
 */
const NETWORK_APIS_WINHTTP = ['WinHttpOpen', 'WinHttpConnect', 'WinHttpSendRequest', 'WinHttpReceiveResponse'];
const NETWORK_APIS_WININET = ['InternetOpen', 'InternetConnect', 'HttpSendRequest', 'InternetReadFile', 'InternetOpenUrl'];
const NETWORK_APIS_WINSOCK = ['WSAStartup', 'socket', 'connect', 'send', 'recv', 'WSAConnect'];
const ALL_NETWORK_APIS = [...NETWORK_APIS_WINHTTP, ...NETWORK_APIS_WININET, ...NETWORK_APIS_WINSOCK];
const ENDPOINT_STRING_PATTERNS = [
    /^https?:\/\//i,
    /^ftp:\/\//i,
    /\.(com|net|org|io|gov|edu)\//i,
    /api\./i,
    /endpoint/i,
];
exports.networkCommunicationRule = {
    id: 'network-communication',
    evaluate(ctx) {
        const imported = allImportedApis(ctx.imports);
        // CRITICAL anti-false-positive check: Windows messaging APIs must NOT count
        // hasApis only checks explicitly listed network APIs — messaging APIs are never listed here
        const hasWinHttp = hasApis(imported, NETWORK_APIS_WINHTTP);
        const hasWinInet = hasApis(imported, NETWORK_APIS_WININET);
        const hasWinsock = hasApis(imported, NETWORK_APIS_WINSOCK);
        const hasNetworkApis = hasWinHttp || hasWinInet || hasWinsock;
        const stringEvidenceIds = evidenceIdsForStrings(ctx.evidence, ENDPOINT_STRING_PATTERNS);
        const hasEndpointStrings = stringEvidenceIds.length > 0;
        // Anti-overclaim: URL string alone → LOW at most
        if (!hasNetworkApis && !hasEndpointStrings)
            return [];
        if (!hasNetworkApis && hasEndpointStrings) {
            return [makeInference({
                    ruleId: 'network-communication',
                    category: 'network',
                    statement: 'URL or endpoint strings are present, but no network API was identified.',
                    confidence: 'low',
                    evidenceIds: stringEvidenceIds,
                    rationale: ['URL or hostname strings found, but no network API (WinHTTP/WinINet/Winsock) is imported.'],
                    limitations: [
                        'A URL string alone does not confirm network activity.',
                        'The URL may be a resource reference, error message, or documentation string.',
                    ],
                })];
        }
        const apiEvidenceIds = evidenceIdsForApis(ctx.evidence, ALL_NETWORK_APIS);
        const allEvidenceIds = [...new Set([...apiEvidenceIds, ...stringEvidenceIds])];
        const confidence = (hasNetworkApis && hasEndpointStrings) ? 'high' : 'medium';
        const networkFamily = hasWinHttp ? 'WinHTTP' : hasWinInet ? 'WinINet' : 'Winsock';
        return [makeInference({
                ruleId: 'network-communication',
                category: 'network',
                statement: `The binary communicates over the network using ${networkFamily} APIs.`,
                confidence,
                evidenceIds: allEvidenceIds,
                rationale: [
                    `Network APIs from the ${networkFamily} family are imported.`,
                    hasEndpointStrings ? 'Endpoint or URL strings corroborate network usage.' : '',
                ].filter(Boolean),
                limitations: [
                    'Static analysis cannot determine what data is transmitted or received.',
                    'Static analysis cannot confirm which endpoints are contacted at runtime.',
                    'SendMessageW/PostMessageW (Windows messaging) were not counted as network evidence.',
                ],
            })];
    },
};
// ── Rule: database-interaction ────────────────────────────────────────────────
const ODBC_APIS = [
    'SQLConnect', 'SQLConnectW', 'SQLExecDirect', 'SQLExecDirectW',
    'SQLPrepare', 'SQLPrepareW', 'SQLExecute', 'SQLFetch', 'SQLAllocHandle',
];
const SQL_STRING_PATTERNS = [
    /\bselect\b/i,
    /\binsert\b/i,
    /\bupdate\b/i,
    /\bdelete\b/i,
    /\bcreate table\b/i,
    /\bfrom\b.*\bwhere\b/i,
    /odbc/i,
    /dsn=/i,
    /driver=\{/i,
];
exports.databaseInteractionRule = {
    id: 'database-interaction',
    evaluate(ctx) {
        const imported = allImportedApis(ctx.imports);
        const hasOdbcApis = hasApis(imported, ODBC_APIS);
        const apiEvidenceIds = evidenceIdsForApis(ctx.evidence, ODBC_APIS);
        const stringEvidenceIds = evidenceIdsForStrings(ctx.evidence, SQL_STRING_PATTERNS);
        const hasSqlStrings = stringEvidenceIds.length > 0;
        // Anti-overclaim: generic SQL strings alone → LOW at most
        if (!hasOdbcApis && !hasSqlStrings)
            return [];
        let confidence;
        if (hasOdbcApis && hasSqlStrings) {
            confidence = 'high';
        }
        else if (hasOdbcApis) {
            confidence = 'medium';
        }
        else {
            // hasSqlStrings only
            confidence = 'low';
        }
        const allEvidenceIds = [...new Set([...apiEvidenceIds, ...stringEvidenceIds])];
        return [makeInference({
                ruleId: 'database-interaction',
                category: 'database',
                statement: 'The binary interacts with a database via ODBC or similar interface.',
                confidence,
                evidenceIds: allEvidenceIds,
                rationale: [
                    hasOdbcApis ? 'ODBC APIs (SQLConnect, SQLExecDirect, etc.) are imported.' : '',
                    hasSqlStrings ? 'SQL statement strings or ODBC connection string fragments are present.' : '',
                ].filter(Boolean),
                limitations: [
                    'Static analysis cannot determine which database engine or schema is used.',
                    'SQL strings may be error messages or documentation, not executed queries.',
                    'Generic SQL strings alone are not sufficient for high-confidence database inference.',
                ],
            })];
    },
};
// ── Rule: authentication-credentials ─────────────────────────────────────────
const CREDENTIAL_APIS = [
    'CryptAcquireContextW', 'BCryptOpenAlgorithmProvider', 'NCryptOpenKey',
    'CredRead', 'CredWrite', 'CredEnumerate',
    'LsaLogonUser', 'LogonUserW', 'AcquireCredentialsHandleW',
];
const AUTH_STRING_PATTERNS = [
    /\bpassword\b/i,
    /\busername\b/i,
    /\blogin\b/i,
    /\bauth(?:entication|orize|orization)?\b/i,
    /\btoken\b/i,
    /\bcredential/i,
    /\bsecret\b/i,
];
exports.authenticationCredentialsRule = {
    id: 'authentication-credentials',
    evaluate(ctx) {
        const imported = allImportedApis(ctx.imports);
        const hasCredApis = hasApis(imported, CREDENTIAL_APIS);
        const apiEvidenceIds = evidenceIdsForApis(ctx.evidence, CREDENTIAL_APIS);
        const stringEvidenceIds = evidenceIdsForStrings(ctx.evidence, AUTH_STRING_PATTERNS);
        const hasAuthStrings = stringEvidenceIds.length > 0;
        // Anti-overclaim: generic password/auth strings alone → LOW at most
        if (!hasCredApis && !hasAuthStrings)
            return [];
        let confidence;
        if (hasCredApis && hasAuthStrings) {
            confidence = 'high';
        }
        else if (hasCredApis) {
            confidence = 'medium';
        }
        else {
            // strings only
            confidence = 'low';
        }
        const allEvidenceIds = [...new Set([...apiEvidenceIds, ...stringEvidenceIds])];
        return [makeInference({
                ruleId: 'authentication-credentials',
                category: 'authentication',
                statement: 'The binary handles authentication or credential management.',
                confidence,
                evidenceIds: allEvidenceIds,
                rationale: [
                    hasCredApis ? 'Credential or authentication APIs are imported.' : '',
                    hasAuthStrings ? 'Authentication-related strings (password, login, token) are present.' : '',
                ].filter(Boolean),
                limitations: [
                    'Static analysis cannot determine whether credentials are handled securely.',
                    'Generic authentication strings alone are insufficient for high-confidence claims.',
                    'Credential APIs may be present in third-party libraries that are not always invoked.',
                ],
            })];
    },
};
// ── Rule: cryptographic-operations ────────────────────────────────────────────
const CRYPTO_APIS = [
    'CryptAcquireContextW', 'CryptEncrypt', 'CryptDecrypt', 'CryptHashData',
    'CryptCreateHash', 'CryptDeriveKey', 'CryptGenKey',
    'BCryptEncrypt', 'BCryptDecrypt', 'BCryptGenRandom', 'BCryptCreateHash',
    'NCryptEncrypt', 'NCryptDecrypt',
];
const ALGO_STRING_PATTERNS = [
    /\baes\b/i,
    /\brsa\b/i,
    /\bsha[-_]?(?:1|2|256|384|512)\b/i,
    /\bmd5\b/i,
    /\bdes\b/i,
    /\bhmac\b/i,
    /\bpbkdf/i,
    /calg_/i,
];
exports.cryptographicOperationsRule = {
    id: 'cryptographic-operations',
    evaluate(ctx) {
        const imported = allImportedApis(ctx.imports);
        const hasCryptoApis = hasApis(imported, CRYPTO_APIS);
        if (!hasCryptoApis)
            return [];
        // Anti-overclaim: CryptAcquireContextW alone → MEDIUM at most
        const hasStrongCryptoApis = hasApis(imported, [
            'CryptEncrypt', 'CryptDecrypt', 'CryptHashData',
            'BCryptEncrypt', 'BCryptDecrypt', 'BCryptCreateHash', 'NCryptEncrypt', 'NCryptDecrypt',
        ]);
        const apiEvidenceIds = evidenceIdsForApis(ctx.evidence, CRYPTO_APIS);
        const stringEvidenceIds = evidenceIdsForStrings(ctx.evidence, ALGO_STRING_PATTERNS);
        const hasAlgoStrings = stringEvidenceIds.length > 0;
        const confidence = (hasStrongCryptoApis && hasAlgoStrings) ? 'high' : 'medium';
        const allEvidenceIds = [...new Set([...apiEvidenceIds, ...stringEvidenceIds])];
        return [makeInference({
                ruleId: 'cryptographic-operations',
                category: 'cryptography',
                statement: 'The binary performs cryptographic operations (encryption, decryption, or hashing).',
                confidence,
                evidenceIds: allEvidenceIds,
                rationale: [
                    'Cryptographic APIs (CryptEncrypt, BCrypt*, etc.) are imported.',
                    hasAlgoStrings ? 'Algorithm identifier strings (AES, SHA-256, RSA, etc.) are present.' : '',
                ].filter(Boolean),
                limitations: [
                    'CryptAcquireContextW alone does not prove application-level encrypted data flow.',
                    'Static analysis cannot determine what data is encrypted or whether keys are managed securely.',
                    'Crypto APIs may be used for hashing or certificate verification rather than bulk encryption.',
                ],
            })];
    },
};
// ── All rules ─────────────────────────────────────────────────────────────────
exports.ALL_RULES = [
    exports.windowsInstallationRule,
    exports.registryConfigPersistenceRule,
    exports.serviceDriverLifecycleRule,
    exports.filesystemDeploymentRule,
    exports.processExecutionRule,
    exports.networkCommunicationRule,
    exports.databaseInteractionRule,
    exports.authenticationCredentialsRule,
    exports.cryptographicOperationsRule,
];
//# sourceMappingURL=rules.js.map