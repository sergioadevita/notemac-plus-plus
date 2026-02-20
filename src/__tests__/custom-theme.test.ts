import { describe, it, expect } from 'vitest';
import { getTheme, getCustomTheme, themeColorGroups } from '../utils/themes';
import { GetTheme, GetCustomTheme, GetThemeNames } from '../Notemac/Configs/ThemeConfig';
import { GetDefaultSettings } from '../Notemac/Configs/EditorConfig';

// ============================================================
// Custom Theme — getCustomTheme (Web layer)
// ============================================================
describe('getCustomTheme — Web layer', () =>
{
    it('returns base theme colors when no overrides', () =>
    {
        const base = getTheme('dark');
        const custom = getCustomTheme('dark', {});
        expect(custom.bg).toBe(base.bg);
        expect(custom.accent).toBe(base.accent);
        expect(custom.text).toBe(base.text);
        expect(custom.statusBarBg).toBe(base.statusBarBg);
    });

    it('overrides specific colors while keeping base for others', () =>
    {
        const base = getTheme('mac-glass');
        const custom = getCustomTheme('mac-glass', {
            bg: '#ff0000',
            accent: '#00ff00',
        });
        expect(custom.bg).toBe('#ff0000');
        expect(custom.accent).toBe('#00ff00');
        // Unchanged colors should remain from base
        expect(custom.text).toBe(base.text);
        expect(custom.border).toBe(base.border);
        expect(custom.statusBarBg).toBe(base.statusBarBg);
    });

    it('preserves editorMonacoTheme from base even if override attempted', () =>
    {
        const base = getTheme('monokai');
        const custom = getCustomTheme('monokai', {
            editorMonacoTheme: 'invalid-theme',
        });
        expect(custom.editorMonacoTheme).toBe(base.editorMonacoTheme);
    });

    it('falls back to mac-glass when base name is invalid', () =>
    {
        const macGlass = getTheme('mac-glass');
        const custom = getCustomTheme('nonexistent', { bg: '#123456' });
        expect(custom.bg).toBe('#123456');
        expect(custom.text).toBe(macGlass.text);
        expect(custom.editorMonacoTheme).toBe(macGlass.editorMonacoTheme);
    });

    it('can override all color properties at once', () =>
    {
        const overrides: Record<string, string> = {};
        const allColorKeys = themeColorGroups.flatMap(g => g.keys.map(k => k.key));
        for (const key of allColorKeys)
        {
            if (key !== 'editorMonacoTheme')
            {
                overrides[key] = '#aabbcc';
            }
        }
        const custom = getCustomTheme('dark', overrides);
        for (const key of allColorKeys)
        {
            if (key !== 'editorMonacoTheme')
            {
                expect((custom as any)[key]).toBe('#aabbcc');
            }
        }
    });

    it('works with every built-in theme as base', () =>
    {
        const bases = ['mac-glass', 'dark', 'light', 'monokai', 'dracula', 'solarized-dark', 'solarized-light'];
        for (const name of bases)
        {
            const custom = getCustomTheme(name, { accent: '#ff9900' });
            const base = getTheme(name);
            expect(custom.accent).toBe('#ff9900');
            expect(custom.bg).toBe(base.bg);
            expect(custom.editorMonacoTheme).toBe(base.editorMonacoTheme);
        }
    });
});

// ============================================================
// Custom Theme — GetCustomTheme (Electron layer)
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
// themeColorGroups — metadata
// ============================================================
describe('themeColorGroups — metadata', () =>
{
    it('covers all non-monaco theme color keys', () =>
    {
        const base = getTheme('dark');
        const allKeysInGroups = new Set(themeColorGroups.flatMap(g => g.keys.map(k => k.key)));
        const themeKeys = Object.keys(base).filter(k => k !== 'editorMonacoTheme');
        for (const key of themeKeys)
        {
            expect(allKeysInGroups.has(key as any)).toBe(true);
        }
    });

    it('has no duplicate keys across groups', () =>
    {
        const seen = new Set<string>();
        for (const group of themeColorGroups)
        {
            for (const { key } of group.keys)
            {
                expect(seen.has(key)).toBe(false);
                seen.add(key);
            }
        }
    });

    it('each group has a label and at least one key', () =>
    {
        for (const group of themeColorGroups)
        {
            expect(group.label.length).toBeGreaterThan(0);
            expect(group.keys.length).toBeGreaterThan(0);
            for (const entry of group.keys)
            {
                expect(entry.key.length).toBeGreaterThan(0);
                expect(entry.label.length).toBeGreaterThan(0);
            }
        }
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
