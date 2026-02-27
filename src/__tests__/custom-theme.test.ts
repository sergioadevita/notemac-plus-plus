import { describe, it, expect } from 'vitest';
import { GetTheme, GetCustomTheme, GetThemeNames } from '../Notemac/Configs/ThemeConfig';
import { GetDefaultSettings } from '../Notemac/Configs/EditorConfig';

// ============================================================
// Custom Theme — GetCustomTheme
// ============================================================
describe('GetCustomTheme — Electron layer', () =>
{
    it('returns base theme when no overrides', () =>
    {
        const base = GetTheme('dark');
        const custom = GetCustomTheme('dark', {});
        expect(custom.bg).toBe(base.bg);
        expect(custom.accent).toBe(base.accent);
    });

    it('applies overrides correctly', () =>
    {
        const custom = GetCustomTheme('mac-glass', {
            bg: '#111111',
            danger: '#ff0000',
        });
        expect(custom.bg).toBe('#111111');
        expect(custom.danger).toBe('#ff0000');
    });

    it('preserves editorMonacoTheme from base', () =>
    {
        const custom = GetCustomTheme('dracula', { editorMonacoTheme: 'bogus' });
        expect(custom.editorMonacoTheme).toBe('dracula');
    });

    it('falls back to mac-glass for unknown base', () =>
    {
        const macGlass = GetTheme('mac-glass');
        const custom = GetCustomTheme('unknown', {});
        expect(custom.bg).toBe(macGlass.bg);
    });
});

// ============================================================
// Default settings — custom theme fields
// ============================================================
describe('Default settings — custom theme fields', () =>
{
    it('includes customThemeBase in defaults', () =>
    {
        const settings = GetDefaultSettings();
        expect(settings.customThemeBase).toBe('mac-glass');
    });

    it('includes empty customThemeColors in defaults', () =>
    {
        const settings = GetDefaultSettings();
        expect(settings.customThemeColors).toBeDefined();
        expect(Object.keys(settings.customThemeColors).length).toBe(0);
    });

    it('default theme is not custom', () =>
    {
        const settings = GetDefaultSettings();
        expect(settings.theme).not.toBe('custom');
    });
});

// ============================================================
// GetThemeNames — includes all themes
// ============================================================
describe('GetThemeNames', () =>
{
    it('returns all 7 built-in themes', () =>
    {
        const names = GetThemeNames();
        expect(names.length).toBe(7);
        expect(names).toContain('mac-glass');
        expect(names).toContain('dark');
        expect(names).toContain('light');
        expect(names).toContain('monokai');
        expect(names).toContain('dracula');
        expect(names).toContain('solarized-dark');
        expect(names).toContain('solarized-light');
    });

    it('does not include custom in theme names', () =>
    {
        const names = GetThemeNames();
        expect(names).not.toContain('custom');
    });
});
