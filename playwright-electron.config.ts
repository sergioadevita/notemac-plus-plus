import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-electron/specs',
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Electron tests must run serially
  reporter: [['list']],
  use: {
    trace: 'on-first-retry',
  },
});
