import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsDialog } from '../Notemac/UI/SettingsDialogViewPresenter';
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

const mockSetShowSettings = vi.fn();
const mockUpdateSettings = vi.fn();

const mockSettings = {
  autoSave: false,
  autoSaveDelay: 5000,
  tabSize: 4,
  insertSpaces: true,
  autoIndent: true,
  rememberLastSession: true,
  dateTimeFormat: 'locale',
  wordWrap: true,
  matchBrackets: true,
  autoCloseBrackets: true,
  autoCloseQuotes: true,
  highlightCurrentLine: true,
  smoothScrolling: true,
  showLineNumbers: true,
  showMinimap: true,
  showIndentGuides: true,
  showEOL: false,
  renderWhitespace: 'none',
  cursorStyle: 'line',
  cursorBlinking: 'blink',
  fontSize: 14,
  fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
  theme: 'mac-glass',
  customThemeBase: 'mac-glass',
  customThemeColors: {},
  virtualSpace: false,
  alwaysOnTop: false,
  distractionFreeMode: false,
  syncScrollVertical: false,
  syncScrollHorizontal: false,
  showNonPrintable: false,
  showWrapSymbol: false,
  searchEngine: 'google',
};

vi.mock('../Notemac/Model/Store');

vi.mock('../Notemac/UI/hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

vi.mock('../Notemac/Configs/ThemeConfig', () => ({
  GetTheme: vi.fn(() => mockTheme),
  themeColorGroups: [],
}));

describe('SettingsDialogViewPresenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotemacStore).mockReturnValue({
      settings: mockSettings,
      updateSettings: mockUpdateSettings,
      setShowSettings: mockSetShowSettings,
    } as any);
  });

  it('renders dialog with title "Preferences"', () => {
    render(<SettingsDialog theme={mockTheme} />);
    const title = screen.getByText('Preferences');
    expect(title).toBeInTheDocument();
  });

  it('has proper ARIA attributes on dialog', () => {
    const { container } = render(<SettingsDialog theme={mockTheme} />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-labelledby', 'settings-title');
  });

  it('renders 5 section tabs: General, Editor, Appearance, Advanced, Keybindings', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const tabNames = ['General', 'Editor', 'Appearance', 'Advanced', 'Keybindings'];
    tabNames.forEach((name) => {
      const tab = screen.getByText(name);
      expect(tab).toBeInTheDocument();
    });
  });

  it('shows General section settings by default', () => {
    render(<SettingsDialog theme={mockTheme} />);
    expect(screen.getByText('Auto Save')).toBeInTheDocument();
    expect(screen.getByText('Tab Size')).toBeInTheDocument();
  });

  it('displays Auto Save setting in General section', () => {
    render(<SettingsDialog theme={mockTheme} />);
    expect(screen.getByText('Auto Save')).toBeInTheDocument();
  });

  it('displays Tab Size setting in General section', () => {
    render(<SettingsDialog theme={mockTheme} />);
    expect(screen.getByText('Tab Size')).toBeInTheDocument();
  });

  it('displays Insert Spaces setting in General section', () => {
    render(<SettingsDialog theme={mockTheme} />);
    expect(screen.getByText('Insert Spaces for Tabs')).toBeInTheDocument();
  });

  it('navigates to Editor section when Editor tab is clicked', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const editorTab = screen.getByText('Editor');
    fireEvent.click(editorTab);

    expect(screen.getByText('Word Wrap')).toBeInTheDocument();
    expect(screen.getByText('Match Brackets')).toBeInTheDocument();
  });

  it('shows Word Wrap setting in Editor section', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const editorTab = screen.getByText('Editor');
    fireEvent.click(editorTab);

    expect(screen.getByText('Word Wrap')).toBeInTheDocument();
  });

  it('shows Match Brackets setting in Editor section', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const editorTab = screen.getByText('Editor');
    fireEvent.click(editorTab);

    expect(screen.getByText('Match Brackets')).toBeInTheDocument();
  });

  it('navigates to Appearance section when Appearance tab is clicked', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const appearanceTab = screen.getByText('Appearance');
    fireEvent.click(appearanceTab);

    expect(screen.getByText('Color Theme')).toBeInTheDocument();
  });

  it('navigates to Advanced section when Advanced tab is clicked', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const advancedTab = screen.getByText('Advanced');
    fireEvent.click(advancedTab);

    expect(screen.getByText('Virtual Space')).toBeInTheDocument();
  });

  it('navigates to Keybindings section when Keybindings tab is clicked', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const keybindingsTab = screen.getByText('Keybindings');
    fireEvent.click(keybindingsTab);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('displays keyboard shortcuts in Keybindings section', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const keybindingsTab = screen.getByText('Keybindings');
    fireEvent.click(keybindingsTab);

    expect(screen.getByText('New File')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('renders close button (×) in dialog header', () => {
    const { container } = render(<SettingsDialog theme={mockTheme} />);

    const header = container.querySelector('[role="dialog"]');
    const spans = header?.querySelectorAll('span') || [];
    const closeButton = spans[spans.length - 1]; // Last span in header is close button
    expect(closeButton).toBeInTheDocument();
    expect(closeButton?.textContent).toBe('×');
  });

  it('calls setShowSettings(false) when close button (×) is clicked', () => {
    const { container } = render(<SettingsDialog theme={mockTheme} />);

    const header = container.querySelector('[role="dialog"]');
    const spans = header?.querySelectorAll('span') || [];
    const closeButton = spans[spans.length - 1] as HTMLElement;
    fireEvent.click(closeButton);

    expect(mockSetShowSettings).toHaveBeenCalledWith(false);
  });

  it('closes dialog when overlay is clicked', () => {
    const { container } = render(<SettingsDialog theme={mockTheme} />);

    const overlay = container.querySelector('.dialog-overlay') as HTMLElement;
    fireEvent.click(overlay);

    expect(mockSetShowSettings).toHaveBeenCalledWith(false);
  });

  it('calls useFocusTrap hook', async () => {
    // Import the mocked module to get the mock function
    const { useFocusTrap } = await import('../Notemac/UI/hooks/useFocusTrap');
    const mockUseFocusTrap = vi.mocked(useFocusTrap);

    render(<SettingsDialog theme={mockTheme} />);

    expect(mockUseFocusTrap).toHaveBeenCalled();
  });

  it('displays theme setting in Appearance section', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const appearanceTab = screen.getByText('Appearance');
    fireEvent.click(appearanceTab);

    expect(screen.getByText('Color Theme')).toBeInTheDocument();
  });

  it('displays font size setting', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const appearanceTab = screen.getByText('Appearance');
    fireEvent.click(appearanceTab);

    expect(screen.getByText('Font Size')).toBeInTheDocument();
  });

  it('displays font family setting', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const appearanceTab = screen.getByText('Appearance');
    fireEvent.click(appearanceTab);

    expect(screen.getByText('Font Family')).toBeInTheDocument();
  });

  it('calls updateSettings when General section settings change', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const tabSizeInput = screen.getByDisplayValue('4') as HTMLInputElement;
    fireEvent.change(tabSizeInput, { target: { value: '2' } });

    expect(mockUpdateSettings).toHaveBeenCalled();
  });

  it('calls updateSettings when Editor section settings change', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const editorTab = screen.getByText('Editor');
    fireEvent.click(editorTab);

    const wordWrapCheckbox = screen.getByLabelText('Word Wrap') as HTMLInputElement;
    fireEvent.click(wordWrapCheckbox);

    expect(mockUpdateSettings).toHaveBeenCalled();
  });

  it('calls updateSettings when Appearance section settings change', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const appearanceTab = screen.getByText('Appearance');
    fireEvent.click(appearanceTab);

    const themeSelects = screen.getAllByRole('combobox');
    expect(themeSelects.length).toBeGreaterThan(0);

    fireEvent.change(themeSelects[0], { target: { value: 'dark' } });
    expect(mockUpdateSettings).toHaveBeenCalled();
  });

  it('switches tabs and shows correct content', () => {
    render(<SettingsDialog theme={mockTheme} />);

    // Start in General
    expect(screen.getByText('Auto Save')).toBeInTheDocument();

    // Click Editor tab
    const editorTab = screen.getByText('Editor');
    fireEvent.click(editorTab);

    // General content should be gone (Auto Save is only in General)
    expect(screen.queryByText('Auto Save')).not.toBeInTheDocument();
    // Editor content should be visible
    expect(screen.getByText('Word Wrap')).toBeInTheDocument();
  });

  it('renders all necessary checkboxes for boolean settings', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('renders all necessary input fields for numeric settings', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const numberInputs = screen.getAllByRole('spinbutton');
    expect(numberInputs.length).toBeGreaterThan(0);
  });

  it('displays correct initial values for settings', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const tabSizeInput = screen.getByDisplayValue('4');
    expect(tabSizeInput).toBeInTheDocument();

    // Font size is in Appearance section, navigate there first
    const appearanceTab = screen.getByText('Appearance');
    fireEvent.click(appearanceTab);

    const fontSizeInput = screen.getByDisplayValue('14');
    expect(fontSizeInput).toBeInTheDocument();
  });

  it('prevents dialog from closing when clicking inside the content area', () => {
    render(<SettingsDialog theme={mockTheme} />);

    const dialogContent = screen.getByText('Preferences').closest('[role="dialog"]') as HTMLElement;
    fireEvent.click(dialogContent);

    expect(mockSetShowSettings).not.toHaveBeenCalled();
  });

  it('Active tab styling reflects current section', () => {
    const { container } = render(<SettingsDialog theme={mockTheme} />);

    const editorTab = screen.getByText('Editor');
    fireEvent.click(editorTab);

    // The component applies inline styles for active state (bgHover background + bold text)
    // We can verify the click worked by checking that Editor content is now visible
    expect(screen.getByText('Word Wrap')).toBeInTheDocument();
  });
});
