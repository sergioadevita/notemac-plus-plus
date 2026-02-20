# Testing

Notemac++ uses [Vitest](https://vitest.dev/) with JSDOM for unit testing and [Playwright](https://playwright.dev/) for E2E testing (both web and Electron desktop).

## Running Tests

```bash
npm test                          # Run unit tests once
npm run test:watch                # Watch mode
npx vitest run --reporter=verbose # Detailed unit test output
npx playwright test               # Web E2E tests
xvfb-run --auto-servernum npx playwright test --config=playwright-electron.config.ts  # Electron E2E tests
```

## Test Summary

**1,884 total tests** across three test layers:

### Unit Tests — 961 tests across 39 suites (Vitest)

| Suite | File | Tests | Covers |
|---|---|---|---|
| Helpers | `helpers.test.ts` | 46 | `detectLanguage` (30 extensions + edge cases), `detectLineEnding`, `convertLineEnding`, `generateId` |
| Tabs | `store-tabs.test.ts` | 36 | `addTab`, `closeTab`, `closeAllTabs`, `closeOtherTabs`, `closeTabsToLeft/Right`, `closeUnchangedTabs`, `closeAllButPinned`, `restoreLastClosedTab`, tab navigation, `updateTab`, `updateTabContent`, `togglePinTab`, `setTabColor`, `moveTab`, `addRecentFile` |
| UI State | `store-ui.test.ts` | 31 | Sidebar, zoom, split view, clipboard history, dialog toggles, settings, session save/load |
| Configs | `configs.test.ts` | 21 | `EditorConfig`, `ThemeConfig` (all 7 themes), `Constants` |
| Search | `store-search.test.ts` | 13 | Search state, find options, marks, bookmarks |
| Search Deep | `search-model-deep.test.ts` | 10 | Advanced search patterns, regex, whole word matching |
| Macros | `store-macro.test.ts` | 9 | Recording, playback, action logging, saved macros |
| Macros Deep | `macro-deep.test.ts` | 18 | Multi-step macros, action replay, edge cases |
| File Tree | `store-filetree.test.ts` | 7 | Tree nodes, expansion state, workspace root |
| Git Store | `store-git.test.ts` | 30 | Git state management, branch tracking, staging |
| Git Commands | `git-commands.test.ts` | 14 | Clone, commit, push, pull, branch operations |
| Git Adapter | `git-adapter.test.ts` | 15 | HTTP/SSH protocol handling, credential passing |
| Git Config | `git-config.test.ts` | 9 | Remote management, auth settings |
| Git Controllers | `git-controllers.test.ts` | 93 | Commit, push, pull, branch, merge, stash controllers |
| Git Deep | `git-deep.test.ts` | 40 | Diff viewer, conflict resolution, history |
| AI Store | `store-ai.test.ts` | 19 | Provider selection, conversation management, settings |
| AI Integration | `ai-integration.test.ts` | 51 | Multi-provider chat, completions, streaming |
| AI Config | `ai-config.test.ts` | 13 | API key management, model configuration |
| AI Action Controller | `ai-action-controller.test.ts` | 51 | Explain code, fix error, convert language, commit messages |
| AI Model Deep | `ai-model-deep.test.ts` | 20 | Token estimation, context windowing |
| LLM Controller | `llm-controller.test.ts` | 19 | Request routing, error handling, retry logic |
| Completion Controller | `completion-controller.test.ts` | 48 | Autocomplete, inline suggestions, debouncing |
| App Controller | `app-controller.test.ts` | 24 | Keyboard shortcuts, event handling, focus management |
| Menu Action Controller | `menu-action-controller.test.ts` | 25 | Menu item dispatch, action routing |
| File Controller | `file-controller.test.ts` | 17 | Open, save, save-as, file type detection |
| Auth Controller | `auth-controller.test.ts` | 15 | OAuth flow, token refresh, credential storage |
| Browser Workspace | `browser-workspace.test.ts` | 9 | File System Access API, directory handles |
| Browser Workspace Controller | `browser-workspace-controller.test.ts` | 30 | File tree sync, watch, read/write operations |
| Credential Security | `credential-security.test.ts` | 25 | Encryption/decryption, session-only mode, auto-expiry |
| Snippet Controller | `snippet-controller.test.ts` | 15 | CRUD operations, language filtering, insertion |
| Editor Panel | `editor-panel.test.ts` | 43 | Monaco integration, tab sync, action dispatch |
| Sidebar FileTree Deep | `sidebar-filetree-deep.test.ts` | 32 | Nested trees, expand/collapse, drag-drop |
| Dialogs Deep | `dialogs-deep.test.ts` | 15 | Settings, about, shortcut mapper state |
| Tab Model Deep | `tab-model-deep.test.ts` | 15 | Tab lifecycle, pinning, color coding |
| Error Boundary | `error-boundary.test.tsx` | 14 | Error catching, fallback rendering, recovery |
| Focus Trap | `focus-trap.test.tsx` | 16 | Keyboard navigation, tab cycling, escape handling |
| UI Toolbar | `ui-toolbar.test.tsx` | 20 | Button rendering, action dispatch, icon display |
| UI StatusBar | `ui-statusbar.test.tsx` | 14 | Cursor position, encoding, language display |
| UI Welcome | `ui-welcome.test.tsx` | 19 | Welcome screen, recent files, quick actions |

### Web E2E Tests — ~709 tests across 36 spec files (Playwright)

| Spec | Covers |
|---|---|
| `ai-chat.spec.ts` / `ai-chat-deep.spec.ts` | AI chat panel, conversations, provider switching |
| `command-palette.spec.ts` | Open/close, search, filtering, keyboard navigation, command execution |
| `context-menus.spec.ts` | Right-click menus, action dispatch |
| `dialogs.spec.ts` / `dialogs-deep.spec.ts` | Settings, Go to Line, About, Shortcut Mapper, Column Editor, Command Palette |
| `diff-viewer.spec.ts` | Side-by-side diff, inline diff |
| `drag-drop.spec.ts` | Tab reordering, file drop |
| `editor-editing.spec.ts` / `editor-panel.spec.ts` | Monaco editor, typing, selection, formatting |
| `file-operations.spec.ts` / `file-operations-web.spec.ts` | New file, open, save, tab content |
| `find-replace.spec.ts` / `find-replace-deep.spec.ts` | Find, replace, regex, case-sensitive, whole word |
| `git-panel.spec.ts` / `git-panel-deep.spec.ts` | Git panel UI, staging, branch display |
| `keyboard-shortcuts.spec.ts` / `keyboard-shortcuts-deep.spec.ts` | All keyboard shortcuts, modifier keys, zoom |
| `line-operations.spec.ts` | Sort, trim, reverse, remove duplicates, uppercase/lowercase |
| `macro.spec.ts` | Start/stop recording, save macro, store state |
| `menu-bar-actions.spec.ts` / `menu-bar-deep.spec.ts` | All menu items, action dispatch |
| `panels.spec.ts` | Sidebar panels, terminal, resize |
| `resize.spec.ts` | Window/panel resizing |
| `settings.spec.ts` | Theme, font size, tab size, word wrap, minimap toggles |
| `sidebar-deep.spec.ts` | File tree, panels, state management |
| `snippet-manager.spec.ts` | Browse, insert, CRUD operations |
| `split-view.spec.ts` | Split right/down, close split |
| `statusbar-deep.spec.ts` | Cursor, encoding, language, line ending display |
| `tab-bar-deep.spec.ts` | Tab operations, pinning, close, reorder |
| `tabs.spec.ts` | Create, close, switch, restore |
| `terminal-search.spec.ts` | Terminal search, regex, whole word |
| `toolbar-menu.spec.ts` | Toolbar buttons, menu bar items |
| `tools-encoding.spec.ts` | Base64, URL encode, hash, encoding conversions |
| `welcome-screen.spec.ts` | Welcome page, quick actions |
| `zoom-statusbar.spec.ts` | Zoom in/out/reset, status bar display |

### Electron E2E Tests — 214 tests across 4 spec files (Playwright Electron)

| Spec | Tests | Covers |
|---|---|---|
| `electron-menu-actions.spec.ts` | 80 | File/Search/View/Encoding/Language menus, dialogs, macro start/stop |
| `electron-ui-integration.spec.ts` | 40 | Editor integration, tab operations, sidebar, keyboard shortcuts, IPC |
| `electron-line-ops.spec.ts` | 28 | Line operations via Monaco API, tools with text selection, hash generation |
| `electron-window.spec.ts` | 66 | Window management, web preferences, app lifecycle, full menu structure validation |

## Test Setup

Tests use a setup file (`src/__tests__/setup.ts`) that:

- Imports `@testing-library/jest-dom` for DOM matchers
- Mocks `@monaco-editor/react` (Monaco requires a browser environment)
- Mocks `window.matchMedia` (not available in JSDOM)

## Configuration

Vitest config is in `vitest.config.ts`:

```typescript
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.test.ts']
  }
});
```

Test files are excluded from the main `tsconfig.json` compilation (`"exclude": ["src/__tests__"]`) so that `tsc -b` doesn't fail on Vitest globals like `vi`. Vitest handles its own TypeScript processing independently.

## Writing New Tests

Tests follow these conventions:

- Unit test files go in `src/__tests__/` with the pattern `<module>.test.ts`
- Web E2E spec files go in `e2e/specs/` with the pattern `<feature>.spec.ts`
- Electron E2E spec files go in `e2e-electron/specs/` with the pattern `electron-<feature>.spec.ts`
- Use `describe` blocks to group related tests
- Test names describe the expected behavior: `"should add a new tab with default values"`
- Each unit test creates a fresh store instance to avoid state leakage
- E2E tests use `gotoApp(page)` for web and `launchElectronApp()` for desktop
- Electron tests interact with Monaco via `setMonacoContent()` / `getMonacoContent()` helpers (not the Zustand store)
- Tools tests must select text before triggering (tools check `editor.getSelection().isEmpty()`)
- Use `dispatchShortcut()` instead of `pressShortcut()` for shortcuts intercepted by Monaco (Cmd+G, Cmd+Shift+P)
- Dialogs without web keyboard shortcuts (About, Shortcut Mapper, Column Editor) are opened via store methods
