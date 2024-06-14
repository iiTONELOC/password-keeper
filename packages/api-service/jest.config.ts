import type {JestConfigWithTsJest} from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^passwordkeeper.types$': '<rootDir>/node_modules/passwordkeeper.types/src'
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.+(ts|tsx|js)',
    '<rootDir>/src/**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],

  globalSetup: '<rootDir>/jest.setup.ts',
  globalTeardown: '<rootDir>/jest.teardown.ts'
};

export default jestConfig;
