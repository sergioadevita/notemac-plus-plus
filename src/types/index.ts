export interface FileTab {
  id: string;
  name: string;
  path: string | null;
  content: string;
  originalContent: string;
  language: string;
  encoding: string;
  lineEnding: 'LF' | 'CRLF' | 'CR';
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

export type TabColor = 'none' | 'color1' | 'color2' | 'color3' | 'color4' | 'color5';

export interface MarkStyle {
  line: number;
  column: number;
  length: number;
  style: 1 | 2 | 3 | 4 | 5;
}

export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
  isExpanded?: boolean;
  handle?: FileSystemFileHandle;
}

export interface MacroAction {
  type: 'type' | 'delete' | 'move' | 'select' | 'command';
  data: any;
  timestamp: number;
}

export interface SavedMacro {
  id: string;
  name: string;
  actions: MacroAction[];
  shortcut?: string;
}

export interface SearchOptions {
  query: string;
  replaceText: string;
  isRegex: boolean;
  isCaseSensitive: boolean;
  isWholeWord: boolean;
  searchInSelection: boolean;
  wrapAround: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'monokai' | 'solarized-dark' | 'solarized-light' | 'dracula';
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
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  cursorStyle: 'line' | 'block' | 'underline';
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
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

export type SidebarPanel = 'explorer' | 'search' | 'functions' | 'project' | 'clipboardHistory' | 'charPanel' | 'docList' | null;

export interface FindResult {
  line: number;
  column: number;
  length: number;
  text: string;
  filePath?: string;
}

export interface ClipboardEntry {
  text: string;
  timestamp: number;
}

export interface SessionData {
  tabs: { path: string | null; name: string; language: string; cursorLine: number; cursorColumn: number; scrollTop: number; content?: string }[];
  activeTabIndex: number;
  sidebarPanel: SidebarPanel;
}

// All supported encodings matching Notepad++
export const ENCODINGS = [
  { group: 'Unicode', items: [
    { value: 'utf-8', label: 'UTF-8' },
    { value: 'utf-8-bom', label: 'UTF-8 BOM' },
    { value: 'utf-16le', label: 'UTF-16 LE' },
    { value: 'utf-16be', label: 'UTF-16 BE' },
  ]},
  { group: 'Western European', items: [
    { value: 'windows-1252', label: 'Windows-1252 (ANSI)' },
    { value: 'iso-8859-1', label: 'ISO 8859-1 (Latin I)' },
    { value: 'iso-8859-15', label: 'ISO 8859-15 (Latin 9)' },
    { value: 'cp850', label: 'OEM 850 (DOS Latin)' },
  ]},
  { group: 'Central European', items: [
    { value: 'windows-1250', label: 'Windows-1250' },
    { value: 'iso-8859-2', label: 'ISO 8859-2 (Latin II)' },
  ]},
  { group: 'Cyrillic', items: [
    { value: 'windows-1251', label: 'Windows-1251' },
    { value: 'iso-8859-5', label: 'ISO 8859-5' },
    { value: 'koi8-r', label: 'KOI8-R' },
    { value: 'koi8-u', label: 'KOI8-U' },
    { value: 'cp866', label: 'OEM 866 (DOS Cyrillic)' },
  ]},
  { group: 'Greek', items: [
    { value: 'windows-1253', label: 'Windows-1253' },
    { value: 'iso-8859-7', label: 'ISO 8859-7' },
  ]},
  { group: 'Turkish', items: [
    { value: 'windows-1254', label: 'Windows-1254' },
    { value: 'iso-8859-9', label: 'ISO 8859-9' },
  ]},
  { group: 'Hebrew', items: [
    { value: 'windows-1255', label: 'Windows-1255' },
    { value: 'iso-8859-8', label: 'ISO 8859-8' },
  ]},
  { group: 'Arabic', items: [
    { value: 'windows-1256', label: 'Windows-1256' },
    { value: 'iso-8859-6', label: 'ISO 8859-6' },
  ]},
  { group: 'Baltic', items: [
    { value: 'windows-1257', label: 'Windows-1257' },
    { value: 'iso-8859-13', label: 'ISO 8859-13' },
  ]},
  { group: 'Vietnamese', items: [
    { value: 'windows-1258', label: 'Windows-1258' },
  ]},
  { group: 'East Asian', items: [
    { value: 'big5', label: 'Big5 (Traditional Chinese)' },
    { value: 'gb2312', label: 'GB2312 (Simplified Chinese)' },
    { value: 'shift_jis', label: 'Shift JIS (Japanese)' },
    { value: 'euc-kr', label: 'EUC-KR (Korean)' },
    { value: 'iso-2022-jp', label: 'ISO-2022-JP' },
  ]},
  { group: 'Thai', items: [
    { value: 'tis-620', label: 'TIS-620 (Thai)' },
  ]},
  { group: 'DOS', items: [
    { value: 'cp437', label: 'OEM 437 (US)' },
    { value: 'cp737', label: 'OEM 737 (Greek)' },
    { value: 'cp775', label: 'OEM 775 (Baltic)' },
    { value: 'cp852', label: 'OEM 852 (Latin II)' },
    { value: 'cp855', label: 'OEM 855 (Cyrillic)' },
    { value: 'cp857', label: 'OEM 857 (Turkish)' },
    { value: 'cp858', label: 'OEM 858 (Latin I + Euro)' },
    { value: 'cp860', label: 'OEM 860 (Portuguese)' },
    { value: 'cp861', label: 'OEM 861 (Icelandic)' },
    { value: 'cp862', label: 'OEM 862 (Hebrew)' },
    { value: 'cp863', label: 'OEM 863 (French Canadian)' },
    { value: 'cp865', label: 'OEM 865 (Nordic)' },
    { value: 'cp869', label: 'OEM 869 (Greek)' },
  ]},
] as const;

// All supported languages matching Notepad++
export const ALL_LANGUAGES = [
  { value: 'plaintext', label: 'Normal Text' },
  { value: 'actionscript', label: 'ActionScript' },
  { value: 'ada', label: 'Ada' },
  { value: 'asp', label: 'ASP' },
  { value: 'asm', label: 'Assembly' },
  { value: 'autoit', label: 'AutoIt' },
  { value: 'bat', label: 'Batch' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'caml', label: 'OCaml' },
  { value: 'cmake', label: 'CMake' },
  { value: 'cobol', label: 'COBOL' },
  { value: 'coffeescript', label: 'CoffeeScript' },
  { value: 'css', label: 'CSS' },
  { value: 'd', label: 'D' },
  { value: 'dart', label: 'Dart' },
  { value: 'diff', label: 'Diff' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'elixir', label: 'Elixir' },
  { value: 'erlang', label: 'Erlang' },
  { value: 'fortran', label: 'Fortran' },
  { value: 'fsharp', label: 'F#' },
  { value: 'gdscript', label: 'GDScript' },
  { value: 'go', label: 'Go' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'haskell', label: 'Haskell' },
  { value: 'html', label: 'HTML' },
  { value: 'ini', label: 'INI' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'json5', label: 'JSON5' },
  { value: 'julia', label: 'Julia' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'latex', label: 'LaTeX' },
  { value: 'less', label: 'LESS' },
  { value: 'lisp', label: 'Lisp' },
  { value: 'lua', label: 'Lua' },
  { value: 'makefile', label: 'Makefile' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'matlab', label: 'MATLAB' },
  { value: 'nim', label: 'Nim' },
  { value: 'nsis', label: 'NSIS' },
  { value: 'objective-c', label: 'Objective-C' },
  { value: 'pascal', label: 'Pascal' },
  { value: 'perl', label: 'Perl' },
  { value: 'php', label: 'PHP' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'properties', label: 'Properties' },
  { value: 'python', label: 'Python' },
  { value: 'r', label: 'R' },
  { value: 'raku', label: 'Raku' },
  { value: 'restructuredtext', label: 'reStructuredText' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'rust', label: 'Rust' },
  { value: 'sas', label: 'SAS' },
  { value: 'scala', label: 'Scala' },
  { value: 'scheme', label: 'Scheme' },
  { value: 'scss', label: 'SCSS' },
  { value: 'shell', label: 'Shell/Bash' },
  { value: 'smalltalk', label: 'Smalltalk' },
  { value: 'sql', label: 'SQL' },
  { value: 'swift', label: 'Swift' },
  { value: 'tcl', label: 'Tcl' },
  { value: 'toml', label: 'TOML' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'vb', label: 'Visual Basic' },
  { value: 'verilog', label: 'Verilog' },
  { value: 'vhdl', label: 'VHDL' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
] as const;

export const MARK_COLORS: Record<number, string> = {
  1: '#ff4444',
  2: '#44ff44',
  3: '#4488ff',
  4: '#ff44ff',
  5: '#ffaa00',
};

export const TAB_COLORS: Record<TabColor, string> = {
  none: 'transparent',
  color1: '#ff4444',
  color2: '#44bb44',
  color3: '#4488ff',
  color4: '#ff8800',
  color5: '#cc44cc',
};
