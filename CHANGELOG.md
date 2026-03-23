# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.0.0] - 2026-03-21

### Added — Compile & Run (73+ Languages)
- **Universal Code Execution**: Run code in 73+ languages on Desktop (Electron/Tauri) and Web, with no "desktop only" limitations
- **Runtime Adapter Architecture**: Unified `RuntimeAdapter` interface with platform-specific backends — DesktopRuntimeAdapter (OS processes), WebJsRuntimeAdapter (sandboxed iframe for JS/TS/CoffeeScript), WebValidationAdapter (JSON/XML/YAML/HTML/CSS/Markdown), WasmRuntimeAdapter (CDN-loaded WASM runtimes for Python, Lua, SQL, and more)
- **WASM Runtime Support**: Lazy-loaded WASM runtimes from CDN via `<script>` tag injection with deduplication; three concrete loaders (Pyodide, Wasmoon, sql.js) plus stub runtimes for future languages
- **Background Caching**: RuntimeCacheService with IndexedDB persistence, predictive preloading based on open file types, and Service Worker registration for offline WASM caching
- **Console Panel**: Resizable console panel with close button, stdin input field, ANSI color support, elapsed time display, drag-to-resize handle, auto-scroll, and status indicators (Console/Running/Completed/Failed/Cancelled)
- **Toolbar Buttons**: 4 new toolbar buttons after macros — Run File, Stop Execution, Run with Arguments, Toggle Console
- **Run Menu Integration**: 6 new menu items (Run File, Run with Arguments, Stop, separator, Clear Console, Toggle Console) added to the Run menu
- **Keyboard Shortcuts**: F5 (Run File), Shift+F5 (Run with Arguments), Ctrl+F5 (Stop Execution), Cmd+Shift+Y (Toggle Console)
- **Language Command Map**: Maps all 73 languages to desktop commands and web runtime types across 5 categories — A (JS-based), B (existing WASM ports), C (Emscripten builds), D (self-hosted compilers), E (custom TS interpreters)
- **Command Registry**: 5 new compile-run commands registered in the Run category

### Added — Testing
- 2 new test files: `CompileRunModel.test.ts` (69 tests), `LanguageCommandMap.test.ts` (63 tests)
- Total: 3,124 unit tests across 146 suites

### Changed
- Version bumped from 4.2.1 to 5.0.0 (major: new execution platform)
- `AppViewPresenter` — added lazy-loaded RunOutputPanelViewPresenter
- `MenuBarViewPresenter` — added compile-run items to Run menu
- `MenuActionController` — added compile-run action handler with dynamic import
- `ShortcutConfig` — added 5 Run category shortcuts
- `ShortcutPresets` — added 5 Run shortcuts to ReSharper preset
- `CommandRegistry` — added 5 compile-run commands
- `Constants` — added compile-run panel, history, output, and timeout constants
- `Store` — added CompileRunSlice to combined Zustand store
- `EventDispatcher` — added COMPILE_RUN_STARTED and COMPILE_RUN_COMPLETED events

### New Files (8 source + 2 test = 10 total)
- `src/Notemac/Services/RuntimeAdapter.ts` — Core RuntimeAdapter interface and types
- `src/Notemac/Services/Runtimes/LanguageCommandMap.ts` — 73-language command/runtime map
- `src/Notemac/Services/Runtimes/DesktopRuntimeAdapter.ts` — Desktop execution via OS processes
- `src/Notemac/Services/Runtimes/WebJsRuntimeAdapter.ts` — Sandboxed iframe execution for JS/TS
- `src/Notemac/Services/Runtimes/WebValidationAdapter.ts` — Validation/preview for JSON/XML/YAML/HTML/CSS
- `src/Notemac/Services/Runtimes/WasmRuntimeAdapter.ts` — CDN-loaded WASM runtime adapter
- `src/Notemac/Services/Runtimes/RuntimeCacheService.ts` — IndexedDB caching + Service Worker
- `src/Notemac/Model/CompileRunModel.ts` — Zustand slice for execution state
- `src/Notemac/Controllers/CompileRunController.ts` — Orchestrator routing to correct adapter
- `src/Notemac/UI/RunOutputPanelViewPresenter.tsx` — Resizable output panel with ANSI colors
- `src/__tests__/CompileRunModel.test.ts` — 69 unit tests for execution state management
- `src/__tests__/LanguageCommandMap.test.ts` — 63 unit tests for language command map

## [4.2.1] - 2026-03-13

### Added — Shortcut Mapping Presets
- **Preset Dropdown**: Select from different shortcut mapping presets via a dropdown in the Shortcut Mapper dialog
- **Notemac++ Default Preset**: Standard Notemac++ keyboard shortcuts (the existing defaults)
- **ReSharper Preset**: JetBrains ReSharper / IntelliJ IDEA style keyboard shortcuts covering all 60 actions with key differences (Cmd+Alt+N for New File, Cmd+Y for Delete Line, Cmd+Shift+A for Command Palette, Alt+1 for Toggle Sidebar, etc.)
- **Plugin Preset Support**: Plugins can register custom shortcut mapping presets via the `PluginContributions.presets` API
- **Preset + Override Merging**: Active preset provides base shortcuts; user overrides persist across preset switches
- **Preset Persistence**: Active preset ID saved to localStorage and restored on app startup

### Added — Testing
- 2 new test files (51 new unit tests) covering ShortcutPresets structure/storage and ShortcutPresetsIntegration (preset+override merging, conflict detection)
- Total: 2,992 unit tests across 144 suites

### Changed
- Version bumped to 4.2.1
- `ShortcutConfig.GetEffectiveShortcuts()` now accepts optional base shortcuts parameter for preset-aware merging
- `ShortcutConfig.FindConflict()` now accepts optional base shortcuts parameter
- `ShortcutConfig.GetShortcutCategories()` and `GetShortcutsByCategory()` accept optional base parameter
- Exported `DEFAULT_SHORTCUTS` from ShortcutConfig (previously unexported)
- Added `activePresetId` state to ShortcutModel with `SetActivePreset` and `LoadActivePresetFromStorage`
- Extended `PluginTypes` with `PluginPresetDef`, `RegisteredPreset`, and `PluginContributions.presets`
- Extended `PluginModel` with `pluginPresets` state and register/unregister methods
- Added `GetActivePresetId`, `GetActivePresetShortcuts`, `SetActivePreset`, `GetAvailablePresets` to ShortcutEditorController
- Updated `AppController.HandleKeyDown` to resolve base shortcuts from active preset
- Updated `ShortcutMapperDialogViewPresenter` with preset dropdown UI
- Updated `AppViewPresenter` to load preset from storage on init

### New Files (1 source + 2 test = 3 total)
- `src/Notemac/Configs/ShortcutPresets.ts` — Preset interfaces, built-in presets (Default + ReSharper), storage helpers
- `src/__tests__/ShortcutPresets.test.ts` — 35 unit tests for preset structure, key differences, storage
- `src/__tests__/ShortcutPresetsIntegration.test.ts` — 16 integration tests for preset+override merging, conflict detection

## [4.2.0] - 2026-03-13

### Added — Keyboard Shortcut Editor
- **Shortcut Customization**: Click any shortcut in the Shortcut Mapper dialog to enter key capture mode — press a new key combination to reassign it
- **Conflict Detection**: Real-time detection of shortcut conflicts with visual warnings showing which action already uses the key combination
- **Per-Row Reset**: Reset individual customized shortcuts back to their default values
- **Reset All**: One-click reset of all shortcut overrides to restore factory defaults
- **Export/Import JSON**: Export all shortcut overrides as JSON for backup or sharing; import from JSON to restore configurations
- **localStorage Persistence**: Custom shortcut overrides persist across sessions via localStorage
- **Dynamic Dispatch**: Replaced hardcoded if-else chains in AppController with a dynamic lookup map from GetEffectiveShortcuts(), making shortcuts instantly responsive to user changes
- **Dynamic Labels**: Menu bar and Command Palette shortcut labels update automatically when shortcuts are customized

### Added — Hex Editor
- **Hex Editor Panel**: Virtualized three-column layout displaying offset, hex bytes, and ASCII representation with virtual scrolling for performance
- **Inline Byte Editing**: Double-click any byte to edit its hex value in-place; changes update the underlying content string
- **Bytes-Per-Row Toggle**: Switch between 8 and 16 bytes per row via toolbar buttons
- **Go To Offset Dialog**: Navigate directly to any byte offset using decimal or hex (0x prefix) input with bounds validation
- **Binary Content Detection**: `IsBinaryContent()` detects null bytes or high non-printable ratio; `IsBinaryExtension()` checks file extensions against known binary types
- **View Mode Toggle**: Switch between text and hex views via View menu; hex mode shows the hex editor, text mode returns to Monaco
- **Hex Search**: Search for hex byte patterns (space-separated hex values) within file content
- **Status Bar Integration**: When in hex mode, status bar shows byte offset and file size instead of line/column

### Added — Testing
- 5 new test files (205 new unit tests) covering HexHelpers, HexEditorController, HexEditorViewPresenter, GoToHexOffsetDialogViewPresenter, and ShortcutEditorController
- Total: 2,941 unit tests across 142 suites

### Changed
- Version bumped to 4.2.0
- Extended `FileTab` interface with `viewMode: 'text' | 'hex'`, `hexByteOffset: number`, `hexBytesPerRow: 8 | 16`
- Added `updateTabViewMode` to TabModel (resets hexByteOffset to 0 when switching to hex)
- Added `showGoToHexOffset` state and setter to UIModel
- Extended ShortcutConfig with `GetEffectiveShortcuts()`, `FindConflict()`, `NormalizeKeyboardEvent()`, and localStorage persistence
- Added ShortcutSlice to Zustand store with `UpdateShortcut`, `ResetShortcut`, `ResetAllShortcuts`, `ExportShortcutsAsJSON`, `ImportShortcutsFromJSON`
- Refactored AppController.HandleKeyDown from if-else chains to dynamic shortcut lookup map
- Updated CommandRegistry with effective shortcuts and 4 new hex editor commands
- Updated MenuActionController with hex editor cases (`view-as-hex`, `view-as-text`, `hex-goto-offset`)
- Updated EditorPanelViewPresenter with conditional hex/text rendering
- Updated StatusBarViewPresenter with hex offset display
- Updated MenuBarViewPresenter with View as Hex/Text toggle
- Updated AppViewPresenter with GoToHexOffset dialog

### New Files (7 source + 5 test = 12 total)
- `src/Shared/Helpers/HexHelpers.ts`
- `src/Notemac/Controllers/HexEditorController.ts`
- `src/Notemac/Controllers/ShortcutEditorController.ts`
- `src/Notemac/Model/ShortcutModel.ts`
- `src/Notemac/UI/HexEditorViewPresenter.tsx`
- `src/Notemac/UI/GoToHexOffsetDialogViewPresenter.tsx`
- `src/Notemac/UI/ShortcutMapperDialogViewPresenter.tsx` (rewritten)

## [3.4.0] - 2026-02-28

### Added — Plugin System
- **Plugin Architecture**: Manifest-based plugin loading with JS bundle support via dynamic `import()` and Blob URLs; plugins provide `activate(context)` / `deactivate()` lifecycle hooks
- **Plugin API**: Sandboxed PluginContext with scoped interfaces — editor (get/set content, selection, language), events (subscribe/dispatch with auto-cleanup), UI (sidebar panels, status bar items, menu items, settings sections, notifications, dialogs), commands (register/execute), themes (register), languages (register), storage (per-plugin localStorage)
- **Plugin Manager Dialog**: Two-tab dialog (Installed/Browse) with enable/disable toggles, reload and uninstall buttons, status indicators (active/inactive/error), search + 2-column grid for browsing registry entries, install progress tracking
- **Plugin Sidebar Panel**: Dynamic rendering of plugin-registered sidebar panels with error boundary wrapping and theme passthrough
- **Plugin Status Bar Items**: Left/right positioning with priority sorting, error boundary isolation per item
- **Plugin Settings Sections**: Plugin-registered settings rendered in the Settings dialog under a new "Plugins" tab
- **Plugin Dialog Wrapper**: Generic modal for plugin-provided dialog components with Escape/backdrop close and error boundary
- **Plugin Error Boundary**: React error boundary catching render errors from plugin components — shows plugin name, error message, and "Disable Plugin" button
- **Plugin Registry**: Remote registry fetching with demo fallback entries; search, install, uninstall, and update checking
- **Plugin Shortcuts**: `Cmd+Shift+X` opens Plugin Manager; Plugins category in Shortcut Mapper

### Added — Testing
- **13 new test files** following 1:1 naming convention — comprehensive unit tests covering PluginTypes, PluginModel, PluginLoaderService, PluginAPIService, PluginRegistryService, PluginController, PluginErrorBoundary, PluginSidebarPanelViewPresenter, PluginStatusBarViewPresenter, PluginSettingsSectionViewPresenter, PluginManagerViewPresenter, PluginDialogViewPresenter, and PluginIntegration

### Changed
- Version bumped to 3.4.0
- Extended `AppSettings` with `pluginsEnabled` and `pluginRegistryUrl`
- Extended `SidebarPanel` enum with `'plugins'` and `\`plugin:\${string}\`` variants
- Added 5 new events to EventDispatcher: PLUGIN_ACTIVATED, PLUGIN_DEACTIVATED, PLUGIN_ERROR, PLUGIN_INSTALLED, PLUGIN_UNINSTALLED
- Added 6 new constants: PLUGIN_DIRECTORY_NAME, PLUGIN_MANIFEST_FILENAME, PLUGIN_REGISTRY_URL, PLUGIN_API_VERSION, PLUGIN_STORAGE_PREFIX, UI_PLUGIN_MANAGER_DIALOG
- Added PluginSlice to Zustand store (9th composable slice)
- Updated SidebarViewPresenter with plugin icon and panel rendering
- Updated StatusBarViewPresenter with plugin status bar items
- Updated AppViewPresenter with Plugin Manager and Plugin Dialog rendering + InitializePluginSystem on mount
- Updated MenuActionController with 'show-plugin-manager', 'reload-plugins', and dynamic plugin command dispatch
- Updated ShortcutConfig with Plugins category (Cmd+Shift+X)
- Updated SettingsDialogViewPresenter with Plugins section

### New Files (12 source + 13 test = 25 total)
- `src/Notemac/Commons/PluginTypes.ts`
- `src/Notemac/Model/PluginModel.ts`
- `src/Notemac/Services/PluginLoaderService.ts`
- `src/Notemac/Services/PluginAPIService.ts`
- `src/Notemac/Services/PluginRegistryService.ts`
- `src/Notemac/Controllers/PluginController.ts`
- `src/Notemac/UI/PluginErrorBoundary.tsx`
- `src/Notemac/UI/PluginSidebarPanelViewPresenter.tsx`
- `src/Notemac/UI/PluginStatusBarViewPresenter.tsx`
- `src/Notemac/UI/PluginSettingsSectionViewPresenter.tsx`
- `src/Notemac/UI/PluginDialogViewPresenter.tsx`
- `src/Notemac/UI/PluginManagerViewPresenter.tsx`

## [3.3.0] - 2026-02-28

### Added — Editor Enhancements
- **Breadcrumb Navigation**: File path and symbol breadcrumbs above the editor — click segments to navigate to files, folders, or code symbols; auto-updates on cursor movement
- **Sticky Scroll**: Pins function/class headers at the top of the editor while scrolling through their bodies — toggle via View menu or settings
- **Code Formatting (Prettier)**: Format document or selection on command (`Ctrl+Shift+I`), with optional format-on-save; supports JavaScript, TypeScript, HTML, CSS, JSON, Markdown, and more
- **Linting & Diagnostics**: Inline errors/warnings with severity markers, quick-fix suggestions, a dedicated Problems panel with error/warning counts, and go-to-next/previous-error navigation
- **Emmet Support**: Expand HTML/CSS abbreviations (e.g., `div.container>ul>li*3` → full HTML) with intelligent completion in HTML, CSS, JSX, TSX, and more
- **Print Support**: Format and print current document or selection with syntax highlighting, configurable line numbers, font size, headers/footers, and a full print preview dialog

### Added — Git & Collaboration
- **Git Blame View**: Line-by-line blame annotations showing author, date, commit hash, and message; toggle via View menu; cached per file for performance
- **Git Stash Management**: Stash, pop, apply, drop, and list stashes from the Git panel; stash messages, date display, and automatic re-indexing
- **Merge Conflict Resolution**: Visual inline merge with Accept Current / Accept Incoming / Accept Both controls; automatic conflict marker detection (`<<<<<<<`, `=======`, `>>>>>>>`); bulk resolve-all actions
- **Collaborative Editing**: Real-time multi-user editing via WebRTC with Yjs CRDT-based conflict resolution; create/join sessions with shareable room IDs; live peer cursors with colored labels; peer avatars in status bar

### Added — Testing
- **23 new test files** following 1:1 naming convention — comprehensive unit tests for all 10 new features covering controllers, services, and view presenters
- **New dependencies**: `prettier`, `emmet`, `yjs`, `y-webrtc`, `y-monaco`

### Changed
- Version bumped to 3.3.0 (10 new features, 5 new dependencies)
- Updated `useEditorActions.ts` with 14 new action cases
- Updated `Git/index.ts` to export 3 new controllers (Blame, Stash, Merge)
- Extended `AppSettings` with 6 new configuration options
- Added 10 new events to EventDispatcher

## [3.2.0] - 2026-02-27

### Added
- **Comprehensive test coverage**: 1,728 unit tests across 91 test suites — every source file with testable logic now has a dedicated test file
- **Test naming convention**: All test files renamed to match their source file (`SourceFileName.test.ts(x)`), making it instant to find the test for any source file
- **Integration test convention**: Integration/deep tests use `.integration.` in the file name (e.g., `AIModel.integration.test.ts`)
- **New test files**: Split multi-source test files into individual per-source files — 7 Git controller tests, 6 dialog tests, 3 persistence service tests, and more
- **TabModel consolidated test**: Merged duplicate tab test suites into a single comprehensive 56-test file

### Improved
- **Dead code removal**: Removed all unused exports, imports, and unreachable code paths identified during test audit
- **Test warnings eliminated**: Fixed React `act()` warnings and duplicate object key warnings in test suites
- **Documentation**: Complete rewrite of `docs/TESTING.md` with accurate test counts, file names, and categorized tables

## [3.1.0] - 2026-02-20

### Added
- **Custom Theme Color Picker**: New color customization system in Preferences > Appearance that lets users customize every color property of any built-in theme
  - 30 color pickers organized into 8 groups (Backgrounds, Text, Accent & Status, Borders & Scrollbar, Tabs, Menu, Status Bar, Sidebar)
  - Changing any color automatically creates a "Custom" theme based on the current theme
  - Base theme selector for choosing which built-in theme to customize from
  - Individual color reset buttons to revert specific customizations
  - "Reset All" button to return to the base theme
  - Override counter showing how many colors have been customized
  - Resetting the last override automatically switches back to the base theme
- **30 new tests**: 18 unit tests covering custom theme creation, color merging, metadata validation, and settings defaults; 12 UI tests covering color picker rendering, auto-custom switching, reset behaviors, and state persistence

## [3.0.0] - 2026

### Major: Tauri Desktop Shell
- **Tauri v2 migration**: Added Tauri as the primary desktop shell, reducing packaged app size from ~50MB (Electron) to ~10-15MB by using the system WebView (WKWebView on macOS) instead of bundling Chromium
- **Rust backend**: Complete Tauri command layer (`src-tauri/`) with file operations (`read_file`, `write_file`, `read_dir`, `file_exists`, `rename_file`), native dialogs (open/save file, open folder, message box), window management (always-on-top, minimize, maximize), and credential storage via OS keychain (`keyring` crate)
- **Native menu system**: ~100 menu items implemented in Rust matching every Electron menu action — File, Edit, Search, View, Encoding, Language, Settings, Tools, Macro, and Window menus
- **Platform abstraction layer**: New `PlatformBridge.ts` + `TauriBridge.ts` provide clean `detectPlatform()` and bridge initialization so the React frontend works seamlessly with Tauri, Electron, or plain browser
- **Frontend integration**: `FileController`, `GitFileSystemAdapter`, `SafeStorageService`, and `AppViewPresenter` updated with Tauri IPC paths alongside existing Electron paths
- **Tauri E2E tests**: 8 Playwright test suites (`e2e-tauri/`) mirroring all Electron E2E tests — app launch, IPC commands, file operations, UI integration, window management, menu actions, line operations, and native features
- **CI/CD**: GitHub Actions `tauri-build` job on macOS runner with Rust toolchain and cargo caching
- **Backward compatible**: Electron shell fully preserved — both desktop shells coexist

### Improved
- **Documentation**: README updated with Tauri build commands, tech stack entry, comparison table size (10-15MB), and roadmap
- **`.gitignore`**: Added `src-tauri/target/`, `playwright-report/`, `test-results/`
- **Test infrastructure**: `test:e2e:all` script now runs web, Electron, and Tauri E2E suites

## [2.4.0] - 2026

### Architecture
- **GitController split**: 908-line monolith split into 7 focused modules (`Git/GitInitController.ts`, `GitStatusController.ts`, `GitCommitController.ts`, `GitBranchController.ts`, `GitRemoteController.ts`, `GitLogController.ts`, `GitAutoFetchController.ts`) with backward-compatible re-exports
- **EditorPanelVP split**: 1048-line component split into 4 custom hooks (`useEditorActions`, `useEditorSetup`, `useEditorEvents`, `useMacroPlayback`)

### Performance
- **Inline style extraction**: Created `useStyles(theme)` memoized hooks in 11 ViewPresenter files, eliminating hundreds of style object re-creations per render
- **React key anti-patterns**: Replaced 25+ array-index keys (`key={i}`) with stable unique identifiers across all list renderings

### TypeScript Strictness
- Enabled `noUnusedLocals: true` and `noUnusedParameters: true` in tsconfig.json
- Fixed 83 unused variable/import/parameter errors across 30+ files
- Converted unused imports to `import type`, prefixed unused params with `_`

### Accessibility
- **Keyboard navigation**: Arrow key navigation for file tree (Up/Down/Left/Right to navigate and expand/collapse), Enter to open files
- **Menu keyboard support**: Alt+key shortcuts for menu bar, arrow keys within menus

### Testing
- **5 new UI test suites** (83 new tests): ToolbarVP, StatusBarVP, WelcomeScreenVP, ErrorBoundary, useFocusTrap hook
- Total: 546 tests across 27 test suites (up from 463/22)

### Fixed
- **useFocusTrap**: Unsafe `document.activeElement as HTMLElement` replaced with `instanceof` check

## [2.3.0] - 2026

### Zero `any` Milestone
- **Complete type safety**: Eliminated every remaining `any` type annotation across the entire production codebase — 0 instances of `any` in `.ts` and `.tsx` files
- **Proper discriminated union for MacroAction**: `type: 'type' | 'delete' | 'move' | 'select' | 'command'` with narrowed `data` fields
- **Menu action value type**: `boolean | string | number` union replaces `any` with proper narrowing at all consumption sites
- **EditorGlobals type**: `EditorActionFn` properly typed as `(action: string, value?: boolean | string | number) => void`

### Fixed
- **Race condition**: `AIModel.LoadAIState()` — sync `set({credentials: []})` was running after async `RetrieveSecureValue` was kicked off, overwriting credentials on resolve. Reordered to set sync state first, then async credentials
- **Memory safety**: `SidebarViewPresenter` — `FileSystemHandle` iterator entries now properly cast with kind checks (`FileSystemFileHandle` / `FileSystemDirectoryHandle`)
- **React hooks**: `EditorPanelViewPresenter` — added missing `updateTabContent`, `tab.scrollTop`, `updateTab` to `useCallback` dependency arrays

### Improved
- **Accessibility**: All 9 dialog/modal components now have `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to titled headings (GoToLine, ShortcutMapper, ColumnEditor, CharInRange, FeedbackPopup, Summary, RunCommand, Settings, About)
- **CSS hover utilities**: Replaced 16 direct DOM style mutations (`onMouseEnter`/`onMouseLeave`) with CSS classes using custom properties (`hover-bg`, `hover-color`, `hover-opacity`, `hover-border`, `hover-bg-color`)
- **vite-env.d.ts**: All Window interface declarations properly typed (no `any[]`, uses `FileTreeNode[]`, proper callback signatures)

## [2.2.2] - 2026

### Fixed
- **Critical**: `GitFileSystemAdapter.ts` — `null !== typeof window` (always true) corrected to `'undefined' !== typeof window`; was causing incorrect environment detection
- **Critical**: `SecureEncryptionService.ts` — `String.fromCharCode(...combined)` stack overflow on large Uint8Arrays replaced with loop-based approach

### Improved
- **Type safety**: Eliminated `any` types from UIModel (Immer Draft), SearchModel (FindResult[]), SnippetController (Monaco types), FileController (typed IPC callbacks), ThemeConfig (Monaco namespace), EventDispatcher (T = unknown), MacroAction (typed data), GitFileSystemAdapter (FsReadOptions, FsStat, typed return values)
- **Code deduplication**: Extracted `RunCodeAction` helper in AIActionController — 5 code-action functions reduced from ~200 to ~40 lines
- **Constants extraction**: `AI_INLINE_MAX_CONTEXT_CHARS`, `AI_COMMIT_MESSAGE_MAX_TOKENS`, `AI_COMMIT_MESSAGE_TEMPERATURE`, `AI_COMMIT_SUMMARY_MAX_CHARS`, `ANTHROPIC_API_VERSION` — replacing hardcoded values across 3 controllers

## [2.2.1] - 2026

### Fixed
- **DiffViewerViewPresenter**: Fixed missing `setShowDiffViewer` in `useCallback` dependency array (could cause stale closure)
- **AIModel**: Added missing `.catch()` handler on credential retrieval promise in `LoadAIState`

### Improved
- **Error typing**: Replaced all `catch (error: any)` with `catch (error: unknown)` across AIActionController, LLMController, GitController, and AuthController (14 instances)
- **EditorGlobals typing**: Properly typed with `editor.IStandaloneCodeEditor` and typed action function instead of `any`
- **CompletionController typing**: Full Monaco type imports (`MonacoNamespace`, `editor.IStandaloneCodeEditor`, `editor.ITextModel`, `IDisposable`, `FileTreeNode`) replacing all `any` params
- **GitController typing**: `FsClient` from isomorphic-git replaces `any` for filesystem cache and parameters; typed `BuildOnAuth` return
- **LLMController typing**: `Record<string, unknown>` for request body builders and variables instead of `any`
- **Magic number extraction**: Replaced hardcoded `zIndex: 10000` with `UI_ZINDEX_MODAL` constant across 5 ViewPresenters; replaced dimension magic numbers in QuickOpenViewPresenter with `UI_COMMAND_PALETTE_*` constants

## [2.2.0] - 2026

### Improved
- **Zero `as any` casts**: Eliminated ALL remaining type-unsafe casts from production code (45→0)
- **Generic SelectField component**: Settings dropdowns now fully type-safe with generic type parameters
- **FileTreeNode type**: Added `handle` property to interface, removing unsafe casts for File System Access API
- **WeakMap for editor disposables**: Replaced runtime property patching (`editor.__completionDisposables`) with a type-safe WeakMap
- **Zustand store typing**: Properly typed cross-slice state creator and store method access
- **Specific type assertions**: Replaced broad `as any` with precise union types for settings enums, line endings, auth types, and column editor formats
- **Promise error handling**: All `.then()` chains now have `.catch()` handlers
- **Empty catch blocks**: All catch blocks now have descriptive comments

## [2.1.0] - 2026

### Changed
- **New App Icon**: Octopus mascot with notepad design, replacing previous icon across all platforms
- All icon variants regenerated (1024, 512, 256, 128, 64, 32, 16) plus macOS .icns

### Fixed
- **Git auto-detection**: Opening a folder now automatically detects if it's a git repository (web and Electron)
- Directory handle was not registered with the git filesystem adapter when opening folders via file picker
- Electron `onFolderOpened` handler now initializes git workspace detection
- Filesystem cache is properly invalidated when switching workspaces

### Improved
- **Type safety**: Added proper Window interface declarations for `showDirectoryPicker`, `showOpenFilePicker`, and `runCommand`, eliminating 7 unnecessary `as any` casts
- **Error handling**: Added try/catch blocks to all async file input handlers in MenuActionController and ViewPresenters
- **Error handling**: Added error handling to OAuth flow and git authentication test in GitSettingsViewPresenter
- **Code quality**: Empty catch blocks now have descriptive comments explaining why errors are suppressed
- **RunCommand dialog**: Fixed type mismatch — properly extracts stdout/stderr from command result object
- **Documentation**: Updated test count from 450+ to accurate 463, updated all docs pages

## [2.0.0] - 2026

### Added
- **Git Integration**: Clone, commit, push, pull, branch management, visual diff viewer, GitHub OAuth Device Flow
- **AI Assistant**: Multi-provider LLM support (OpenAI, Anthropic, Google, Mistral, Groq, custom), chat panel, inline completions, code actions (explain, refactor, fix, document, test)
- **Terminal Panel**: Integrated command execution with history and resizable panel
- **Snippet Manager**: Create, edit, delete, and insert code snippets with persistence
- **Credential Security**: AES-GCM encryption (web), Electron safeStorage (desktop), session-only defaults, auto-expiry (AI 24h, Git 8h), silent migration from plaintext
- **GitHub OAuth Device Flow** for Git authentication
- **280+ new unit tests** (450+ total, up from 163)

### Changed
- Session-only credential storage by default (opt-in to persist with encryption)
- Sidebar icons always visible; panel expands on click
- Improved performance with React.memo on sub-components and memoized computations
- All hardcoded UI values extracted to named constants
- Window globals replaced with module-level EditorGlobals accessors
- CI workflow now includes linting step

### Fixed
- Memory leak in sidebar resize handler (event listeners not cleaned up on unmount)
- Missing error handling in async file operations
- File System Access API calls now properly typed (eliminated `as any` casts)

## [1.0.0] - 2025

Initial release of Notemac++: A powerful, feature-rich text and source code editor for macOS and Web, inspired by Notepad++.

### Added

#### Editor
- **Monaco Editor** integration with full code intelligence
- **Syntax highlighting** for 70+ programming languages (C, C++, Python, JavaScript, TypeScript, Rust, Go, Java, Ruby, PHP, Swift, Kotlin, SQL, HTML/CSS, Markdown, and more)
- **Multi-cursor editing** for simultaneous edits at multiple locations
- **Code folding** with 8 levels of granularity for better code navigation
- **Bracket matching** and auto-closing for brackets and quotes
- **Smart auto-indent** based on language context
- **Comment toggling** for both line and block comments
- **Configurable indentation** — tab size, spaces vs. tabs
- **Virtual space mode** and smooth scrolling
- **Minimap** for quick visual navigation
- **Indent guides** to visualize indentation levels
- **Word wrap** with optional wrap symbols
- **Whitespace and EOL visualization** for debugging formatting issues
- **Line numbers** with current-line highlighting
- **Selection highlighting** for all matching occurrences

#### Tabs & Workspace
- **Drag-and-drop tab reordering** for flexible workspace arrangement
- **Pin tabs** to prevent accidental closure
- **Color-code tabs** with 6 colors (red, green, blue, orange, magenta, none)
- **Visual indicators** for modified, pinned, and read-only files
- **Context menu** with Close, Close Others, Close to Left/Right, Close Unchanged, Close All but Pinned
- **Middle-click to close** for quick tab dismissal
- **Restore last closed tab** with full undo history
- **Recent files list** tracking last 20 files
- **Clone tab to split view** for side-by-side editing

#### Find & Replace
- **Find with regex** support for complex pattern matching
- **Find options** — case-sensitive, whole-word, wrap-around
- **Replace single or all** occurrences
- **Find in Files** across entire workspace
- **Incremental search** with live results as you type
- **Mark system** with 5 visual styles for color-coding matches
- **Bulk operations on marks** — cut, copy, delete, replace, or inverse
- **Go to Line** dialog for quick navigation
- **Go to Matching Bracket** for paired symbol navigation
- **Bookmark system** — toggle, navigate, clear all
- **Search Results panel** for organized match browsing

#### Split View
- **Horizontal or vertical split** for flexible pane arrangement
- **Clone any tab** into the split pane
- **Synchronized scrolling** — vertical and/or horizontal
- **Close split** to return to single-pane mode

#### Themes
- **7 built-in color themes**:
  - Mac Glass — warm orange/amber glassmorphism (default)
  - Dark (VS Code Dark) — modern dark theme
  - Light (VS Code Light) — clean light theme
  - Monokai — classic warm palette
  - Dracula — purple-toned dark theme
  - Solarized Dark — Ethan Schoonover's dark variant
  - Solarized Light — Ethan Schoonover's light variant
- **Comprehensive theming** covering editor, tabs, sidebar, menus, dialogs, and status bar
- **Persistent theme selection** across sessions

#### Macros
- **Record keyboard actions** — typing, deletions, cursor movement, commands
- **Playback recorded macros** with single keystroke
- **Run macro multiple times** with customizable count dialog
- **Save macros** with custom names for reuse
- **Recording indicator** in status bar for visual feedback

#### Sidebar & Panels
- **File Explorer** — open folders as workspaces, browse tree structure, click to open files
- **Document List** — quick overview of all open tabs
- **Function List** — code symbol navigation for quick method/class jumping
- **Clipboard History** — last 50 clipboard entries for paste recovery
- **Character Panel** — inspect character details and Unicode code points
- **Search Results** — organized display of find-in-files results
- **Resizable sidebar** with 150–500px width range
- **Toggle sidebar** with `Cmd+B`

#### Encoding & Line Endings
- **Wide encoding support**:
  - UTF-8, UTF-8 BOM
  - UTF-16 LE/BE
  - Windows code pages (1250–1258)
  - ISO 8859 family (Latin-1 through Latin-10)
  - KOI8-R/U (Cyrillic)
  - CJK encodings (Big5, GB2312, Shift JIS, EUC-KR)
  - DOS/OEM code pages
- **Line ending detection** and conversion (LF, CRLF, CR)
- **Automatic line ending normalization** on file load

#### Line Operations
- **Sort lines** — ascending, descending, case-insensitive, by length
- **Remove duplicate lines** — all or consecutive only
- **Remove empty lines** including whitespace-only lines
- **Trim whitespace** — leading, trailing, or both
- **EOL and indentation conversion** — convert EOL to spaces, TAB to spaces, spaces to TAB
- **Insert blank lines** above or below current selection
- **Reverse line order** for upside-down text effects

#### Tools & Utilities
- **Hash generation** — MD5, SHA-1, SHA-256, SHA-512 from text or file
- **Copy hash to clipboard** for easy integration
- **Base64 encode/decode** for data serialization
- **URL encode/decode** for web data handling
- **JSON format** — pretty-print and minify JSON
- **Character encoding conversion** between supported formats

#### Case Conversion
- **6 text case transforms**:
  - UPPERCASE
  - lowercase
  - Proper Case
  - Sentence case
  - iNVERT cASE
  - RaNdOm CaSe

#### Additional Features
- **Distraction-Free Mode** — hides all UI chrome for focused writing
- **Always on Top** — keep editor above other windows for reference
- **Monitoring (tail -f)** — live file watching with auto-scroll
- **Column Editor** — multi-line vertical editing
- **Run Command** — execute shell commands from within the editor
- **Search on Google/Wikipedia** — quick web lookups for selected text
- **Open in Browser** — preview files directly in default browser
- **Insert Date/Time** — configurable date/time insertion
- **File Summary** — line, word, and character counts at a glance
- **Session Save/Load** — persist workspace across application restarts
- **Copy File Path/Name/Dir** — quick file path operations

#### Desktop (macOS)
- **Native Electron app** for seamless macOS integration
- **Portable DMG** — run directly from disk image without installation
- **Installable DMG** — drag to Applications for standard installation
- **Menu bar integration** with standard macOS shortcuts
- **Native file dialogs** for open/save operations
- **Dock integration** with custom icon

#### Testing
- **163 comprehensive unit tests** covering:
  - Tab management and lifecycle
  - Search and replace functionality
  - Macro recording and playback
  - UI state management
  - File tree operations
  - Configuration handling
  - Helper utility functions
- **Vitest framework** for fast, modern testing
- **100% test pass rate** on initial release

---

[5.0.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v5.0.0
[4.2.1]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v4.2.1
[4.2.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v4.2.0
[3.4.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v3.4.0
[3.3.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v3.3.0
[3.2.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v3.2.0
[3.1.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v3.1.0
[3.0.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v3.0.0
[2.4.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.4.0
[2.3.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.3.0
[2.2.2]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.2.2
[2.2.1]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.2.1
[2.2.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.2.0
[2.1.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.1.0
[2.0.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.0.0
[1.0.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v1.0.0
