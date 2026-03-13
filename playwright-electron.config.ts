import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-electron/specs',
  timeout: 60000,
  retries: 0,
  workers: 1, // Electron tests must run serially
  reporter: [['list']],
  use: {
    trace: 'retain-on-failure',
  },
});
