import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { SettingsDialog } from '../components/SettingsDialog';
import { useEditorStore } from '../store/editorStore';
import { getTheme } from '../utils/themes';

// Helper: reset store before each test
function resetStore()
{
    const state = useEditorStore.getState();
    state.updateSettings({
        theme: 'mac-glass',
        customThemeBase: 'mac-glass',
        customThemeColors: {},
    });
    state.setShowSettings(true);
}

describe('SettingsDialog — Appearance Section', () =>
{
    beforeEach(() =>
    {
        resetStore();
    });

    it('renders theme selector with Custom option', () =>
    {
        const theme = getTheme('mac-glass');
        render(<SettingsDialog theme={theme} />);

        // Navigate to Appearance section
        fireEvent.click(screen.getByText('Appearance'));

        // Should show the theme dropdown
        const select = screen.getByDisplayValue('Mac Glass (Default)');
        expect(select).toBeDefined();

        // Should contain Custom option
        const options = within(select as HTMLElement).getAllByRole('option');
        const customOption = options.find((o: HTMLElement) => o.textContent === 'Custom');
        expect(customOption).toBeDefined();
    });

    it('displays color picker grid in appearance section', () =>
    {
        const theme = getTheme('mac-glass');
        render(<SettingsDialog theme={theme} />);
        fireEvent.click(screen.getByText('Appearance'));

        // Should display Theme Colors section header
        expect(screen.getByText('Theme Colors')).toBeDefined();

        // Should display grouped color pickers
        expect(screen.getByText('Backgrounds')).toBeDefined();
        expect(screen.getByText('Text')).toBeDefined();
        expect(screen.getByText('Accent & Status')).toBeDefined();
        expect(screen.getByText('Tabs')).toBeDefined();
        expect(screen.getByText('Menu')).toBeDefined();
        expect(screen.getByText('Status Bar')).toBeDefined();
        expect(screen.getByText('Sidebar')).toBeDefined();
    });

    it('shows color inputs for each theme property', () =>
    {
        const theme = getTheme('mac-glass');
        render(<SettingsDialog theme={theme} />);
        fireEvent.click(screen.getByText('Appearance'));

        // Check specific color pickers exist
        expect(screen.getByTestId('color-picker-bg')).toBeDefined();
        expect(screen.getByTestId('color-picker-accent')).toBeDefined();
        expect(screen.getByTestId('color-picker-text')).toBeDefined();
        expect(screen.getByTestId('color-picker-statusBarBg')).toBeDefined();
    });

    it('switching a color auto-selects custom theme', () =>
    {
        const theme = getTheme('mac-glass');
        render(<SettingsDialog theme={theme} />);
        fireEvent.click(screen.getByText('Appearance'));

        // Change a color
        const bgInput = screen.getByTestId('color-input-bg');
        fireEvent.change(bgInput, { target: { value: '#ff0000' } });

        // Store should now have custom theme
        const state = useEditorStore.getState();
        expect(state.settings.theme).toBe('custom');
        expect(state.settings.customThemeBase).toBe('mac-glass');
        expect(state.settings.customThemeColors.bg).toBe('#ff0000');
    });

    it('shows Base Theme selector when custom is active', () =>
    {
        const theme = getTheme('mac-glass');
        render(<SettingsDialog theme={theme} />);
        fireEvent.click(screen.getByText('Appearance'));

        // Switch to custom
        const themeSelect = screen.getByDisplayValue('Mac Glass (Default)');
        fireEvent.change(themeSelect, { target: { value: 'custom' } });

        // Should now show Base Theme selector
        expect(screen.getByDisplayValue('Mac Glass')).toBeDefined();
    });

    it('shows reset button for overridden colors', () =>
    {
        // Set up custom theme with overrides
        act(() =>
        {
            useEditorStore.getState().updateSettings({
                theme: 'custom' as any,
                customThemeBase: 'dark' as any,
                customThemeColors: { bg: '#ff0000', accent: '#00ff00' },
            });
        });

        const theme = getTheme('dark');
        render(<SettingsDialog theme={theme} />);
        fireEvent.click(screen.getByText('Appearance'));

        // Should show reset buttons for overridden colors
        expect(screen.getByTestId('color-reset-bg')).toBeDefined();
        expect(screen.getByTestId('color-reset-accent')).toBeDefined();
    });

    it('reset button removes individual color override', () =>
    {
        act(() =>
        {
            useEditorStore.getState().updateSettings({
                theme: 'custom' as any,
                customThemeBase: 'dark' as any,
                customThemeColors: { bg: '#ff0000', accent: '#00ff00' },
            });
        });

        const theme = getTheme('dark');
        render(<SettingsDialog theme={theme} />);
        fireEvent.click(screen.getByText('Appearance'));

        // Reset bg color
        fireEvent.click(screen.getByTestId('color-reset-bg'));

        const state = useEditorStore.getState();
        expect(state.settings.customThemeColors.bg).toBeUndefined();
        // accent should still be there
        expect(state.settings.customThemeColors.accent).toBe('#00ff00');
    });

    it('resetting last override reverts to base theme', () =>
    {
        act(() =>
        {
            useEditorStore.getState().updateSettings({
                theme: 'custom' as any,
                customThemeBase: 'dark' as any,
                customThemeColors: { bg: '#ff0000' },
            });
        });

        const theme = getTheme('dark');
        render(<SettingsDialog theme={theme} />);
        fireEvent.click(screen.getByText('Appearance'));

        // Reset the only override
        fireEvent.click(screen.getByTestId('color-reset-bg'));

        const state = useEditorStore.getState();
        expect(state.settings.theme).toBe('dark');
        expect(Object.keys(state.settings.customThemeColors).length).toBe(0);
    });

    it('Reset All button clears all overrides and reverts theme', () =>
    {
        act(() =>
        {
            useEditorStore.getState().updateSettings({
                theme: 'custom' as any,
                customThemeBase: 'monokai' as any,
                customThemeColors: { bg: '#111', accent: '#222', text: '#333' },
            });
        });

        const theme = getTheme('monokai');
        render(<SettingsDialog theme={theme} />);
        fireEvent.click(screen.getByText('Appearance'));

        // Click Reset All
        fireEvent.click(screen.getByText('Reset All'));

        const state = useEditorStore.getState();
        expect(state.settings.theme).toBe('monokai');
        expect(Object.keys(state.settings.customThemeColors).length).toBe(0);
    });

    it('shows override count when colors are customized', () =>
    {
        act(() =>
        {
            useEditorStore.getState().updateSettings({
                theme: 'custom' as any,
                customThemeBase: 'dark' as any,
                customThemeColors: { bg: '#111', accent: '#222' },
            });
        });

        const theme = getTheme('dark');
        render(<SettingsDialog theme={theme} />);
        fireEvent.click(screen.getByText('Appearance'));

        expect(screen.getByText('2 colors customized')).toBeDefined();
    });

    it('switching to a built-in theme clears custom colors', () =>
    {
        act(() =>
        {
            useEditorStore.getState().updateSettings({
                theme: 'custom' as any,
                customThemeBase: 'dark' as any,
                customThemeColors: { bg: '#ff0000' },
            });
        });

        const theme = getTheme('dark');
        render(<SettingsDialog theme={theme} />);
        fireEvent.click(screen.getByText('Appearance'));

        // Switch to monokai
        const themeSelect = screen.getByDisplayValue('Custom');
        fireEvent.change(themeSelect, { target: { value: 'monokai' } });

        const state = useEditorStore.getState();
        expect(state.settings.theme).toBe('monokai');
        expect(Object.keys(state.settings.customThemeColors).length).toBe(0);
    });

    it('multiple color changes accumulate in customThemeColors', () =>
    {
        const theme = getTheme('mac-glass');
        render(<SettingsDialog theme={theme} />);
        fireEvent.click(screen.getByText('Appearance'));

        // Change bg
        fireEvent.change(screen.getByTestId('color-input-bg'), { target: { value: '#111111' } });
        // Change accent
        fireEvent.change(screen.getByTestId('color-input-accent'), { target: { value: '#222222' } });
        // Change text
        fireEvent.change(screen.getByTestId('color-input-text'), { target: { value: '#333333' } });

        const state = useEditorStore.getState();
        expect(state.settings.theme).toBe('custom');
        expect(state.settings.customThemeColors.bg).toBe('#111111');
        expect(state.settings.customThemeColors.accent).toBe('#222222');
        expect(state.settings.customThemeColors.text).toBe('#333333');
    });
});
