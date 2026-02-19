import { _electron as electron, ElectronApplication, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Launch the Electron app for testing.
 * Must have built the app first (npm run build) and vite preview on port 5173.
 */
export async function launchElectronApp(): Promise<ElectronApplication> {
  const electronApp = await electron.launch({
    args: [
      '--no-sandbox',
      '--disable-gpu',
      path.join(PROJECT_ROOT, 'electron', 'main.cjs'),
    ],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      ELECTRON_DISABLE_GPU: '1',
    },
  });
  return electronApp;
}

/**
 * Get the main BrowserWindow page (not the DevTools window).
 * In dev mode, DevTools opens automatically and may be the first window.
 * We find the window that loads localhost:5173 (or dist/index.html).
 */
export async function getMainWindow(electronApp: ElectronApplication): Promise<Page> {
  // Wait for windows to open
  let page = await electronApp.firstWindow();
  await page.waitForTimeout(3000);

  // Find the actual app window (not DevTools)
  const windows = electronApp.windows();
  for (const win of windows) {
    const url = win.url();
    if (url.includes('localhost:5173') || url.includes('index.html') || url.includes('#root')) {
      page = win;
      break;
    }
  }

  // If first window was DevTools, close it and use the app window
  if (page.url().includes('devtools://')) {
    // The app window should be the other one
    const windows = electronApp.windows();
    for (const win of windows) {
      if (!win.url().includes('devtools://')) {
        page = win;
        break;
      }
    }
  }

  // Wait for the app to load
  await page.waitForSelector('.notemac-app, #root > div', { timeout: 30000 });
  await page.waitForTimeout(2000); // Give Monaco time to initialize

  // Close DevTools to avoid interference
  await electronApp.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win && win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools();
    }
  });
  await page.waitForTimeout(500);

  return page;
}

/**
 * Send a menu action to the renderer via IPC (simulating native menu click).
 */
export async function triggerMenuAction(electronApp: ElectronApplication, action: string, value?: any): Promise<void> {
  await electronApp.evaluate(({ BrowserWindow }, { a, v }) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (v !== undefined) {
      win.webContents.send('menu-action', a, v);
    } else {
      win.webContents.send('menu-action', a);
    }
  }, { a: action, v: value });
  // Wait for the action to be processed
  await new Promise(r => setTimeout(r, 300));
}

/**
 * Create a temp directory for file operation tests.
 * Returns the path to the temp directory.
 */
export function createTestWorkspace(): string {
  const tmpDir = path.join(PROJECT_ROOT, 'e2e-electron', '.test-workspace');
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });

  // Create some test files
  fs.writeFileSync(path.join(tmpDir, 'test.js'), 'const x = 1;\nconsole.log(x);', 'utf-8');
  fs.writeFileSync(path.join(tmpDir, 'test.py'), 'x = 1\nprint(x)', 'utf-8');
  fs.writeFileSync(path.join(tmpDir, 'test.txt'), 'Hello World\nLine 2\nLine 3', 'utf-8');
  fs.writeFileSync(path.join(tmpDir, 'test.json'), '{"key": "value"}', 'utf-8');

  // Create a subdirectory
  const subDir = path.join(tmpDir, 'src');
  fs.mkdirSync(subDir, { recursive: true });
  fs.writeFileSync(path.join(subDir, 'index.js'), 'export default {};', 'utf-8');

  return tmpDir;
}

/**
 * Clean up the test workspace.
 */
export function cleanupTestWorkspace(): void {
  const tmpDir = path.join(PROJECT_ROOT, 'e2e-electron', '.test-workspace');
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

/**
 * Get store state from the Electron app page.
 */
export async function getStoreState(page: Page, path?: string): Promise<any> {
  return page.evaluate((p) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return null;
    const state = store.getState();
    if (!p) return state;
    return p.split('.').reduce((obj: any, key: string) => obj?.[key], state);
  }, path);
}

/**
 * Get tab count from store.
 */
export async function getTabCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    return store ? store.getState().tabs.length : 0;
  });
}
