import { Page, BrowserContext, Browser, webkit } from 'playwright';
import { spawn, ChildProcess, execSync } from 'child_process';
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
 * IMPORTANT: Uses a SINGLE shared preview server and browser instance across
 * all test files to avoid memory exhaustion on CI runners.
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
 * Check if preview server is already running.
 */
async function isServerRunning(port: number): Promise<boolean> {
  try {
    await new Promise<void>((resolve, reject) => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', reject);
      req.setTimeout(500, () => { req.destroy(); reject(new Error('timeout')); });
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Start the Vite preview server (serves the built dist/ folder).
 * Only starts if not already running.
 */
async function startPreviewServer(): Promise<void> {
  if (await isServerRunning(PREVIEW_PORT)) {
    return;
  }

  const distPath = path.join(PROJECT_ROOT, 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('dist/ not found. Build the app first with: npm run build');
  }

  // Kill any lingering process on the port
  try {
    execSync(`lsof -ti:${PREVIEW_PORT} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
    await new Promise(r => setTimeout(r, 500));
  } catch {}

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
 *
 * IMPORTANT: This must be called AFTER the app has loaded and initialized.
 * If injected before page load (via addInitScript), the app detects __TAURI__
 * and tries to dynamically import @tauri-apps/api/core — which fails because
 * the real Tauri IPC backend doesn't exist in the web build.
 */
async function injectTauriMocks(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__TAURI__ = {
      event: {
        listen: async (event: string, handler: Function) => {
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
          const invocations = (window as any).__TAURI_INVOCATIONS__ || [];
          invocations.push({ cmd, args, timestamp: Date.now() });
          (window as any).__TAURI_INVOCATIONS__ = invocations;

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
            case 'minimize_window':
            case 'maximize_window':
            case 'unmaximize_window':
            case 'close_window':
              return undefined;
            case 'is_safe_storage_available':
              return true;
            case 'safe_storage_encrypt':
              return btoa(args?.plaintext || '');
            case 'safe_storage_decrypt':
              try { return atob(args?.encrypted || ''); } catch { return ''; }
            case 'get_monitor':
              return { width: 1920, height: 1080, scaleFactor: 1 };
            case 'file_exists':
              return false;
            case 'rename_file':
              return true;
            default:
              console.warn(`[tauri-mock] Unknown command: ${cmd}`);
              return null;
          }
        },
      },
      window: {
        getCurrentWindow: () => ({
          setAlwaysOnTop: async () => {},
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

    (window as any).__TAURI_INVOCATIONS__ = [];
    (window as any).__TAURI_LISTENERS__ = {};
  });
}

/**
 * Inject real file-system backed Tauri mock that does actual I/O.
 * Used by file-ops and ipc tests that need real file operations.
 * Uses page.exposeFunction to bridge Node.js fs into the browser.
 */
export async function injectRealFsMock(page: Page): Promise<void> {
  await page.exposeFunction('__nodeReadFile', async (filePath: string) => {
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
    return fs.readFileSync(filePath, 'utf-8');
  });

  await page.exposeFunction('__nodeWriteFile', async (filePath: string, content: string) => {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  });

  await page.exposeFunction('__nodeReadDir', async (dirPath: string) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries
      .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
      .map(e => {
        const fullPath = path.join(dirPath, e.name);
        if (e.isDirectory()) {
          const children = fs.readdirSync(fullPath, { withFileTypes: true })
            .filter(c => !c.name.startsWith('.') && c.name !== 'node_modules')
            .map(c => ({
              name: c.name,
              path: path.join(fullPath, c.name),
              isDirectory: c.isDirectory(),
              children: c.isDirectory() ? [] : undefined,
            }));
          return { name: e.name, path: fullPath, isDirectory: true, children };
        }
        return { name: e.name, path: fullPath, isDirectory: false };
      });
  });

  await page.exposeFunction('__nodeFileExists', async (filePath: string) => {
    return fs.existsSync(filePath);
  });

  await page.exposeFunction('__nodeRenameFile', async (oldPath: string, newName: string) => {
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);
    fs.renameSync(oldPath, newPath);
    return true;
  });

  // Override invoke to use real FS for file commands
  await page.evaluate(() => {
    const originalInvoke = (window as any).__TAURI__.core.invoke;
    (window as any).__TAURI__.core.invoke = async (cmd: string, args?: any) => {
      const invocations = (window as any).__TAURI_INVOCATIONS__ || [];
      invocations.push({ cmd, args, timestamp: Date.now() });
      (window as any).__TAURI_INVOCATIONS__ = invocations;

      switch (cmd) {
        case 'read_file':
          return (window as any).__nodeReadFile(args?.path);
        case 'write_file':
          return (window as any).__nodeWriteFile(args?.path, args?.content);
        case 'read_dir':
          return (window as any).__nodeReadDir(args?.path);
        case 'file_exists':
          return (window as any).__nodeFileExists(args?.path);
        case 'rename_file':
          return (window as any).__nodeRenameFile(args?.oldPath, args?.newName);
        default:
          // Remove duplicate tracking since originalInvoke also tracks
          invocations.pop();
          return originalInvoke(cmd, args);
      }
    };
  });
}

/**
 * Launch the Tauri test environment and return a Playwright Page.
 * Reuses browser instance and preview server across calls.
 */
export async function launchTauriApp(): Promise<{ context: BrowserContext; page: Page }> {
  await startPreviewServer();

  if (!browser || !browser.isConnected()) {
    browser = await webkit.launch({ headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 },
  });

  const page = await context.newPage();

  await page.goto(`http://localhost:${PREVIEW_PORT}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.notemac-app, #root > div', { timeout: 30000 });
  await page.waitForTimeout(2000);

  await injectTauriMocks(page);

  return { context, page };
}

/**
 * Clean up a context (keeps browser and preview server alive for reuse).
 */
export async function closeTauriApp(context?: BrowserContext): Promise<void> {
  if (context) {
    await context.close().catch(() => {});
  }
}

// Clean up on process exit
process.on('exit', () => {
  if (previewServer) {
    previewServer.kill('SIGTERM');
    previewServer = null;
  }
  try {
    execSync(`lsof -ti:${PREVIEW_PORT} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
  } catch {}
});

/**
 * Trigger a menu action by dispatching via the Zustand store.
 * This mirrors the real MenuActionController.HandleMenuAction() dispatch.
 */
export async function triggerMenuAction(page: Page, action: string, value?: any): Promise<void> {
  await page.evaluate(({ a, v }) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (!store) return;

    const state = store.getState();
    const activeTabId = state.activeTabId;

    switch (a) {
      // ── File actions ──
      case 'new':
        store.getState().addTab();
        break;
      case 'close-tab':
        if (activeTabId) store.getState().closeTab(activeTabId);
        break;
      case 'close-all':
        store.getState().closeAllTabs();
        break;
      case 'close-others':
        if (activeTabId) store.getState().closeOtherTabs(activeTabId);
        break;
      case 'close-tabs-to-left':
        if (activeTabId) store.getState().closeTabsToLeft(activeTabId);
        break;
      case 'close-tabs-to-right':
        if (activeTabId) store.getState().closeTabsToRight(activeTabId);
        break;
      case 'close-unchanged':
        store.getState().closeUnchangedTabs();
        break;
      case 'close-all-but-pinned':
        store.getState().closeAllButPinned();
        break;
      case 'restore-last-closed':
        store.getState().restoreLastClosedTab();
        break;
      case 'pin-tab':
        if (activeTabId) store.getState().togglePinTab(activeTabId);
        break;
      case 'save-all':
        break; // no-op in web mode
      case 'delete-file':
        if (activeTabId) store.getState().closeTab(activeTabId);
        break;

      // ── Search actions ──
      case 'find':
        store.getState().setShowFindReplace(true, 'find');
        break;
      case 'replace':
        store.getState().setShowFindReplace(true, 'replace');
        break;
      case 'find-in-files':
        store.getState().setShowFindReplace(true, 'findInFiles');
        break;
      case 'mark':
        store.getState().setShowFindReplace(true, 'mark');
        break;
      case 'incremental-search':
        store.getState().setShowIncrementalSearch(true);
        break;
      case 'goto-line':
        store.getState().setShowGoToLine(true);
        break;
      case 'find-char-in-range':
        store.getState().setShowCharInRange(true);
        break;

      // ── View actions ──
      case 'zoom-in':
        store.getState().setZoomLevel(state.zoomLevel + 1);
        break;
      case 'zoom-out':
        store.getState().setZoomLevel(state.zoomLevel - 1);
        break;
      case 'zoom-reset':
        store.getState().setZoomLevel(0);
        break;
      case 'toggle-sidebar':
        store.getState().toggleSidebar();
        break;
      case 'show-doc-list':
        store.getState().setSidebarPanel('docList');
        break;
      case 'show-function-list':
        store.getState().setSidebarPanel('functions');
        break;
      case 'show-project-panel':
        store.getState().setSidebarPanel('project');
        break;
      case 'show-git-panel':
        store.getState().setSidebarPanel('git');
        break;
      case 'ai-chat':
        store.getState().setSidebarPanel('ai');
        break;
      case 'distraction-free':
        store.getState().updateSettings({ distractionFreeMode: v as boolean | undefined });
        break;
      case 'always-on-top':
        store.getState().updateSettings({ alwaysOnTop: v as boolean | undefined });
        break;
      case 'split-right':
        if (activeTabId) store.getState().setSplitView('vertical', activeTabId);
        break;
      case 'split-down':
        if (activeTabId) store.getState().setSplitView('horizontal', activeTabId);
        break;
      case 'close-split':
        store.getState().setSplitView('none');
        break;
      case 'show-summary':
        store.getState().setShowSummary(true);
        break;
      case 'toggle-monitoring':
        if (activeTabId) {
          const tab = state.tabs.find((t: any) => t.id === activeTabId);
          if (tab) store.getState().updateTab(activeTabId, { isMonitoring: !tab.isMonitoring });
        }
        break;
      case 'word-wrap':
        store.getState().updateSettings({ wordWrap: v as boolean | undefined });
        break;
      case 'show-whitespace':
        store.getState().updateSettings({ showWhitespace: v as boolean | undefined, renderWhitespace: v ? 'all' : 'none' });
        break;
      case 'show-eol':
        store.getState().updateSettings({ showEOL: v as boolean | undefined });
        break;
      case 'toggle-minimap':
        store.getState().updateSettings({ showMinimap: v as boolean | undefined });
        break;

      // ── Language / Encoding ──
      case 'language':
        if (activeTabId) store.getState().updateTab(activeTabId, { language: v as string | undefined });
        break;
      case 'encoding':
        if (activeTabId) store.getState().updateTab(activeTabId, { encoding: v as string | undefined });
        break;
      case 'line-ending':
        if (activeTabId) store.getState().updateTab(activeTabId, { lineEnding: v });
        break;

      // ── Macro ──
      case 'macro-start':
        store.getState().startRecordingMacro();
        break;
      case 'macro-stop':
        store.getState().stopRecordingMacro();
        break;
      case 'macro-playback':
        if (store.getState().playbackMacro) store.getState().playbackMacro();
        break;

      // ── Dialogs ──
      case 'preferences':
        store.getState().setShowSettings(true);
        break;
      case 'about':
        store.getState().setShowAbout(true);
        break;
      case 'run-command':
        store.getState().setShowRunCommand(true);
        break;
      case 'column-editor':
        store.getState().setShowColumnEditor(true);
        break;
      case 'shortcut-mapper':
        store.getState().setShowShortcutMapper(true);
        break;
      case 'command-palette':
        store.getState().setShowCommandPalette(true);
        break;
      case 'quick-open':
        store.getState().setShowQuickOpen(true);
        break;
      case 'compare-files':
        store.getState().setShowDiffViewer(true);
        break;
      case 'snippet-manager':
        store.getState().setShowSnippetManager(true);
        break;
      case 'toggle-terminal':
        store.getState().setShowTerminalPanel(!state.showTerminalPanel);
        break;
      case 'clone-repository':
        store.getState().setShowCloneDialog(true);
        break;
      case 'git-settings':
        store.getState().setShowGitSettings(true);
        break;
      case 'ai-settings':
        store.getState().SetShowAiSettings(true);
        break;
      case 'clipboard-history':
        store.getState().setSidebarPanel('clipboardHistory');
        break;
      case 'char-panel':
        store.getState().setSidebarPanel('charPanel');
        break;

      // ── Editor-handled actions (line ops, transforms, etc.) ──
      default: {
        const editorAction = (window as any).__EDITOR_ACTION_DISPATCH__;
        if (editorAction) {
          editorAction(a, v);
        }
        break;
      }
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
