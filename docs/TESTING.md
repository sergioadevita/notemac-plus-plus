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

### Unit Tests — 1,728 tests across 91 suites (Vitest)

#### Configs & Settings

| Suite | File | Tests | Covers |
|---|---|---|---|
| Editor Config | `EditorConfig.test.ts` | 12 | Default font size, tab size, font family, themes, cursor style, render whitespace |
| Encoding Config | `EncodingConfig.test.ts` | 11 | Default encodings, UTF-8 configuration |
| Git Config | `GitConfig.test.ts` | 9 | Default Git settings, author, credentials, persistence keys |
| Language Config | `LanguageConfig.test.ts` | 17 | Language detection, language-specific defaults |
| Shortcut Config | `ShortcutConfig.test.ts` | 7 | Keyboard shortcut definitions, categories |
| Theme Config | `ThemeConfig.test.ts` | 14 | Theme validation, color definitions, custom themes |

#### Controllers

| Suite | File | Tests | Covers |
|---|---|---|---|
| App Controller | `AppController.test.ts` | 24 | Keyboard shortcuts, event handling, focus management, menu dispatch |
| Auth Controller | `AuthController.test.ts` | 18 | OAuth flow, token refresh, credential storage, logout |
| Completion Controller | `CompletionController.test.ts` | 48 | Autocomplete, inline suggestions, debouncing, language support |
| File Controller | `FileController.test.ts` | 17 | Open, save, save-as, file type detection, encoding |
| LLM Controller | `LLMController.test.ts` | 19 | Context building, token estimation, text truncation, code block extraction |
| Menu Action Controller | `MenuActionController.test.ts` | 25 | Menu item dispatch, action routing, keyboard shortcuts, submenu handling |
| Snippet Controller | `SnippetController.test.ts` | 15 | CRUD operations, language filtering, insertion, persistence |

#### Git Controllers

| Suite | File | Tests | Covers |
|---|---|---|---|
| Git Auto Fetch Controller | `GitAutoFetchController.test.ts` | 5 | Auto-fetch timer, polling intervals, start/stop |
| Git Branch Controller | `GitBranchController.test.ts` | 13 | Branch creation, deletion, switching, renaming, tracking |
| Git Commit Controller | `GitCommitController.test.ts` | 8 | Commit creation, message validation, staging amend |
| Git File System Adapter | `GitFileSystemAdapter.test.ts` | 15 | File read/write operations, path normalization, directory traversal |
| Git Init Controller | `GitInitController.test.ts` | 16 | Repository initialization, empty repo detection |
| Git Log Controller | `GitLogController.test.ts` | 9 | Commit history retrieval, date parsing, log filtering |
| Git Model | `GitModel.test.ts` | 29 | Git state management, branch tracking, staging, diff status |
| Git Remote Controller | `GitRemoteController.test.ts` | 15 | Remote management, push, pull, fetch operations |
| Git Status Controller | `GitStatusController.test.ts` | 15 | File status tracking, modified/untracked/staged detection |

#### Models (Zustand Stores)

| Suite | File | Tests | Covers |
|---|---|---|---|
| App View Presenter | `AppViewPresenter.test.tsx` | 18 | Main layout rendering, modal management |
| File Tree Model | `FileTreeModel.test.ts` | 7 | Tree node structure, expansion state, parent tracking |
| Macro Model | `MacroModel.test.ts` | 9 | Recording, playback, action logging, saved macros |
| Search Model | `SearchModel.test.ts` | 13 | Search state, find options, marks, bookmarks, history |
| Snippet Model | `SnippetModel.test.ts` | 10 | Snippet storage, CRUD, language categories |
| Tab Model | `TabModel.test.ts` | 56 | Tab creation, closing, switching, pinning, color coding, restoration |
| UI Model | `UIModel.test.ts` | 40 | Sidebar, zoom, split view, clipboard history, dialog toggles, settings |

#### Services & Helpers

| Suite | File | Tests | Covers |
|---|---|---|---|
| Browser Workspace | `BrowserWorkspace.integration.test.ts` | 9 | File System Access API, directory handles, persistence |
| Browser Workspace Controller | `BrowserWorkspaceController.test.ts` | 30 | File tree sync, watch, read/write operations |
| Credential Storage Service | `CredentialStorageService.test.ts` | 25 | Encryption/decryption, session-only mode, auto-expiry |
| Editor Globals | `EditorGlobals.test.ts` | 13 | Monaco editor instance management, global state |
| File Helpers | `FileHelpers.test.ts` | 44 | Language detection (30+ extensions), line endings, encoding conversion |
| Fuzzy Search Helpers | `FuzzySearchHelpers.test.ts` | 20 | String matching, fuzzy matching, ranking, case sensitivity |
| Id Helpers | `IdHelpers.test.ts` | 2 | ID generation, uniqueness |
| Persistence Service | `PersistenceService.test.ts` | 23 | Local storage, session storage, state persistence, cleanup |
| Platform Bridge | `PlatformBridge.test.ts` | 13 | Platform detection (web/Tauri/Electron), desktop checks |
| Safe Storage Service | `SafeStorageService.test.ts` | 4 | Electron safe storage, encryption, decryption |
| Secure Encryption Service | `SecureEncryptionService.test.ts` | 6 | Encryption/decryption, key initialization, availability checks |
| Tauri Bridge | `TauriBridge.test.ts` | 6 | Tauri API integration, IPC communication |
| Text Helpers | `TextHelpers.test.ts` | 33 | String manipulation, trimming, case conversion, formatting |

#### Hooks

| Suite | File | Tests | Covers |
|---|---|---|---|
| useAIContextMenu | `useAIContextMenu.test.ts` | 13 | Context menu rendering, AI action dispatch |
| useEditorActions | `useEditorActions.test.ts` | 76 | Line operations, text transformation, macro integration |
| useEditorEvents | `useEditorEvents.test.ts` | 23 | Monaco events, selection tracking, content changes |
| useEditorSetup | `useEditorSetup.test.ts` | 13 | Editor initialization, settings application |
| useFocusTrap | `useFocusTrap.test.tsx` | 16 | Keyboard navigation, tab cycling, escape handling |
| useMacroPlayback | `useMacroPlayback.test.ts` | 17 | Action replay, execution timing, error handling |

#### UI Components

| Suite | File | Tests | Covers |
|---|---|---|---|
| AIChatPanelViewPresenter | `AIChatPanelViewPresenter.test.tsx` | 21 | Chat rendering, message display, input handling, streaming |
| AISettingsViewPresenter | `AISettingsViewPresenter.test.tsx` | 29 | Provider settings, API key management, model selection |
| AppViewPresenter | `AppViewPresenter.test.tsx` | 18 | Layout, modal management, app state |
| CommandPaletteViewPresenter | `CommandPaletteViewPresenter.test.tsx` | 12 | Command search, filtering, keyboard navigation |
| DiffViewerViewPresenter | `DiffViewerViewPresenter.test.tsx` | 9 | Diff display, syntax highlighting, file comparison |
| EditorPanelViewPresenter | `EditorPanelViewPresenter.test.tsx` | 18 | Monaco editor integration, tab sync, action dispatch |
| ErrorBoundary | `ErrorBoundary.test.tsx` | 14 | Error catching, fallback rendering, error recovery |
| FeedbackPopupViewPresenter | `FeedbackPopupViewPresenter.test.tsx` | 9 | Feedback display, auto-dismiss, styling |
| FindReplaceViewPresenter | `FindReplaceViewPresenter.test.tsx` | 15 | Find panel, replace functionality, regex support |
| GitPanelViewPresenter | `GitPanelViewPresenter.test.tsx` | 32 | Git status display, branch info, commit UI, diff integration |
| GitSettingsViewPresenter | `GitSettingsViewPresenter.test.tsx` | 26 | Git configuration UI, author settings, remote management |
| MenuBarViewPresenter | `MenuBarViewPresenter.test.tsx` | 13 | Menu rendering, dropdown navigation, action dispatch |
| QuickOpenViewPresenter | `QuickOpenViewPresenter.test.tsx` | 12 | File quick open, search filtering, keyboard shortcuts |
| SidebarViewPresenter | `SidebarViewPresenter.test.tsx` | 12 | Sidebar panels, panel toggle, badge display |
| StatusBarViewPresenter | `StatusBarViewPresenter.test.tsx` | 14 | Cursor position, encoding, language, line ending display |
| TabBarViewPresenter | `TabBarViewPresenter.test.tsx` | 26 | Tab rendering, close buttons, drag-drop indicators |
| TerminalPanelViewPresenter | `TerminalPanelViewPresenter.test.tsx` | 15 | Terminal rendering, command execution, output display |
| ToolbarViewPresenter | `ToolbarViewPresenter.test.tsx` | 20 | Button rendering, action dispatch, icon display |
| WelcomeScreenViewPresenter | `WelcomeScreenViewPresenter.test.tsx` | 19 | Welcome screen, recent files, quick actions |

#### Dialogs

| Suite | File | Tests | Covers |
|---|---|---|---|
| AboutDialogViewPresenter | `AboutDialogViewPresenter.test.tsx` | 11 | About modal, version display, styling |
| Character Range Dialog | `CharInRangeDialogViewPresenter.test.tsx` | 12 | Character code input, validation, display |
| Clone Repository Dialog | `CloneRepositoryViewPresenter.test.tsx` | 12 | Repository URL input, authentication, progress |
| Column Editor Dialog | `ColumnEditorDialogViewPresenter.test.tsx` | 12 | Column operation configuration, text input |
| Go To Line Dialog | `GoToLineDialogViewPresenter.test.tsx` | 10 | Line number input, validation, navigation |
| Run Command Dialog | `RunCommandDialogViewPresenter.test.tsx` | 9 | Command execution, input handling, output |
| Settings Dialog | `SettingsDialogViewPresenter.test.tsx` | 30 | All settings tabs (General, Editor, Appearance, Advanced, Keybindings) |
| Shortcut Mapper Dialog | `ShortcutMapperDialogViewPresenter.test.tsx` | 23 | Shortcut display, filtering, category tabs |
| Snippet Manager Dialog | `SnippetManagerViewPresenter.test.tsx` | 11 | Snippet list, editor, CRUD operations |
| Summary Dialog | `SummaryDialogViewPresenter.test.tsx` | 8 | Summary display, styling |

#### Integration Tests

| Suite | File | Tests | Covers |
|---|---|---|---|
| AI Integration | `AIIntegration.test.ts` | 51 | Multi-provider chat, completions, streaming, token counting |
| AI Action Controller | `AIActionController.test.ts` | 51 | Explain code, fix error, convert language, commit messages |
| AI Model | `AIModel.integration.test.ts` | 20 | Token estimation, context windowing, provider integration |
| Browser Workspace | `BrowserWorkspace.integration.test.ts` | 9 | File System Access API, directory handles, persistence |
| Dialogs | `Dialogs.integration.test.ts` | 15 | Dialog interactions, state management, navigation |
| Editor Panel | `EditorPanelViewPresenter.integration.test.ts` | 43 | Monaco integration, tab sync, action dispatch |
| File Tree Model | `FileTreeModel.integration.test.ts` | 32 | Nested trees, expand/collapse, drag-drop |
| Git Integration | `Git.integration.test.ts` | 40 | Commit, push, pull, branch, merge, stash workflows |
| Macro Model | `MacroModel.integration.test.ts` | 18 | Multi-step macros, action replay, edge cases |
| OAuth Integration | `OAuthIntegration.test.ts` | 6 | GitHub OAuth device flow, token polling |
| Search Model | `SearchModel.integration.test.ts` | 10 | Advanced search patterns, regex, whole word matching |
| Tab Model | `TabModel.integration.test.ts` | 15 | Tab lifecycle, pinning, color coding, restoration |
| Command Registry | `CommandRegistry.test.ts` | 7 | Command registration, category management |
| Editor Panel Params | `EditorPanelViewPresenterParams.test.ts` | 5 | Parameter defaults, state management |

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

- Unit test files go in `src/__tests__/` with the pattern `SourceFileName.test.ts(x)` — matching the source file they test
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
