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

export interface CommandDefinition
{
    id: string;
    label: string;
    category: string;
    keybinding?: string;
    action: string;
    icon?: string;
}

export interface SavedSnippet
{
    id: string;
    name: string;
    prefix: string;
    body: string;
    language: string;
    description?: string;
}

export interface DiffSession
{
    id: string;
    originalTabId: string;
    modifiedTabId: string;
}

// Git types

export interface GitBranch
{
    name: string;
    isRemote: boolean;
    isCurrentBranch: boolean;
    lastCommitOid: string;
}

export interface GitCommit
{
    oid: string;
    message: string;
    author: { name: string; email: string };
    timestamp: number;
}

export interface GitFileStatus
{
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'untracked' | 'unmerged';
    isStaged: boolean;
}

export interface GitStatus
{
    branch: string;
    isRepoDirty: boolean;
    stagedFiles: GitFileStatus[];
    unstagedFiles: GitFileStatus[];
    untrackedFiles: GitFileStatus[];
    aheadBy: number;
    behindBy: number;
    mergeInProgress: boolean;
}

export interface GitRemote
{
    name: string;
    url: string;
}

export interface GitCredentials
{
    type: 'token' | 'ssh' | 'oauth';
    username: string;
    token?: string;
    sshPrivateKey?: string;
}

export interface GitAuthor
{
    name: string;
    email: string;
}

export interface BrowserWorkspace
{
    id: string;
    name: string;
    repoUrl?: string;
    createdAt: number;
    lastOpenedAt: number;
}

// AI types

export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'custom';

export interface AIProvider
{
    id: string;
    name: string;
    type: AIProviderType;
    baseUrl: string;
    models: AIModelDefinition[];
    isBuiltIn: boolean;
}

export interface AIModelDefinition
{
    id: string;
    name: string;
    providerId: string;
    contextWindow: number;
    supportsStreaming: boolean;
    supportsFIM: boolean;
}

export interface AICredential
{
    providerId: string;
    apiKey: string;
    rememberKey: boolean;
}

export interface AIMessage
{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    codeBlocks: AICodeBlock[];
}

export interface AIConversation
{
    id: string;
    title: string;
    messages: AIMessage[];
    modelId: string;
    providerId: string;
    createdAt: number;
}

export interface AICodeBlock
{
    language: string;
    code: string;
    startLine?: number;
    endLine?: number;
    action: 'insert' | 'replace' | 'new-file';
}

export interface AIInlineSuggestion
{
    text: string;
    range: { startLine: number; startColumn: number; endLine: number; endColumn: number };
    requestId: string;
    status: 'pending' | 'active' | 'accepted' | 'dismissed';
}

export interface AIContextItem
{
    type: 'file' | 'selection' | 'error' | 'diff';
    content: string;
    label: string;
    language?: string;
}
