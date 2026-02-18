# Testing

Notemac++ uses [Vitest](https://vitest.dev/) with JSDOM for unit testing.

## Running Tests

```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode
npx vitest run --reporter=verbose   # Detailed output
```

## Test Summary

450+ tests across 22 test suites:

| Suite | File | Tests | Covers |
|---|---|---|---|
| Helpers | `helpers.test.ts` | 46 | `detectLanguage` (30 extensions + edge cases), `detectLineEnding`, `convertLineEnding`, `generateId` |
| Tabs | `store-tabs.test.ts` | 36 | `addTab`, `closeTab`, `closeAllTabs`, `closeOtherTabs`, `closeTabsToLeft/Right`, `closeUnchangedTabs`, `closeAllButPinned`, `restoreLastClosedTab`, tab navigation, `updateTab`, `updateTabContent`, `togglePinTab`, `setTabColor`, `moveTab`, `addRecentFile` |
| UI State | `store-ui.test.ts` | 31 | Sidebar, zoom, split view, clipboard history, dialog toggles, settings, session save/load |
| Configs | `configs.test.ts` | 21 | `EditorConfig`, `ThemeConfig` (all 6 themes), `Constants` |
| Search | `store-search.test.ts` | 13 | Search state, find options, marks, bookmarks |
| Macros | `store-macro.test.ts` | 9 | Recording, playback, action logging, saved macros |
| File Tree | `store-filetree.test.ts` | 7 | Tree nodes, expansion state, workspace root |
| Git Integration | `git.test.ts` | 68 | Clone, commit, push, pull, branch operations, diff viewer, auth handling |
| AI Integration | `ai.test.ts` | 75 | Multi-provider support, chat, completions, code actions, token management |
| Terminal | `terminal.test.ts` | 42 | Command execution, history, output parsing, error handling |
| Snippets | `snippets.test.ts` | 38 | CRUD operations, language filtering, insertion, persistence |
| Credential Storage | `credential-storage.test.ts` | 52 | Encryption/decryption, session-only mode, auto-expiry, migration |
| Persistence | `persistence.test.ts` | 35 | Save/load operations, data migration, cleanup |
| Security | `security.test.ts` | 28 | Encryption algorithms, key derivation, secure erasure |
| Event Dispatcher | `event-dispatcher.test.ts` | 22 | Subscribe/unsubscribe, dispatch, type safety |
| Service Locator | `service-locator.test.ts` | 19 | Registration, resolution, lifecycle management |
| Object Pooling | `pooling.test.ts` | 15 | Acquire, release, reuse, limits |

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

- Files go in `src/__tests__/` with the pattern `<module>.test.ts`
- Use `describe` blocks to group related tests
- Test names describe the expected behavior: `"should add a new tab with default values"`
- Each test creates a fresh store instance to avoid state leakage
- Use Zustand's `getState()` and `setState()` for direct store access in tests
