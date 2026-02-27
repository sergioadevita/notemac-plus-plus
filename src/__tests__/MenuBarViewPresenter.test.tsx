import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuBar } from '../Notemac/UI/MenuBarViewPresenter';
import { useNotemacStore } from '../Notemac/Model/Store';

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

vi.mock('../Notemac/Model/Store');

vi.mock('../Notemac/Configs/EncodingConfig', () => ({
  GetEncodings: vi.fn(() => [
    {
      group: 'Unicode',
      items: [{ label: 'UTF-8', value: 'utf-8' }],
    },
  ]),
}));

vi.mock('../Notemac/Configs/LanguageConfig', () => ({
  GetLanguages: vi.fn(() => [{ label: 'JavaScript', value: 'javascript' }]),
}));

vi.mock('../Notemac/Commons/Constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../Notemac/Commons/Constants')>();
  return { ...actual };
});

describe('MenuBar', () => {
  const mockOnAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotemacStore).mockReturnValue({
      settings: {
        wordWrap: true,
        showWhitespace: false,
        showEOL: false,
        showNonPrintable: false,
        showWrapSymbol: false,
        showIndentGuides: true,
        showLineNumbers: true,
        showMinimap: true,
        distractionFreeMode: false,
        alwaysOnTop: false,
        syncScrollVertical: false,
        syncScrollHorizontal: false,
      },
      isRecordingMacro: false,
    } as any);
  });

  it('should render menu bar with correct role', () => {
    render(<MenuBar theme={mockTheme} onAction={mockOnAction} />);

    const menubar = screen.getByRole('menubar');
    expect(menubar).toBeInTheDocument();
  });

  it('should display app icon "N++"', () => {
    render(<MenuBar theme={mockTheme} onAction={mockOnAction} />);

    expect(screen.getByText('N++')).toBeInTheDocument();
  });

  it('should display all menu names', () => {
    render(<MenuBar theme={mockTheme} onAction={mockOnAction} />);

    const menuNames = [
      'File',
      'Edit',
      'Search',
      'View',
      'Encoding',
      'Language',
      'Line Ops',
      'Macro',
      'Git',
      'Run',
      'Tools',
      'AI',
      'Settings',
    ];

    menuNames.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('should open dropdown when menu name is clicked', () => {
    render(<MenuBar theme={mockTheme} onAction={mockOnAction} />);

    const fileMenu = screen.getByText('File');
    fireEvent.click(fileMenu);

    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.length).toBeGreaterThan(0);
  });

  it('should render menu items with role="menuitem"', () => {
    render(<MenuBar theme={mockTheme} onAction={mockOnAction} />);

    const fileMenu = screen.getByText('File');
    fireEvent.click(fileMenu);

    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.length).toBeGreaterThan(0);
    menuItems.forEach((item) => {
      expect(item).toHaveAttribute('role', 'menuitem');
    });
  });

  it('should show checkmark for checked checkbox items', () => {
    render(<MenuBar theme={mockTheme} onAction={mockOnAction} />);

    const viewMenu = screen.getByText('View');
    fireEvent.click(viewMenu);

    const wordWrapItem = screen.getByText(/Word Wrap/i);
    const checkmark = wordWrapItem.textContent?.includes('✓');
    expect(checkmark).toBe(true);
  });

  it('should render separator items as dividers', () => {
    const { container } = render(<MenuBar theme={mockTheme} onAction={mockOnAction} />);

    const fileMenu = screen.getByText('File');
    fireEvent.click(fileMenu);

    // Separators are rendered as plain divs with height 1 and backgroundColor matching theme.border
    const separators = container.querySelectorAll('[style*="height: 1px"]');
    expect(separators.length).toBeGreaterThan(0);
  });

  it('should show shortcut text for menu items with shortcuts', () => {
    render(<MenuBar theme={mockTheme} onAction={mockOnAction} />);

    const fileMenu = screen.getByText('File');
    fireEvent.click(fileMenu);

    const menuItems = screen.getAllByRole('menuitem');
    const hasShortcuts = menuItems.some(
      (item) =>
        item.textContent?.includes('Ctrl') ||
        item.textContent?.includes('Cmd') ||
        item.textContent?.includes('Alt')
    );
    expect(hasShortcuts).toBe(true);
  });

  it('should call onAction with correct action string when menu item is clicked', () => {
    render(<MenuBar theme={mockTheme} onAction={mockOnAction} />);

    const fileMenu = screen.getByText('File');
    fireEvent.click(fileMenu);

    const newItem = screen.getByText('New');
    fireEvent.click(newItem);

    expect(mockOnAction).toHaveBeenCalledWith('new', undefined);
  });

  it('should close menu when Escape is pressed', () => {
    const { container } = render(<MenuBar theme={mockTheme} onAction={mockOnAction} />);

    const fileMenu = screen.getByText('File');
    fireEvent.click(fileMenu);

    let menuItems = screen.queryAllByRole('menu');
    expect(menuItems.length).toBeGreaterThan(0);

    const menubar = container.querySelector('[role="menubar"]') as HTMLElement;
    fireEvent.keyDown(menubar, { key: 'Escape', code: 'Escape' });

    menuItems = screen.queryAllByRole('menu');
    expect(menuItems.length).toBe(0);
  });

  it('should show recording indicator when isRecordingMacro is true', () => {
    const { rerender } = render(
      <MenuBar theme={mockTheme} onAction={mockOnAction} />
    );

    vi.mocked(useNotemacStore).mockReturnValue({
      settings: {
        wordWrap: true,
        showWhitespace: false,
        showEOL: false,
        showNonPrintable: false,
        showWrapSymbol: false,
        showIndentGuides: true,
        showLineNumbers: true,
        showMinimap: true,
        distractionFreeMode: false,
        alwaysOnTop: false,
        syncScrollVertical: false,
        syncScrollHorizontal: false,
      },
      isRecordingMacro: true,
    } as any);

    rerender(<MenuBar theme={mockTheme} onAction={mockOnAction} />);

    const recordingIndicator = screen.queryByText('REC');
    expect(recordingIndicator).toBeInTheDocument();
  });

  it('should handle multiple menu switches correctly', () => {
    render(<MenuBar theme={mockTheme} onAction={mockOnAction} />);

    const fileMenu = screen.getByText('File');
    fireEvent.click(fileMenu);
    let menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.length).toBeGreaterThan(0);

    const editMenu = screen.getByText('Edit');
    fireEvent.click(editMenu);

    menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.length).toBeGreaterThan(0);
  });

  it('should reflect setting state in View menu checkboxes', () => {
    render(<MenuBar theme={mockTheme} onAction={mockOnAction} />);

    const viewMenu = screen.getByText('View');
    fireEvent.click(viewMenu);

    const wordWrapItem = screen.getByText(/Word Wrap/i);
    const showLineNumbersItem = screen.getByText(/Line Numbers/i);

    expect(wordWrapItem.textContent?.includes('✓')).toBe(true);
    expect(showLineNumbersItem.textContent?.includes('✓')).toBe(true);
  });
});
