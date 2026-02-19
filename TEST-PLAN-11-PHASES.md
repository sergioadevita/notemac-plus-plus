# Notemac++ Comprehensive Test Coverage Plan — 11 Phases

## Current State
- **768 unit tests** (31 files) — Vitest
- **392 web E2E tests** (25 spec files) — Playwright/Chromium
- **55 Electron E2E tests** (4 spec files) — Playwright/Electron
- **Total: 1,215 tests**

## Goal
Full QA-level coverage of every UI component, panel, dialog, keyboard shortcut, and user flow — both web and Electron.

---

## Phase 1: EditorPanel & Monaco Editor Interactions
**Component:** `EditorPanelViewPresenter.tsx`
**New tests: ~30 E2E + ~15 unit**

- Editor renders with correct language/theme for active tab
- Switching tabs updates editor content and language
- Editor respects word wrap setting toggle
- Editor respects font size / zoom level
- Minimap visibility toggle
- Line numbers visibility toggle
- Tab size / indent settings (spaces vs tabs)
- Cursor position updates StatusBar (line:column)
- Editor receives focus on tab switch
- Code folding (fold/unfold all, fold region)
- Multi-cursor editing (Alt+Click adds cursor)
- Content change marks tab as modified (dot indicator)
- Read-only mode when applicable
- Large file handling (1000+ lines loads without freeze)
- Editor context menu (right-click) appears with expected items
- AI context menu items (Explain, Refactor, etc.) appear on selection
- Split view: two editors side by side with independent scroll
- Split view: content sync when editing same file

---

## Phase 2: TabBar & Tab Interactions (Deep)
**Component:** `TabBarViewPresenter.tsx`
**New tests: ~25 E2E + ~10 unit**

- Tab renders with correct name, icon, and modified indicator
- New tab button creates untitled tab
- Clicking tab switches active tab
- Double-click tab triggers rename (if supported)
- Middle-click tab closes it
- Tab close button appears on hover
- Pinned tab shows pin icon and no close button
- Tab color shows colored indicator
- Tab overflow scroll when many tabs open (10+)
- Drag and drop reorder preserves all tab metadata
- Context menu: all 10+ options work correctly
- Context menu: "Close Others" leaves only clicked tab
- Context menu: "Close to the Right/Left" works correctly
- Context menu: "Close Unchanged" only closes unmodified tabs
- Context menu: "Clone to Split View" creates split editor
- Tab tooltip shows full file path
- Recently closed tabs can be restored (Cmd+Shift+T)
- Tab order persistence across session save/load

---

## Phase 3: FindReplace Panel
**Component:** `FindReplaceViewPresenter.tsx`
**New tests: ~30 E2E + ~10 unit**

- Find panel opens on Cmd+F with focus in search input
- Find highlights all matches in editor
- Find Next/Previous navigates between matches
- Match count displayed correctly (e.g., "3 of 12")
- Case sensitive toggle changes match results
- Whole word toggle changes match results
- Regex mode toggle works with valid patterns
- Regex mode shows error for invalid patterns
- Replace single replaces current match and moves to next
- Replace All replaces all matches at once
- Replace All reports count of replacements
- Find in selection only searches within selected text
- Mark feature highlights matches with colored markers
- Mark colors (5 colors) can be toggled
- Clear all marks removes highlights
- Search preserves history (up/down arrow in input)
- Escape closes find panel
- Find panel state persists when reopened
- Find with empty query shows no matches
- Find across wrapped content works correctly
- Incremental search highlights as you type

---

## Phase 4: Sidebar, FileTree, & Panel Switching
**Components:** `SidebarViewPresenter.tsx`, FileTree rendering
**New tests: ~25 E2E + ~10 unit**

- Sidebar toggle (Cmd+B) shows/hides sidebar
- Sidebar width is resizable by dragging
- Sidebar minimum width enforced
- Panel switching: Explorer, Git, AI panels
- Explorer panel: file tree renders folder structure
- Explorer panel: clicking file opens it in editor tab
- Explorer panel: folder expand/collapse works
- Explorer panel: right-click context menu on files
- Explorer panel: right-click context menu on folders
- Search panel (Cmd+Shift+F): search across all tabs
- Search panel: results show file name and line number
- Search panel: clicking result navigates to match
- Functions panel: lists functions/classes in active file
- Character panel: shows character info at cursor
- Clipboard history panel: shows recent clipboard items
- Clipboard history panel: clicking item pastes it
- Document list panel: shows all open documents
- Terminal panel: toggle with keyboard shortcut
- Sidebar remembers last selected panel
- Sidebar panel badges/indicators update correctly

---

## Phase 5: All 13 Dialogs (Rendering & Interaction)
**Components:** All `*DialogViewPresenter.tsx` + modals
**New tests: ~50 E2E + ~25 unit**

- **Settings Dialog:** Opens, shows all setting categories, toggle changes persist, close saves
- **Settings Dialog:** Editor tab (font size, tab size, word wrap, minimap, line numbers)
- **Settings Dialog:** Theme tab switches theme
- **Settings Dialog:** Reset to defaults works
- **GoToLine Dialog:** Opens, accepts line number, navigates editor, handles invalid input
- **About Dialog:** Opens, shows version/credits, close works
- **Run Command Dialog:** Opens, input field works, execute runs command (Electron only)
- **Column Editor Dialog:** Opens, number sequence generation, column text insertion
- **Summary Dialog:** Opens, shows accurate word/char/line counts for active file
- **CharInRange Dialog:** Opens, generates character range between two values
- **Shortcut Mapper Dialog:** Opens, shows all categories, shows all shortcuts
- **Shortcut Mapper Dialog:** Search/filter shortcuts works
- **Shortcut Mapper Dialog:** Rebind shortcut (record new key combo)
- **Diff Viewer Dialog:** Opens with two-pane diff view
- **Diff Viewer Dialog:** Shows added/removed/changed lines correctly
- **Snippet Manager Dialog:** Opens, lists all snippets
- **Snippet Manager Dialog:** Create new snippet with name, prefix, body, language
- **Snippet Manager Dialog:** Edit existing snippet
- **Snippet Manager Dialog:** Delete snippet with confirmation
- **Snippet Manager Dialog:** Search/filter snippets
- **Clone Repository Dialog:** Opens, URL input, credential fields
- **Git Settings Dialog:** Opens, shows credential tabs (token, username/password)
- **Git Settings Dialog:** Author name/email fields
- **Git Settings Dialog:** CORS proxy configuration
- **AI Settings Dialog:** Opens, shows provider list
- **AI Settings Dialog:** Add/edit API key for provider
- **AI Settings Dialog:** Model selection per provider
- **AI Settings Dialog:** Inline completion toggle
- **AI Settings Dialog:** Temperature sliders

---

## Phase 6: Git Panel & Git Workflows
**Component:** `GitPanelViewPresenter.tsx`, `GitSettingsViewPresenter.tsx`, `CloneRepositoryViewPresenter.tsx`
**New tests: ~30 E2E + ~15 unit**

- Git panel shows "No repository" when not initialized
- Git panel init button creates new repo
- Git panel shows current branch name
- Git panel shows staged/unstaged/untracked file lists
- Stage file: clicking + icon moves file to staged
- Unstage file: clicking - icon moves file to unstaged
- Stage all: stages all changed files at once
- Discard changes: reverts file to HEAD version
- Commit: message input, commit button, success feedback
- Commit: disabled when no staged files
- Commit: disabled when message is empty
- Branch dropdown: shows all local branches
- Branch switching: checkout changes branch, refreshes status
- Create new branch: name input, optional checkout
- Delete branch: confirmation, cannot delete current branch
- Pull/Push buttons: trigger operations with progress
- Pull/Push: error display for auth failures
- Commit log: shows recent commits with message/author/date
- File diff: clicking staged file shows diff preview
- Clone dialog: URL validation, progress display
- Git settings: credential save/load
- Git settings: author info save/load

---

## Phase 7: AI Chat Panel & AI Features
**Component:** `AIChatPanelViewPresenter.tsx`, `AISettingsViewPresenter.tsx`
**New tests: ~25 E2E + ~15 unit**

- AI panel shows empty state when no conversation
- AI panel: type message and send
- AI panel: user message appears in chat
- AI panel: assistant response appears (mocked)
- AI panel: streaming response shows typing indicator
- AI panel: code blocks render with syntax highlighting
- AI panel: copy code block button works
- AI panel: conversation history scrollable
- AI panel: new conversation button starts fresh
- AI panel: conversation list shows all conversations
- AI panel: switch between conversations
- AI panel: delete conversation
- AI context menu on editor selection: Explain Code
- AI context menu: Refactor Code (shows diff)
- AI context menu: Generate Tests
- AI context menu: Generate Documentation
- AI context menu: Fix Error
- AI context menu: Simplify Code
- AI context menu: Convert Language
- AI inline completions: ghost text appears (mocked)
- AI inline completions: Tab accepts suggestion
- AI inline completions: Escape dismisses
- AI settings: provider/model/key configuration
- AI commit message generation in Git panel

---

## Phase 8: MenuBar, Toolbar, Command Palette & Quick Open
**Components:** `MenuBarViewPresenter.tsx`, `ToolbarViewPresenter.tsx`, `CommandPaletteViewPresenter.tsx`, `QuickOpenViewPresenter.tsx`
**New tests: ~30 E2E + ~15 unit**

- MenuBar renders all top-level menus (File, Edit, Search, View, etc.)
- MenuBar: each menu opens on click and shows submenu items
- MenuBar: submenu items trigger correct actions
- MenuBar: keyboard navigation (arrow keys) through menus
- MenuBar: accelerator keys shown next to items
- MenuBar: disabled items appear grayed out
- Toolbar: all buttons render with correct icons
- Toolbar: each button triggers correct action
- Toolbar: tooltips shown on hover
- Toolbar: buttons reflect current state (e.g., word wrap active)
- Command Palette: opens on Cmd+Shift+P
- Command Palette: fuzzy search filters commands
- Command Palette: selecting command executes it
- Command Palette: keyboard navigation (up/down/enter)
- Command Palette: shows all registered commands
- Command Palette: shows shortcut next to each command
- Command Palette: escape closes palette
- Command Palette: recently used commands shown first
- Quick Open: opens on Cmd+P
- Quick Open: fuzzy search filters open tabs
- Quick Open: selecting file switches to that tab
- Quick Open: shows file path in subtitle
- Quick Open: keyboard navigation works
- Quick Open: escape closes

---

## Phase 9: StatusBar, Zoom, Macro, & Welcome Screen
**Components:** `StatusBarViewPresenter.tsx`, `WelcomeScreenViewPresenter.tsx`, macro system
**New tests: ~25 E2E + ~10 unit**

- StatusBar shows line:column position (updates on cursor move)
- StatusBar shows character count / word count
- StatusBar shows file language (clickable to change)
- StatusBar shows encoding (clickable to change)
- StatusBar shows EOL type (LF/CRLF/CR, clickable)
- StatusBar shows zoom percentage
- StatusBar shows git branch when repo initialized
- StatusBar shows AI status indicator
- StatusBar shows macro recording indicator (red dot)
- StatusBar shows selection info (chars selected, lines selected)
- Zoom in/out/reset via keyboard shortcuts
- Zoom in/out/reset via StatusBar click
- Zoom level persists across tab switches
- Macro: start recording indicator appears
- Macro: actions recorded (type, navigate, find/replace)
- Macro: stop recording saves macro
- Macro: playback replays all recorded actions
- Macro: run macro multiple times (with count input)
- Macro: save recorded macro with name
- Macro: load and play saved macro
- Welcome screen: shows on first launch / empty state
- Welcome screen: recent files list
- Welcome screen: quick action buttons (New, Open, Clone)
- Welcome screen: disappears when file is opened
- Feedback popup: appears after usage threshold

---

## Phase 10: Keyboard Shortcuts (Complete Coverage)
**Config:** `ShortcutConfig.ts` — all 81 shortcuts
**New tests: ~50 E2E**

Test EVERY keyboard shortcut triggers the correct action:

- **File shortcuts (8):** New, Open, Save, Save As, Save All, Close Tab, Restore Closed, Quick Open
- **Edit shortcuts (12):** Undo, Redo, Cut, Copy, Paste, Select All, Duplicate Line, Delete Line, Move Line Up/Down, Toggle Comment, Column Editor
- **Search shortcuts (6):** Find, Replace, Find in Files, Go to Line, Go to Matching Brace, Mark
- **View shortcuts (9):** Toggle Sidebar, Zoom In/Out/Reset, Word Wrap, Fold/Unfold All, Command Palette, Toggle Terminal
- **Settings shortcuts (2):** Preferences, Shortcut Mapper
- **Macro shortcuts (3):** Start/Stop Recording, Playback
- **Git shortcuts (1):** Source Control Panel
- **AI shortcuts (3):** AI Chat Panel, Explain Code, Refactor Code
- **Navigation:** Switch tabs (Cmd+1-9, Cmd+Tab)
- **Electron-specific shortcuts** that map to native accelerators
- Shortcut conflicts: verify no two shortcuts share the same binding
- Custom shortcuts: rebind and verify new binding works

---

## Phase 11: Electron-Specific Features (Deep)
**Focus:** Native menus, file dialogs, IPC, window management
**New tests: ~30 Electron E2E**

- Native File > Open dialog triggers and opens file
- Native File > Save dialog triggers and saves file
- Native File > Save As dialog with suggested filename
- Native Edit menu items (Undo/Redo/Cut/Copy/Paste) work via native menu
- Native View menu toggles (Sidebar, Terminal, DevTools)
- Window always-on-top toggle via menu
- Window title updates with active file name
- Multiple file open via dialog (multi-select)
- Open folder loads file tree in sidebar
- Drag file onto window opens it (if supported)
- File watcher: external changes detected (if implemented)
- IPC: all menu-action cases trigger correct store updates
- IPC: file-opened event creates tab with correct content/language
- IPC: folder-opened event populates file tree
- IPC: file-saved event updates tab state
- App lifecycle: close with unsaved changes shows warning
- App lifecycle: reopen restores previous session
- Keyboard accelerators match defined shortcuts
- About menu shows app info dialog
- Preferences accelerator (Cmd+,) opens settings

---

## Phase Summary

| Phase | Focus Area | Est. New Tests |
|-------|-----------|----------------|
| 1 | EditorPanel & Monaco | ~45 |
| 2 | TabBar & Tabs (Deep) | ~35 |
| 3 | FindReplace Panel | ~40 |
| 4 | Sidebar, FileTree, Panels | ~35 |
| 5 | All 13 Dialogs | ~75 |
| 6 | Git Panel & Workflows | ~45 |
| 7 | AI Chat & Features | ~40 |
| 8 | MenuBar, Toolbar, Palette | ~45 |
| 9 | StatusBar, Zoom, Macro, Welcome | ~35 |
| 10 | All 81 Keyboard Shortcuts | ~50 |
| 11 | Electron-Specific (Deep) | ~30 |
| **Total** | | **~475 new tests** |

**Projected final total: ~1,690 tests**
