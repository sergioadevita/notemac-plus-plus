import { describe, it, expect } from 'vitest';
import { GetTheme, GetCustomTheme, GetThemeNames } from '../Notemac/Configs/ThemeConfig';

// ============================================================
// ThemeConfig — getTheme
// ============================================================
describe('ThemeConfig — getTheme', () =>
{
    it('returns mac-glass theme', () =>
    {
        const theme = GetTheme('mac-glass');
        expect(theme).toBeDefined();
        expect(theme.bg).toBe('#1a1520');
        expect(theme.editorMonacoTheme).toBe('mac-glass');
        expect(theme.accent).toBe('#e8863a');
    });

    it('returns dark theme', () =>
    {
        const theme = GetTheme('dark');
        expect(theme).toBeDefined();
        expect(theme.bg).toBe('#1e1e1e');
        expect(theme.editorMonacoTheme).toBe('vs-dark');
    });

    it('returns light theme', () =>
    {
        const theme = GetTheme('light');
        expect(theme).toBeDefined();
        expect(theme.bg).toBe('#ffffff');
    });

    it('returns monokai theme', () =>
    {
        const theme = GetTheme('monokai');
        expect(theme).toBeDefined();
        expect(theme.bg).toBeTruthy();
    });

    it('returns solarized-dark theme', () =>
    {
        const theme = GetTheme('solarized-dark');
        expect(theme).toBeDefined();
    });

    it('returns solarized-light theme', () =>
    {
        const theme = GetTheme('solarized-light');
        expect(theme).toBeDefined();
    });

    it('returns dracula theme', () =>
    {
        const theme = GetTheme('dracula');
        expect(theme).toBeDefined();
    });

    it('all themes have required color keys', () =>
    {
        const themeNames = ['mac-glass', 'dark', 'light', 'monokai', 'solarized-dark', 'solarized-light', 'dracula'] as const;
        const requiredKeys = [
            'bg', 'bgSecondary', 'bgTertiary', 'bgHover', 'bgActive',
            'text', 'textSecondary', 'textMuted', 'border',
            'accent', 'accentHover', 'accentText',
            'danger', 'warning', 'success',
            'tabBg', 'tabActiveBg', 'tabActiveText', 'tabBorder',
            'menuBg', 'menuHover', 'menuText',
            'statusBarBg', 'statusBarText',
            'sidebarBg', 'sidebarText',
            'scrollbarBg', 'scrollbarThumb',
            'editorBg', 'editorMonacoTheme', 'findBg',
        ];

        for (const name of themeNames)
        {
            const theme = GetTheme(name);
            for (const key of requiredKeys)
            {
                expect(theme).toHaveProperty(key);
            }
        }
    });
});

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
