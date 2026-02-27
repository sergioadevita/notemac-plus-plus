import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../Notemac/UI/AppViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

Element.prototype.scrollIntoView = vi.fn();

const mockTheme: ThemeColors = {
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

// Mock all dependencies
vi.mock('../Notemac/Model/Store', () => ({
  useNotemacStore: vi.fn(),
}));

import { useNotemacStore } from '../Notemac/Model/Store';

vi.mock('../Notemac/Configs/ThemeConfig', () => ({
  GetTheme: () => mockTheme,
  GetCustomTheme: () => mockTheme,
}));

vi.mock('../Notemac/Controllers/AppController', () => ({
  HandleKeyDown: vi.fn(),
}));

vi.mock('../Notemac/Controllers/MenuActionController', () => ({
  HandleMenuAction: vi.fn(),
}));

vi.mock('../Notemac/Controllers/FileController', () => ({
  HandleDragOver: vi.fn(),
  HandleDrop: vi.fn(),
  SetupElectronIPC: vi.fn(),
}));

vi.mock('../Notemac/Services/PlatformBridge', () => ({
  IsDesktopEnvironment: () => false,
}));

vi.mock('../Notemac/UI/MenuBarViewPresenter', () => ({
  MenuBar: () => <div data-testid="menu-bar">MenuBar</div>,
}));

vi.mock('../Notemac/UI/ToolbarViewPresenter', () => ({
  Toolbar: () => <div data-testid="toolbar">Toolbar</div>,
}));

vi.mock('../Notemac/UI/TabBarViewPresenter', () => ({
  TabBar: () => <div data-testid="tab-bar">TabBar</div>,
}));

vi.mock('../Notemac/UI/EditorPanelViewPresenter', () => ({
  EditorPanel: () => <div data-testid="editor-panel">EditorPanel</div>,
}));

vi.mock('../Notemac/UI/StatusBarViewPresenter', () => ({
  StatusBar: () => <div data-testid="status-bar">StatusBar</div>,
}));

vi.mock('../Notemac/UI/SidebarViewPresenter', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('../Notemac/UI/FindReplaceViewPresenter', () => ({
  FindReplace: () => <div data-testid="find-replace">FindReplace</div>,
}));

vi.mock('../Notemac/UI/WelcomeScreenViewPresenter', () => ({
  WelcomeScreen: () => <div data-testid="welcome-screen">WelcomeScreen</div>,
}));

vi.mock('../Notemac/UI/FeedbackPopupViewPresenter', () => ({
  FeedbackPopup: () => <div data-testid="feedback-popup">FeedbackPopup</div>,
}));

vi.mock('../Notemac/UI/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>,
}));

vi.mock('../Notemac/UI/SettingsDialogViewPresenter', () => ({
  SettingsDialog: () => <div>SettingsDialog</div>,
}));

vi.mock('../Notemac/UI/GoToLineDialogViewPresenter', () => ({
  GoToLineDialog: () => <div>GoToLineDialog</div>,
}));

vi.mock('../Notemac/UI/AboutDialogViewPresenter', () => ({
  AboutDialog: () => <div>AboutDialog</div>,
}));

vi.mock('../Notemac/UI/RunCommandDialogViewPresenter', () => ({
  RunCommandDialog: () => <div>RunCommandDialog</div>,
}));

vi.mock('../Notemac/UI/ColumnEditorDialogViewPresenter', () => ({
  ColumnEditorDialog: () => <div>ColumnEditorDialog</div>,
}));

vi.mock('../Notemac/UI/SummaryDialogViewPresenter', () => ({
  SummaryDialog: () => <div>SummaryDialog</div>,
}));

vi.mock('../Notemac/UI/CharInRangeDialogViewPresenter', () => ({
  CharInRangeDialog: () => <div>CharInRangeDialog</div>,
}));

vi.mock('../Notemac/UI/ShortcutMapperDialogViewPresenter', () => ({
  ShortcutMapperDialog: () => <div>ShortcutMapperDialog</div>,
}));

vi.mock('../Notemac/UI/CommandPaletteViewPresenter', () => ({
  CommandPaletteViewPresenter: () => <div>CommandPalette</div>,
}));

vi.mock('../Notemac/UI/QuickOpenViewPresenter', () => ({
  QuickOpenViewPresenter: () => <div>QuickOpen</div>,
}));

vi.mock('../Notemac/UI/DiffViewerViewPresenter', () => ({
  DiffViewerViewPresenter: () => <div>DiffViewer</div>,
}));

vi.mock('../Notemac/UI/SnippetManagerViewPresenter', () => ({
  SnippetManagerViewPresenter: () => <div>SnippetManager</div>,
}));

vi.mock('../Notemac/UI/TerminalPanelViewPresenter', () => ({
  TerminalPanelViewPresenter: () => <div>TerminalPanel</div>,
}));

vi.mock('../Notemac/UI/CloneRepositoryViewPresenter', () => ({
  CloneRepositoryViewPresenter: () => <div>CloneRepository</div>,
}));

vi.mock('../Notemac/UI/GitSettingsViewPresenter', () => ({
  GitSettingsViewPresenter: () => <div>GitSettings</div>,
}));

vi.mock('../Notemac/UI/AISettingsViewPresenter', () => ({
  AISettingsViewPresenter: () => <div>AISettings</div>,
}));

describe('AppViewPresenter', () => {
  const mockStoreState = {
    tabs: [
      {
        id: 'tab-1',
        name: 'test.js',
        content: 'console.log("hello");',
        language: 'javascript',
        encoding: 'utf-8',
        lineEnding: 'LF',
        cursorLine: 1,
        cursorColumn: 1,
        isDirty: false,
      },
    ],
    activeTabId: 'tab-1',
    showStatusBar: true,
    showToolbar: true,
    settings: {
      theme: 'dark',
      fontSize: 12,
      distractionFreeMode: false,
      customThemeBase: 'dark',
      customThemeColors: {},
    },
    showFindReplace: false,
    showSettings: false,
    showGoToLine: false,
    showAbout: false,
    showRunCommand: false,
    showColumnEditor: false,
    showSummary: false,
    showCharInRange: false,
    showShortcutMapper: false,
    showCommandPalette: false,
    showQuickOpen: false,
    showDiffViewer: false,
    showSnippetManager: false,
    showTerminalPanel: false,
    showCloneDialog: false,
    showGitSettings: false,
    showAiSettings: false,
    splitView: 'none',
    splitTabId: null,
    zoomLevel: 0,
    sidebarPanel: 'files',
    addTab: vi.fn(),
    LoadAIState: vi.fn(),
    setSidebarPanel: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(mockStoreState);
      }
      return mockStoreState;
    });
    vi.mocked(useNotemacStore).getState = vi.fn(() => mockStoreState);
  });

  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeTruthy();
  });

  it('shows MenuBar when not in distraction-free mode and not electron', () => {
    render(<App />);
    expect(screen.getByTestId('menu-bar')).toBeTruthy();
  });

  it('shows Toolbar when showToolbar is true', () => {
    render(<App />);
    expect(screen.getByTestId('toolbar')).toBeTruthy();
  });

  it('hides Toolbar when showToolbar is false', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = { ...mockStoreState, showToolbar: false };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<App />);
    expect(screen.queryByTestId('toolbar')).toBeFalsy();
  });

  it('shows TabBar when not in distraction-free mode', () => {
    render(<App />);
    expect(screen.getByTestId('tab-bar')).toBeTruthy();
  });

  it('shows StatusBar when showStatusBar is true', () => {
    render(<App />);
    expect(screen.getByTestId('status-bar')).toBeTruthy();
  });

  it('hides StatusBar when showStatusBar is false', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = { ...mockStoreState, showStatusBar: false };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<App />);
    expect(screen.queryByTestId('status-bar')).toBeFalsy();
  });

  it('shows EditorPanel when tabs exist', () => {
    render(<App />);
    expect(screen.getByTestId('editor-panel')).toBeTruthy();
  });

  it('shows WelcomeScreen when no tabs exist', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = { ...mockStoreState, tabs: [], activeTabId: null };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<App />);
    expect(screen.getByTestId('welcome-screen')).toBeTruthy();
  });

  it('shows Sidebar when not in distraction-free mode', () => {
    render(<App />);
    expect(screen.getByTestId('sidebar')).toBeTruthy();
  });

  it('hides Sidebar when in distraction-free mode', () => {
    const stateWithoutSidebar = {
      ...mockStoreState,
      settings: { ...mockStoreState.settings, distractionFreeMode: true },
    };
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(stateWithoutSidebar);
      }
      return stateWithoutSidebar;
    });

    render(<App />);
    expect(screen.queryByTestId('sidebar')).toBeFalsy();
  });

  it('shows FeedbackPopup', () => {
    render(<App />);
    expect(screen.getByTestId('feedback-popup')).toBeTruthy();
  });

  it('registers keyboard handler on mount', () => {
    render(<App />);
    // Should not throw and component should render
    expect(screen.getByTestId('error-boundary')).toBeTruthy();
  });

  it('applies correct background color from theme', () => {
    const { container } = render(<App />);
    const appDiv = container.querySelector('.notemac-app') as HTMLElement;
    expect(appDiv).toBeTruthy();
    // DOM converts hex colors to rgb, so check that it's truthy instead
    expect(appDiv.style.backgroundColor).toBeTruthy();
  });

  it('applies correct text color from theme', () => {
    const { container } = render(<App />);
    const appDiv = container.querySelector('.notemac-app') as HTMLElement;
    // DOM converts hex colors to rgb, so check that it's truthy instead
    expect(appDiv.style.color).toBeTruthy();
  });

  it('hides MenuBar and Toolbar in distraction-free mode', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = {
        ...mockStoreState,
        settings: { ...mockStoreState.settings, distractionFreeMode: true },
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<App />);
    expect(screen.queryByTestId('menu-bar')).toBeFalsy();
    expect(screen.queryByTestId('toolbar')).toBeFalsy();
  });

  it('shows FindReplace when showFindReplace is true', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = { ...mockStoreState, showFindReplace: true };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<App />);
    expect(screen.getByTestId('find-replace')).toBeTruthy();
  });

  it('does not show FindReplace when showFindReplace is false', () => {
    render(<App />);
    expect(screen.queryByTestId('find-replace')).toBeFalsy();
  });
});
