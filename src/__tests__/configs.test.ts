import { describe, it, expect } from 'vitest';
import {
    GetDefaultSettings,
    GetDefaultFontSize,
    GetDefaultTabSize,
    GetDefaultFontFamily,
    GetDefaultTheme,
    GetDefaultCursorBlinking,
    GetDefaultCursorStyle,
    GetDefaultRenderWhitespace,
} from '../Notemac/Configs/EditorConfig';
import { GetTheme, GetThemeNames } from '../Notemac/Configs/ThemeConfig';
import {
    MARK_COLORS,
    TAB_COLORS,
    EDITOR_DEFAULT_FONT_SIZE,
    EDITOR_DEFAULT_TAB_SIZE,
    EDITOR_DEFAULT_FONT_FAMILY,
    EDITOR_DEFAULT_AUTO_SAVE_DELAY,
    EDITOR_DEFAULT_SEARCH_ENGINE,
    EDITOR_DEFAULT_DATE_TIME_FORMAT,
    LIMIT_CLOSED_TABS,
    LIMIT_RECENT_FILES,
    LIMIT_CLIPBOARD_HISTORY,
    LIMIT_ZOOM_MIN,
    LIMIT_ZOOM_MAX,
    DB_SESSION_DATA,
    DB_SETTINGS,
    DB_RECENT_FILES,
    DB_SAVED_MACROS,
    DB_CLIPBOARD_HISTORY,
} from '../Notemac/Commons/Constants';

// ============================================================
// EditorConfig — GetDefault* methods
// ============================================================
describe('EditorConfig — GetDefaultSettings', () =>
{
    it('returns a complete settings object', () =>
    {
        const settings = GetDefaultSettings();
        expect(settings).toBeDefined();
        expect(settings.theme).toBe('dark');
        expect(14 === settings.fontSize).toBe(true);
        expect(4 === settings.tabSize).toBe(true);
        expect(settings.insertSpaces).toBe(true);
        expect(settings.wordWrap).toBe(false);
        expect(settings.showLineNumbers).toBe(true);
        expect(settings.showMinimap).toBe(true);
        expect(settings.showIndentGuides).toBe(true);
        expect(settings.autoSave).toBe(false);
        expect(settings.highlightCurrentLine).toBe(true);
        expect(settings.matchBrackets).toBe(true);
        expect(settings.autoCloseBrackets).toBe(true);
        expect(settings.autoCloseQuotes).toBe(true);
        expect(settings.autoIndent).toBe(true);
        expect(settings.smoothScrolling).toBe(true);
        expect(settings.cursorBlinking).toBe('blink');
        expect(settings.cursorStyle).toBe('line');
        expect(settings.renderWhitespace).toBe('none');
        expect(settings.rememberLastSession).toBe(true);
    });

    it('returns a fresh copy each time (not same reference)', () =>
    {
        const s1 = GetDefaultSettings();
        const s2 = GetDefaultSettings();
        expect(s1).not.toBe(s2);
        expect(s1).toEqual(s2);
    });
});

describe('EditorConfig — individual getters', () =>
{
    it('GetDefaultFontSize returns 14', () =>
    {
        expect(14 === GetDefaultFontSize()).toBe(true);
    });

    it('GetDefaultTabSize returns 4', () =>
    {
        expect(4 === GetDefaultTabSize()).toBe(true);
    });

    it('GetDefaultFontFamily returns monospace stack', () =>
    {
        const family = GetDefaultFontFamily();
        expect(family).toContain('Menlo');
        expect(family).toContain('Monaco');
    });

    it('GetDefaultTheme returns dark', () =>
    {
        expect(GetDefaultTheme()).toBe('dark');
    });

    it('GetDefaultCursorBlinking returns blink', () =>
    {
        expect(GetDefaultCursorBlinking()).toBe('blink');
    });

    it('GetDefaultCursorStyle returns line', () =>
    {
        expect(GetDefaultCursorStyle()).toBe('line');
    });

    it('GetDefaultRenderWhitespace returns none', () =>
    {
        expect(GetDefaultRenderWhitespace()).toBe('none');
    });
});

// ============================================================
// ThemeConfig — getTheme
// ============================================================
describe('ThemeConfig — getTheme', () =>
{
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
        const themeNames = ['dark', 'light', 'monokai', 'solarized-dark', 'solarized-light', 'dracula'] as const;
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
// Constants
// ============================================================
describe('Constants', () =>
{
    it('has correct mark colors', () =>
    {
        expect(Object.keys(MARK_COLORS).length).toBe(5);
        expect(MARK_COLORS[1]).toBe('#ff4444');
        expect(MARK_COLORS[2]).toBe('#44ff44');
        expect(MARK_COLORS[3]).toBe('#4488ff');
        expect(MARK_COLORS[4]).toBe('#ff44ff');
        expect(MARK_COLORS[5]).toBe('#ffaa00');
    });

    it('has correct tab colors', () =>
    {
        expect(TAB_COLORS.none).toBe('transparent');
        expect(TAB_COLORS.color1).toBe('#ff4444');
        expect(TAB_COLORS.color2).toBe('#44bb44');
        expect(TAB_COLORS.color3).toBe('#4488ff');
        expect(TAB_COLORS.color4).toBe('#ff8800');
        expect(TAB_COLORS.color5).toBe('#cc44cc');
    });

    it('has correct editor defaults', () =>
    {
        expect(14 === EDITOR_DEFAULT_FONT_SIZE).toBe(true);
        expect(4 === EDITOR_DEFAULT_TAB_SIZE).toBe(true);
        expect(EDITOR_DEFAULT_FONT_FAMILY).toContain('Menlo');
        expect(5000 === EDITOR_DEFAULT_AUTO_SAVE_DELAY).toBe(true);
        expect(EDITOR_DEFAULT_SEARCH_ENGINE).toContain('google.com');
        expect(EDITOR_DEFAULT_DATE_TIME_FORMAT).toBe('yyyy-MM-dd HH:mm:ss');
    });

    it('has correct limits', () =>
    {
        expect(20 === LIMIT_CLOSED_TABS).toBe(true);
        expect(20 === LIMIT_RECENT_FILES).toBe(true);
        expect(50 === LIMIT_CLIPBOARD_HISTORY).toBe(true);
        expect(-5 === LIMIT_ZOOM_MIN).toBe(true);
        expect(10 === LIMIT_ZOOM_MAX).toBe(true);
    });

    it('has persistence key constants', () =>
    {
        expect(DB_SESSION_DATA).toBe('SessionData');
        expect(DB_SETTINGS).toBe('Settings');
        expect(DB_RECENT_FILES).toBe('RecentFiles');
        expect(DB_SAVED_MACROS).toBe('SavedMacros');
        expect(DB_CLIPBOARD_HISTORY).toBe('ClipboardHistory');
    });
});
