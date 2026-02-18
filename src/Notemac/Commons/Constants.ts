import { TabColor } from "./Enums";

// DB - Persistence keys
export const DB_SESSION_DATA = "SessionData";
export const DB_SETTINGS = "Settings";
export const DB_RECENT_FILES = "RecentFiles";
export const DB_SAVED_MACROS = "SavedMacros";
export const DB_CLIPBOARD_HISTORY = "ClipboardHistory";
export const DB_SAVED_SNIPPETS = "SavedSnippets";
export const DB_TERMINAL_HISTORY = "TerminalHistory";

// UI - Panels
export const UI_EXPLORER_PANEL = "Explorer";
export const UI_SEARCH_PANEL = "Search";
export const UI_FUNCTIONS_PANEL = "Functions";
export const UI_PROJECT_PANEL = "Project";
export const UI_CLIPBOARD_HISTORY_PANEL = "ClipboardHistory";
export const UI_CHAR_PANEL = "CharPanel";
export const UI_DOC_LIST_PANEL = "DocList";

// UI - Dialogs
export const UI_SETTINGS_DIALOG = "Settings";
export const UI_GO_TO_LINE_DIALOG = "GoToLine";
export const UI_ABOUT_DIALOG = "About";
export const UI_RUN_COMMAND_DIALOG = "RunCommand";
export const UI_COLUMN_EDITOR_DIALOG = "ColumnEditor";
export const UI_SUMMARY_DIALOG = "Summary";
export const UI_CHAR_IN_RANGE_DIALOG = "CharInRange";
export const UI_SHORTCUT_MAPPER_DIALOG = "ShortcutMapper";
export const UI_COMMAND_PALETTE = "CommandPalette";
export const UI_QUICK_OPEN = "QuickOpen";
export const UI_DIFF_VIEWER = "DiffViewer";
export const UI_SNIPPET_MANAGER = "SnippetManager";
export const UI_TERMINAL_PANEL = "Terminal";

// MARK - Colors
export const MARK_COLORS: Record<number, string> =
{
    1: '#ff4444',
    2: '#44ff44',
    3: '#4488ff',
    4: '#ff44ff',
    5: '#ffaa00',
};

// TAB - Colors
export const TAB_COLORS: Record<TabColor, string> =
{
    none: 'transparent',
    color1: '#ff4444',
    color2: '#44bb44',
    color3: '#4488ff',
    color4: '#ff8800',
    color5: '#cc44cc',
};

// EDITOR - Defaults
export const EDITOR_DEFAULT_FONT_SIZE = 14;
export const EDITOR_DEFAULT_TAB_SIZE = 4;
export const EDITOR_DEFAULT_FONT_FAMILY = "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace";
export const EDITOR_DEFAULT_AUTO_SAVE_DELAY = 5000;
export const EDITOR_DEFAULT_SEARCH_ENGINE = "https://www.google.com/search?q=";
export const EDITOR_DEFAULT_DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss";

// LIMITS
export const LIMIT_CLOSED_TABS = 20;
export const LIMIT_RECENT_FILES = 20;
export const LIMIT_CLIPBOARD_HISTORY = 50;
export const LIMIT_ZOOM_MIN = -5;
export const LIMIT_ZOOM_MAX = 10;
export const LIMIT_TERMINAL_HISTORY = 100;
export const LIMIT_QUICK_OPEN_RESULTS = 50;

// TERMINAL
export const TERMINAL_DEFAULT_HEIGHT = 200;
export const TERMINAL_MIN_HEIGHT = 100;
export const TERMINAL_MAX_HEIGHT = 600;

// DB - Git
export const DB_GIT_CREDENTIALS = "GitCredentials";
export const DB_GIT_AUTHOR = "GitAuthor";
export const DB_GIT_SETTINGS = "GitSettings";
export const DB_BROWSER_WORKSPACES = "BrowserWorkspaces";

// UI - Git
export const UI_GIT_PANEL = "SourceControl";
export const UI_CLONE_DIALOG = "CloneRepository";
export const UI_GIT_SETTINGS_DIALOG = "GitSettings";

// GIT
export const GIT_COMMIT_FETCH_LIMIT = 50;
export const GIT_STATUS_POLL_INTERVAL = 3000;
export const GIT_DEFAULT_CORS_PROXY = "https://cors.isomorphic-git.org";
export const GIT_DEFAULT_AUTHOR_NAME = "Notemac++ User";
export const GIT_DEFAULT_AUTHOR_EMAIL = "user@notemac.app";

// DB - AI
export const DB_AI_PROVIDERS = "AIProviders";
export const DB_AI_CREDENTIALS = "AICredentials";
export const DB_AI_SETTINGS = "AISettings";
export const DB_AI_CONVERSATIONS = "AIConversations";

// UI - AI
export const UI_AI_PANEL = "AIAssistant";
export const UI_AI_SETTINGS_DIALOG = "AISettings";

// AI - Defaults
export const AI_DEFAULT_DEBOUNCE_MS = 500;
export const AI_MAX_CONTEXT_TOKENS = 8000;
export const AI_DEFAULT_TEMPERATURE = 0.3;
export const AI_CHAT_TEMPERATURE = 0.7;
export const AI_MAX_CONVERSATIONS = 50;
export const AI_MAX_INLINE_TOKENS = 256;
