import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PluginManagerViewPresenter } from '../Notemac/UI/PluginManagerViewPresenter';
import { useNotemacStore } from '../Notemac/Model/Store';
import * as PluginController from '../Notemac/Controllers/PluginController';
import * as PluginRegistryService from '../Notemac/Services/PluginRegistryService';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

// ─── Mock Store ─────────────────────────────────────────────────

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: vi.fn(),
}));

vi.mock('../Notemac/Controllers/PluginController');
vi.mock('../Notemac/Services/PluginRegistryService', () => ({
    InstallPlugin: vi.fn(),
    UninstallPlugin: vi.fn(),
    SearchRegistry: vi.fn((_q: string, entries: any[]) => entries),
}));

vi.mock('../Notemac/Commons/Constants', () => ({
    UI_ZINDEX_MODAL: 10000,
}));

vi.mock('../../Shared/EventDispatcher/EventDispatcher', () => ({
    Dispatch: vi.fn(),
    NOTEMAC_EVENTS: {
        PLUGIN_ACTIVATED: 'plugin:activated',
        PLUGIN_DEACTIVATED: 'plugin:deactivated',
        PLUGIN_ERROR: 'plugin:error',
        PLUGIN_INSTALLED: 'plugin:installed',
        PLUGIN_UNINSTALLED: 'plugin:uninstalled',
    },
}));

// ─── Mock Theme ─────────────────────────────────────────────────

const mockTheme: ThemeColors = {
    bg: '#1e1e1e',
    bgSecondary: '#252526',
    bgTertiary: '#2d2d2d',
    bgHover: '#2a2d2e',
    bgSelected: '#094771',
    border: '#474747',
    fg: '#cccccc',
    fgSecondary: '#969696',
    fgInactive: '#6e7681',
    text: '#cccccc',
    textSecondary: '#969696',
    textMuted: '#6e7681',
    accent: '#0078d4',
    accentHover: '#1c8cf9',
    accentFg: '#ffffff',
    accentText: '#ffffff',
    scrollbar: '#424242',
    scrollbarHover: '#4f4f4f',
    findHighlight: '#623315',
    selectionBg: '#264f78',
    lineHighlight: '#2a2d2e',
    errorFg: '#f14c4c',
    warningFg: '#cca700',
    successFg: '#89d185',
    infoFg: '#3794ff',
    tabActiveBg: '#1e1e1e',
    tabInactiveBg: '#2d2d2d',
    tabHoverBg: '#2a2d2e',
    sidebarBg: '#252526',
    sidebarFg: '#cccccc',
    editorMonacoTheme: 'notemac-dark',
} as ThemeColors;

// ─── Tests ──────────────────────────────────────────────────────

describe('PluginManagerViewPresenter', () =>
{
    const mockSetShowPluginManager = vi.fn();
    const mockSetPluginInstances = vi.fn();

    const mockPlugin = {
        id: 'test-plugin',
        manifest: {
            id: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            author: 'Test Author',
            description: 'Test Description',
            main: 'index.js',
        },
        status: 'active' as const,
        context: null,
        module: null,
    };

    const mockRegistryEntry = {
        id: 'registry-plugin',
        name: 'Registry Plugin',
        version: '2.0.0',
        description: 'A plugin from registry',
        author: 'Test Author',
        downloadUrl: 'https://example.com/plugin.zip',
        stars: 10,
        downloads: 100,
    };

    function setupMockState(overrides: any = {})
    {
        const mockState = {
            pluginInstances: [mockPlugin],
            pluginRegistryEntries: [mockRegistryEntry],
            pluginRegistryLoading: false,
            SetShowPluginManager: mockSetShowPluginManager,
            SetPluginInstances: mockSetPluginInstances,
            ...overrides,
        };
        (useNotemacStore as any).mockImplementation((selector?: any) =>
            selector ? selector(mockState) : mockState
        );
    }

    beforeEach(() =>
    {
        vi.clearAllMocks();
        setupMockState();
    });

    it('should render dialog with Plugin Manager title', () =>
    {
        render(<PluginManagerViewPresenter theme={mockTheme} />);

        expect(null !== screen.queryByText('Plugin Manager')).toBe(true);
    });

    it('should display installed plugin name', () =>
    {
        render(<PluginManagerViewPresenter theme={mockTheme} />);

        expect(null !== screen.queryByText('Test Plugin')).toBe(true);
    });

    it('should show empty state when no plugins installed', () =>
    {
        setupMockState({ pluginInstances: [] });

        render(<PluginManagerViewPresenter theme={mockTheme} />);

        expect(null !== screen.queryByText(/no plugins/i)).toBe(true);
    });

    it('should close dialog on close button click', () =>
    {
        render(<PluginManagerViewPresenter theme={mockTheme} />);

        const closeButton = screen.getByLabelText('Close plugin manager');
        fireEvent.click(closeButton);

        expect(mockSetShowPluginManager).toHaveBeenCalledWith(false);
    });

    it('should switch to browse tab', () =>
    {
        render(<PluginManagerViewPresenter theme={mockTheme} />);

        const browseTab = screen.getByText('Browse');
        fireEvent.click(browseTab);

        // After clicking Browse, search input should appear
        expect(null !== screen.queryByPlaceholderText(/search/i)).toBe(true);
    });
});
