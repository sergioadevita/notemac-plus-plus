/**
 * Quick check: is the Tauri binary built and available?
 * Exits 0 if yes (proceed with tests), 1 if no (skip tests).
 */
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Check for Tauri binary in common build output locations
const possiblePaths = [
  resolve(root, 'src-tauri', 'target', 'release', 'notemac-plus-plus'),
  resolve(root, 'src-tauri', 'target', 'release', 'Notemac++'),
  resolve(root, 'src-tauri', 'target', 'debug', 'notemac-plus-plus'),
  resolve(root, 'src-tauri', 'target', 'debug', 'Notemac++'),
];

const found = possiblePaths.find(p => existsSync(p));
if (!found) {
  console.log('Tauri binary not found. Build with: npm run tauri:build');
  process.exit(1);
}

// Check DISPLAY on Linux
if (process.platform === 'linux' && !process.env.DISPLAY) {
  console.log('No DISPLAY set — cannot run Tauri GUI tests');
  process.exit(1);
}

process.exit(0);
