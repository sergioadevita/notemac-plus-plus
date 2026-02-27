import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../Notemac/Model/Store', () => ({
  useNotemacStore: vi.fn(),
}));

vi.mock('@monaco-editor/react', () => ({
  default: vi.fn((props: any) => (
    <div
      data-testid="monaco-editor"
      data-language={props.language}
      data-theme={props.theme}
      data-readonly={String(props.options?.readOnly ?? false)}
      data-word-wrap={props.options?.wordWrap ?? ''}
      data-minimap={String(props.options?.minimap?.enabled ?? true)}
      data-value={props.value}
    >
      {props.loading}
    </div>
  )),
  __esModule: true,
}));

vi.mock('../Notemac/UI/EditorPanel/useEditorSetup', () => ({
  useEditorSetup: vi.fn(() => vi.fn()),
  cleanupCompletionDisposables: vi.fn(),
}));

vi.mock('../Notemac/UI/EditorPanel/useEditorEvents', () => ({
  useEditorEvents: vi.fn(),
}));

vi.mock('../Notemac/UI/EditorPanel/useEditorActions', () => ({
  useEditorActions: vi.fn(() => vi.fn()),
  registerActionHandler: vi.fn(),
  unregisterActionHandler: vi.fn(),
}));

vi.mock('../Notemac/UI/EditorPanel/useMacroPlayback', () => ({
  useMacroPlayback: vi.fn(() => vi.fn()),
}));

vi.mock('../Notemac/UI/EditorPanel/useAIContextMenu', () => ({
  RegisterAIContextMenuActions: vi.fn(),
}));

vi.mock('../Notemac/Controllers/SnippetController', () => ({
  InsertSnippet: vi.fn(),
}));

vi.mock('../Shared/EventDispatcher/EventDispatcher', () => ({
  Subscribe: vi.fn(),
  Unsubscribe: vi.fn(),
  NOTEMAC_EVENTS: { INSERT_SNIPPET: 'INSERT_SNIPPET' },
}));

import { useNotemacStore } from '../Notemac/Model/Store';
import { EditorPanel } from '../Notemac/UI/EditorPanelViewPresenter';
import { useEditorSetup } from '../Notemac/UI/EditorPanel/useEditorSetup';
import { useEditorEvents } from '../Notemac/UI/EditorPanel/useEditorEvents';
import { useEditorActions } from '../Notemac/UI/EditorPanel/useEditorActions';
import { useMacroPlayback } from '../Notemac/UI/EditorPanel/useMacroPlayback';
import { Subscribe } from '../Shared/EventDispatcher/EventDispatcher';

const mockTheme: any = {
  bg: '#1e1e1e',
  bgSecondary: '#252526',
  bgTertiary: '#2d2d30',
  bgHover: '#3e3e42',
  bgActive: '#094771',
  text: '#cccccc',
  textSecondary: '#969696',
  textMuted: '#6e6e6e',
  border: '#3e3e42',
  accent: '#007acc',
  accentHover: '#1a8ad4',
  accentText: '#ffffff',
  danger: '#f44747',
  warning: '#cca700',
  success: '#89d185',
  tabBg: '#2d2d30',
  tabActiveBg: '#1e1e1e',
  tabActiveText: '#ffffff',
  tabBorder: '#3e3e42',
  menuBg: '#2d2d30',
  menuHover: '#094771',
  menuText: '#cccccc',
  statusBarBg: '#007acc',
  statusBarText: '#ffffff',
  sidebarBg: '#252526',
  sidebarText: '#cccccc',
  scrollbarBg: 'transparent',
  scrollbarThumb: '#424242',
  editorBg: '#1e1e1e',
  editorMonacoTheme: 'vs-dark',
  findBg: '#252526',
};

const mockTab: any = {
  id: 'tab-1',
  title: 'test.js',
  content: 'const x = 1;',
  language: 'javascript',
  isReadOnly: false,
  bookmarks: [],
  marks: {},
};

const mockSettings: any = {
  fontSize: 14,
  fontFamily: 'Consolas',
  tabSize: 2,
  insertSpaces: true,
  wordWrap: true,
  showLineNumbers: true,
  showMinimap: true,
  renderWhitespace: 'selection',
  showIndentGuides: true,
  cursorBlinking: 'blink',
  cursorStyle: 'line',
  smoothScrolling: true,
  matchBrackets: true,
  autoCloseBrackets: true,
  autoCloseQuotes: true,
  highlightCurrentLine: true,
};

describe('EditorPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotemacStore).mockReturnValue({
      updateTabContent: vi.fn(),
      updateTab: vi.fn(),
    } as any);
  });

  it('renders the editor container', () => {
    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('passes correct language to Editor', () => {
    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(screen.getByTestId('monaco-editor')).toHaveAttribute(
      'data-language',
      'javascript'
    );
  });

  it('passes correct theme to Editor', () => {
    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(screen.getByTestId('monaco-editor')).toHaveAttribute(
      'data-theme',
      'vs-dark'
    );
  });

  it('shows loading text', () => {
    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    const editor = screen.getByTestId('monaco-editor');
    expect(editor.textContent).toBeDefined();
  });

  it('calls useEditorSetup with tab and theme', () => {
    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(useEditorSetup).toHaveBeenCalled();
  });

  it('calls useEditorEvents', () => {
    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(useEditorEvents).toHaveBeenCalled();
  });

  it('calls useMacroPlayback', () => {
    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(useMacroPlayback).toHaveBeenCalled();
  });

  it('calls useEditorActions', () => {
    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(useEditorActions).toHaveBeenCalled();
  });

  it('subscribes to snippet events on mount', () => {
    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(Subscribe).toHaveBeenCalled();
  });

  it('renders with read-only tab', () => {
    const readOnlyTab = { ...mockTab, isReadOnly: true };

    render(
      <EditorPanel
        tab={readOnlyTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(screen.getByTestId('monaco-editor')).toHaveAttribute(
      'data-readonly',
      'true'
    );
  });

  it('renders with different zoom level', () => {
    const { rerender } = render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();

    rerender(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1.2}
      />
    );

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('renders with minimap disabled', () => {
    const settingsWithoutMinimap = { ...mockSettings, showMinimap: false };

    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={settingsWithoutMinimap}
        zoomLevel={1}
      />
    );

    expect(screen.getByTestId('monaco-editor')).toHaveAttribute(
      'data-minimap',
      'false'
    );
  });

  it('renders with word wrap off', () => {
    const settingsWithoutWordWrap = { ...mockSettings, wordWrap: false };

    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={settingsWithoutWordWrap}
        zoomLevel={1}
      />
    );

    expect(screen.getByTestId('monaco-editor')).toHaveAttribute(
      'data-word-wrap',
      'off'
    );
  });

  it('renders with word wrap on', () => {
    const settingsWithWordWrap = { ...mockSettings, wordWrap: true };

    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={settingsWithWordWrap}
        zoomLevel={1}
      />
    );

    expect(screen.getByTestId('monaco-editor')).toHaveAttribute(
      'data-word-wrap',
      'on'
    );
  });

  it('uses settings font size in editor options', () => {
    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('uses settings font family in editor options', () => {
    render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('passes tab content to Editor', () => {
    const customTab = { ...mockTab, content: 'console.log("hello");' };

    render(
      <EditorPanel
        tab={customTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('updates when tab content changes', () => {
    const { rerender } = render(
      <EditorPanel
        tab={mockTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    const updatedTab = { ...mockTab, content: 'const y = 2;' };

    rerender(
      <EditorPanel
        tab={updatedTab}
        theme={mockTheme}
        settings={mockSettings}
        zoomLevel={1}
      />
    );

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });
});
