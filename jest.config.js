// @ts-check
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Map .js relative imports to their .ts source counterparts for ts-jest
  moduleNameMapper: {
    '^(\\.{1,2}/.+)\\.js$': '$1',
  },
  // Allow Jest to transform ESM-only node_modules used in production code
  transformIgnorePatterns: [
    '/node_modules/(?!(p-queue|eventemitter3|p-limit)/)',
  ],
  clearMocks: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts'],
};

module.exports = config;
