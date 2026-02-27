import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShortcutMapperDialog } from '../Notemac/UI/ShortcutMapperDialogViewPresenter';

const mockSetShowShortcutMapper = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
  useNotemacStore: vi.fn(() => ({
    setShowShortcutMapper: mockSetShowShortcutMapper,
  })),
}));

vi.mock('../Notemac/Configs/ShortcutConfig', () => ({
  GetDefaultShortcuts: vi.fn(() => [
    { name: 'New File', shortcut: 'Cmd+N', category: 'File' },
    { name: 'Save', shortcut: 'Cmd+S', category: 'File' },
    { name: 'Find', shortcut: 'Cmd+F', category: 'Search' },
    { name: 'Undo', shortcut: 'Cmd+Z', category: 'Edit' },
    { name: 'Redo', shortcut: 'Cmd+Shift+Z', category: 'Edit' },
  ]),
  GetShortcutCategories: vi.fn(() => ['File', 'Search', 'Edit']),
}));

vi.mock('../Notemac/UI/hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

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

describe('ShortcutMapperDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with title "Shortcut Mapper"', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    expect(screen.getByText('Shortcut Mapper')).toBeInTheDocument();
  });

  it('has proper ARIA attributes for dialog', () => {
    const { container } = render(<ShortcutMapperDialog theme={mockTheme} />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('shows category tabs including "all"', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const allTab = screen.getAllByText('all')[0];
    expect(allTab).toBeInTheDocument();
    // Tabs are span elements within categoryTabsContainer
    const fileElements = screen.getAllByText('File');
    expect(fileElements.length).toBeGreaterThan(0);
  });

  it('shows filter input with placeholder "Filter shortcuts..."', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const filterInput = screen.getByPlaceholderText('Filter shortcuts...');
    expect(filterInput).toBeInTheDocument();
  });

  it('shows shortcuts table with correct columns', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    expect(screen.getByText('Command')).toBeInTheDocument();
    expect(screen.getByText('Shortcut')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('displays all shortcuts in table', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    expect(screen.getByText('New File')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Find')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
  });

  it('displays shortcut combinations in kbd elements', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    // Check that shortcut text exists within kbd elements
    expect(screen.getByText('Cmd+N')).toBeInTheDocument();
    expect(screen.getByText('Cmd+S')).toBeInTheDocument();
    expect(screen.getByText('Cmd+F')).toBeInTheDocument();
  });

  it('filters shortcuts by text input', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const filterInput = screen.getByPlaceholderText('Filter shortcuts...');
    fireEvent.change(filterInput, { target: { value: 'Save' } });

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.queryByText('New File')).not.toBeInTheDocument();
    expect(screen.queryByText('Find')).not.toBeInTheDocument();
  });

  it('filters shortcuts case-insensitively', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const filterInput = screen.getByPlaceholderText('Filter shortcuts...');
    fireEvent.change(filterInput, { target: { value: 'save' } });

    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('filters shortcuts by category tab selection', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const fileElements = screen.getAllByText('File');
    // First File is the tab (span), second is in table
    const fileTab = fileElements[0];
    fireEvent.click(fileTab);

    expect(screen.getByText('New File')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.queryByText('Find')).not.toBeInTheDocument();
    expect(screen.queryByText('Undo')).not.toBeInTheDocument();
  });

  it('filters by "Edit" category tab', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const editElements = screen.getAllByText('Edit');
    // First Edit is the tab (span), second is in table
    const editTab = editElements[0];
    fireEvent.click(editTab);

    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.queryByText('Find')).not.toBeInTheDocument();
  });

  it('filters by "Search" category tab', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const searchElements = screen.getAllByText('Search');
    // First Search is the tab (span), second is in table
    const searchTab = searchElements[0];
    fireEvent.click(searchTab);

    expect(screen.getByText('Find')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.queryByText('Undo')).not.toBeInTheDocument();
  });

  it('shows all shortcuts when "all" tab is selected', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const editElements = screen.getAllByText('Edit');
    const editTab = editElements[0];
    fireEvent.click(editTab);

    // Verify filtered state
    expect(screen.queryByText('Save')).not.toBeInTheDocument();

    // Click all tab
    const allElements = screen.getAllByText('all');
    const allTab = allElements[0];
    fireEvent.click(allTab);

    // All shortcuts should be visible
    expect(screen.getByText('New File')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Find')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
  });

  it('shows shortcut count in footer', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    expect(screen.getByText('5 shortcuts')).toBeInTheDocument();
  });

  it('updates shortcut count when filtering by text', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const filterInput = screen.getByPlaceholderText('Filter shortcuts...');
    fireEvent.change(filterInput, { target: { value: 'Save' } });

    expect(screen.getByText('1 shortcuts')).toBeInTheDocument();
  });

  it('shows correct count after category filter', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const editElements = screen.getAllByText('Edit');
    const editTab = editElements[0];
    fireEvent.click(editTab);

    expect(screen.getByText('2 shortcuts')).toBeInTheDocument();
  });

  it('has close button with text "Close"', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const closeButton = screen.getByText('Close');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton.tagName).toBe('BUTTON');
  });

  it('calls setShowShortcutMapper(false) when close button is clicked', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockSetShowShortcutMapper).toHaveBeenCalledWith(false);
  });

  it('calls setShowShortcutMapper(false) when clicking overlay', () => {
    const { container } = render(<ShortcutMapperDialog theme={mockTheme} />);
    const overlay = container.querySelector('.dialog-overlay');
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockSetShowShortcutMapper).toHaveBeenCalledWith(false);
    }
  });

  it('combines text filter and category filter', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const editElements = screen.getAllByText('Edit');
    const editTab = editElements[0];
    fireEvent.click(editTab);

    const filterInput = screen.getByPlaceholderText('Filter shortcuts...');
    fireEvent.change(filterInput, { target: { value: 'Undo' } });

    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.queryByText('Redo')).not.toBeInTheDocument();
    expect(screen.getByText('1 shortcuts')).toBeInTheDocument();
  });

  it('maintains filter input value when switching tabs', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const filterInput = screen.getByPlaceholderText('Filter shortcuts...') as HTMLInputElement;
    fireEvent.change(filterInput, { target: { value: 'U' } });

    const editElements = screen.getAllByText('Edit');
    const editTab = editElements[0];
    fireEvent.click(editTab);

    expect(filterInput.value).toBe('U');
  });

  it('displays correct categories in table cells', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const fileElements = screen.getAllByText('File');
    // Should have at least 2 matches: 1 in tab and 1 in table cell
    expect(fileElements.length).toBeGreaterThanOrEqual(2);
  });

  it('renders table with all rows', () => {
    render(<ShortcutMapperDialog theme={mockTheme} />);
    const rows = screen.getAllByRole('row');
    // 1 header row + 5 data rows = 6 total rows
    expect(rows.length).toBe(6);
  });
});
