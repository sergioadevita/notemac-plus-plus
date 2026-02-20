import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tauri/specs',
  timeout: 60000,
  retries: 1,
  workers: 1, // Tauri tests must run serially
  reporter: [['list']],
  use: {
    trace: 'on-first-retry',
  },
});
