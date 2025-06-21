/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: ['packages/*/src/**/*.ts', '!packages/*/src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  projects: [
    {
      displayName: '@storymark/core',
      testMatch: ['<rootDir>/packages/core/**/*.(test|spec).ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
    {
      displayName: '@storymark/react',
      testMatch: ['<rootDir>/packages/react/**/*.(test|spec).{ts,tsx}'],
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/packages/react/jest.setup.ts'],
      moduleNameMapper: {
        '^@storymark/core$': '<rootDir>/packages/core/src/index.ts',
      },
      modulePathIgnorePatterns: ['<rootDir>/packages/*/dist/'],
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: {
              jsx: 'react-jsx',
            },
          },
        ],
      },
    },
  ],
};
