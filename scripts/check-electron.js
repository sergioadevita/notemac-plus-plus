/**
 * Quick check: can Electron actually launch in this environment?
 * Exits 0 if yes (proceed with tests), 1 if no (skip tests).
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Check 1: electron main entry exists
const mainEntry = resolve(root, 'electron', 'main.cjs');
if (!existsSync(mainEntry)) {
  console.log('Electron main entry not found:', mainEntry);
  process.exit(1);
}

// Check 2: electron binary can run --version
try {
  execSync('npx electron --version', { timeout: 10000, stdio: 'pipe', cwd: root });
} catch {
  console.log('Electron binary cannot execute in this environment');
  process.exit(1);
}

// Check 3: DISPLAY is set (needed for GUI on Linux)
if (process.platform === 'linux' && !process.env.DISPLAY) {
  console.log('No DISPLAY set — cannot run Electron GUI tests');
  process.exit(1);
}

process.exit(0);
