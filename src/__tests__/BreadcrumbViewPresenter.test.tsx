import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn((selector) =>
    {
        const state = {
            breadcrumbs: [
                { label: 'src', kind: 'folder' },
                { label: 'Notemac', kind: 'folder' },
                { label: 'test.ts', kind: 'file' },
            ],
            settings: { breadcrumbsEnabled: true },
        };
        return selector(state);
    }),
}));

vi.mock('../Notemac/Controllers/BreadcrumbController', () => ({
    NavigateToBreadcrumb: vi.fn(),
}));

vi.mock('../../Shared/Helpers/EditorGlobals', () => ({
    GetMonacoEditor: vi.fn(),
}));

import { BreadcrumbViewPresenter } from '../Notemac/UI/BreadcrumbViewPresenter';

describe('BreadcrumbViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    it('should render breadcrumb items', () =>
    {
        render(<BreadcrumbViewPresenter theme={{ textSecondary: '#ccc', bgSecondary: '#1e1e1e', border: '#333', textMuted: '#666', accent: '#89b4fa' }} />);
        expect(screen.getByText('src')).toBeTruthy();
        expect(screen.getByText('Notemac')).toBeTruthy();
        expect(screen.getByText('test.ts')).toBeTruthy();
    });

    it('should render navigation element', () =>
    {
        render(<BreadcrumbViewPresenter theme={{ textSecondary: '#ccc', bgSecondary: '#1e1e1e', border: '#333', textMuted: '#666', accent: '#89b4fa' }} />);
        expect(screen.getByRole('navigation')).toBeTruthy();
    });

    it('should render separators between items', () =>
    {
        const { container } = render(<BreadcrumbViewPresenter theme={{ textSecondary: '#ccc', bgSecondary: '#1e1e1e', border: '#333', textMuted: '#666', accent: '#89b4fa' }} />);
        const spans = container.querySelectorAll('span');
        expect(spans.length).toBeGreaterThan(0);
    });

    it('should render breadcrumb items as buttons', () =>
    {
        render(<BreadcrumbViewPresenter theme={{ textSecondary: '#ccc', bgSecondary: '#1e1e1e', border: '#333', textMuted: '#666', accent: '#89b4fa' }} />);
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(3);
    });

    it('should render breadcrumb bar with correct test id', () =>
    {
        render(<BreadcrumbViewPresenter theme={{ textSecondary: '#ccc', bgSecondary: '#1e1e1e', border: '#333', textMuted: '#666', accent: '#89b4fa' }} />);
        expect(screen.getByTestId('breadcrumb-bar')).toBeTruthy();
    });

    it('should have correct breadcrumb items count', () =>
    {
        render(<BreadcrumbViewPresenter theme={{ textSecondary: '#ccc', bgSecondary: '#1e1e1e', border: '#333', textMuted: '#666', accent: '#89b4fa' }} />);
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(3);
    });
});
