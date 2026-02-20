# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **6 built-in color themes**:
  - Dark (VS Code Dark) — default modern dark theme
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

[3.0.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v3.0.0
[2.4.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.4.0
[2.3.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.3.0
[2.2.2]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.2.2
[2.2.1]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.2.1
[2.2.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.2.0
[2.1.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.1.0
[2.0.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v2.0.0
[1.0.0]: https://github.com/sergioadevita/notemac-plus-plus/releases/tag/v1.0.0
