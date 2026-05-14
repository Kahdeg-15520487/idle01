import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // jsdom for DOM-based UI tests
    environment: 'jsdom',
    // Include all test files
    include: ['src/__tests__/**/*.test.ts'],
    // Global setup
    globals: true,
    // Resolve aliases
    resolve: {
      alias: {
        '@engine': path.resolve(__dirname, 'src/engine'),
        '@state': path.resolve(__dirname, 'src/state'),
        '@data': path.resolve(__dirname, 'src/data'),
        '@ui': path.resolve(__dirname, 'src/ui'),
      },
    },
    // Coverage (optional, for later)
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**'],
    },
  },
});
