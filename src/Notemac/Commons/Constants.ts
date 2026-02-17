import { TabColor } from "./Enums";

// DB - Persistence keys
export const DB_SESSION_DATA = "SessionData";
export const DB_SETTINGS = "Settings";
export const DB_RECENT_FILES = "RecentFiles";
export const DB_SAVED_MACROS = "SavedMacros";
export const DB_CLIPBOARD_HISTORY = "ClipboardHistory";

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
