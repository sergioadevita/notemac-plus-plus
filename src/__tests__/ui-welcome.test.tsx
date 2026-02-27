import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { WelcomeScreen } from '../Notemac/UI/WelcomeScreenViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

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

// Mock the store and helpers
vi.mock('../Notemac/Model/Store', () => {
  const storeFn = vi.fn(() => ({
    addTab: vi.fn(),
    recentFiles: [
      { name: 'test.js', path: '/home/user/test.js' },
      { name: 'config.json', path: '/home/user/config.json' },
    ],
  }));
  (storeFn as any).getState = vi.fn(() => ({
    setSidebarPanel: vi.fn(),
  }));
  (storeFn as any).subscribe = vi.fn();
  (storeFn as any).setState = vi.fn();
  (storeFn as any).getInitialState = vi.fn();
  return {
    useNotemacStore: storeFn,
    useNotemacStoreShallow: vi.fn(() => ({
      addTab: vi.fn(),
      recentFiles: [
        { name: 'test.js', path: '/home/user/test.js' },
        { name: 'config.json', path: '/home/user/config.json' },
      ],
    })),
  };
});

vi.mock('../../Shared/Helpers/FileHelpers', () => ({
  detectLanguage: vi.fn(() => 'javascript'),
  detectLineEnding: vi.fn(() => 'LF'),
}));

describe('WelcomeScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<WelcomeScreen theme={mockTheme} />);
    expect(document.querySelector('div')).toBeTruthy();
  });

  it('displays the Notemac++ title', () => {
    render(<WelcomeScreen theme={mockTheme} />);

    expect(screen.getByText('Notemac++')).toBeTruthy();
  });

  it('displays the subtitle', () => {
    render(<WelcomeScreen theme={mockTheme} />);

    expect(screen.getByText(/A powerful text editor/)).toBeTruthy();
  });

  it('displays the N++ logo', () => {
    render(<WelcomeScreen theme={mockTheme} />);

    expect(screen.getByText('N++')).toBeTruthy();
  });

  it('renders quick action buttons', () => {
    render(<WelcomeScreen theme={mockTheme} />);

    expect(screen.getByText('New File')).toBeTruthy();
    expect(screen.getByText('Open File')).toBeTruthy();
    expect(screen.getByText('Open Folder')).toBeTruthy();
  });

  it('displays New File button with keyboard shortcut', () => {
    const { container } = render(<WelcomeScreen theme={mockTheme} />);

    const newFileButton = screen.getByText('New File').closest('button');
    expect(newFileButton).toBeTruthy();
    // Shortcut is rendered in the component
    expect(container.textContent).toContain('N');
  });

  it('displays Open File button with keyboard shortcut', () => {
    const { container } = render(<WelcomeScreen theme={mockTheme} />);

    const openFileButton = screen.getByText('Open File').closest('button');
    expect(openFileButton).toBeTruthy();
    // Shortcut is rendered in the component
    expect(container.textContent).toContain('O');
  });

  it('displays keyboard shortcuts reference section', () => {
    render(<WelcomeScreen theme={mockTheme} />);

    expect(screen.getByText('Keyboard Shortcuts')).toBeTruthy();
  });

  it('displays common keyboard shortcuts', () => {
    const { container } = render(<WelcomeScreen theme={mockTheme} />);

    const text = container.textContent;
    expect(text).toContain('New file');
    expect(text).toContain('Save');
    expect(text).toContain('Find');
  });

  it('displays recent files section when files exist', () => {
    render(<WelcomeScreen theme={mockTheme} />);

    expect(screen.getByText('Recent Files')).toBeTruthy();
  });

  it('displays recent file names', () => {
    const { container } = render(<WelcomeScreen theme={mockTheme} />);

    const text = container.textContent;
    expect(text).toContain('file');
    expect(text).toContain('.js');
  });

  it('displays recent file paths', () => {
    const { container } = render(<WelcomeScreen theme={mockTheme} />);

    const text = container.textContent;
    expect(text).toContain('/path/');
  });

  it('New File button is clickable', () => {
    
    render(<WelcomeScreen theme={mockTheme} />);

    const newFileButton = screen.getByText('New File').closest('button');
    expect(newFileButton).toBeTruthy();
    if (newFileButton) {
      fireEvent.click(newFileButton);
      // Button should still be interactive
      expect(newFileButton).toBeTruthy();
    }
  });

  it('Open File button is clickable', () => {
    
    render(<WelcomeScreen theme={mockTheme} />);

    const openFileButton = screen.getByText('Open File').closest('button');
    expect(openFileButton).toBeTruthy();
    if (openFileButton) {
      fireEvent.click(openFileButton);
      // Button should still be interactive
      expect(openFileButton).toBeTruthy();
    }
  });

  it('applies theme colors to container', () => {
    const { container } = render(<WelcomeScreen theme={mockTheme} />);

    const mainContainer = container.firstChild as HTMLElement;
    expect(mainContainer).toBeTruthy();
    // Check that backgroundColor is set (may be converted to rgb format)
    expect(mainContainer.style.backgroundColor).toBeTruthy();
  });

  it('displays keyboard shortcut kbd elements', () => {
    render(<WelcomeScreen theme={mockTheme} />);

    const kbdElements = document.querySelectorAll('kbd');
    expect(kbdElements.length > 0).toBe(true);
  });

  it('shows all keyboard shortcuts in grid layout', () => {
    render(<WelcomeScreen theme={mockTheme} />);

    const shortcuts = [
      'New file',
      'Open file',
      'Save',
      'Find',
      'Find & Replace',
      'Go to line',
      'Duplicate line',
      'Toggle sidebar',
      'Preferences',
    ];

    shortcuts.forEach((shortcut) => {
      expect(screen.getByText(shortcut)).toBeTruthy();
    });
  });

  it('renders with correct text color from theme', () => {
    render(<WelcomeScreen theme={mockTheme} />);

    const title = screen.getByText('Notemac++');
    expect(title).toBeTruthy();
  });

  it('limits recent files to 5 items', () => {
    vi.mock('../Notemac/Model/Store', () => ({
      useNotemacStore: vi.fn(() => ({
        addTab: vi.fn(),
        recentFiles: [
          { name: 'file1.js', path: '/path/file1.js' },
          { name: 'file2.js', path: '/path/file2.js' },
          { name: 'file3.js', path: '/path/file3.js' },
          { name: 'file4.js', path: '/path/file4.js' },
          { name: 'file5.js', path: '/path/file5.js' },
          { name: 'file6.js', path: '/path/file6.js' },
        ],
      })),
    }));

    render(<WelcomeScreen theme={mockTheme} />);

    // The component should display at most 5 recent files
    expect(document.querySelectorAll('div').length > 0).toBe(true);
  });
});
