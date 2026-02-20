import { Page, BrowserContext, chromium } from 'playwright';
import { spawn, ChildProcess, execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Tauri E2E test helper.
 *
 * Uses tauri-driver (WebDriver) to launch the Tauri app and connect
 * Playwright to its WebView via Chrome DevTools Protocol (CDP).
 *
 * Requires:
 * - `cargo install tauri-driver` (provides the WebDriver bridge)
 * - The Tauri app built in debug mode: `npm run tauri:build -- --debug`
 */

let tauriDriverProcess: ChildProcess | null = null;
let tauriAppProcess: ChildProcess | null = null;

/**
 * Find the Tauri binary after building.
 * On macOS: src-tauri/target/debug/notemac-plus-plus
 * On Linux: src-tauri/target/debug/notemac-plus-plus
 */
function findTauriBinary(): string {
  const debugBin = path.join(PROJECT_ROOT, 'src-tauri', 'target', 'debug', 'notemac-plus-plus');
  if (fs.existsSync(debugBin)) return debugBin;

  // macOS .app bundle
  const macApp = path.join(
    PROJECT_ROOT, 'src-tauri', 'target', 'debug', 'bundle', 'macos',
    'Notemac++.app', 'Contents', 'MacOS', 'Notemac++'
  );
  if (fs.existsSync(macApp)) return macApp;

  // Release binary
  const releaseBin = path.join(PROJECT_ROOT, 'src-tauri', 'target', 'release', 'notemac-plus-plus');
  if (fs.existsSync(releaseBin)) return releaseBin;

  throw new Error(
    'Tauri binary not found. Build the app first with: npm run tauri:build -- --debug'
  );
}

/**
 * Start tauri-driver on the given port.
 */
async function startTauriDriver(port: number = 4444): Promise<void> {
  tauriDriverProcess = spawn('tauri-driver', ['--port', String(port)], {
    stdio: 'pipe',
    env: { ...process.env },
  });

  // Wait for driver to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => resolve(), 3000); // Give it 3 seconds max

    tauriDriverProcess!.stdout?.on('data', (data: Buffer) => {
      if (data.toString().includes('listening')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    tauriDriverProcess!.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/**
 * Launch the Tauri app and return a Playwright Page connected to its WebView.
 */
export async function launchTauriApp(): Promise<{ context: BrowserContext; page: Page }> {
  const binary = findTauriBinary();

  // Start tauri-driver for WebDriver protocol
  await startTauriDriver(4444);

  // Connect via CDP
  // tauri-driver exposes a WebSocket endpoint for Chrome DevTools Protocol
  const context = await chromium.launchPersistentContext('', {
    executablePath: binary,
    args: [],
    headless: false,
  });

  const page = context.pages()[0] || await context.newPage();

  // Wait for the app to fully load
  await page.waitForSelector('.notemac-app, #root > div', { timeout: 30000 });
  await page.waitForTimeout(2000); // Give Monaco time to initialize

  return { context, page };
}

/**
 * Alternative launcher: connect Playwright to Tauri WebView via WebDriver.
 * This approach starts the Tauri app separately and connects via the debug port.
 */
export async function launchTauriAppWithWebDriver(): Promise<{ page: Page; cleanup: () => void }> {
  const binary = findTauriBinary();

  // Launch Tauri app with remote debugging
  tauriAppProcess = spawn(binary, [], {
    stdio: 'pipe',
    env: {
      ...process.env,
      WEBKIT_INSPECTOR_SERVER: '127.0.0.1:9222',
    },
  });

  // Wait for app to start
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Connect to the WebView's DevTools
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  await page.waitForSelector('.notemac-app, #root > div', { timeout: 30000 });
  await page.waitForTimeout(2000);

  return {
    page,
    cleanup: () => {
      browser.close();
      if (tauriAppProcess) {
        tauriAppProcess.kill();
        tauriAppProcess = null;
      }
    },
  };
}

/**
 * Clean up all processes.
 */
export async function closeTauriApp(context?: BrowserContext): Promise<void> {
  if (context) {
    await context.close().catch(() => {});
  }
  if (tauriDriverProcess) {
    tauriDriverProcess.kill();
    tauriDriverProcess = null;
  }
  if (tauriAppProcess) {
    tauriAppProcess.kill();
    tauriAppProcess = null;
  }
}

/**
 * Trigger a menu action by emitting a Tauri event via JavaScript in the WebView.
 * This simulates what the Rust menu handler does: emit('menu-action', { action, value }).
 */
export async function triggerMenuAction(page: Page, action: string, value?: any): Promise<void> {
  await page.evaluate(async ({ a, v }) => {
    // Use Tauri's event system if available
    const tauriEvent = (window as any).__TAURI__?.event;
    if (tauriEvent) {
      // Emit as if the menu sent it
      // Since we can't emit from Rust in tests, we dispatch directly to the store
    }

    // Fallback: dispatch directly via the Zustand store
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return;

    const state = store.getState();
    // Use the same HandleMenuAction function the app uses
    const { HandleMenuAction } = await import('/src/Notemac/Controllers/MenuActionController');
    HandleMenuAction(a, state.activeTabId, state.tabs, state.zoomLevel, v);
  }, { a: action, v: value }).catch(async () => {
    // If dynamic import fails (bundled app), use the store directly
    await page.evaluate(({ a, v }) => {
      const store = (window as any).__ZUSTAND_STORE__;
      if (!store) return;

      // Direct store manipulation for common actions
      const state = store.getState();
      const handlers: Record<string, () => void> = {
        'new': () => store.getState().addTab({ name: `new ${state.tabs.length + 1}`, content: '' }),
        'close-tab': () => { if (state.activeTabId) store.getState().closeTab(state.activeTabId); },
        'close-all': () => state.tabs.forEach((t: any) => store.getState().closeTab(t.id)),
        'close-others': () => state.tabs.filter((t: any) => t.id !== state.activeTabId).forEach((t: any) => store.getState().closeTab(t.id)),
        'find': () => store.setState({ showFindReplace: true }),
        'replace': () => store.setState({ showFindReplace: true }),
        'goto-line': () => store.setState({ showGoToLine: true }),
        'preferences': () => store.setState({ showSettings: true }),
        'about': () => store.setState({ showAbout: true }),
        'toggle-sidebar': () => store.setState({ sidebarPanel: state.sidebarPanel ? null : 'explorer' }),
        'zoom-in': () => store.setState({ zoomLevel: state.zoomLevel + 2 }),
        'zoom-out': () => store.setState({ zoomLevel: state.zoomLevel - 2 }),
        'zoom-reset': () => store.setState({ zoomLevel: 0 }),
      };

      if (handlers[a]) {
        handlers[a]();
      } else {
        // For actions with values, update via store
        if (a === 'encoding' && v && state.activeTabId) {
          store.getState().updateTab(state.activeTabId, { encoding: v });
        } else if (a === 'language' && v && state.activeTabId) {
          store.getState().updateTab(state.activeTabId, { language: v });
        } else if (a === 'line-ending' && v && state.activeTabId) {
          store.getState().updateTab(state.activeTabId, { lineEnding: v });
        }
      }
    }, { a: action, v: value });
  });
  await new Promise(r => setTimeout(r, 300));
}

/**
 * Get store state from the Tauri app page.
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

/**
 * Create a temp directory for file operation tests.
 */
export function createTestWorkspace(): string {
  const tmpDir = path.join(PROJECT_ROOT, 'e2e-tauri', '.test-workspace');
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });

  // Create test files
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
  const tmpDir = path.join(PROJECT_ROOT, 'e2e-tauri', '.test-workspace');
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
}
