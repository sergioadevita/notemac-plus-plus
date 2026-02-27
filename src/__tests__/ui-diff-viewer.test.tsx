import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiffViewerViewPresenter } from '../Notemac/UI/DiffViewerViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mocks ──────────────────────────────────────────────────────

const mockSetShowDiffViewer = vi.fn();

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(() => ({
        setShowDiffViewer: mockSetShowDiffViewer,
        tabs: [
            { id: 'tab-1', name: 'original.js', content: 'const a = 1;', language: 'javascript', path: '/src/original.js', isModified: false },
            { id: 'tab-2', name: 'modified.js', content: 'const a = 2;', language: 'javascript', path: '/src/modified.js', isModified: true },
        ],
        activeTabId: 'tab-1',
        settings: { fontSize: 14, fontFamily: 'monospace', wordWrap: false },
        isRepoInitialized: false,
    })),
}));

vi.mock('@monaco-editor/react', () => ({
    DiffEditor: vi.fn(() => <div data-testid="diff-editor">Mock DiffEditor</div>),
}));

vi.mock('../Notemac/Controllers/GitController', () => ({
    GetFileAtHead: vi.fn().mockResolvedValue('const a = 0;'),
}));

vi.mock('../Notemac/Commons/Constants', () => ({
    UI_ZINDEX_MODAL: 1000,
}));

const mockTheme = {
    bg: '#1e1e1e', bgSecondary: '#252526', bgTertiary: '#2d2d2d', border: '#474747',
    text: '#cccccc', textSecondary: '#969696', textMuted: '#6e7681',
    accent: '#0078d4', accentText: '#ffffff', bgHover: '#2a2d2e',
    editorMonacoTheme: 'notemac-dark',
} as ThemeColors;

// ─── Tests ──────────────────────────────────────────────────────

describe('DiffViewerViewPresenter', () =>
{
    beforeEach(() => vi.clearAllMocks());

    it('renders without crashing', () =>
    {
        const { container } = render(<DiffViewerViewPresenter theme={mockTheme} />);
        expect(container.firstChild).toBeTruthy();
    });

    it('renders title "Compare Files"', () =>
    {
        render(<DiffViewerViewPresenter theme={mockTheme} />);
        expect(screen.getByText('Compare Files')).toBeTruthy();
    });

    it('renders Close button', () =>
    {
        render(<DiffViewerViewPresenter theme={mockTheme} />);
        expect(screen.getByText('Close')).toBeTruthy();
    });

    it('renders file selectors in files mode', () =>
    {
        render(<DiffViewerViewPresenter theme={mockTheme} />);
        expect(screen.getByText('Original:')).toBeTruthy();
        expect(screen.getByText('Modified:')).toBeTruthy();
    });

    it('renders Side by Side checkbox', () =>
    {
        render(<DiffViewerViewPresenter theme={mockTheme} />);
        expect(screen.getByText('Side by Side')).toBeTruthy();
    });

    it('renders the DiffEditor component', () =>
    {
        render(<DiffViewerViewPresenter theme={mockTheme} />);
        expect(screen.getByTestId('diff-editor')).toBeTruthy();
    });

    it('closes on Close button click', () =>
    {
        render(<DiffViewerViewPresenter theme={mockTheme} />);
        fireEvent.click(screen.getByText('Close'));
        expect(mockSetShowDiffViewer).toHaveBeenCalledWith(false);
    });

    it('renders vs separator', () =>
    {
        render(<DiffViewerViewPresenter theme={mockTheme} />);
        expect(screen.getByText('vs')).toBeTruthy();
    });

    it('renders tab names in select dropdowns', () =>
    {
        render(<DiffViewerViewPresenter theme={mockTheme} />);
        expect(screen.getAllByText('original.js').length).toBeGreaterThan(0);
        expect(screen.getAllByText('modified.js').length).toBeGreaterThan(0);
    });
});
