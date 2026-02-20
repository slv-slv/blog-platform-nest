import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.e2e.test.ts', 'src/**/*.spec.ts'],
    fileParallelism: false,
  },
});
