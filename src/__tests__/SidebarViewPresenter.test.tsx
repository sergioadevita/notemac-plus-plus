import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../Notemac/UI/SidebarViewPresenter';
import { useNotemacStore } from '../Notemac/Model/Store';
import '@testing-library/jest-dom';

const mockTheme = {
  bg: '#1e1e2e',
  bgSecondary: '#181825',
  bgTertiary: '#313244',
  bgHover: '#45475a',
  bgActive: '#585b70',
  text: '#cdd6f4',
  textSecondary: '#a6adc8',
  textMuted: '#6c7086',
  accent: '#89b4fa',
  accentText: '#1e1e2e',
  border: '#45475a',
  tabBg: '#181825',
  tabActiveBg: '#1e1e2e',
  tabActiveText: '#cdd6f4',
  tabBorder: '#313244',
  menuBg: '#1e1e2e',
  menuText: '#cdd6f4',
  sidebarBg: '#181825',
  sidebarText: '#a6adc8',
  warning: '#f9e2af',
  error: '#f38ba8',
  scrollbarThumb: '#45475a',
  scrollbarTrack: 'transparent',
  monacoTheme: 'custom-dark',
} as any;

const mockSetSidebarPanel = vi.fn();
const mockToggleTreeNode = vi.fn();
const mockAddTab = vi.fn();
const mockSetActiveTab = vi.fn();
const mockGetChangedFileCount = vi.fn(() => 0);

vi.mock('../Notemac/Model/Store');

vi.mock('../Notemac/UI/GitPanelViewPresenter', () => ({
  GitPanelViewPresenter: () => <div data-testid="git-panel">Git Panel</div>,
}));

vi.mock('../Notemac/UI/AIChatPanelViewPresenter', () => ({
  AIChatPanelViewPresenter: () => <div data-testid="ai-panel">AI Panel</div>,
}));

vi.mock('../Notemac/Controllers/GitController', () => ({
  InitGitForWorkspace: vi.fn(),
}));

vi.mock('../Shared/Helpers/EditorGlobals', () => ({
  GetEditorAction: vi.fn(() => null),
}));

vi.mock('../Shared/Helpers/FileHelpers', () => ({
  detectLanguage: vi.fn(() => 'plaintext'),
  detectLineEnding: vi.fn(() => 'LF'),
}));

vi.mock('../Notemac/Commons/Constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../Notemac/Commons/Constants')>();
  return { ...actual };
});

describe('SidebarViewPresenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotemacStore).mockReturnValue({
      sidebarPanel: null,
      sidebarWidth: 250,
      fileTree: [],
      workspacePath: null,
      tabs: [],
      activeTabId: 'tab1',
      setSidebarPanel: mockSetSidebarPanel,
      toggleTreeNode: mockToggleTreeNode,
      addTab: mockAddTab,
      setActiveTab: mockSetActiveTab,
      setFileTree: vi.fn(),
      setWorkspacePath: vi.fn(),
      GetChangedFileCount: mockGetChangedFileCount,
      clipboardHistory: [],
    } as any);
  });

  it('renders 9 icon buttons for all sidebar panels', () => {
    render(<Sidebar theme={mockTheme} />);

    const expectedPanels = [
      'Explorer',
      'Search',
      'Function List',
      'Document List',
      'Project',
      'Clipboard History',
      'Character Panel',
      'Source Control',
      'AI Assistant',
    ];

    expectedPanels.forEach((panelName) => {
      const button = screen.getByLabelText(new RegExp(panelName, 'i'));
      expect(button).toBeInTheDocument();
    });
  });

  it('each icon button has proper aria-label', () => {
    render(<Sidebar theme={mockTheme} />);

    const buttons = screen.getAllByRole('button');
    const iconButtons = buttons.filter((btn) => btn.getAttribute('aria-label'));

    expect(iconButtons.length).toBeGreaterThan(0);
    iconButtons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-label');
    });
  });

  it('toggles sidebar panel when icon button is clicked', () => {
    render(<Sidebar theme={mockTheme} />);

    const explorerButton = screen.getByLabelText(/Explorer/i);
    fireEvent.click(explorerButton);

    expect(mockSetSidebarPanel).toHaveBeenCalled();
  });

  it('shows only icons when sidebarPanel is null', () => {
    const { rerender } = render(<Sidebar theme={mockTheme} />);

    // Should not show any panel content headers
    expect(screen.queryByText(/Explorer/)).not.toBeInTheDocument();

    rerender(<Sidebar theme={mockTheme} />);
    // Icon buttons should still be visible
    const explorerButton = screen.getByLabelText(/Explorer/i);
    expect(explorerButton).toBeInTheDocument();
  });

  it('shows Explorer panel with "No folder opened" when sidebarPanel is explorer and fileTree is empty', () => {
    const mockStore = {
      sidebarPanel: 'explorer',
      sidebarWidth: 250,
      fileTree: [],
      workspacePath: null,
      tabs: [],
      activeTabId: 'tab1',
      setSidebarPanel: mockSetSidebarPanel,
      toggleTreeNode: mockToggleTreeNode,
      addTab: mockAddTab,
      setActiveTab: mockSetActiveTab,
      setFileTree: vi.fn(),
      setWorkspacePath: vi.fn(),
      GetChangedFileCount: mockGetChangedFileCount,
      clipboardHistory: [],
    };

    vi.mocked(useNotemacStore).mockReturnValue(mockStore);

    render(<Sidebar theme={mockTheme} />);

    expect(screen.getByText(/No folder opened/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Folder/i })).toBeInTheDocument();
  });

  it('shows Explorer header when sidebarPanel is explorer', () => {
    const mockStore = {
      sidebarPanel: 'explorer',
      sidebarWidth: 250,
      fileTree: [],
      workspacePath: null,
      tabs: [],
      activeTabId: 'tab1',
      setSidebarPanel: mockSetSidebarPanel,
      toggleTreeNode: mockToggleTreeNode,
      addTab: mockAddTab,
      setActiveTab: mockSetActiveTab,
      setFileTree: vi.fn(),
      setWorkspacePath: vi.fn(),
      GetChangedFileCount: mockGetChangedFileCount,
      clipboardHistory: [],
    };

    vi.mocked(useNotemacStore).mockReturnValue(mockStore);

    render(<Sidebar theme={mockTheme} />);

    const header = screen.getByText(/Explorer/i);
    expect(header).toBeInTheDocument();
  });

  it('shows file tree nodes when fileTree has data', () => {
    const mockFileTree = [
      {
        id: '1',
        name: 'src',
        type: 'folder',
        depth: 0,
        children: [],
        isExpanded: true,
      },
      {
        id: '2',
        name: 'app.ts',
        type: 'file',
        depth: 1,
        children: [],
        isExpanded: false,
      },
    ];

    const mockStore = {
      sidebarPanel: 'explorer',
      sidebarWidth: 250,
      fileTree: mockFileTree,
      workspacePath: '/home/user/project',
      tabs: [],
      activeTabId: 'tab1',
      setSidebarPanel: mockSetSidebarPanel,
      toggleTreeNode: mockToggleTreeNode,
      addTab: mockAddTab,
      setActiveTab: mockSetActiveTab,
      setFileTree: vi.fn(),
      setWorkspacePath: vi.fn(),
      GetChangedFileCount: mockGetChangedFileCount,
      clipboardHistory: [],
    };

    vi.mocked(useNotemacStore).mockReturnValue(mockStore);

    render(<Sidebar theme={mockTheme} />);

    expect(screen.getByText(/src/)).toBeInTheDocument();
    expect(screen.getByText(/app.ts/)).toBeInTheDocument();
  });

  it('shows collapse panel button (✕)', () => {
    const mockStore = {
      sidebarPanel: 'explorer',
      sidebarWidth: 250,
      fileTree: [],
      workspacePath: null,
      tabs: [],
      activeTabId: 'tab1',
      setSidebarPanel: mockSetSidebarPanel,
      toggleTreeNode: mockToggleTreeNode,
      addTab: mockAddTab,
      setActiveTab: mockSetActiveTab,
      setFileTree: vi.fn(),
      setWorkspacePath: vi.fn(),
      GetChangedFileCount: mockGetChangedFileCount,
      clipboardHistory: [],
    };

    vi.mocked(useNotemacStore).mockReturnValue(mockStore);

    render(<Sidebar theme={mockTheme} />);

    const collapseButton = screen.getByRole('button', { name: /close|collapse|✕/i });
    expect(collapseButton).toBeInTheDocument();
  });

  it('shows git badge count when GetChangedFileCount returns > 0', () => {
    mockGetChangedFileCount.mockReturnValue(3);

    const mockStore = {
      sidebarPanel: null,
      sidebarWidth: 250,
      fileTree: [],
      workspacePath: null,
      tabs: [],
      activeTabId: 'tab1',
      setSidebarPanel: mockSetSidebarPanel,
      toggleTreeNode: mockToggleTreeNode,
      addTab: mockAddTab,
      setActiveTab: mockSetActiveTab,
      setFileTree: vi.fn(),
      setWorkspacePath: vi.fn(),
      GetChangedFileCount: mockGetChangedFileCount,
      clipboardHistory: [],
    };

    vi.mocked(useNotemacStore).mockReturnValue(mockStore);

    render(<Sidebar theme={mockTheme} />);

    // Badge should show the count
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it('does not show git badge when GetChangedFileCount returns 0', () => {
    mockGetChangedFileCount.mockReturnValue(0);

    const mockStore = {
      sidebarPanel: null,
      sidebarWidth: 250,
      fileTree: [],
      workspacePath: null,
      tabs: [],
      activeTabId: 'tab1',
      setSidebarPanel: mockSetSidebarPanel,
      toggleTreeNode: mockToggleTreeNode,
      addTab: mockAddTab,
      setActiveTab: mockSetActiveTab,
      setFileTree: vi.fn(),
      setWorkspacePath: vi.fn(),
      GetChangedFileCount: mockGetChangedFileCount,
      clipboardHistory: [],
    };

    vi.mocked(useNotemacStore).mockReturnValue(mockStore);

    render(<Sidebar theme={mockTheme} />);

    const badgeText = screen.queryByText(/[1-9]\d*/);
    expect(badgeText).not.toBeInTheDocument();
  });

  it('renders resize handle', () => {
    const mockStore = {
      sidebarPanel: 'explorer',
      sidebarWidth: 250,
      fileTree: [],
      workspacePath: null,
      tabs: [],
      activeTabId: 'tab1',
      setSidebarPanel: mockSetSidebarPanel,
      toggleTreeNode: mockToggleTreeNode,
      addTab: mockAddTab,
      setActiveTab: mockSetActiveTab,
      setFileTree: vi.fn(),
      setWorkspacePath: vi.fn(),
      GetChangedFileCount: mockGetChangedFileCount,
      clipboardHistory: [],
    };

    vi.mocked(useNotemacStore).mockReturnValue(mockStore);

    const { container } = render(<Sidebar theme={mockTheme} />);

    // Resize handle is a plain div with class 'resizer'
    const resizeHandle = container.querySelector('.resizer');

    expect(resizeHandle).toBeInTheDocument();
  });


  it('calls setSidebarPanel(null) when collapse button is clicked', () => {
    const mockStore = {
      sidebarPanel: 'explorer',
      sidebarWidth: 250,
      fileTree: [],
      workspacePath: null,
      tabs: [],
      activeTabId: 'tab1',
      setSidebarPanel: mockSetSidebarPanel,
      toggleTreeNode: mockToggleTreeNode,
      addTab: mockAddTab,
      setActiveTab: mockSetActiveTab,
      setFileTree: vi.fn(),
      setWorkspacePath: vi.fn(),
      GetChangedFileCount: mockGetChangedFileCount,
      clipboardHistory: [],
    };

    vi.mocked(useNotemacStore).mockReturnValue(mockStore);

    render(<Sidebar theme={mockTheme} />);

    const collapseButton = screen.getByRole('button', { name: /close|collapse|✕/i });
    fireEvent.click(collapseButton);

    expect(mockSetSidebarPanel).toHaveBeenCalledWith(null);
  });
});
