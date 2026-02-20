# Contributing to Notemac++

Thank you for your interest in contributing to Notemac++! This guide will help you get started with development and submitting your contributions.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. All contributors are expected to:

- Be respectful and professional in all interactions
- Welcome diverse perspectives and experiences
- Focus feedback on ideas, not individuals
- Report any harassment or inappropriate behavior

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **macOS** 10.15+ (for desktop builds) or any platform with a browser (for web development)
- **Rust** toolchain (for Tauri builds): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Xcode Command Line Tools** (macOS): `xcode-select --install`

### Development Setup

```bash
# Clone the repository
git clone https://github.com/sergioadevita/notemac-plus-plus.git
cd notemac-plus-plus

# Install dependencies
npm install

# Start the development server
npm run dev              # Web (http://localhost:5173)
npm run tauri:dev        # Desktop (Tauri window — recommended)
npm run electron:dev     # Desktop (Electron window — legacy)
```

### Running Tests

```bash
# Run all tests
npx vitest run

# Run tests in watch mode
npx vitest

# Run a specific test file
npx vitest src/__tests__/TabModel.test.ts
```

### Building

```bash
# Web production build
./build-web.sh

# Tauri desktop build (recommended — ~10-15MB)
npm run tauri:build

# Portable macOS DMG (Electron — legacy, ~50MB)
./build-portable-dmg.sh

# Installable macOS DMG (Electron — legacy, ~50MB)
./build-install-dmg.sh
```

See [docs/BUILDING.md](docs/BUILDING.md) for detailed build instructions.

## Project Architecture Overview

Notemac++ follows a **layered architecture** with clear separation of concerns:

### Core Layers

- **Configs** (`src/Notemac/Configs/`): Static configuration data (editor settings, theme configuration)
  - Access via explicit `Get<Property>()` / `Set<Property>()` methods
  - No public fields or auto-properties

- **Models** (`src/Notemac/Model/`): Runtime state and data aggregation
  - Manage tabs, search state, macros, UI state, file tree
  - Use explicit `Get<Property>()` / `Set<Property>()` methods
  - Use Zustand + Immer for immutable state updates

- **Controllers** (`src/Notemac/Controllers/`): Business logic and coordination
  - Orchestrate between models, configs, and views
  - Handle user actions and side effects
  - No direct DOM manipulation

- **ViewPresenters** (`src/Notemac/UI/`): React components for presentation
  - Receive data from controllers via props
  - Dispatch user actions back to controllers
  - No business logic — only UI rendering

### Infrastructure

- **Service Locator** (`src/Shared/DependencyInjection/`): Lightweight dependency resolution
  - Services register/unregister on initialization
  - Accessed via inline property accessors, never cached in fields
  - Used for framework and project-level services

- **Event Dispatcher** (`src/Shared/EventDispatcher/`): Typed pub/sub event system
  - Components communicate via events, not direct references
  - Subscribe and unsubscribe explicitly
  - Avoid magic or implicit wiring

- **Object Pooling** (`src/Shared/Pooling/`): Efficient object reuse
  - Frequently created objects (e.g., clipboard items) use pooling
  - Access via factory or pool manager

- **Persistence** (`src/Shared/Persistence/`): Centralized save/load
  - All data persistence goes through the persistence service
  - Use string-key constants for stored values

For more detail, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Coding Standards

All code must follow the conventions defined in [CLAUDE.md](CLAUDE.md) in the project root. Key points:

### Naming

| Type | Convention | Example |
|---|---|---|
| Controllers | `<Name>Controller` | `EditorController`, `TabController` |
| Configs | `<Name>Config` | `EditorConfig`, `ThemeConfig` |
| Models | `<Name>Model` | `TabModel`, `SearchModel` |
| ViewPresenters | `<Name>ViewPresenter` | `EditorViewPresenter` |
| Methods | Explicit accessors: `Get<Name>()` / `Set<Name>()` | `GetTabCount()`, `SetTheme()` |
| Boolean methods | `Is<Name>()` / `Has<Name>()` | `IsModified()`, `HasSplit()` |
| Constants | `UPPER_SNAKE_CASE` with prefix | `DB_SESSION_DATA`, `UI_MAIN_PANEL` |
| Fields | `camelCase` (private), `PascalCase` (model fields) | `private selectedTab`, `PieceCount` |

### Formatting

- **Braces**: Allman style — opening brace on its own line
  ```typescript
  if (condition)
  {
      doSomething();
  }
  ```

- **Single-statement blocks**: Omit braces, place statement on next line
  ```typescript
  if (condition)
      doSomething();
  ```

- **Yoda conditions**: Place literal/constant on the left
  ```typescript
  if (0 < count)           // ✓ Correct
  if (null == instance)    // ✓ Correct
  // NOT: if (count > 0) or if (instance == null)
  ```

- **Loop caching**: Cache collection size for iteration
  ```typescript
  for (let i = 0, maxCount = items.length; i < maxCount; i++)
  ```

- **Indentation**: 4 spaces (match surrounding code)

- **Blank lines**: One blank line between methods; no blank lines after opening/before closing braces

### No Auto-Properties

Always use explicit methods for config and model data:

```typescript
// ✓ Correct
class EditorConfig
{
    private fontSize: number;

    public GetFontSize(): number
    {
        return this.fontSize;
    }

    public SetFontSize(size: number): void
    {
        this.fontSize = size;
    }
}

// ✗ Incorrect (do not use)
class EditorConfig
{
    public fontSize: number;  // Don't do this
}
```

### Collections and Functional Style

- Prefer native collection methods: `find()`, `filter()`, `map()`, `forEach()`
- Use tuples for lightweight groupings without creating classes
- Functional operations like `any()`, `all()`, `reduce()` are fine when readable

### Service Locator Usage

Always resolve services dynamically via inline accessors, never cache in fields:

```typescript
// ✓ Correct
export class MyController
{
    private get editorService(): EditorService
    {
        return ServiceLocator.Get(EditorService);
    }

    public DoSomething(): void
    {
        this.editorService.Execute();  // Resolved each time
    }
}

// ✗ Incorrect (do not cache)
export class MyController
{
    private editorService: EditorService;  // Don't cache like this

    constructor()
    {
        this.editorService = ServiceLocator.Get(EditorService);
    }
}
```

## Submitting Changes

### Before You Start

1. Check [GitHub Issues](https://github.com/sergioadevita/notemac-plus-plus/issues) for existing work
2. Open an issue to discuss major features or breaking changes
3. Create a feature branch: `git checkout -b feature/your-feature-name`

### Making Your Changes

1. Write clear, descriptive commit messages
2. Keep commits focused and atomic (one feature per commit)
3. Add or update tests for new functionality
4. Ensure all tests pass: `npx vitest run`
5. Ensure code builds: `npm run build`

### Creating a Pull Request

1. **Push your branch** to your fork
2. **Open a PR** with a clear title and description
3. **Reference related issues**: e.g., "Fixes #123"
4. **Include:**
   - A summary of your changes
   - Why the change is needed
   - Any testing steps to verify
   - Screenshots (for UI changes)

5. **Address feedback** on code review promptly

### PR Checklist

- [ ] Code follows CLAUDE.md conventions
- [ ] All tests pass (`npx vitest run`)
- [ ] Build succeeds (`npm run build`)
- [ ] New tests added for new functionality
- [ ] No console errors or warnings in development
- [ ] Updated documentation if needed

## Testing Guidelines

- Write tests for new controllers, models, and services
- Use descriptive test names that explain the behavior
- Aim for >80% coverage on new code
- Test both happy paths and edge cases
- Use the existing test patterns in `src/__tests__/`

Example test:

```typescript
describe('TabModel', () =>
{
    it('should add a tab when AddTab is called', () =>
    {
        const model = new TabModel();
        model.AddTab('file.txt');

        expect(model.GetTabCount()).toBe(1);
    });
});
```

## Reporting Bugs

- **Use GitHub Issues** and include:
  - Clear reproduction steps
  - Expected vs. actual behavior
  - Browser/OS version and Notemac++ version
  - Screenshots or screencasts if applicable
  - Relevant log output (DevTools console)

## Feature Requests

- **Use GitHub Issues** and describe:
  - The problem or use case
  - Your proposed solution
  - Why it would be valuable
  - Any alternatives you've considered

## Questions?

- Open a [GitHub Discussion](https://github.com/sergioadevita/notemac-plus-plus/discussions)
- Check [docs/](docs/) for detailed documentation
- Review existing issues for similar questions

## License

By contributing to Notemac++, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Notemac++! We appreciate your effort in making this project better.
