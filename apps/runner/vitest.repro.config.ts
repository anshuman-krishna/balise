import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['repro/**/*.test.ts'],
    // a hundred page loads through a real browser. slow is the point.
    testTimeout: 1_800_000,
    hookTimeout: 300_000,
  },
});
