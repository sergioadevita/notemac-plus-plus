export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHover: string;
  bgActive: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentHover: string;
  accentText: string;
  danger: string;
  warning: string;
  success: string;
  tabBg: string;
  tabActiveBg: string;
  tabActiveText: string;
  tabBorder: string;
  menuBg: string;
  menuHover: string;
  menuText: string;
  statusBarBg: string;
  statusBarText: string;
  sidebarBg: string;
  sidebarText: string;
  scrollbarBg: string;
  scrollbarThumb: string;
  editorBg: string;
  editorMonacoTheme: string;
  findBg: string;
}

const themes: Record<string, ThemeColors> = {
  'mac-glass': {
    bg: '#1a1520',
    bgSecondary: '#221c2a',
    bgTertiary: '#2a2233',
    bgHover: '#342c3e',
    bgActive: '#3d2e1e',
    text: '#e8e4ec',
    textSecondary: '#9e96a8',
    textMuted: '#6b6474',
    border: '#362e40',
    accent: '#e8863a',
    accentHover: '#f5a04e',
    accentText: '#ffffff',
    danger: '#e85555',
    warning: '#f5c242',
    success: '#6cd97e',
    tabBg: '#221c2a',
    tabActiveBg: '#1a1520',
    tabActiveText: '#f5a04e',
    tabBorder: '#362e40',
    menuBg: '#221c2a',
    menuHover: '#3d2e1e',
    menuText: '#e8e4ec',
    statusBarBg: '#e8863a',
    statusBarText: '#ffffff',
    sidebarBg: '#221c2a',
    sidebarText: '#c8c0d0',
    scrollbarBg: 'transparent',
    scrollbarThumb: '#3e3648',
    editorBg: '#1a1520',
    editorMonacoTheme: 'mac-glass',
    findBg: '#221c2a',
  },
  dark: {
    bg: '#1e1e1e',
    bgSecondary: '#252526',
    bgTertiary: '#2d2d30',
    bgHover: '#3e3e42',
    bgActive: '#094771',
    text: '#cccccc',
    textSecondary: '#969696',
    textMuted: '#6e6e6e',
    border: '#3e3e42',
    accent: '#007acc',
    accentHover: '#1a8ad4',
    accentText: '#ffffff',
    danger: '#f44747',
    warning: '#cca700',
    success: '#89d185',
    tabBg: '#2d2d30',
    tabActiveBg: '#1e1e1e',
    tabActiveText: '#ffffff',
    tabBorder: '#3e3e42',
    menuBg: '#2d2d30',
    menuHover: '#094771',
    menuText: '#cccccc',
    statusBarBg: '#007acc',
    statusBarText: '#ffffff',
    sidebarBg: '#252526',
    sidebarText: '#cccccc',
    scrollbarBg: 'transparent',
    scrollbarThumb: '#424242',
    editorBg: '#1e1e1e',
    editorMonacoTheme: 'vs-dark',
    findBg: '#252526',
  },
  light: {
    bg: '#ffffff',
    bgSecondary: '#f3f3f3',
    bgTertiary: '#ececec',
    bgHover: '#e0e0e0',
    bgActive: '#cce5ff',
    text: '#333333',
    textSecondary: '#666666',
    textMuted: '#999999',
    border: '#d4d4d4',
    accent: '#0078d4',
    accentHover: '#106ebe',
    accentText: '#ffffff',
    danger: '#d32f2f',
    warning: '#f9a825',
    success: '#2e7d32',
    tabBg: '#ececec',
    tabActiveBg: '#ffffff',
    tabActiveText: '#333333',
    tabBorder: '#d4d4d4',
    menuBg: '#f3f3f3',
    menuHover: '#0078d4',
    menuText: '#333333',
    statusBarBg: '#0078d4',
    statusBarText: '#ffffff',
    sidebarBg: '#f3f3f3',
    sidebarText: '#333333',
    scrollbarBg: 'transparent',
    scrollbarThumb: '#c4c4c4',
    editorBg: '#ffffff',
    editorMonacoTheme: 'vs',
    findBg: '#f3f3f3',
  },
  monokai: {
    bg: '#272822',
    bgSecondary: '#1e1f1c',
    bgTertiary: '#3e3d32',
    bgHover: '#49483e',
    bgActive: '#49483e',
    text: '#f8f8f2',
    textSecondary: '#a6a69c',
    textMuted: '#75715e',
    border: '#3e3d32',
    accent: '#a6e22e',
    accentHover: '#b8f340',
    accentText: '#272822',
    danger: '#f92672',
    warning: '#e6db74',
    success: '#a6e22e',
    tabBg: '#1e1f1c',
    tabActiveBg: '#272822',
    tabActiveText: '#f8f8f2',
    tabBorder: '#3e3d32',
    menuBg: '#1e1f1c',
    menuHover: '#49483e',
    menuText: '#f8f8f2',
    statusBarBg: '#49483e',
    statusBarText: '#f8f8f2',
    sidebarBg: '#1e1f1c',
    sidebarText: '#f8f8f2',
    scrollbarBg: 'transparent',
    scrollbarThumb: '#49483e',
    editorBg: '#272822',
    editorMonacoTheme: 'monokai',
    findBg: '#1e1f1c',
  },
  dracula: {
    bg: '#282a36',
    bgSecondary: '#21222c',
    bgTertiary: '#343746',
    bgHover: '#44475a',
    bgActive: '#44475a',
    text: '#f8f8f2',
    textSecondary: '#bd93f9',
    textMuted: '#6272a4',
    border: '#44475a',
    accent: '#bd93f9',
    accentHover: '#caa9fa',
    accentText: '#282a36',
    danger: '#ff5555',
    warning: '#f1fa8c',
    success: '#50fa7b',
    tabBg: '#21222c',
    tabActiveBg: '#282a36',
    tabActiveText: '#f8f8f2',
    tabBorder: '#44475a',
    menuBg: '#21222c',
    menuHover: '#44475a',
    menuText: '#f8f8f2',
    statusBarBg: '#44475a',
    statusBarText: '#f8f8f2',
    sidebarBg: '#21222c',
    sidebarText: '#f8f8f2',
    scrollbarBg: 'transparent',
    scrollbarThumb: '#44475a',
    editorBg: '#282a36',
    editorMonacoTheme: 'dracula',
    findBg: '#21222c',
  },
  'solarized-dark': {
    bg: '#002b36',
    bgSecondary: '#073642',
    bgTertiary: '#073642',
    bgHover: '#0a4858',
    bgActive: '#0a4858',
    text: '#839496',
    textSecondary: '#657b83',
    textMuted: '#586e75',
    border: '#073642',
    accent: '#268bd2',
    accentHover: '#2aa7f5',
    accentText: '#fdf6e3',
    danger: '#dc322f',
    warning: '#b58900',
    success: '#859900',
    tabBg: '#073642',
    tabActiveBg: '#002b36',
    tabActiveText: '#93a1a1',
    tabBorder: '#073642',
    menuBg: '#073642',
    menuHover: '#0a4858',
    menuText: '#839496',
    statusBarBg: '#073642',
    statusBarText: '#839496',
    sidebarBg: '#073642',
    sidebarText: '#839496',
    scrollbarBg: 'transparent',
    scrollbarThumb: '#0a4858',
    editorBg: '#002b36',
    editorMonacoTheme: 'solarized-dark',
    findBg: '#073642',
  },
  'solarized-light': {
    bg: '#fdf6e3',
    bgSecondary: '#eee8d5',
    bgTertiary: '#eee8d5',
    bgHover: '#e4ddc8',
    bgActive: '#e4ddc8',
    text: '#657b83',
    textSecondary: '#839496',
    textMuted: '#93a1a1',
    border: '#eee8d5',
    accent: '#268bd2',
    accentHover: '#2aa7f5',
    accentText: '#fdf6e3',
    danger: '#dc322f',
    warning: '#b58900',
    success: '#859900',
    tabBg: '#eee8d5',
    tabActiveBg: '#fdf6e3',
    tabActiveText: '#586e75',
    tabBorder: '#eee8d5',
    menuBg: '#eee8d5',
    menuHover: '#e4ddc8',
    menuText: '#657b83',
    statusBarBg: '#eee8d5',
    statusBarText: '#657b83',
    sidebarBg: '#eee8d5',
    sidebarText: '#657b83',
    scrollbarBg: 'transparent',
    scrollbarThumb: '#d3cbb7',
    editorBg: '#fdf6e3',
    editorMonacoTheme: 'solarized-light',
    findBg: '#eee8d5',
  },
};

export function getTheme(name: string): ThemeColors {
  return themes[name] || themes['mac-glass'];
}

export function getThemeNames(): string[] {
  return Object.keys(themes);
}

export function getCustomTheme(baseName: string, overrides: Partial<ThemeColors>): ThemeColors {
  const base = themes[baseName] || themes['mac-glass'];
  return { ...base, ...overrides, editorMonacoTheme: base.editorMonacoTheme };
}

/** Returns human-readable labels for each theme color property, grouped by category. */
export const themeColorGroups: { label: string; keys: { key: keyof ThemeColors; label: string }[] }[] = [
  {
    label: 'Backgrounds',
    keys: [
      { key: 'bg', label: 'Primary Background' },
      { key: 'bgSecondary', label: 'Secondary Background' },
      { key: 'bgTertiary', label: 'Tertiary Background' },
      { key: 'bgHover', label: 'Hover Background' },
      { key: 'bgActive', label: 'Active Background' },
      { key: 'editorBg', label: 'Editor Background' },
      { key: 'findBg', label: 'Find Panel Background' },
    ],
  },
  {
    label: 'Text',
    keys: [
      { key: 'text', label: 'Primary Text' },
      { key: 'textSecondary', label: 'Secondary Text' },
      { key: 'textMuted', label: 'Muted Text' },
    ],
  },
  {
    label: 'Accent & Status',
    keys: [
      { key: 'accent', label: 'Accent Color' },
      { key: 'accentHover', label: 'Accent Hover' },
      { key: 'accentText', label: 'Accent Text' },
      { key: 'danger', label: 'Danger / Error' },
      { key: 'warning', label: 'Warning' },
      { key: 'success', label: 'Success' },
    ],
  },
  {
    label: 'Borders & Scrollbar',
    keys: [
      { key: 'border', label: 'Border' },
      { key: 'scrollbarBg', label: 'Scrollbar Track' },
      { key: 'scrollbarThumb', label: 'Scrollbar Thumb' },
    ],
  },
  {
    label: 'Tabs',
    keys: [
      { key: 'tabBg', label: 'Tab Background' },
      { key: 'tabActiveBg', label: 'Active Tab Background' },
      { key: 'tabActiveText', label: 'Active Tab Text' },
      { key: 'tabBorder', label: 'Tab Border' },
    ],
  },
  {
    label: 'Menu',
    keys: [
      { key: 'menuBg', label: 'Menu Background' },
      { key: 'menuHover', label: 'Menu Hover' },
      { key: 'menuText', label: 'Menu Text' },
    ],
  },
  {
    label: 'Status Bar',
    keys: [
      { key: 'statusBarBg', label: 'Status Bar Background' },
      { key: 'statusBarText', label: 'Status Bar Text' },
    ],
  },
  {
    label: 'Sidebar',
    keys: [
      { key: 'sidebarBg', label: 'Sidebar Background' },
      { key: 'sidebarText', label: 'Sidebar Text' },
    ],
  },
];

export function defineMonacoThemes(monaco: typeof import('monaco-editor')) {
  monaco.editor.defineTheme('mac-glass', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6b6474', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'e8863a' },
      { token: 'string', foreground: '6cd97e' },
      { token: 'number', foreground: 'f5c242' },
      { token: 'type', foreground: 'f5a04e', fontStyle: 'italic' },
      { token: 'function', foreground: 'c8a0ff' },
      { token: 'variable', foreground: 'e8e4ec' },
      { token: 'operator', foreground: 'e8863a' },
      { token: 'delimiter', foreground: '9e96a8' },
    ],
    colors: {
      'editor.background': '#1a1520',
      'editor.foreground': '#e8e4ec',
      'editor.lineHighlightBackground': '#221c2a',
      'editor.selectionBackground': '#3d2e1e',
      'editorCursor.foreground': '#e8863a',
      'editor.selectionHighlightBackground': '#362e4040',
      'editorLineNumber.foreground': '#6b6474',
      'editorLineNumber.activeForeground': '#e8863a',
      'editorIndentGuide.background': '#2a2233',
      'editorIndentGuide.activeBackground': '#362e40',
    },
  });

  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'type', foreground: '66d9ef', fontStyle: 'italic' },
      { token: 'function', foreground: 'a6e22e' },
      { token: 'variable', foreground: 'f8f8f2' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#3e3d32',
      'editor.selectionBackground': '#49483e',
      'editorCursor.foreground': '#f8f8f0',
    },
  });

  monaco.editor.defineTheme('dracula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
      { token: 'function', foreground: '50fa7b' },
      { token: 'variable', foreground: 'f8f8f2' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#44475a',
      'editor.selectionBackground': '#44475a',
      'editorCursor.foreground': '#f8f8f2',
    },
  });

  monaco.editor.defineTheme('solarized-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '586e75', fontStyle: 'italic' },
      { token: 'keyword', foreground: '859900' },
      { token: 'string', foreground: '2aa198' },
      { token: 'number', foreground: 'd33682' },
      { token: 'type', foreground: 'b58900' },
      { token: 'function', foreground: '268bd2' },
    ],
    colors: {
      'editor.background': '#002b36',
      'editor.foreground': '#839496',
      'editor.lineHighlightBackground': '#073642',
      'editor.selectionBackground': '#073642',
    },
  });

  monaco.editor.defineTheme('solarized-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '93a1a1', fontStyle: 'italic' },
      { token: 'keyword', foreground: '859900' },
      { token: 'string', foreground: '2aa198' },
      { token: 'number', foreground: 'd33682' },
      { token: 'type', foreground: 'b58900' },
      { token: 'function', foreground: '268bd2' },
    ],
    colors: {
      'editor.background': '#fdf6e3',
      'editor.foreground': '#657b83',
      'editor.lineHighlightBackground': '#eee8d5',
      'editor.selectionBackground': '#eee8d5',
    },
  });
}
