import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: { include: ['tests/unidade/**/*.test.ts', 'tests/banco/**/*.test.ts'], fileParallelism: false, testTimeout: 20000 },
});
