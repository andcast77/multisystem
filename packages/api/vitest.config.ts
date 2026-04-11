import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    setupFiles: ['./src/__tests__/vitest-setup-env.ts'],
    globals: true,
    environment: 'node',
    // Integration tests share a single database; run files sequentially to avoid
    // concurrent seed races (each worker would run db:seed against the same DB).
    fileParallelism: false,
    include: ['src/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/__tests__/',
        '**/*.config.{js,ts}',
        '**/*.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
