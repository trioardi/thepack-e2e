/** Jest config for the DayBook API suite (Supertest over HTTP). */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '..',
  testMatch: ['<rootDir>/api/tests/**/*.test.ts'],
  testTimeout: 15000,
  // API tests mutate a shared database + a shared server process, so run them
  // serially (also enforced via the `--runInBand` npm script).
  maxWorkers: 1,
};
