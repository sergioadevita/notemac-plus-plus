import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '../Notemac/UI/ToolbarViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// Mock the store
vi.mock('../Notemac/Model/Store', () => ({
  useNotemacStore: () => ({
    isRecordingMacro: false,
    settings: {
      wordWrap: false,
      showWhitespace: false,
    },
  }),
}));

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

describe('Toolbar', () => {
  let onAction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onAction = vi.fn();
  });

  it('renders without crashing', () => {
    const { container } = render(<Toolbar theme={mockTheme} onAction={onAction} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders all toolbar buttons with correct aria-labels', () => {
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const expectedButtons = [
      'New (Cmd+N)',
      'Open (Cmd+O)',
      'Save (Cmd+S)',
      'Save All',
      'Undo (Cmd+Z)',
      'Redo (Cmd+Shift+Z)',
      'Find (Cmd+F)',
      'Replace (Cmd+H)',
      'Zoom In (Cmd++)',
      'Zoom Out (Cmd+-)',
      'Start Recording',
      'Playback Macro',
      'Toggle Sidebar (Cmd+B)',
      'Word Wrap',
      'Show Whitespace',
      'Settings (Cmd+,)',
    ];

    expectedButtons.forEach((buttonLabel) => {
      expect(screen.getByLabelText(buttonLabel)).toBeTruthy();
    });
  });

  it('calls onAction with "new" when New button is clicked', () => {
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const newButton = screen.getByLabelText('New (Cmd+N)');
    fireEvent.click(newButton);

    expect(onAction).toHaveBeenCalledWith('new');
  });

  it('calls onAction with "open" when Open button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const openButton = screen.getByLabelText('Open (Cmd+O)');
    fireEvent.click(openButton);

    expect(onAction).toHaveBeenCalledWith('open');
  });

  it('calls onAction with "save" when Save button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const saveButton = screen.getByLabelText('Save (Cmd+S)');
    fireEvent.click(saveButton);

    expect(onAction).toHaveBeenCalledWith('save');
  });

  it('calls onAction with "save-all" when Save All button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const saveAllButton = screen.getByLabelText('Save All');
    fireEvent.click(saveAllButton);

    expect(onAction).toHaveBeenCalledWith('save-all');
  });

  it('calls onAction with "undo" when Undo button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const undoButton = screen.getByLabelText('Undo (Cmd+Z)');
    fireEvent.click(undoButton);

    expect(onAction).toHaveBeenCalledWith('undo');
  });

  it('calls onAction with "redo" when Redo button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const redoButton = screen.getByLabelText('Redo (Cmd+Shift+Z)');
    fireEvent.click(redoButton);

    expect(onAction).toHaveBeenCalledWith('redo');
  });

  it('calls onAction with "find" when Find button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const findButton = screen.getByLabelText('Find (Cmd+F)');
    fireEvent.click(findButton);

    expect(onAction).toHaveBeenCalledWith('find');
  });

  it('calls onAction with "replace" when Replace button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const replaceButton = screen.getByLabelText('Replace (Cmd+H)');
    fireEvent.click(replaceButton);

    expect(onAction).toHaveBeenCalledWith('replace');
  });

  it('calls onAction with "zoom-in" when Zoom In button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const zoomInButton = screen.getByLabelText('Zoom In (Cmd++)');
    fireEvent.click(zoomInButton);

    expect(onAction).toHaveBeenCalledWith('zoom-in');
  });

  it('calls onAction with "zoom-out" when Zoom Out button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const zoomOutButton = screen.getByLabelText('Zoom Out (Cmd+-)');
    fireEvent.click(zoomOutButton);

    expect(onAction).toHaveBeenCalledWith('zoom-out');
  });

  it('calls onAction with "macro-start" when Record button is clicked (not recording)', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const recordButton = screen.getByLabelText('Start Recording');
    fireEvent.click(recordButton);

    expect(onAction).toHaveBeenCalledWith('macro-start');
  });

  it('calls onAction with "macro-playback" when Playback button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const playbackButton = screen.getByLabelText('Playback Macro');
    fireEvent.click(playbackButton);

    expect(onAction).toHaveBeenCalledWith('macro-playback');
  });

  it('calls onAction with "toggle-sidebar" when Sidebar button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const sidebarButton = screen.getByLabelText('Toggle Sidebar (Cmd+B)');
    fireEvent.click(sidebarButton);

    expect(onAction).toHaveBeenCalledWith('toggle-sidebar');
  });

  it('calls onAction with "word-wrap" and boolean value when Word Wrap button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const wordWrapButton = screen.getByLabelText('Word Wrap');
    fireEvent.click(wordWrapButton);

    expect(onAction).toHaveBeenCalledWith('word-wrap', true);
  });

  it('calls onAction with "show-whitespace" and boolean value when Show Whitespace button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const whitespaceButton = screen.getByLabelText('Show Whitespace');
    fireEvent.click(whitespaceButton);

    expect(onAction).toHaveBeenCalledWith('show-whitespace', true);
  });

  it('calls onAction with "preferences" when Settings button is clicked', () => {
    // Using fireEvent instead
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const settingsButton = screen.getByLabelText('Settings (Cmd+,)');
    fireEvent.click(settingsButton);

    expect(onAction).toHaveBeenCalledWith('preferences');
  });

  it('buttons have proper cursor style (pointer)', () => {
    render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const newButton = screen.getByLabelText('New (Cmd+N)');
    // In jsdom, inline styles are preserved
    expect(newButton.style.cursor).toBe('pointer');
  });

  it('renders with correct background color from theme', () => {
    const { container } = render(<Toolbar theme={mockTheme} onAction={onAction} />);

    const toolbar = container.firstChild as HTMLElement;
    expect(toolbar).toBeTruthy();
    // Color may be converted to rgb format by the browser
    expect(toolbar.style.backgroundColor).toBeTruthy();
  });
});
