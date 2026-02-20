# Feature Reference

Complete reference of every feature in Notemac++.

## Table of Contents

- [Command Palette & Quick Open](#command-palette--quick-open)
- [Git Integration](#git-integration)
- [AI Assistant](#ai-assistant)
- [Terminal](#terminal)
- [Snippets](#snippets)
- [Credential Security](#credential-security)
- [Menu Reference](#menu-reference)
- [Editor Capabilities](#editor-capabilities)
- [Tab Management](#tab-management)
- [Find, Replace & Mark](#find-replace--mark)
- [Split View](#split-view)
- [Sidebar & Panels](#sidebar--panels)
- [Themes](#themes)
- [Macro System](#macro-system)
- [Encoding & Line Endings](#encoding--line-endings)
- [Language Support](#language-support)
- [Line Operations](#line-operations)
- [Case Conversion](#case-conversion)
- [Tools](#tools)
- [Status Bar](#status-bar)
- [Settings & Preferences](#settings--preferences)
- [Session Management](#session-management)
- [Monitoring](#monitoring)
- [Feedback & Support](#feedback--support)
- [Dialogs](#dialogs)

---

## Command Palette & Quick Open

Two fast-access overlays for navigating commands and files without touching the mouse.

**Command Palette** (`Cmd+Shift+P`): A fuzzy-searchable launcher with 100+ registered commands spanning every menu action, keybinding, and feature in the app. Commands are organized by category (File, Edit, Search, View, Encoding, Language, Line Operations, Macro, Run, Tools, Settings, Git, AI). Type to filter, use arrow keys to navigate, and press Enter to execute.

**Quick Open** (`Cmd+P`): A fuzzy file finder that searches all files in the current workspace by name. Results are ranked by match quality and displayed in real-time as you type. Press Enter to open the selected file.

**Features:**
- Fuzzy matching algorithm with scoring (FuzzyMatch / FuzzyFilter)
- Keyboard navigation (Up/Down arrows, Enter to select, Escape to dismiss)
- Real-time filtered results as you type
- Category labels for each command in the palette
- Full coverage of all menu actions, keybindings, and features

---

## Git Integration

Clone repositories from URLs, stage and commit changes, push/pull with remote tracking, create and switch branches, view visual diffs of changed files. Status indicators show repository state in the sidebar and status bar. Supports HTTPS authentication and GitHub OAuth Device Flow for secure authentication without storing credentials.

**Features:**
- Clone with HTTPS authentication
- Commit with staging/unstaging
- Push and pull operations
- Branch creation, switching, deletion
- Visual diff viewer for changed files
- GitHub OAuth Device Flow authentication
- Status indicators in sidebar and status bar

---

## AI Assistant

Multi-provider LLM integration supporting OpenAI, Anthropic, Google Gemini, Mistral, Groq, and custom providers. Use the AI chat panel for interactive code discussion, get inline code completions with ghost text, and leverage code actions (explain, refactor, fix bugs, add documentation, write tests). Credentials are securely encrypted and auto-expire (24 hours for AI keys).

**Features:**
- Support for 6+ LLM providers
- AI chat panel for interactive discussion
- Inline code completions with ghost text
- Code actions: explain, refactor, fix, document, test, simplify, convert language
- Configurable model, temperature, token limits
- Secure credential storage with auto-expiry

---

## Terminal

Integrated terminal panel for executing shell commands directly from within the editor. View command output with error highlighting, access command history (last 100 commands), and resize the panel to suit your workflow.

**Features:**
- Execute shell commands without leaving editor
- Command history (last 100 commands)
- Resizable panel with configurable height
- Error highlighting in output

---

## Snippets

Save frequently used code snippets with language and description metadata. Create, edit, delete, and quickly insert snippets into the active editor. Snippets persist across sessions for easy reuse.

**Features:**
- Create, edit, delete code snippets
- Assign language and description
- Quick insertion into active editor
- Persistent storage across sessions
- Search and filter by language

---

## Credential Security

AES-GCM encryption for web-based storage and Electron safeStorage for desktop (uses OS keychain). Session-only mode is the default (credentials never touch disk), with optional encrypted persistence. Credentials automatically expire: AI keys after 24 hours, Git tokens after 8 hours. Automatic silent migration from plaintext storage.

**Features:**
- AES-GCM encryption (web)
- Electron safeStorage (desktop OS keychain)
- Session-only mode by default
- Auto-expiry: AI keys (24h), Git tokens (8h)
- Silent migration from plaintext storage
- Secure erasure of sensitive data

---

## Menu Reference

### File

| Action | Shortcut |
|---|---|
| New | `Cmd+N` |
| Open File | `Cmd+O` |
| Open Folder as Workspace | — |
| Reload from Disk | — |
| Save | `Cmd+S` |
| Save As | `Cmd+Shift+S` |
| Save Copy As | — |
| Save All | `Cmd+Alt+S` |
| Rename File | — |
| Delete from Disk | — |
| Restore Last Closed Tab | `Cmd+Shift+T` |
| Close Tab | `Cmd+W` |
| Close All / Close Others | — |
| Close Tabs to Left / Right | — |
| Close Unchanged | — |
| Close All but Pinned | — |
| Pin Tab | — |
| Load Session / Save Session | — |
| Print | `Cmd+P` |

### Edit

| Action | Shortcut |
|---|---|
| Undo / Redo | `Cmd+Z` / `Cmd+Shift+Z` |
| Cut / Copy / Paste | `Cmd+X` / `Cmd+C` / `Cmd+V` |
| Select All | `Cmd+A` |
| Duplicate Line | `Cmd+D` |
| Delete Line | `Cmd+Shift+K` |
| Transpose Line | `Alt+T` |
| Move Line Up / Down | `Alt+Up` / `Alt+Down` |
| Split Lines / Join Lines | — |
| Toggle Comment | `Cmd+/` |
| Block Comment | `Alt+Shift+A` |
| UPPERCASE / lowercase | `Cmd+Shift+U` / `Cmd+U` |
| Column Editor | `Alt+C` |
| Clipboard History | `Cmd+Shift+V` |
| Copy File Path / Name / Dir | — |
| Set Read-Only | — |

### Search

| Action | Shortcut |
|---|---|
| Find | `Cmd+F` |
| Replace | `Cmd+H` |
| Find in Files | `Cmd+Shift+F` |
| Incremental Search | `Cmd+Alt+I` |
| Mark | `Cmd+M` |
| Go to Line | `Cmd+G` |
| Go to Matching Bracket | `Cmd+Shift+\` |
| Toggle Bookmark | `Cmd+F2` |
| Next / Previous Bookmark | `F2` / `Shift+F2` |
| Clear All Bookmarks | — |

### View

| Action | Shortcut |
|---|---|
| Word Wrap | `Alt+Z` |
| Show Whitespace / EOL / Non-Printable | — |
| Show Line Numbers / Minimap / Indent Guides | — |
| Fold All / Unfold All | `Cmd+K Cmd+0` / `Cmd+K Cmd+J` |
| Zoom In / Out / Reset | `Cmd++` / `Cmd+-` / `Cmd+0` |
| Toggle Sidebar | `Cmd+B` |
| Split Right / Down / Close Split | — |
| Distraction-Free Mode | — |
| Always on Top | — |
| Synchronize Scrolling (V/H) | — |

### Encoding

Unicode: UTF-8, UTF-8 BOM, UTF-16 LE, UTF-16 BE. Western European: Windows-1252, ISO 8859-1, ISO 8859-15, OEM 850. Central European: Windows-1250, ISO 8859-2. Cyrillic: Windows-1251, ISO 8859-5, KOI8-R, KOI8-U, OEM 866. Greek: Windows-1253, ISO 8859-7. Turkish: Windows-1254, ISO 8859-9. Hebrew: Windows-1255, ISO 8859-8. Arabic: Windows-1256, ISO 8859-6. Baltic: Windows-1257, ISO 8859-13. Vietnamese: Windows-1258. East Asian: Big5, GB2312, Shift JIS, EUC-KR, ISO-2022-JP. Thai: TIS-620. DOS: OEM 437, 737, 775, 852, 855, 857, 858, 860, 861, 862, 863, 865, 869.

Line endings: LF (Unix/macOS), CRLF (Windows), CR (Classic Mac).

### Language

70+ languages — see [Language Support](#language-support) for the full list.

### Line Operations

Sort (ascending, descending, case-insensitive, by length), remove duplicates (all or consecutive), remove empty lines, trim spaces (leading, trailing, both), EOL-to-space, TAB-to-space, space-to-TAB, insert blank lines, reverse line order.

### Macro

Start Recording (`Cmd+Shift+R`), Stop Recording, Playback (`Cmd+Shift+P` in Electron), Run Multiple Times, Save Recorded Macro. In web mode, `Cmd+Shift+P` opens the Command Palette; macro playback is accessible via the Macro menu or toolbar.

### Run

Run Command, Search on Google, Search on Wikipedia, Open in Browser.

### Tools

MD5/SHA-1/SHA-256/SHA-512 generation (from text and file), copy hash to clipboard, Base64 encode/decode, URL encode/decode, JSON format/minify.

### Settings

Preferences (`Cmd+,`), Shortcut Mapper, About Notemac++.

### Quick Access

| Action | Shortcut |
|---|---|
| Command Palette | `Cmd+Shift+P` |
| Quick Open (file search) | `Cmd+P` |
| Toggle Terminal | `` Ctrl+` `` |

---

## Editor Capabilities

Notemac++ uses the Monaco Editor, the same engine behind VS Code.

**Core editing**: syntax highlighting, multi-cursor support, undo/redo with unlimited history, auto-indent, bracket matching, auto-close brackets and quotes.

**Visual features**: line numbers, indent guides, minimap, code folding (8 levels), word wrap, virtual space, smooth scrolling, current line highlighting.

**Whitespace visualization**: show/hide whitespace characters, EOL markers, non-printable characters, and wrap symbols.

**Cursor customization**: 3 styles (line, block, underline) and 5 blinking modes (blink, smooth, phase, expand, solid).

---

## Tab Management

Tabs support drag-and-drop reordering, pinning (prevents accidental closure), and color-coding with 6 colors. Visual indicators show modified (dot), pinned (pin icon), and read-only (lock icon) state. Middle-click closes a tab. Right-click opens a context menu with close variants and management options. The last 20 closed tabs can be restored, and the last 20 opened files are tracked in a recent files list.

---

## Find, Replace & Mark

**Find** supports regex, case-sensitive, whole-word, wrap-around, and search-in-selection modes. A match counter shows total results. **Replace** handles single or all replacements, with regex capture group support.

**Mark** lets you highlight all matches in one of 5 color styles (red, green, blue, orange, magenta). Once lines are marked, you can cut, copy, delete, or replace them in bulk. "Inverse Marks" flips the selection. "Delete Unmarked Lines" removes everything except marked content.

**Bookmarks** work per-file: toggle on any line, navigate forward/backward, clear all.

---

## Split View

Split the editor horizontally or vertically to view two files side by side. Clone any tab into the other pane. Enable synchronized scrolling (vertical, horizontal, or both) to keep both panes aligned.

---

## Sidebar & Panels

The sidebar (toggled with `Cmd+B`) includes these panels, switched via icon tabs: Explorer (file tree with folder browsing), Document List (all open tabs), Function List (code symbols), Clipboard History (last 50 entries), Character Panel (character inspection), and Search Results (find-in-files output). The sidebar is resizable between 150px and 500px.

---

## Themes

Seven built-in themes, each fully styling the editor, tabs, sidebar, menus, dialogs, and status bar: Mac Glass (default — warm orange/amber glassmorphism), Dark (VS Code dark), Light (VS Code light), Monokai, Dracula, Solarized Dark, and Solarized Light. Themes define 31+ color properties covering backgrounds, text, accents, status colors, and component-specific colors.

---

## Macro System

Record a sequence of actions (typing, deletions, cursor movement, commands), then play it back once or multiple times. Macros can be saved with custom names for later use. A recording indicator appears in the status bar during capture.

---

## Encoding & Line Endings

Notemac++ auto-detects file encoding using the jschardet library. You can switch encoding from the status bar or the Encoding menu. Supported encodings span Unicode (UTF-8/16), Western/Central/Eastern European, Cyrillic, Greek, Turkish, Hebrew, Arabic, Baltic, Vietnamese, East Asian (CJK), Thai, and numerous DOS/OEM code pages.

Line endings are auto-detected and displayed in the status bar. Switch between LF (Unix/macOS), CRLF (Windows), and CR (Classic Mac) at any time.

---

## Language Support

70+ languages: Normal Text, ActionScript, Ada, ASP, Assembly, AutoIt, Batch, C, C++, C#, OCaml, CMake, COBOL, CoffeeScript, CSS, D, Dart, Diff, Dockerfile, Elixir, Erlang, Fortran, F#, GDScript, Go, GraphQL, Haskell, HTML, INI, Java, JavaScript, JSON, JSON5, Julia, Kotlin, LaTeX, LESS, Lisp, Lua, Makefile, Markdown, MATLAB, Nim, NSIS, Objective-C, Pascal, Perl, PHP, PowerShell, Properties, Python, R, Raku, reStructuredText, Ruby, Rust, SAS, Scala, Scheme, SCSS, Shell/Bash, Smalltalk, SQL, Swift, Tcl, TOML, TypeScript, Visual Basic, Verilog, VHDL, XML, YAML.

Language is auto-detected from file extension and can be changed from the status bar or Language menu.

---

## Line Operations

**Sorting**: ascending, descending, case-insensitive (ascending/descending), by length (ascending/descending).

**Deduplication**: remove all duplicate lines, or only consecutive duplicates.

**Whitespace**: remove empty lines (or lines containing only whitespace), trim leading spaces, trailing spaces, or both.

**Conversion**: EOL to space, TAB to space, space to TAB (leading only or all).

**Insertion**: blank line above, blank line below, reverse line order.

---

## Case Conversion

Six transforms: UPPERCASE, lowercase, Proper Case (capitalize first letter of each word), Sentence case (capitalize first letter of each sentence), iNVERT cASE, and RaNdOm CaSe.

---

## Tools

**Hashing**: Generate MD5, SHA-1, SHA-256, or SHA-512 hashes from selected text or from a file. Copy any hash directly to clipboard.

**Encoding**: Base64 encode/decode and URL encode/decode for selected text.

**JSON**: Pretty-print (format) or minify JSON content.

---

## Status Bar

The status bar shows (left to right): macro recording indicator, cursor position (Ln/Col), character count, word count, line count, tab size toggle (spaces vs. tabs), line ending selector, encoding selector, language selector, and zoom level.

All status bar items are clickable — clicking the language opens a language picker, clicking the encoding opens the encoding menu, and so on.

---

## Settings & Preferences

Preferences are organized into sections:

**General**: theme selection, remember last session.

**Editor**: font size, font family, tab size, insert spaces, auto-save (with configurable delay), word wrap, line numbers, minimap, indent guides, EOL display, non-printable characters, wrap symbols, highlight current line, bracket matching, auto-close brackets/quotes, auto-indent.

**Appearance**: cursor blinking style (5 modes), cursor style (3 options), render whitespace, virtual space, smooth scrolling, dark mode.

**Advanced**: always on top, distraction-free mode, custom search engine URL, date/time format, synchronized scrolling (vertical/horizontal).

**Keybindings**: customizable keyboard shortcuts via the Shortcut Mapper.

---

## Session Management

Save the current workspace layout to a JSON file and reload it later. A session captures all open tabs, the active tab, sidebar panel state, cursor positions, and scroll positions. The "Remember last session" preference automatically restores your workspace on launch.

**Features:**
- Save Session (File > Save Session) — exports to `.json`
- Load Session (File > Load Session) — restores tabs, cursors, scroll positions
- Auto-restore on launch (configurable in Settings > General)

---

## Monitoring

Live file watching (like `tail -f`) that auto-scrolls to the end of the file as it updates. Useful for monitoring log files in real time. Toggle via the View menu or Command Palette.

---

## Feedback & Support

After 20 minutes of continuous use (once per version), a non-intrusive feedback popup appears with links to GitHub Issues, social sharing, and Ko-fi donation. Dismiss with "Maybe later" — it will not reappear until the next version.

---

## Dialogs

Notemac++ includes these dialogs: About (version, creator, feature highlights, tech stack), Settings (5-section preferences), Go to Line, Column Editor, Find/Replace, Run Command, Character Panel, Summary (file statistics), Find Characters in Range, Shortcut Mapper, Clipboard History, Command Palette, Quick Open, Clone Repository, Git Settings, AI Settings, Diff Viewer, and Snippet Manager.
