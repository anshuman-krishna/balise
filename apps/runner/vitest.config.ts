import { defineConfig } from 'vitest/config';

// the reproducibility suite is slow on purpose and lives in repro/, run by
// `pnpm test:repro`. it is not part of the normal test loop.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
});
