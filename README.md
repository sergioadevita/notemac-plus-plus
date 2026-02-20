<p align="center">
  <img src="Icons/icon.png" alt="Notemac++" width="128" height="128">
</p>

<h1 align="center">Notemac++</h1>

<p align="center">
  A powerful, feature-rich text and source code editor for <strong>macOS</strong> and <strong>Web</strong>, inspired by <a href="https://notepad-plus-plus.org/">Notepad++</a>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-3.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Web-lightgrey" alt="Platform">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/tests-1880%2B%20passing-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/languages-70%2B-orange" alt="Languages">
  <a href="https://ko-fi.com/sergioadevita"><img src="https://img.shields.io/badge/Ko--fi-Support%20Me-FF5E5B?logo=ko-fi&logoColor=white" alt="Ko-fi"></a>
</p>

<p align="center">
  <a href="https://sergioadevita.github.io/notemac-plus-plus/app/"><strong>🚀 Try it in your browser</strong></a>
  &nbsp;·&nbsp;
  <a href="https://sergioadevita.github.io/notemac-plus-plus/">Landing Page</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/sergioadevita/notemac-plus-plus/releases">Releases</a>
</p>

---

Notemac++ brings the familiar power of Notepad++ to macOS — both as a native desktop app (via Tauri or Electron) and as a web application. It features syntax highlighting for 70+ languages, a tabbed interface with drag-and-drop reordering, split views, macro recording, bookmarks, powerful find/replace with regex, **built-in Git integration**, an **AI coding assistant** with multi-provider support, an **integrated terminal**, **code snippets**, and much more.

## Screenshots

<p align="center">
  <img src="docs/screenshots/editor-mac-glass.png" alt="Notemac++ — Mac Glass theme" width="900">
</p>
<p align="center"><em>Mac Glass — the default theme, with warm orange accents and glassmorphism-inspired palette.</em></p>

<details>
<summary><strong>More themes and features</strong></summary>

&nbsp;

<p align="center">
  <img src="docs/screenshots/editor-dark.png" alt="Notemac++ — Dark theme" width="900">
</p>
<p align="center"><em>Dark theme</em></p>

<p align="center">
  <img src="docs/screenshots/editor-light.png" alt="Notemac++ — Light theme" width="900">
</p>
<p align="center"><em>Light theme</em></p>

<p align="center">
  <img src="docs/screenshots/editor-monokai.png" alt="Notemac++ — Monokai theme" width="900">
</p>
<p align="center"><em>Monokai theme</em></p>

<p align="center">
  <img src="docs/screenshots/editor-dracula.png" alt="Notemac++ — Dracula theme" width="900">
</p>
<p align="center"><em>Dracula theme</em></p>

<p align="center">
  <img src="docs/screenshots/editor-solarized-dark.png" alt="Notemac++ — Solarized Dark theme" width="900">
</p>
<p align="center"><em>Solarized Dark theme</em></p>

<p align="center">
  <img src="docs/screenshots/editor-solarized-light.png" alt="Notemac++ — Solarized Light theme" width="900">
</p>
<p align="center"><em>Solarized Light theme</em></p>

<p align="center">
  <img src="docs/screenshots/find-replace.png" alt="Notemac++ — Find & Replace" width="900">
</p>
<p align="center"><em>Find & Replace with regex support, mark system, and multiple search modes.</em></p>

</details>

## Quick Start

**Web (any platform):**

```bash
./build-web.sh
```

This builds and serves the app locally. Works on macOS, Linux, and WSL.

**Desktop (macOS):**

```bash
# Portable — runs directly from the disk image
./build-portable-dmg.sh

# Installable — drag to Applications
./build-install-dmg.sh
```

**Development:**

```bash
npm install
npm run dev              # Web dev server
npm run electron:dev     # Electron dev mode
```

## Features

<details>
<summary><strong>Command Palette & Quick Open</strong> — Fast access to every command and file</summary>

&nbsp;

- **Command Palette** (`Cmd+Shift+P`): Fuzzy-searchable launcher with 100+ commands spanning every menu action, keybinding, and feature
- **Quick Open** (`Cmd+P`): Fuzzy file finder that searches all files in the current workspace
- Keyboard navigation with arrow keys and Enter
- Real-time filtered results as you type

</details>

<details>
<summary><strong>Editing</strong> — Monaco-powered editor with full code intelligence</summary>

&nbsp;

Notemac++ is built on the [Monaco Editor](https://microsoft.github.io/monaco-editor/), the same engine that powers VS Code. This gives you:

- Syntax highlighting for **70+ languages** including C, C++, Python, JavaScript, TypeScript, Rust, Go, Java, Ruby, PHP, Swift, Kotlin, SQL, HTML/CSS, Markdown, and many more
- Multi-cursor editing
- Code folding with 8 levels of granularity
- Bracket matching and auto-closing for brackets and quotes
- Smart auto-indent
- Comment toggling (line and block comments)
- Configurable tab size, spaces vs. tabs
- Virtual space mode, smooth scrolling
- Minimap for quick navigation
- Indent guides
- Word wrap with optional wrap symbols
- Whitespace and EOL character visualization
- Line numbers with current-line highlighting

</details>

<details>
<summary><strong>Tabs</strong> — Drag, pin, color-code, and manage your workspace</summary>

&nbsp;

- Drag-and-drop tab reordering
- Pin tabs to prevent accidental closure
- Color-code tabs (6 colors: red, green, blue, orange, magenta, or none)
- Visual indicators for modified, pinned, and read-only files
- Middle-click to close
- Right-click context menu: Close, Close Others, Close to Left/Right, Close Unchanged, Close All but Pinned
- Restore last closed tab (with full undo history)
- Recent files list (last 20 files)
- Clone tab to split view

</details>

<details>
<summary><strong>Find & Replace</strong> — Regex, marks, and bulk operations</summary>

&nbsp;

- Find with regex, case-sensitive, whole-word, and wrap-around options
- Replace single or all occurrences
- Find in Files across your workspace
- Incremental search (live results as you type)
- **Mark system** with 5 color styles — highlight all matches visually, then operate on marked lines: cut, copy, delete, replace, or inverse
- Go to Line dialog
- Go to Matching Bracket
- Bookmark system: toggle, navigate next/previous, clear all

See [Keybindings Reference](docs/KEYBINDINGS.md) for all search shortcuts.

</details>

<details>
<summary><strong>Split View</strong> — Work on two files side by side</summary>

&nbsp;

- Horizontal or vertical split
- Clone any tab into the split pane
- Synchronized vertical and/or horizontal scrolling
- Close split to return to single-pane mode

</details>

<details>
<summary><strong>Themes</strong> — 7 built-in color themes</summary>

&nbsp;

| Theme | Style |
|---|---|
| Mac Glass | Warm orange/amber glassmorphism (default) |
| Dark | VS Code Dark |
| Light | VS Code Light |
| Monokai | Classic warm palette |
| Dracula | Purple-toned dark theme |
| Solarized Dark | Ethan Schoonover's dark variant |
| Solarized Light | Ethan Schoonover's light variant |

Each theme fully styles the editor, tabs, sidebar, menus, dialogs, and status bar.

</details>

<details>
<summary><strong>Macros</strong> — Record, replay, and save action sequences</summary>

&nbsp;

- Record keyboard actions (typing, deletions, cursor movement, commands)
- Playback recorded macro
- Run macro multiple times (with count dialog)
- Save macros with custom names for reuse
- Recording indicator in the status bar

</details>

<details>
<summary><strong>Sidebar & Panels</strong> — File explorer, function list, and more</summary>

&nbsp;

- **File Explorer**: Open folders as workspaces, browse the tree, click to open files
- **Document List**: Quick overview of all open tabs
- **Function List**: Code symbol navigation
- **Clipboard History**: Last 50 clipboard entries, paste from history
- **Character Panel**: Inspect character details and code points
- **Search Results**: Find-in-files results panel

The sidebar is resizable (150–500px) and togglable with `Cmd+B`.

</details>

<details>
<summary><strong>Encoding & Line Endings</strong> — Full character set support</summary>

&nbsp;

Notemac++ supports a wide range of encodings: UTF-8, UTF-8 BOM, UTF-16 LE/BE, Windows-1250 through 1258, ISO 8859 family, KOI8-R/U, Big5, GB2312, Shift JIS, EUC-KR, and dozens of DOS/OEM code pages. Line endings are auto-detected and switchable between LF, CRLF, and CR.

See the full list in [docs/FEATURES.md](docs/FEATURES.md#encoding--line-endings).

</details>

<details>
<summary><strong>Line Operations</strong> — Sort, deduplicate, trim, and transform</summary>

&nbsp;

- Sort lines (ascending, descending, case-insensitive, by length)
- Remove duplicate lines (all or consecutive only)
- Remove empty lines (including blank-only)
- Trim leading/trailing/both spaces
- Convert EOL to spaces, TAB to spaces, spaces to TABs
- Insert blank lines above/below
- Reverse line order

</details>

<details>
<summary><strong>Tools</strong> — Hashing, encoding, and formatting utilities</summary>

&nbsp;

- Hash generation: MD5, SHA-1, SHA-256, SHA-512 (from text or file)
- Copy hash to clipboard
- Base64 encode/decode
- URL encode/decode
- JSON format (pretty-print) and minify

</details>

<details>
<summary><strong>Case Conversion</strong> — 6 text case transforms</summary>

&nbsp;

UPPERCASE, lowercase, Proper Case, Sentence case, iNVERT cASE, and RaNdOm CaSe.

</details>

<details>
<summary><strong>More Features</strong></summary>

&nbsp;

- **Distraction-Free Mode**: Hides all UI chrome for focused writing
- **Always on Top**: Keep the editor above other windows
- **Monitoring (tail -f)**: Live file watching with auto-scroll
- **Column Editor**: Multi-line vertical editing
- **Run Command**: Execute shell commands from within the editor
- **Search on Google/Wikipedia**: Quick web lookups for selected text
- **Open in Browser**: Preview files directly
- **Insert Date/Time**: Configurable format
- **File Summary**: Line, word, and character counts at a glance
- **Session Save/Load**: Persist your workspace across sessions
- **Copy File Path/Name/Dir**: Quick path operations

</details>

<details>
<summary><strong>Git Integration</strong> — Full version control from within the editor</summary>

&nbsp;

- **Repository management**: Initialize, clone (with GitHub OAuth), and open Git repositories
- **Staging & commits**: Stage/unstage files, write commit messages, view commit history
- **Branch management**: Create, switch, and delete branches
- **Diff viewer**: Side-by-side diff comparison for changed files
- **GitHub OAuth**: Secure authentication with token encryption and automatic refresh
- **Powered by isomorphic-git** for full web and Electron compatibility

</details>

<details>
<summary><strong>AI Assistant</strong> — Multi-provider AI chat and inline completions</summary>

&nbsp;

- **AI Chat panel**: Ask questions, get code explanations, generate code, and refactor
- **Inline completions**: Context-aware code suggestions as you type
- **Multi-provider support**: OpenAI (GPT-4), Anthropic (Claude), and Google (Gemini)
- **Context actions**: Explain, refactor, fix, document, test, simplify, convert language
- **XSS-protected responses**: Sanitized AI output for safe rendering
- **Configurable**: Choose your provider, model, and API key in settings

</details>

<details>
<summary><strong>Integrated Terminal</strong> — Run commands without leaving the editor</summary>

&nbsp;

- Built-in terminal emulator powered by Xterm.js
- Run shell commands directly from the editor
- Terminal panel in the sidebar for quick access

</details>

<details>
<summary><strong>Code Snippets</strong> — Language-aware snippet management</summary>

&nbsp;

- Pre-built snippets for popular languages (JavaScript, TypeScript, Python, HTML, CSS, and more)
- Quick insertion via the snippet manager panel
- Create and save custom snippets
- IntelliSense-integrated snippet completion provider

</details>

<details>
<summary><strong>Security</strong> — Hardened credential storage and secure flows</summary>

&nbsp;

- AES-GCM encrypted credential storage with Electron safeStorage integration
- Secure OAuth flows with PKCE and state validation
- Token expiry tracking with automatic cleanup
- XSS protection on all AI-generated content
- No plaintext secrets in localStorage

</details>

## Architecture

Notemac++ follows a **layered architecture** with clear separation of concerns:

| Layer | Responsibility |
|---|---|
| **Configs** | Static settings and configuration data |
| **Models** | Runtime state (tabs, search, macros, UI, file tree) |
| **Controllers** | Business logic and coordination |
| **ViewPresenters** | UI components — no business logic |

State management uses **Zustand** with **Immer** for immutable updates, split into composable slices. Dependencies are resolved through a lightweight **Service Locator** pattern, and components communicate via a typed **event dispatcher** (pub/sub).

For more detail, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Project Structure

```
src/
├── Notemac/                    # Project-specific code
│   ├── Commons/                # Constants, enums, shared types
│   ├── Configs/                # EditorConfig, ThemeConfig
│   ├── Controllers/            # Business logic controllers
│   ├── Model/                  # TabModel, SearchModel, MacroModel, UIModel, FileTreeModel, SnippetModel, GitModel, AIModel
│   └── UI/                     # ViewPresenter components
│       └── Params/             # Parameter/DTO classes
├── Shared/                     # Reusable framework library
│   ├── DependencyInjection/    # Service locator
│   ├── EventDispatcher/        # Typed pub/sub events
│   ├── Helpers/                # FileHelpers, IdHelpers
│   ├── Persistence/            # Save/load + credential encryption
│   ├── Pooling/                # Object pool management
│   └── Git/                    # Git integration adapter
├── components/                 # React UI components
├── store/                      # Zustand store slices
└── __tests__/                  # 961 unit tests (39 suites, Vitest)
```

## Testing

```bash
npx vitest run
```

961 unit tests across 39 test suites, ~709 web E2E tests across 36 Playwright spec files, and 214 Electron E2E tests across 4 Playwright Electron spec files — covering all UI components, panels, dialogs, keyboard shortcuts, menu actions, and user flows for both web and desktop.

```bash
npx playwright test          # E2E tests
```

See [docs/TESTING.md](docs/TESTING.md) for details.

## Comparison

How Notemac++ stacks up against other editors:

| Feature | Notemac++ | Notepad++ | VS Code | Sublime Text |
|---|---|---|---|---|
| **Platform** | macOS / Web | Windows | All | All |
| **Size** | ~10-15 MB (Tauri) | ~5 MB | ~300 MB | ~30 MB |
| **Startup Time** | Instant | Fast | Moderate | Fast |
| **Syntax Languages** | 70+ | 80+ | 200+ | 50+ |
| **Built-in Git** | Yes | No | Yes | No |
| **Built-in AI** | Yes (multi-provider) | No | Via Copilot | No |
| **Terminal** | Yes | No | Yes | No |
| **Command Palette** | Yes | No | Yes | Yes |
| **Quick Open** | Yes | No | Yes | Yes |
| **Macros** | Yes | Yes | Via Extensions | Yes |
| **Split View** | Yes | Yes | Yes | Yes |
| **Code Snippets** | Yes | No (plugins) | Yes | Yes |
| **Mark System** | Yes (5 colors) | Yes (5 styles) | No | No |
| **Column Editor** | Yes | Yes | Via Extensions | Yes |
| **Themes** | 7 | 30+ | 1000+ | 25+ |
| **Plugins** | Planned | 200+ | 30K+ | 5K+ |
| **Runs in Browser** | Yes | No | Yes (vscode.dev) | No |
| **Price** | Free (MIT) | Free (GPL) | Free | $99 |

Notemac++ is purpose-built for macOS and web users seeking Notepad++ familiarity with modern web technology and native desktop integration. It combines the simplicity of Notepad++ with power features found in VS Code — without the overhead.

## Roadmap

Shipped in v2.0.0: Git integration, AI assistant, integrated terminal, snippet manager, and IntelliSense completions. v2.1.0: New app icon, git auto-detection fix, code quality improvements. v2.2.0: Zero `as any` casts — full type safety across all production code. v2.3.0: Zero `any` milestone — complete type safety across the entire production codebase. v2.4.0: Architecture refactors (GitController split, EditorPanel hooks), accessibility improvements (keyboard nav, ARIA), performance optimizations, and 1,884 total tests. **v3.0.0: Tauri migration — ~75% smaller desktop app (~10-15MB vs ~50MB) using system WebView instead of bundled Chromium, with full platform abstraction layer and 8 new Tauri E2E test suites.**

Planned for future releases:

- **Plugin System** — Extensibility through custom plugins
- **Custom Theme Editor** — Create and share your own themes
- **Print Support** — Format and print documents
- **Collaborative Editing** — Real-time multi-user editing
- **Remote File Editing** — Edit files over SSH/SFTP

Have a feature request? Open an [issue](https://github.com/sergioadevita/notemac-plus-plus/issues) or [discussion](https://github.com/sergioadevita/notemac-plus-plus/discussions).

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Setting up your development environment
- Project architecture and coding standards
- How to submit pull requests
- Code of conduct

## Building

| Target | Command | Output |
|---|---|---|
| Web (dev) | `npm run dev` | `localhost:5173` |
| Web (prod) | `./build-web.sh` | Built + served |
| Desktop/Electron (dev) | `npm run electron:dev` | Live Electron window |
| Desktop/Tauri (dev) | `npm run tauri:dev` | Live Tauri window |
| Desktop/Tauri (build) | `npm run tauri:build` | `src-tauri/target/release/bundle/` |
| Portable DMG | `./build-portable-dmg.sh` | `release/Notemac++-Portable.dmg` |
| Installable DMG | `./build-install-dmg.sh` | `release/Notemac++-Installer.dmg` |

Build scripts auto-install prerequisites (Homebrew, Node.js, Python/Pillow) if missing.

See [docs/BUILDING.md](docs/BUILDING.md) for full build documentation.

## Tech Stack

| Technology | Role |
|---|---|
| [React](https://react.dev/) | UI framework |
| [Monaco Editor](https://microsoft.github.io/monaco-editor/) | Code editor engine |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| [Zustand](https://zustand-demo.pmnd.rs/) + [Immer](https://immerjs.github.io/immer/) | State management |
| [Vite](https://vitejs.dev/) | Build tooling |
| [Electron](https://www.electronjs.org/) | Desktop shell (legacy) |
| [Tauri](https://tauri.app/) | Desktop shell (lightweight, ~10-15MB vs ~50MB) |
| [isomorphic-git](https://isomorphic-git.org/) | Git operations (web & desktop) |
| [Xterm.js](https://xtermjs.org/) | Integrated terminal emulator |
| OpenAI / Anthropic / Google AI | Multi-provider AI assistant |
| [Vitest](https://vitest.dev/) | Unit testing framework |
| [Playwright](https://playwright.dev/) | E2E testing framework |

## Author

**Sergio Agustin De Vita**
[LinkedIn](https://linkedin.com/in/sergioadevita) · [GitHub](https://github.com/sergioadevita) · [Ko-fi](https://ko-fi.com/sergioadevita)

## Support

If you find Notemac++ useful, consider supporting its development:

<a href="https://ko-fi.com/sergioadevita"><img src="https://img.shields.io/badge/Ko--fi-Support%20Notemac++-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Support on Ko-fi"></a>

## License

This project is licensed under the MIT License.
