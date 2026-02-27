import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TabBar } from '../Notemac/UI/TabBarViewPresenter';
import * as StoreModule from '../Notemac/Model/Store';

vi.mock('../Notemac/Commons/Constants', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual };
});

const mockTheme = {
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

describe('TabBar', () => {
  const mockTabs = [
    {
      id: 'tab-1',
      name: 'File1.tsx',
      isModified: false,
      isPinned: false,
      isReadOnly: false,
      tabColor: 'none' as const,
    },
    {
      id: 'tab-2',
      name: 'File2.ts',
      isModified: true,
      isPinned: false,
      isReadOnly: false,
      tabColor: 'none' as const,
    },
    {
      id: 'tab-3',
      name: 'Config.json',
      isModified: false,
      isPinned: true,
      isReadOnly: true,
      tabColor: 'none' as const,
    },
  ];

  let mockStore: any;

  beforeEach(() => {
    mockStore = {
      tabs: mockTabs,
      activeTabId: 'tab-1',
      setActiveTab: vi.fn(),
      closeTab: vi.fn(),
      addTab: vi.fn(),
      closeOtherTabs: vi.fn(),
      closeAllTabs: vi.fn(),
      moveTab: vi.fn(),
      setSplitView: vi.fn(),
      closeTabsToLeft: vi.fn(),
      closeTabsToRight: vi.fn(),
      closeUnchangedTabs: vi.fn(),
      closeAllButPinned: vi.fn(),
      togglePinTab: vi.fn(),
      setTabColor: vi.fn(),
    };

    vi.spyOn(StoreModule, 'useNotemacStore').mockReturnValue(mockStore);
  });

  it('renders tabs from store', () => {
    render(<TabBar theme={mockTheme} />);

    expect(screen.getByText('File1.tsx')).toBeInTheDocument();
    expect(screen.getByText('File2.ts')).toBeInTheDocument();
    expect(screen.getByText('Config.json')).toBeInTheDocument();
  });

  it('shows modified indicator for modified tabs', () => {
    render(<TabBar theme={mockTheme} />);

    const modifiedTab = screen.getByText('File2.ts');
    expect(modifiedTab.parentElement).toHaveTextContent('●');
  });

  it('shows pinned indicator for pinned tabs', () => {
    render(<TabBar theme={mockTheme} />);

    const pinnedTab = screen.getByText('Config.json');
    expect(pinnedTab.parentElement).toHaveTextContent('📌');
  });

  it('shows read-only indicator for read-only tabs', () => {
    render(<TabBar theme={mockTheme} />);

    const readOnlyTab = screen.getByText('Config.json');
    expect(readOnlyTab.parentElement).toHaveTextContent('🔒');
  });

  it('shows close button on non-pinned tabs', () => {
    render(<TabBar theme={mockTheme} />);

    const closeButton = screen.getByLabelText('Close tab: File1.tsx');
    expect(closeButton).toBeInTheDocument();
  });

  it('does not show close button on pinned tabs', () => {
    render(<TabBar theme={mockTheme} />);

    expect(screen.queryByLabelText('Close tab: Config.json')).not.toBeInTheDocument();
  });

  it('shows new tab button', () => {
    render(<TabBar theme={mockTheme} />);

    const newTabButton = screen.getByLabelText('New tab');
    expect(newTabButton).toBeInTheDocument();
    expect(newTabButton.textContent).toBe('+');
  });

  it('calls setActiveTab when clicking a tab', () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File2.ts').closest('div[draggable]');
    fireEvent.click(tab!);

    expect(mockStore.setActiveTab).toHaveBeenCalledWith('tab-2');
  });

  it('calls addTab when clicking new tab button', () => {
    render(<TabBar theme={mockTheme} />);

    const newTabButton = screen.getByLabelText('New tab');
    fireEvent.click(newTabButton);

    expect(mockStore.addTab).toHaveBeenCalled();
  });

  it('calls closeTab when clicking close button', () => {
    render(<TabBar theme={mockTheme} />);

    const closeButton = screen.getByLabelText('Close tab: File1.tsx');
    fireEvent.click(closeButton);

    expect(mockStore.closeTab).toHaveBeenCalledWith('tab-1');
  });

  it('calls closeTab on middle-click', () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File2.ts').closest('div[draggable]');
    fireEvent.mouseDown(tab!, { button: 1 });

    expect(mockStore.closeTab).toHaveBeenCalledWith('tab-2');
  });

  it('opens context menu on right-click', async () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File1.tsx').closest('div[draggable]');
    fireEvent.contextMenu(tab!, { clientX: 100, clientY: 100 });

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  it('shows all context menu items', async () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File1.tsx').closest('div[draggable]');
    fireEvent.contextMenu(tab!, { clientX: 100, clientY: 100 });

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument();
      expect(screen.getByText('Close Others')).toBeInTheDocument();
      expect(screen.getByText('Close Tabs to the Left')).toBeInTheDocument();
      expect(screen.getByText('Close Tabs to the Right')).toBeInTheDocument();
      expect(screen.getByText('Close All')).toBeInTheDocument();
      expect(screen.getByText('Close Unchanged')).toBeInTheDocument();
      expect(screen.getByText('Close All but Pinned')).toBeInTheDocument();
      expect(screen.getByText('Pin Tab')).toBeInTheDocument();
      expect(screen.getByText('Tab Color')).toBeInTheDocument();
      expect(screen.getByText('Clone to Split View')).toBeInTheDocument();
    });
  });

  it('calls closeTab from context menu', async () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File1.tsx').closest('div[draggable]');
    fireEvent.contextMenu(tab!, { clientX: 100, clientY: 100 });

    const closeMenuItem = await screen.findByText('Close');
    fireEvent.click(closeMenuItem);

    expect(mockStore.closeTab).toHaveBeenCalledWith('tab-1');
  });

  it('calls closeOtherTabs from context menu', async () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File1.tsx').closest('div[draggable]');
    fireEvent.contextMenu(tab!, { clientX: 100, clientY: 100 });

    const closeOthersMenuItem = await screen.findByText('Close Others');
    fireEvent.click(closeOthersMenuItem);

    expect(mockStore.closeOtherTabs).toHaveBeenCalledWith('tab-1');
  });

  it('calls closeTabsToLeft from context menu', async () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File2.ts').closest('div[draggable]');
    fireEvent.contextMenu(tab!, { clientX: 100, clientY: 100 });

    const closeLeftMenuItem = await screen.findByText('Close Tabs to the Left');
    fireEvent.click(closeLeftMenuItem);

    expect(mockStore.closeTabsToLeft).toHaveBeenCalledWith('tab-2');
  });

  it('calls closeTabsToRight from context menu', async () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File1.tsx').closest('div[draggable]');
    fireEvent.contextMenu(tab!, { clientX: 100, clientY: 100 });

    const closeRightMenuItem = await screen.findByText('Close Tabs to the Right');
    fireEvent.click(closeRightMenuItem);

    expect(mockStore.closeTabsToRight).toHaveBeenCalledWith('tab-1');
  });

  it('calls closeAllTabs from context menu', async () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File1.tsx').closest('div[draggable]');
    fireEvent.contextMenu(tab!, { clientX: 100, clientY: 100 });

    const closeAllMenuItem = await screen.findByText('Close All');
    fireEvent.click(closeAllMenuItem);

    expect(mockStore.closeAllTabs).toHaveBeenCalled();
  });

  it('calls closeUnchangedTabs from context menu', async () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File1.tsx').closest('div[draggable]');
    fireEvent.contextMenu(tab!, { clientX: 100, clientY: 100 });

    const closeUnchangedMenuItem = await screen.findByText('Close Unchanged');
    fireEvent.click(closeUnchangedMenuItem);

    expect(mockStore.closeUnchangedTabs).toHaveBeenCalled();
  });

  it('calls closeAllButPinned from context menu', async () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File1.tsx').closest('div[draggable]');
    fireEvent.contextMenu(tab!, { clientX: 100, clientY: 100 });

    const closePinnedMenuItem = await screen.findByText('Close All but Pinned');
    fireEvent.click(closePinnedMenuItem);

    expect(mockStore.closeAllButPinned).toHaveBeenCalled();
  });

  it('calls togglePinTab from context menu for unpinned tab', async () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File1.tsx').closest('div[draggable]');
    fireEvent.contextMenu(tab!, { clientX: 100, clientY: 100 });

    const pinMenuItem = await screen.findByText('Pin Tab');
    fireEvent.click(pinMenuItem);

    expect(mockStore.togglePinTab).toHaveBeenCalledWith('tab-1');
  });

  it('shows Unpin Tab option for pinned tab', async () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('Config.json').closest('div[draggable]');
    fireEvent.contextMenu(tab!, { clientX: 100, clientY: 100 });

    const unpinMenuItem = await screen.findByText('Unpin Tab');
    expect(unpinMenuItem).toBeInTheDocument();
  });

  it('opens tab color picker from context menu', async () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File1.tsx').closest('div[draggable]');
    fireEvent.contextMenu(tab!, { clientX: 100, clientY: 100 });

    const colorMenuItem = await screen.findByText('Tab Color');
    fireEvent.click(colorMenuItem);

    await waitFor(() => {
      expect(screen.getByTitle('No color')).toBeInTheDocument();
    });
  });

  it('calls setSplitView from context menu', async () => {
    render(<TabBar theme={mockTheme} />);

    const tab = screen.getByText('File1.tsx').closest('div[draggable]');
    fireEvent.contextMenu(tab!, { clientX: 100, clientY: 100 });

    const cloneMenuItem = await screen.findByText('Clone to Split View');
    fireEvent.click(cloneMenuItem);

    expect(mockStore.setSplitView).toHaveBeenCalledWith('vertical', 'tab-1');
  });

  it('handles tab drag and drop', () => {
    render(<TabBar theme={mockTheme} />);

    const sourceTab = screen.getByText('File1.tsx').closest('div[draggable]');
    const targetTab = screen.getByText('File2.ts').closest('div[draggable]');

    fireEvent.dragStart(sourceTab!);
    fireEvent.dragOver(targetTab!, { preventDefault: vi.fn() });
    fireEvent.drop(targetTab!);

    expect(mockStore.moveTab).toHaveBeenCalledWith(0, 1);
  });

  it('renders with correct theme colors', () => {
    const { container } = render(<TabBar theme={mockTheme} />);

    const tabBar = container.firstChild as HTMLElement;
    expect(tabBar.style.backgroundColor).toBeTruthy();
  });
});
