/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Vite config for the client.
 * - `server.proxy` forwards `/api/*` to the Express server in development,
 *   so the client can call relative URLs like `/api/messages` with no CORS setup.
 * - `test` configures Vitest: a jsdom browser environment and a shared setup file.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Vitest skips CSS by default. tokens.test.ts reads tokens.css as text to check contrast.
    css: { include: [/tokens\.css/] },
  },
});
