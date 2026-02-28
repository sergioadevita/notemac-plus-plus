export type TabColor = 'none' | 'color1' | 'color2' | 'color3' | 'color4' | 'color5';

export type SidebarPanel = 'explorer' | 'search' | 'functions' | 'project' | 'clipboardHistory' | 'charPanel' | 'docList' | 'terminal' | 'git' | 'ai' | null;

export type GitFileStatusType = 'modified' | 'added' | 'deleted' | 'untracked' | 'unmerged';

export type SplitViewMode = 'none' | 'horizontal' | 'vertical';

export type FindReplaceMode = 'find' | 'replace' | 'findInFiles' | 'mark';

export type CursorStyle = 'line' | 'block' | 'underline';

export type CursorBlinking = 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';

export type RenderWhitespace = 'none' | 'boundary' | 'selection' | 'trailing' | 'all';

export type LineEnding = 'LF' | 'CRLF' | 'CR';

export type ThemeName = 'mac-glass' | 'dark' | 'light' | 'monokai' | 'solarized-dark' | 'solarized-light' | 'dracula' | 'custom';

export type BuiltInThemeName = 'mac-glass' | 'dark' | 'light' | 'monokai' | 'solarized-dark' | 'solarized-light' | 'dracula';

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';
