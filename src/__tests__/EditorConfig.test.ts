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

// ============================================================
// EditorConfig — GetDefaultSettings
// ============================================================
describe('EditorConfig — GetDefaultSettings', () =>
{
    it('returns a complete settings object', () =>
    {
        const settings = GetDefaultSettings();
        expect(settings).toBeDefined();
        expect(settings.theme).toBe('mac-glass');
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

    it('GetDefaultTheme returns mac-glass', () =>
    {
        expect(GetDefaultTheme()).toBe('mac-glass');
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
