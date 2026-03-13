import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tauri/specs',
  timeout: 60000,
  retries: 0,
  workers: 1, // Tauri tests must run serially (shared preview server)
  reporter: [['list']],
  use: {
    trace: 'retain-on-failure',
  },
});
