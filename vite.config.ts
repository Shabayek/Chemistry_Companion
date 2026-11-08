/// <reference types="vitest" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Some component tests click through 20+ steps; give slow machines headroom (default 5 s).
    testTimeout: 20000,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/**/*.d.ts'],
      // A little below the measured values (Phase 7: 94.6 / 86.1 / 93.3 / 96.5) so real regressions fail.
      thresholds: { statements: 92, branches: 83, functions: 90, lines: 94 },
    },
  },
})