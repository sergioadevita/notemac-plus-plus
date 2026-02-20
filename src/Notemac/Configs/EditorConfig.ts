import type { AppSettings } from "../Commons/Types";
import type { ThemeName, CursorBlinking, CursorStyle, RenderWhitespace } from "../Commons/Enums";
import {
    EDITOR_DEFAULT_FONT_SIZE,
    EDITOR_DEFAULT_TAB_SIZE,
    EDITOR_DEFAULT_FONT_FAMILY,
    EDITOR_DEFAULT_AUTO_SAVE_DELAY,
    EDITOR_DEFAULT_SEARCH_ENGINE,
    EDITOR_DEFAULT_DATE_TIME_FORMAT,
} from '../Commons/Constants';

const defaultSettings: AppSettings =
{
    theme: 'mac-glass',
    fontSize: EDITOR_DEFAULT_FONT_SIZE,
    fontFamily: EDITOR_DEFAULT_FONT_FAMILY,
    tabSize: EDITOR_DEFAULT_TAB_SIZE,
    insertSpaces: true,
    wordWrap: false,
    showWhitespace: false,
    showLineNumbers: true,
    showMinimap: true,
    showIndentGuides: true,
    showEOL: false,
    showNonPrintable: false,
    showWrapSymbol: false,
    autoSave: false,
    autoSaveDelay: EDITOR_DEFAULT_AUTO_SAVE_DELAY,
    highlightCurrentLine: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    autoCloseQuotes: true,
    autoIndent: true,
    smoothScrolling: true,
    cursorBlinking: 'blink',
    cursorStyle: 'line',
    renderWhitespace: 'none',
    virtualSpace: false,
    alwaysOnTop: false,
    distractionFreeMode: false,
    darkMode: true,
    syncScrollVertical: false,
    syncScrollHorizontal: false,
    rememberLastSession: true,
    searchEngine: EDITOR_DEFAULT_SEARCH_ENGINE,
    dateTimeFormat: EDITOR_DEFAULT_DATE_TIME_FORMAT,
};

export function GetDefaultSettings(): AppSettings
{
    return { ...defaultSettings };
}

export function GetDefaultFontSize(): number
{
    return defaultSettings.fontSize;
}

export function GetDefaultTabSize(): number
{
    return defaultSettings.tabSize;
}

export function GetDefaultFontFamily(): string
{
    return defaultSettings.fontFamily;
}

export function GetDefaultTheme(): ThemeName
{
    return defaultSettings.theme;
}

export function GetDefaultCursorBlinking(): CursorBlinking
{
    return defaultSettings.cursorBlinking;
}

export function GetDefaultCursorStyle(): CursorStyle
{
    return defaultSettings.cursorStyle;
}

export function GetDefaultRenderWhitespace(): RenderWhitespace
{
    return defaultSettings.renderWhitespace;
}
