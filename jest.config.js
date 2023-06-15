/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  silent: false,
  setupFilesAfterEnv: ['jest-extended/all'],

  rootDir: 'src',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  coverageDirectory: './reports/coverage',
  collectCoverageFrom: ['src/*.(t|j)s'],
  reporters: ['default', ['jest-junit', { outputFile: 'reports/junit.xml' }]],
  coverageReporters: ['cobertura', 'lcov', 'text'],
};
