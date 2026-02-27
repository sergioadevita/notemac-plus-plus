import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TerminalPanelViewPresenter } from '../Notemac/UI/TerminalPanelViewPresenter';
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

vi.mock('../Notemac/Commons/Constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../Notemac/Commons/Constants')>();
  return { ...actual };
});

describe('TerminalPanelViewPresenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotemacStore).mockReturnValue({
      tabs: [
        {
          id: 'tab1',
          name: 'test.ts',
          content: 'hello world',
          language: 'typescript',
          isModified: false,
          isPinned: false,
        },
      ],
      setShowTerminalPanel: vi.fn(),
      terminalHeight: 200,
      setTerminalHeight: vi.fn(),
    } as any);
  });

  it('renders terminal header with TERMINAL text', () => {
    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText('TERMINAL')).toBeInTheDocument();
  });

  it('renders close button that calls setShowTerminalPanel(false)', () => {
    const mockSetShowTerminalPanel = vi.fn();
    vi.mocked(useNotemacStore).mockReturnValue({
      setShowTerminalPanel: mockSetShowTerminalPanel,
      terminalHeight: 200,
      setTerminalHeight: vi.fn(),
    } as any);

    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    const closeButton = screen.getByRole('button', { name: /×/i });
    fireEvent.click(closeButton);
    expect(mockSetShowTerminalPanel).toHaveBeenCalledWith(false);
  });

  it('shows initial info line "Notemac++ Terminal v1.0"', () => {
    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/Notemac\+\+ Terminal v1\.0/)).toBeInTheDocument();
  });

  it('renders input field with $ prompt', () => {
    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('typing "help" and pressing Enter shows command list', async () => {
    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'help' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/Available commands:/i)).toBeInTheDocument();
    });
  });

  it('typing "echo hello" shows "hello" output', async () => {
    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'echo hello' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('hello')).toBeInTheDocument();
    });
  });

  it('typing "date" shows date', async () => {
    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'date' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      const output = screen.queryAllByText(/^\w+ \w+ \d+/);
      expect(output.length).toBeGreaterThan(0);
    });
  });

  it('typing "whoami" shows "notemac-user"', async () => {
    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'whoami' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('notemac-user')).toBeInTheDocument();
    });
  });

  it('typing unknown command shows error "Command not found"', async () => {
    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'unknowncommand123' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/Command not found/i)).toBeInTheDocument();
    });
  });

  it('typing "clear" clears output', async () => {
    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'echo test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    fireEvent.change(input, { target: { value: 'clear' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });
  });

  it('typing "exit" calls setShowTerminalPanel(false)', async () => {
    const mockSetShowTerminalPanel = vi.fn();
    vi.mocked(useNotemacStore).mockReturnValue({
      setShowTerminalPanel: mockSetShowTerminalPanel,
      terminalHeight: 200,
      setTerminalHeight: vi.fn(),
    } as any);

    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'exit' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockSetShowTerminalPanel).toHaveBeenCalledWith(false);
    });
  });

  it('arrow up/down navigates history', async () => {
    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'echo first' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    fireEvent.change(input, { target: { value: 'echo second' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
    expect(input.value).toBe('echo second');

    fireEvent.keyDown(input, { key: 'ArrowUp', code: 'ArrowUp' });
    expect(input.value).toBe('echo first');

    fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
    expect(input.value).toBe('echo second');
  });

  it('Ctrl+C cancels current input', async () => {
    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'echo test' } });
    fireEvent.keyDown(input, { key: 'c', code: 'KeyC', ctrlKey: true });

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('Ctrl+L clears terminal', async () => {
    render(<TerminalPanelViewPresenter theme={mockTheme} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'echo test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'l', code: 'KeyL', ctrlKey: true });

    await waitFor(() => {
      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });
  });

  it('resize handle exists', () => {
    const { container } = render(<TerminalPanelViewPresenter theme={mockTheme} />);
    // Resize handle is a plain div with cursor: ns-resize
    const resizeHandle = container.querySelector('[style*="ns-resize"]');
    expect(resizeHandle).toBeInTheDocument();
  });
});
