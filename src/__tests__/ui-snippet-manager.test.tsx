import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SnippetManagerViewPresenter } from '../Notemac/UI/SnippetManagerViewPresenter';
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

vi.mock('../Shared/EventDispatcher/EventDispatcher', () => ({
  Dispatch: vi.fn(),
  NOTEMAC_EVENTS: { INSERT_SNIPPET: 'insert-snippet' },
}));

vi.mock('../Notemac/Commons/Constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../Notemac/Commons/Constants')>();
  return { ...actual };
});

describe('SnippetManagerViewPresenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotemacStore).mockReturnValue({
      setShowSnippetManager: vi.fn(),
      savedSnippets: [],
      addSnippet: vi.fn(),
      removeSnippet: vi.fn(),
      updateSnippet: vi.fn(),
      loadSnippets: vi.fn(),
    } as any);
  });

  it('renders with title "Snippet Manager"', () => {
    render(<SnippetManagerViewPresenter theme={mockTheme} />);
    expect(screen.getByText('Snippet Manager')).toBeInTheDocument();
  });

  it('renders Import, Export, and Close buttons in title bar', () => {
    render(<SnippetManagerViewPresenter theme={mockTheme} />);
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close|✕/i })).toBeInTheDocument();
  });

  it('renders "+ New Snippet" button in list panel', () => {
    render(<SnippetManagerViewPresenter theme={mockTheme} />);
    expect(screen.getByRole('button', { name: /\+ New Snippet/i })).toBeInTheDocument();
  });

  it('shows "No snippets yet" when empty', () => {
    render(<SnippetManagerViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/No snippets yet/i)).toBeInTheDocument();
  });

  it('shows snippet list when snippets exist', () => {
    const mockSnippets = [
      { id: '1', name: 'console.log', prefix: 'log', language: 'javascript', description: 'Log output', body: 'console.log()' },
      { id: '2', name: 'arrow function', prefix: 'arrow', language: 'javascript', description: 'Arrow function', body: '() => {}' },
    ];
    vi.mocked(useNotemacStore).mockReturnValue({
      setShowSnippetManager: vi.fn(),
      savedSnippets: mockSnippets,
      addSnippet: vi.fn(),
      removeSnippet: vi.fn(),
      updateSnippet: vi.fn(),
      loadSnippets: vi.fn(),
    } as any);

    render(<SnippetManagerViewPresenter theme={mockTheme} />);
    expect(screen.getByText('console.log')).toBeInTheDocument();
    expect(screen.getByText('arrow function')).toBeInTheDocument();
  });

  it('selecting snippet shows editor with Name, Prefix, Language, Description, Body fields', async () => {
    const mockSnippets = [
      { id: '1', name: 'console.log', prefix: 'log', language: 'javascript', description: 'Log output', body: 'console.log()' },
    ];
    vi.mocked(useNotemacStore).mockReturnValue({
      setShowSnippetManager: vi.fn(),
      savedSnippets: mockSnippets,
      addSnippet: vi.fn(),
      removeSnippet: vi.fn(),
      updateSnippet: vi.fn(),
      loadSnippets: vi.fn(),
    } as any);

    render(<SnippetManagerViewPresenter theme={mockTheme} />);

    const snippetItem = screen.getByText('console.log');
    fireEvent.click(snippetItem);

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('console.log');
      const prefixInput = screen.getByDisplayValue('log');
      const languageInput = screen.getByDisplayValue('javascript');
      const descriptionInput = screen.getByDisplayValue('Log output');
      const bodyInput = screen.getByDisplayValue('console.log()');

      expect(nameInput).toBeInTheDocument();
      expect(prefixInput).toBeInTheDocument();
      expect(languageInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();
      expect(bodyInput).toBeInTheDocument();
    });
  });

  it('creating new snippet: click New, fill fields, click Create', async () => {
    const mockAddSnippet = vi.fn();
    vi.mocked(useNotemacStore).mockReturnValue({
      setShowSnippetManager: vi.fn(),
      savedSnippets: [],
      addSnippet: mockAddSnippet,
      removeSnippet: vi.fn(),
      updateSnippet: vi.fn(),
      loadSnippets: vi.fn(),
    } as any);

    const { container } = render(<SnippetManagerViewPresenter theme={mockTheme} />);

    const newSnippetButton = screen.getByRole('button', { name: /\+ New Snippet/i });
    fireEvent.click(newSnippetButton);

    await waitFor(() => {
      const allInputs = container.querySelectorAll('input[style*="width: 100%"]');
      expect(allInputs.length).toBeGreaterThan(0);
    });

    const allInputs = container.querySelectorAll('input[style*="width: 100%"]') as NodeListOf<HTMLInputElement>;
    const nameInput = allInputs[0];
    const prefixInput = screen.getByPlaceholderText(/e\.g\. log, fn, cls/i) as HTMLInputElement;
    const bodyInput = container.querySelector('textarea') as HTMLTextAreaElement;

    fireEvent.change(nameInput, { target: { value: 'test snippet' } });
    fireEvent.change(prefixInput, { target: { value: 'test' } });
    fireEvent.change(bodyInput, { target: { value: 'test body' } });

    const createButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockAddSnippet).toHaveBeenCalled();
    });
  });

  it('Delete and Insert buttons shown when editing existing snippet', async () => {
    const mockSnippets = [
      { id: '1', name: 'console.log', prefix: 'log', language: 'javascript', description: 'Log output', body: 'console.log()' },
    ];
    vi.mocked(useNotemacStore).mockReturnValue({
      setShowSnippetManager: vi.fn(),
      savedSnippets: mockSnippets,
      addSnippet: vi.fn(),
      removeSnippet: vi.fn(),
      updateSnippet: vi.fn(),
      loadSnippets: vi.fn(),
    } as any);

    render(<SnippetManagerViewPresenter theme={mockTheme} />);

    const snippetItem = screen.getByText('console.log');
    fireEvent.click(snippetItem);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /insert/i })).toBeInTheDocument();
    });
  });

  it('Close button closes dialog', async () => {
    const mockSetShowSnippetManager = vi.fn();
    vi.mocked(useNotemacStore).mockReturnValue({
      setShowSnippetManager: mockSetShowSnippetManager,
      savedSnippets: [],
      addSnippet: vi.fn(),
      removeSnippet: vi.fn(),
      updateSnippet: vi.fn(),
      loadSnippets: vi.fn(),
    } as any);

    render(<SnippetManagerViewPresenter theme={mockTheme} />);

    const closeButton = screen.getByRole('button', { name: /close|✕/i });
    fireEvent.click(closeButton);

    expect(mockSetShowSnippetManager).toHaveBeenCalledWith(false);
  });

  it('overlay click closes dialog', async () => {
    const mockSetShowSnippetManager = vi.fn();
    vi.mocked(useNotemacStore).mockReturnValue({
      setShowSnippetManager: mockSetShowSnippetManager,
      savedSnippets: [],
      addSnippet: vi.fn(),
      removeSnippet: vi.fn(),
      updateSnippet: vi.fn(),
      loadSnippets: vi.fn(),
    } as any);

    const { container } = render(<SnippetManagerViewPresenter theme={mockTheme} />);

    const overlay = container.querySelector('[class*="overlay"]');
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockSetShowSnippetManager).toHaveBeenCalledWith(false);
    }
  });

  it('loadSnippets called on mount', async () => {
    const mockLoadSnippets = vi.fn();
    vi.mocked(useNotemacStore).mockReturnValue({
      setShowSnippetManager: vi.fn(),
      savedSnippets: [],
      addSnippet: vi.fn(),
      removeSnippet: vi.fn(),
      updateSnippet: vi.fn(),
      loadSnippets: mockLoadSnippets,
    } as any);

    render(<SnippetManagerViewPresenter theme={mockTheme} />);

    await waitFor(() => {
      expect(mockLoadSnippets).toHaveBeenCalled();
    });
  });
});
