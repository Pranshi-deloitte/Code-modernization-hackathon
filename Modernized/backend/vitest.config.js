import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: { NODE_ENV: 'test' },
    // Isolate module state between test files so each file gets a fresh DB
    isolate: true,
    pool: 'forks'
  }
});
