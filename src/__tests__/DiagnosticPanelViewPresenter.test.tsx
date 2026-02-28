import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockDiagnostics = [
    { message: 'Unexpected token', severity: 'error', startLineNumber: 5, startColumn: 1, endLineNumber: 5, endColumn: 10, source: 'typescript' },
    { message: 'Unused variable', severity: 'warning', startLineNumber: 10, startColumn: 5, endLineNumber: 10, endColumn: 15, source: 'typescript' },
];

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn((selector) =>
    {
        const state = {
            diagnostics: mockDiagnostics,
            diagnosticsPanelVisible: true,
            SetDiagnosticsPanelVisible: vi.fn(),
        };
        return selector(state);
    }),
}));

vi.mock('../../Shared/Helpers/EditorGlobals', () => ({
    GetMonacoEditor: vi.fn(),
}));

import { DiagnosticPanelViewPresenter } from '../Notemac/UI/DiagnosticPanelViewPresenter';

describe('DiagnosticPanelViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('should render the diagnostics panel', () =>
    {
        render(<DiagnosticPanelViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', textSecondary: '#ccc', error: '#f38ba8', warning: '#f9e2af', accent: '#89b4fa' }} />);
        expect(screen.getByTestId('diagnostic-panel')).toBeTruthy();
    });

    it('should display diagnostic messages', () =>
    {
        render(<DiagnosticPanelViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', textSecondary: '#ccc', error: '#f38ba8', warning: '#f9e2af', accent: '#89b4fa' }} />);
        expect(screen.getByText(/Unexpected token/)).toBeTruthy();
        expect(screen.getByText(/Unused variable/)).toBeTruthy();
    });

    it('should show error and warning counts', () =>
    {
        render(<DiagnosticPanelViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', textSecondary: '#ccc', error: '#f38ba8', warning: '#f9e2af', accent: '#89b4fa' }} />);
        const headerText = screen.getByText(/Problems/);
        expect(headerText).toBeTruthy();
        expect(headerText.textContent).toMatch(/1 errors, 1 warnings/);
    });

    it('should display severity icons', () =>
    {
        const { container } = render(<DiagnosticPanelViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', textSecondary: '#ccc', error: '#f38ba8', warning: '#f9e2af', accent: '#89b4fa' }} />);
        const panel = container.querySelector('[data-testid="diagnostic-panel"]');
        expect(panel).toBeTruthy();
    });

    it('should show line numbers for diagnostics', () =>
    {
        render(<DiagnosticPanelViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', textSecondary: '#ccc', error: '#f38ba8', warning: '#f9e2af', accent: '#89b4fa' }} />);
        expect(screen.getByText(/Ln 5/)).toBeTruthy();
        expect(screen.getByText(/Ln 10/)).toBeTruthy();
    });

    it('should have close button', () =>
    {
        render(<DiagnosticPanelViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', textSecondary: '#ccc', error: '#f38ba8', warning: '#f9e2af', accent: '#89b4fa' }} />);
        expect(screen.getByTestId('close-diagnostics')).toBeTruthy();
    });

    it('should have accessible close button label', () =>
    {
        render(<DiagnosticPanelViewPresenter theme={{ bgSecondary: '#1e1e1e', border: '#333', text: '#fff', textMuted: '#999', textSecondary: '#ccc', error: '#f38ba8', warning: '#f9e2af', accent: '#89b4fa' }} />);
        expect(screen.getByLabelText('Close problems panel')).toBeTruthy();
    });
});
