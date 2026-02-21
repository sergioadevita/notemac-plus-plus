import { Page, BrowserContext, Browser, webkit } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Tauri E2E test helper.
 *
 * Strategy: Run the built frontend in Playwright's WebKit browser (same engine
 * Tauri uses on macOS) with a mock __TAURI__ API injected. This tests the full
 * frontend in WebKit with Tauri API calls interceptable and verifiable.
 *
 * Why not launch the Tauri binary directly?
 * - Tauri uses WKWebView, not Chromium — `chromium.launchPersistentContext` hangs
 * - WEBKIT_INSPECTOR_SERVER requires macOS-specific setup unreliable in CI
 * - The frontend code is identical; only the IPC bridge differs
 *
 * This approach validates:
 * - Frontend runs correctly in WebKit (same engine as Tauri)
 * - All store operations work
 * - Menu actions dispatch correctly
 * - Tauri API surface is exercised
 */

let previewServer: ChildProcess | null = null;
let browser: Browser | null = null;

const PREVIEW_PORT = 4173;

/**
 * Wait for a server to be ready on the given port.
 */
async function waitForServer(port: number, maxWait: number = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`http://localhost:${port}`, (res) => {
          res.resume();
          resolve();
        });
        req.on('error', reject);
        req.setTimeout(1000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      return;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error(`Server on port ${port} not ready after ${maxWait}ms`);
}

/**
 * Start the Vite preview server (serves the built dist/ folder).
 */
async function startPreviewServer(): Promise<void> {
  // Verify dist/ exists
  const distPath = path.join(PROJECT_ROOT, 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('dist/ not found. Build the app first with: npm run build');
  }

  previewServer = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--host'], {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
    env: { ...process.env },
    shell: true,
  });

  previewServer.stderr?.on('data', (data: Buffer) => {
    const msg = data.toString();
    if (msg.includes('Error') || msg.includes('error')) {
      console.error('[preview-server]', msg);
    }
  });

  await waitForServer(PREVIEW_PORT);
}

/**
 * Inject a mock __TAURI__ API into the page.
 * This simulates the Tauri runtime environment.
 */
async function injectTauriMocks(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Mock the __TAURI__ namespace that Tauri apps expose
    (window as any).__TAURI__ = {
      event: {
        listen: async (event: string, handler: Function) => {
          // Store listeners for test invocation
          const listeners = (window as any).__TAURI_LISTENERS__ || {};
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(handler);
          (window as any).__TAURI_LISTENERS__ = listeners;
          return () => {
            const idx = listeners[event].indexOf(handler);
            if (idx >= 0) listeners[event].splice(idx, 1);
          };
        },
        emit: async (event: string, payload?: any) => {
          const listeners = (window as any).__TAURI_LISTENERS__?.[event] || [];
          for (const handler of listeners) {
            handler({ event, payload });
          }
        },
      },
      core: {
        invoke: async (cmd: string, args?: any) => {
          // Track invocations for test assertions
          const invocations = (window as any).__TAURI_INVOCATIONS__ || [];
          invocations.push({ cmd, args, timestamp: Date.now() });
          (window as any).__TAURI_INVOCATIONS__ = invocations;

          // Mock responses for common commands
          switch (cmd) {
            case 'read_file':
              return args?.path ? `Mock content for ${args.path}` : '';
            case 'write_file':
              return true;
            case 'read_dir':
              return [
                { name: 'test.js', path: '/mock/test.js', isDirectory: false },
                { name: 'src', path: '/mock/src', isDirectory: true, children: [] },
              ];
            case 'open_file_dialog':
              return [{ path: '/mock/test.txt', content: 'Mock file content', name: 'test.txt' }];
            case 'open_folder_dialog':
              return { path: '/mock/workspace', tree: [] };
            case 'save_file_dialog':
              return '/mock/saved.txt';
            case 'set_always_on_top':
              return undefined;
            case 'is_safe_storage_available':
              return true;
            case 'safe_storage_encrypt':
              return btoa(args?.plaintext || '');
            case 'safe_storage_decrypt':
              try { return atob(args?.encrypted || ''); } catch { return ''; }
            default:
              console.warn(`[tauri-mock] Unknown command: ${cmd}`);
              return null;
          }
        },
      },
      window: {
        getCurrentWindow: () => ({
          setAlwaysOnTop: async (value: boolean) => { /* no-op */ },
          innerSize: async () => ({ width: 1200, height: 800 }),
          outerSize: async () => ({ width: 1200, height: 800 }),
          innerPosition: async () => ({ x: 0, y: 0 }),
          outerPosition: async () => ({ x: 0, y: 0 }),
          isMaximized: async () => false,
          isMinimized: async () => false,
          isFullscreen: async () => false,
          setSize: async () => {},
          setPosition: async () => {},
          center: async () => {},
          setTitle: async (title: string) => { document.title = title; },
          title: async () => document.title,
          minimize: async () => {},
          maximize: async () => {},
          unmaximize: async () => {},
          setFullscreen: async () => {},
          close: async () => {},
        }),
      },
    };

    // Initialize invocation tracker
    (window as any).__TAURI_INVOCATIONS__ = [];
    (window as any).__TAURI_LISTENERS__ = {};
  });
}

/**
 * Launch the Tauri test environment and return a Playwright Page.
 * Uses WebKit browser (same engine as Tauri on macOS) with mocked Tauri APIs.
 */
export async function launchTauriApp(): Promise<{ context: BrowserContext; page: Page }> {
  // Start preview server for the built frontend
  await startPreviewServer();

  // Launch WebKit (same engine Tauri uses on macOS via WKWebView)
  browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 },
  });

  const page = await context.newPage();

  // Inject Tauri mocks before navigation
  await injectTauriMocks(page);

  // Navigate to the app
  await page.goto(`http://localhost:${PREVIEW_PORT}`, { waitUntil: 'domcontentloaded' });

  // Wait for the app to fully load
  await page.waitForSelector('.notemac-app, #root > div', { timeout: 30000 });
  await page.waitForTimeout(2000); // Give Monaco time to initialize

  return { context, page };
}

/**
 * Clean up all processes.
 */
export async function closeTauriApp(context?: BrowserContext): Promise<void> {
  if (context) {
    await context.close().catch(() => {});
  }
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
  if (previewServer) {
    previewServer.kill('SIGTERM');
    previewServer = null;
    // Kill any lingering preview server
    try {
      const { execSync } = await import('child_process');
      execSync(`lsof -ti:${PREVIEW_PORT} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
    } catch {}
  }
}

/**
 * Trigger a menu action by dispatching via the Zustand store.
 * Simulates what the Rust menu handler does: emit('menu-action', { action, value }).
 */
export async function triggerMenuAction(page: Page, action: string, value?: any): Promise<void> {
  await page.evaluate(({ a, v }) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return;

    const state = store.getState();
    const handlers: Record<string, () => void> = {
      'new': () => store.getState().addTab({ name: `new ${state.tabs.length + 1}`, content: '' }),
      'close-tab': () => { if (state.activeTabId) store.getState().closeTab(state.activeTabId); },
      'close-all': () => state.tabs.forEach((t: any) => store.getState().closeTab(t.id)),
      'close-others': () => state.tabs.filter((t: any) => t.id !== state.activeTabId).forEach((t: any) => store.getState().closeTab(t.id)),
      'find': () => store.getState().setShowFindReplace(true, 'find'),
      'replace': () => store.getState().setShowFindReplace(true, 'replace'),
      'goto-line': () => store.getState().setShowGoToLine(true),
      'preferences': () => store.getState().setShowSettings(true),
      'about': () => store.getState().setShowAbout(true),
      'toggle-sidebar': () => {
        const current = store.getState().sidebarPanel;
        store.getState().setSidebarPanel(current ? null : 'explorer');
      },
      'zoom-in': () => store.getState().setZoomLevel(state.zoomLevel + 1),
      'zoom-out': () => store.getState().setZoomLevel(state.zoomLevel - 1),
      'zoom-reset': () => store.getState().setZoomLevel(0),
      'toggle-terminal': () => store.getState().setShowTerminalPanel(!state.showTerminalPanel),
      'toggle-word-wrap': () => store.getState().updateSettings({ wordWrap: !state.settings?.wordWrap }),
    };

    if (handlers[a]) {
      handlers[a]();
    } else if (a === 'encoding' && v && state.activeTabId) {
      store.getState().updateTab(state.activeTabId, { encoding: v });
    } else if (a === 'language' && v && state.activeTabId) {
      store.getState().updateTab(state.activeTabId, { language: v });
    } else if (a === 'line-ending' && v && state.activeTabId) {
      store.getState().updateTab(state.activeTabId, { lineEnding: v });
    }
  }, { a: action, v: value });
  await new Promise(r => setTimeout(r, 300));
}

/**
 * Emit a Tauri event (simulates Rust backend emitting to frontend).
 */
export async function emitTauriEvent(page: Page, event: string, payload?: any): Promise<void> {
  await page.evaluate(({ e, p }) => {
    const listeners = (window as any).__TAURI_LISTENERS__?.[e] || [];
    for (const handler of listeners) {
      handler({ event: e, payload: p });
    }
  }, { e: event, p: payload });
  await new Promise(r => setTimeout(r, 200));
}

/**
 * Get the list of Tauri invoke calls made during the test.
 */
export async function getTauriInvocations(page: Page): Promise<Array<{ cmd: string; args?: any }>> {
  return page.evaluate(() => (window as any).__TAURI_INVOCATIONS__ || []);
}

/**
 * Clear tracked Tauri invocations.
 */
export async function clearTauriInvocations(page: Page): Promise<void> {
  await page.evaluate(() => { (window as any).__TAURI_INVOCATIONS__ = []; });
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
