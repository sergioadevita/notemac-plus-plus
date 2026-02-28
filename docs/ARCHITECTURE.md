# Architecture

Notemac++ follows a layered architecture with strict separation of concerns. This document covers the design decisions, patterns, and conventions used throughout the codebase.

## Layered Design

```
┌─────────────────────────────────────────┐
│           ViewPresenters (UI)           │  React components — rendering only
├─────────────────────────────────────────┤
│             Controllers                 │  Business logic, coordination
├─────────────────────────────────────────┤
│               Models                    │  Runtime state and data
├─────────────────────────────────────────┤
│              Configs                    │  Static settings, configuration
└─────────────────────────────────────────┘
```

**Configs** hold static data and settings. They expose data through explicit `Get`/`Set` methods — never auto-properties or public fields.

**Models** hold runtime state. Plain classes with no framework dependencies. Each domain has its own model: `TabModel`, `SearchModel`, `MacroModel`, `UIModel`, `FileTreeModel`.

**Controllers** contain business logic. They coordinate between models, configs, and the UI layer.

**ViewPresenters** handle all UI and presentation logic. They receive data from controllers and never contain business logic.

## State Management

State is managed with **Zustand** and **Immer**, split into composable slices:

| Slice | Responsibility |
|---|---|
| `tabSlice` | Tab lifecycle, ordering, pinning, coloring, content, navigation |
| `searchSlice` | Find/replace state, marks, bookmarks |
| `macroSlice` | Recording state, action log, saved macros |
| `uiSlice` | Sidebar, zoom, split view, dialogs, settings, clipboard history |
| `fileTreeSlice` | File tree nodes, expansion state, workspace root |

Each slice is independently testable and follows the same patterns: initial state, action creators with Immer drafts, and explicit getter methods.

## Service Locator

Dependencies are resolved through a lightweight service locator — no constructor-based DI or third-party IoC frameworks.

Rules:

- Services register on initialization and unregister on teardown.
- Consumers access services via inline accessors (expression-bodied properties or lazy getters). Service references are never cached in fields — always resolved dynamically.
- Both framework-level and project-specific services can be registered.

## Event System (Pub/Sub)

A custom typed event dispatcher handles cross-component communication. Components subscribe, dispatch, and unsubscribe explicitly — no implicit wiring or string-based keys.

## Object Pooling

Frequently created objects are pooled rather than repeatedly instantiated and destroyed. Pooled objects are accessed via a factory/pool manager registered in the service locator, referenced by string ID.

## Persistence

A dedicated persistence service handles saving and loading data, accessed through the service locator. All stored values use string-key constants with category prefixes (`DB_` for persistence keys, `UI_` for interface identifiers).

## Folder Structure

### Project-Specific Code

```
src/Notemac/
├── Commons/         # Constants, enums, shared types
├── Configs/         # EditorConfig, ThemeConfig
├── Controllers/     # Business logic controllers
├── Model/           # Data models (runtime state slices)
└── UI/              # ViewPresenter components
    └── Params/      # Parameter/DTO classes for views
```

### Shared Framework

```
src/Shared/
├── DependencyInjection/  # Service locator
├── EventDispatcher/      # Typed pub/sub event system
├── Helpers/              # FileHelpers, IdHelpers
├── Persistence/          # Save/load services
├── Pooling/              # Object pool management
└── Git/                  # Git integration adapter
```

The `Shared/` library is reusable infrastructure. Project-specific logic never goes here.

## Naming Conventions

| Type | Pattern | Example |
|---|---|---|
| Controllers | `<Name>Controller` | `GameController` |
| Configs | `<Name>Config` | `EditorConfig` |
| Models | `<Name>Model` | `TabModel` |
| ViewPresenters | `<Name>ViewPresenter` | `MainScreenViewPresenter` |
| Item views | `<Name>UIItemViewPresenter` | `GoalPairUIItemViewPresenter` |
| View params | `<ViewName>Params` | `ScrollUIPieceItemViewPresenterParams` |
| Extensions | `<Type>Extensions` | `ListExtensions` |
| Helpers | `<Name>Helpers` | `FileHelpers` |

**Fields**: private fields use `camelCase`, model fields use `PascalCase`, constants use `UPPER_SNAKE_CASE` with category prefix.

**Methods**: explicit `Get<Property>()`/`Set<Property>()` on configs and models. Boolean getters use `Is<Name>()`/`Has<Name>()`.

## Code Style

- **Braces**: Allman style (opening brace on its own line).
- **Single-statement if/else**: no braces, statement on next line.
- **Yoda conditions**: literal on the left (`if (null == instance)`).
- **Loop count caching**: `for (int i = 0, maxCount = list.Count; i < maxCount; i++)`.
- **Collections**: prefer native methods (`Find`, `filter`, `map`) over heavy query frameworks.
- **Tuples**: use value tuples for lightweight groupings.

## Credential Storage Architecture

A three-tier encryption system provides platform-specific and secure credential handling:

**Layer 1: SecureEncryptionService**
- Core AES-GCM encryption for web (via `crypto.subtle`)
- Supports key derivation and secure erasure

**Layer 2: SafeStorageService**
- Uses Electron's `safeStorage` on desktop (OS keychain)
- Falls back to in-memory storage on web

**Layer 3: CredentialStorageService**
- Session-only mode by default (no disk persistence)
- Opt-in encrypted persistence with auto-expiry
- Silent migration from plaintext storage
- Credentials: AI keys (24h), Git tokens (8h)

## AI/LLM Integration Layer

**LLMController** coordinates with provider adapters:
- OpenAI, Anthropic, Google Gemini, Mistral, Groq, custom
- Configurable models, temperature, token limits
- Chat panel for interactive discussion
- Inline completions with ghost text
- Code actions: explain, refactor, fix, document, test

## Git Integration Layer

**GitController** uses `isomorphic-git` for cross-platform operations:
- Clone, commit, push, pull, branch management
- Visual diff viewer
- GitHub OAuth Device Flow authentication
- Status indicators in sidebar and status bar

## Editor Enhancement Features

**BreadcrumbController** manages breadcrumb navigation:
- Maintains current file path and symbol stack
- Updates breadcrumb state as cursor moves
- Provides click-to-navigate handlers for file, folder, and symbol navigation
- Caches breadcrumb data per file for performance

**StickyScrollController** manages pinned scroll context:
- Tracks function and class headers
- Positions and updates sticky header overlays
- Synchronizes with editor scroll events
- Configurable sticky region height

**FormattingController** manages document and selection formatting:
- Integrates with Prettier formatter
- Provides format-on-save via file save hooks
- Supports multiple formatters (JavaScript, TypeScript, HTML, CSS, JSON, Markdown)
- Format document and selection commands

**DiagnosticsController** manages inline errors and warnings:
- Integrates with Monaco's diagnostics system
- Provides Problems panel view
- Implements go-to-next/previous-error navigation
- Groups diagnostics by file and severity

**EmmetController** manages HTML/CSS abbreviation expansion:
- Registers as Monaco completion provider
- Expands abbreviations in supported file types
- Supports HTML, CSS, JSX, TSX, SCSS, LESS, XML
- Real-time expansion with preview

**PrintController** manages document printing:
- Formats document with syntax highlighting for print
- Provides print preview dialog
- Configurable print options (line numbers, font size, word wrap, headers/footers)
- Print document and selection commands

## Git Enhancement Features

**GitBlameController** manages blame annotations:
- Fetches commit history per file
- Displays author, date, hash, message per line
- Caches blame data per file
- Toggle blame on/off from View menu

**GitStashController** manages stash lifecycle:
- Stash current changes with optional message
- List all stashes with metadata
- Pop (apply + remove), apply (keep), or drop stashes
- Auto re-index stash entries after operations

**MergeConflictController** manages merge conflict resolution:
- Detects conflict markers automatically
- Displays inline resolution controls per conflict
- Accept Current, Accept Incoming, Accept Both actions
- Bulk resolve-all actions

## Collaborative Editing Layer

**CollaborationController** manages real-time multi-user editing:
- Yjs CRDT integration for conflict-free collaboration
- WebRTC peer-to-peer communication
- Session creation and joining with room IDs
- Live peer cursors with colored labels and avatars
- Connection status and peer count in status bar
- Dependencies: yjs, y-webrtc, y-monaco

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| React | 18.3 | UI rendering |
| Monaco Editor | 0.45 | Code editor engine |
| Zustand | 4.5 | State management |
| Immer | 10.0 | Immutable state updates |
| Electron | 28.1 | Desktop shell |
| TypeScript | 5.6 | Type safety |
| Vite | 6.0 | Build tooling |
| isomorphic-git | 1.37 | Git operations |
| iconv-lite | 0.6 | Character encoding |
| jschardet | 3.1 | Charset detection |
| js-md5/sha1/sha256/sha512 | — | Hash generation |
| react-icons | 5.3 | Icon library |
