/**
 * Unit tests for the pure metric functions (lib/rideMetrics, lib/elevationCorrection).
 * Plain node environment — no React Native runtime needed.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
};
