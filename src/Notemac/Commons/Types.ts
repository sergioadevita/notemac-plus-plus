import { TabColor, SidebarPanel, LineEnding, ThemeName, CursorBlinking, CursorStyle, RenderWhitespace } from "./Enums";

export interface FileTab
{
    id: string;
    name: string;
    path: string | null;
    content: string;
    originalContent: string;
    language: string;
    encoding: string;
    lineEnding: LineEnding;
    isModified: boolean;
    isReadOnly: boolean;
    isPinned: boolean;
    tabColor: TabColor;
    cursorLine: number;
    cursorColumn: number;
    scrollTop: number;
    bookmarks: number[];
    marks: MarkStyle[];
    hiddenLines: number[];
    isMonitoring: boolean;
}

export interface MarkStyle
{
    line: number;
    column: number;
    length: number;
    style: 1 | 2 | 3 | 4 | 5;
}

export interface FileTreeNode
{
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileTreeNode[];
    isExpanded?: boolean;
}

export interface MacroAction
{
    type: 'type' | 'delete' | 'move' | 'select' | 'command';
    data: any;
    timestamp: number;
}

export interface SavedMacro
{
    id: string;
    name: string;
    actions: MacroAction[];
    shortcut?: string;
}

export interface SearchOptions
{
    query: string;
    replaceText: string;
    isRegex: boolean;
    isCaseSensitive: boolean;
    isWholeWord: boolean;
    searchInSelection: boolean;
    wrapAround: boolean;
}

export interface AppSettings
{
    theme: ThemeName;
    fontSize: number;
    fontFamily: string;
    tabSize: number;
    insertSpaces: boolean;
    wordWrap: boolean;
    showWhitespace: boolean;
    showLineNumbers: boolean;
    showMinimap: boolean;
    showIndentGuides: boolean;
    showEOL: boolean;
    showNonPrintable: boolean;
    showWrapSymbol: boolean;
    autoSave: boolean;
    autoSaveDelay: number;
    highlightCurrentLine: boolean;
    matchBrackets: boolean;
    autoCloseBrackets: boolean;
    autoCloseQuotes: boolean;
    autoIndent: boolean;
    smoothScrolling: boolean;
    cursorBlinking: CursorBlinking;
    cursorStyle: CursorStyle;
    renderWhitespace: RenderWhitespace;
    virtualSpace: boolean;
    alwaysOnTop: boolean;
    distractionFreeMode: boolean;
    darkMode: boolean;
    syncScrollVertical: boolean;
    syncScrollHorizontal: boolean;
    rememberLastSession: boolean;
    searchEngine: string;
    dateTimeFormat: string;
}

export interface FindResult
{
    line: number;
    column: number;
    length: number;
    text: string;
    filePath?: string;
}

export interface ClipboardEntry
{
    text: string;
    timestamp: number;
}

export interface SessionData
{
    tabs: { path: string | null; name: string; language: string; cursorLine: number; cursorColumn: number; scrollTop: number; content?: string }[];
    activeTabIndex: number;
    sidebarPanel: SidebarPanel;
}
