import React, { useState, useRef, useEffect } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { GetEncodings } from "../Configs/EncodingConfig";
import { GetLanguages } from "../Configs/LanguageConfig";
import { UI_ZINDEX_MODAL } from "../Commons/Constants";

interface MenuBarProps {
  theme: ThemeColors;
  onAction: (action: string, value?: boolean | string | number) => void;
  isElectron?: boolean;
}

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: string;
  value?: boolean | string | number;
  type?: 'separator' | 'checkbox';
  checked?: boolean;
  children?: MenuItem[];
}

export function MenuBar({ theme, onAction, isElectron }: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [focusedMenuItem, setFocusedMenuItem] = useState<string | null>(null);
  const [focusedSubmenuIndex, setFocusedSubmenuIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const { settings, isRecordingMacro } = useNotemacStore();

  const isMac = navigator.platform.includes('Mac');
  const mod = isMac ? '\u2318' : 'Ctrl+';
  const shift = isMac ? '\u21e7' : 'Shift+';
  const alt = isMac ? '\u2325' : 'Alt+';

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setFocusedMenuItem(null);
        setFocusedSubmenuIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMenuBarKeyDown = (e: React.KeyboardEvent, menuNames: string[]) => {
    const currentMenuIndex = focusedMenuItem ? menuNames.indexOf(focusedMenuItem) : -1;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        e.preventDefault();
        const step = e.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = currentMenuIndex === -1 ? 0 : (currentMenuIndex + step + menuNames.length) % menuNames.length;
        const nextMenu = menuNames[nextIndex];
        setFocusedMenuItem(nextMenu);
        setOpenMenu(nextMenu);
        setFocusedSubmenuIndex(-1);
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!openMenu && focusedMenuItem) {
          setOpenMenu(focusedMenuItem);
          setFocusedSubmenuIndex(0);
        } else if (openMenu) {
          setFocusedSubmenuIndex(focusedSubmenuIndex + 1);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (openMenu && focusedSubmenuIndex > 0) {
          setFocusedSubmenuIndex(focusedSubmenuIndex - 1);
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (openMenu && focusedSubmenuIndex >= 0) {
          const items = menus[openMenu as keyof typeof menus];
          const nonSeparatorItems = items.filter(item => item.type !== 'separator' && !item.label.startsWith('\u2500'));
          if (focusedSubmenuIndex < nonSeparatorItems.length) {
            const item = nonSeparatorItems[focusedSubmenuIndex];
            handleItemClick(item);
          }
        } else if (focusedMenuItem) {
          setOpenMenu(focusedMenuItem);
          setFocusedSubmenuIndex(0);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setOpenMenu(null);
        setFocusedMenuItem(null);
        setFocusedSubmenuIndex(-1);
        break;

      default:
        break;
    }
  };

  // Build encoding submenu items
  const encodingItems: MenuItem[] = [];
  GetEncodings().forEach((group) => {
    encodingItems.push({ type: 'separator', label: `--- ${group.group} ---` });
    group.items.forEach((enc) => {
      encodingItems.push({ label: enc.label, action: 'encoding', value: enc.value });
    });
  });

  // Build language items
  const languageItems: MenuItem[] = GetLanguages().map(lang => ({
    label: lang.label,
    action: 'language',
    value: lang.value,
  }));

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New', shortcut: `${mod}N`, action: 'new' },
      { type: 'separator', label: '' },
      { label: 'Open...', shortcut: `${mod}O`, action: 'open' },
      { label: 'Open Folder as Workspace', action: 'open-folder' },
      { label: 'Reload from Disk', action: 'reload-from-disk' },
      { type: 'separator', label: '' },
      { label: 'Save', shortcut: `${mod}S`, action: 'save' },
      { label: 'Save As...', shortcut: `${shift}${mod}S`, action: 'save-as' },
      { label: 'Save Copy As...', action: 'save-copy-as' },
      { label: 'Save All', action: 'save-all' },
      { type: 'separator', label: '' },
      { label: 'Rename...', action: 'rename-file' },
      { label: 'Delete from Disk', action: 'delete-file' },
      { type: 'separator', label: '' },
      { label: 'Restore Last Closed Tab', shortcut: `${shift}${mod}T`, action: 'restore-last-closed' },
      { type: 'separator', label: '' },
      { label: 'Close Tab', shortcut: `${mod}W`, action: 'close-tab' },
      { label: 'Close All', action: 'close-all' },
      { label: 'Close Others', action: 'close-others' },
      { label: 'Close Tabs to Left', action: 'close-tabs-to-left' },
      { label: 'Close Tabs to Right', action: 'close-tabs-to-right' },
      { label: 'Close Unchanged', action: 'close-unchanged' },
      { label: 'Close All but Pinned', action: 'close-all-but-pinned' },
      { type: 'separator', label: '' },
      { label: 'Pin Tab', action: 'pin-tab' },
      { type: 'separator', label: '' },
      { label: 'Load Session...', action: 'load-session' },
      { label: 'Save Session...', action: 'save-session' },
      { type: 'separator', label: '' },
      { label: 'Print...', shortcut: `${mod}P`, action: 'print' },
    ],
    Edit: [
      { label: 'Undo', shortcut: `${mod}Z`, action: 'undo' },
      { label: 'Redo', shortcut: `${shift}${mod}Z`, action: 'redo' },
      { type: 'separator', label: '' },
      { label: 'Cut', shortcut: `${mod}X`, action: 'cut' },
      { label: 'Copy', shortcut: `${mod}C`, action: 'copy' },
      { label: 'Paste', shortcut: `${mod}V`, action: 'paste' },
      { label: 'Select All', shortcut: `${mod}A`, action: 'select-all' },
      { type: 'separator', label: '' },
      { label: 'Duplicate Line', shortcut: `${mod}D`, action: 'duplicate-line' },
      { label: 'Delete Line', shortcut: `${shift}${mod}K`, action: 'delete-line' },
      { label: 'Transpose Line', shortcut: `${alt}T`, action: 'transpose-line' },
      { label: 'Move Line Up', shortcut: `${alt}\u2191`, action: 'move-line-up' },
      { label: 'Move Line Down', shortcut: `${alt}\u2193`, action: 'move-line-down' },
      { label: 'Split Lines', action: 'split-lines' },
      { label: 'Join Lines', action: 'join-lines' },
      { type: 'separator', label: '' },
      { label: 'Toggle Comment', shortcut: `${mod}/`, action: 'toggle-comment' },
      { label: 'Block Comment', shortcut: `${shift}${alt}A`, action: 'block-comment' },
      { type: 'separator', label: '' },
      { label: 'UPPERCASE', shortcut: `${shift}${mod}U`, action: 'uppercase' },
      { label: 'lowercase', shortcut: `${mod}U`, action: 'lowercase' },
      { label: 'Proper Case', action: 'proper-case' },
      { label: 'Sentence Case', action: 'sentence-case' },
      { label: 'Invert Case', action: 'invert-case' },
      { label: 'Random Case', action: 'random-case' },
      { type: 'separator', label: '' },
      { label: 'Insert Date/Time', action: 'insert-datetime' },
      { type: 'separator', label: '' },
      { label: 'Column Editor...', shortcut: `${alt}C`, action: 'column-editor' },
      { label: 'Clipboard History', shortcut: `${mod}${shift}V`, action: 'clipboard-history' },
      { label: 'Character Panel', action: 'char-panel' },
      { type: 'separator', label: '' },
      { label: 'Copy File Path', action: 'copy-file-path' },
      { label: 'Copy File Name', action: 'copy-file-name' },
      { label: 'Copy File Dir', action: 'copy-file-dir' },
      { type: 'separator', label: '' },
      { label: 'Compare Files...', action: 'compare-files' },
      { label: 'Snippet Manager...', action: 'snippet-manager' },
      { type: 'separator', label: '' },
      { label: 'Set Read-Only', action: 'toggle-readonly' },
    ],
    Search: [
      { label: 'Find...', shortcut: `${mod}F`, action: 'find' },
      { label: 'Replace...', shortcut: `${mod}H`, action: 'replace' },
      { label: 'Find in Files...', shortcut: `${shift}${mod}F`, action: 'find-in-files' },
      { label: 'Incremental Search', shortcut: `${mod}${alt}I`, action: 'incremental-search' },
      { type: 'separator', label: '' },
      { label: 'Mark...', action: 'mark' },
      { label: 'Mark Style 1', action: 'mark-style', value: 1 },
      { label: 'Mark Style 2', action: 'mark-style', value: 2 },
      { label: 'Mark Style 3', action: 'mark-style', value: 3 },
      { label: 'Mark Style 4', action: 'mark-style', value: 4 },
      { label: 'Mark Style 5', action: 'mark-style', value: 5 },
      { label: 'Clear All Marks', action: 'clear-marks' },
      { type: 'separator', label: '' },
      { label: 'Cut Marked Lines', action: 'cut-marked-lines' },
      { label: 'Copy Marked Lines', action: 'copy-marked-lines' },
      { label: 'Paste to (Replace) Marked Lines', action: 'paste-marked-lines' },
      { label: 'Delete Marked Lines', action: 'delete-marked-lines' },
      { label: 'Delete Unmarked Lines', action: 'delete-unmarked-lines' },
      { label: 'Inverse Marks', action: 'inverse-marks' },
      { type: 'separator', label: '' },
      { label: 'Go to Line...', shortcut: `${mod}G`, action: 'goto-line' },
      { label: 'Go to Matching Bracket', shortcut: `${shift}${mod}\\`, action: 'goto-bracket' },
      { label: 'Select to Matching Bracket', action: 'select-to-bracket' },
      { type: 'separator', label: '' },
      { label: 'Toggle Bookmark', shortcut: `${mod}F2`, action: 'toggle-bookmark' },
      { label: 'Next Bookmark', shortcut: 'F2', action: 'next-bookmark' },
      { label: 'Previous Bookmark', shortcut: `${shift}F2`, action: 'prev-bookmark' },
      { label: 'Clear All Bookmarks', action: 'clear-bookmarks' },
      { type: 'separator', label: '' },
      { label: 'Find Characters in Range...', action: 'find-char-in-range' },
    ],
    View: [
      { label: 'Word Wrap', type: 'checkbox', checked: settings.wordWrap, action: 'word-wrap' },
      { type: 'separator', label: '' },
      { label: 'Show Whitespace', type: 'checkbox', checked: settings.showWhitespace, action: 'show-whitespace' },
      { label: 'Show EOL', type: 'checkbox', checked: settings.showEOL, action: 'show-eol' },
      { label: 'Show Non-Printable Characters', type: 'checkbox', checked: settings.showNonPrintable, action: 'show-non-printable' },
      { label: 'Show Wrap Symbol', type: 'checkbox', checked: settings.showWrapSymbol, action: 'show-wrap-symbol' },
      { label: 'Show Indent Guides', type: 'checkbox', checked: settings.showIndentGuides, action: 'indent-guide' },
      { label: 'Show Line Numbers', type: 'checkbox', checked: settings.showLineNumbers, action: 'show-line-numbers' },
      { label: 'Show Minimap', type: 'checkbox', checked: settings.showMinimap, action: 'toggle-minimap' },
      { type: 'separator', label: '' },
      { label: 'Fold All', action: 'fold-all' },
      { label: 'Unfold All', action: 'unfold-all' },
      { label: 'Fold Level 1', action: 'fold-level', value: 1 },
      { label: 'Fold Level 2', action: 'fold-level', value: 2 },
      { label: 'Fold Level 3', action: 'fold-level', value: 3 },
      { label: 'Fold Level 4', action: 'fold-level', value: 4 },
      { label: 'Fold Level 5', action: 'fold-level', value: 5 },
      { label: 'Fold Level 6', action: 'fold-level', value: 6 },
      { label: 'Fold Level 7', action: 'fold-level', value: 7 },
      { label: 'Fold Level 8', action: 'fold-level', value: 8 },
      { type: 'separator', label: '' },
      { label: 'Zoom In', shortcut: `${mod}+`, action: 'zoom-in' },
      { label: 'Zoom Out', shortcut: `${mod}-`, action: 'zoom-out' },
      { label: 'Reset Zoom', shortcut: `${mod}0`, action: 'zoom-reset' },
      { type: 'separator', label: '' },
      { label: 'Toggle Sidebar', shortcut: `${mod}B`, action: 'toggle-sidebar' },
      { label: 'Document List', action: 'show-doc-list' },
      { label: 'Function List', action: 'show-function-list' },
      { label: 'Project Panel', action: 'show-project-panel' },
      { type: 'separator', label: '' },
      { label: 'Distraction-Free Mode', type: 'checkbox', checked: settings.distractionFreeMode, action: 'distraction-free' },
      { label: 'Always on Top', type: 'checkbox', checked: settings.alwaysOnTop, action: 'always-on-top' },
      { type: 'separator', label: '' },
      { label: 'Synchronize Vertical Scrolling', type: 'checkbox', checked: settings.syncScrollVertical, action: 'sync-scroll-v' },
      { label: 'Synchronize Horizontal Scrolling', type: 'checkbox', checked: settings.syncScrollHorizontal, action: 'sync-scroll-h' },
      { type: 'separator', label: '' },
      { label: 'Split Right', action: 'split-right' },
      { label: 'Split Down', action: 'split-down' },
      { label: 'Close Split', action: 'close-split' },
      { type: 'separator', label: '' },
      { label: 'Summary...', action: 'show-summary' },
      { label: 'Monitoring (tail -f)', action: 'toggle-monitoring' },
      { type: 'separator', label: '' },
      { label: 'Command Palette...', shortcut: `${shift}${mod}P`, action: 'command-palette' },
      { label: 'Quick Open...', shortcut: `${mod}P`, action: 'quick-open' },
      { label: 'Toggle Terminal', shortcut: 'Ctrl+`', action: 'toggle-terminal' },
    ],
    Encoding: [
      ...GetEncodings().flatMap(group => [
        { type: 'separator' as const, label: `\u2500 ${group.group} \u2500` },
        ...group.items.map(enc => ({ label: enc.label, action: 'encoding', value: enc.value })),
      ]),
      { type: 'separator', label: '' },
      { label: 'Line Ending: LF (Unix/Mac)', action: 'line-ending', value: 'LF' },
      { label: 'Line Ending: CRLF (Windows)', action: 'line-ending', value: 'CRLF' },
      { label: 'Line Ending: CR (Old Mac)', action: 'line-ending', value: 'CR' },
    ],
    Language: languageItems,
    'Line Ops': [
      { label: 'Sort Lines Ascending', action: 'sort-asc' },
      { label: 'Sort Lines Descending', action: 'sort-desc' },
      { label: 'Sort Lines Case Insensitive (Asc)', action: 'sort-asc-ci' },
      { label: 'Sort Lines Case Insensitive (Desc)', action: 'sort-desc-ci' },
      { label: 'Sort Lines by Length (Asc)', action: 'sort-len-asc' },
      { label: 'Sort Lines by Length (Desc)', action: 'sort-len-desc' },
      { type: 'separator', label: '' },
      { label: 'Remove Duplicate Lines', action: 'remove-duplicates' },
      { label: 'Remove Consecutive Duplicate Lines', action: 'remove-consecutive-duplicates' },
      { label: 'Remove Empty Lines', action: 'remove-empty-lines' },
      { label: 'Remove Empty Lines (Containing Blank)', action: 'remove-blank-lines' },
      { type: 'separator', label: '' },
      { label: 'Trim Trailing Spaces', action: 'trim-trailing' },
      { label: 'Trim Leading Spaces', action: 'trim-leading' },
      { label: 'Trim Leading and Trailing Spaces', action: 'trim-both' },
      { label: 'EOL to Space', action: 'eol-to-space' },
      { type: 'separator', label: '' },
      { label: 'TAB to Space', action: 'tab-to-space' },
      { label: 'Space to TAB (Leading)', action: 'space-to-tab-leading' },
      { label: 'Space to TAB (All)', action: 'space-to-tab-all' },
      { type: 'separator', label: '' },
      { label: 'Insert Blank Line Above', action: 'insert-blank-above' },
      { label: 'Insert Blank Line Below', action: 'insert-blank-below' },
      { label: 'Reverse Line Order', action: 'reverse-lines' },
    ],
    Macro: [
      { label: isRecordingMacro ? 'Stop Recording' : 'Start Recording', shortcut: `${shift}${mod}R`, action: isRecordingMacro ? 'macro-stop' : 'macro-start' },
      { label: 'Playback', shortcut: `${shift}${mod}P`, action: 'macro-playback' },
      { type: 'separator', label: '' },
      { label: 'Run Macro Multiple Times...', action: 'macro-run-multiple' },
      { label: 'Save Recorded Macro...', action: 'macro-save' },
    ],
    Git: [
      { label: 'Source Control Panel', action: 'show-git-panel' },
      { type: 'separator', label: '' },
      { label: 'Clone Repository...', action: 'clone-repository' },
      { type: 'separator', label: '' },
      { label: 'Compare with HEAD', action: 'compare-files' },
      { type: 'separator', label: '' },
      { label: 'Git Settings...', action: 'git-settings' },
    ],
    Run: [
      { label: 'Run Command...', action: 'run-command' },
      { type: 'separator', label: '' },
      { label: 'Search on Google', action: 'search-google' },
      { label: 'Search on Wikipedia', action: 'search-wikipedia' },
      { label: 'Open in Browser', action: 'open-in-browser' },
    ],
    Tools: [
      { label: 'MD5 - Generate', action: 'hash-md5' },
      { label: 'MD5 - Copy to Clipboard', action: 'hash-md5-clipboard' },
      { label: 'SHA-1 - Generate', action: 'hash-sha1' },
      { label: 'SHA-1 - Copy to Clipboard', action: 'hash-sha1-clipboard' },
      { label: 'SHA-256 - Generate', action: 'hash-sha256' },
      { label: 'SHA-256 - Copy to Clipboard', action: 'hash-sha256-clipboard' },
      { label: 'SHA-512 - Generate', action: 'hash-sha512' },
      { label: 'SHA-512 - Copy to Clipboard', action: 'hash-sha512-clipboard' },
      { type: 'separator', label: '' },
      { label: 'MD5 - Generate from File', action: 'hash-md5-file' },
      { label: 'SHA-256 - Generate from File', action: 'hash-sha256-file' },
      { type: 'separator', label: '' },
      { label: 'Base64 Encode', action: 'base64-encode' },
      { label: 'Base64 Decode', action: 'base64-decode' },
      { type: 'separator', label: '' },
      { label: 'URL Encode', action: 'url-encode' },
      { label: 'URL Decode', action: 'url-decode' },
      { type: 'separator', label: '' },
      { label: 'JSON Format', action: 'json-format' },
      { label: 'JSON Minify', action: 'json-minify' },
    ],
    AI: [
      { label: 'AI Chat Panel', shortcut: 'Ctrl+Shift+A', action: 'ai-chat' },
      { type: 'separator', label: '' },
      { label: 'Explain Code', shortcut: 'Ctrl+Shift+E', action: 'ai-explain' },
      { label: 'Refactor Code', shortcut: 'Ctrl+Shift+R', action: 'ai-refactor' },
      { label: 'Generate Tests', action: 'ai-generate-tests' },
      { label: 'Generate Documentation', action: 'ai-generate-docs' },
      { label: 'Fix Error', action: 'ai-fix-error' },
      { label: 'Simplify Code', action: 'ai-simplify' },
      { type: 'separator', label: '' },
      { label: 'Toggle Inline Completions', action: 'ai-toggle-inline' },
      { type: 'separator', label: '' },
      { label: 'AI Settings...', action: 'ai-settings' },
    ],
    Settings: [
      { label: 'Preferences...', shortcut: `${mod},`, action: 'preferences' },
      { label: 'Shortcut Mapper...', action: 'shortcut-mapper' },
      { type: 'separator', label: '' },
      { label: 'About Notemac++', action: 'about' },
    ],
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.type === 'separator') return;
    if (item.label.startsWith('\u2500')) return; // group header
    if (item.type === 'checkbox') {
      onAction(item.action!, !item.checked);
    } else if (item.action) {
      onAction(item.action, item.value);
    }
    setOpenMenu(null);
  };

  return (
    <div
      ref={menuRef}
      role="menubar"
      onKeyDown={(e) => handleMenuBarKeyDown(e, Object.keys(menus))}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 30,
        backgroundColor: theme.menuBg,
        borderBottom: `1px solid ${theme.border}`,
        paddingLeft: isElectron ? 8 : 8,
        flexShrink: 0,
        outline: 'none',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
      } as React.CSSProperties}
      tabIndex={0}
    >
      {/* App icon/name */}
      <span style={{
        fontWeight: 600,
        fontSize: 13,
        marginRight: 16,
        color: theme.accent,
      }}>
        N++
      </span>

      {Object.entries(menus).map(([menuName, items]) => (
        <div
          key={menuName}
          style={{ position: 'relative' }}
        >
          <div
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={openMenu === menuName}
            tabIndex={focusedMenuItem === menuName ? 0 : -1}
            style={{
              padding: '4px 10px',
              cursor: 'pointer',
              borderRadius: 4,
              fontSize: 13,
              backgroundColor: openMenu === menuName ? theme.bgHover : focusedMenuItem === menuName ? theme.bgHover : 'transparent',
              color: openMenu === menuName ? theme.text : theme.menuText,
              outline: focusedMenuItem === menuName ? `1px solid ${theme.accent}` : 'none',
              outlineOffset: '-1px',
            }}
            onClick={() => {
              setFocusedMenuItem(menuName);
              setOpenMenu(openMenu === menuName ? null : menuName);
              setFocusedSubmenuIndex(-1);
            }}
            onMouseEnter={() => {
              setFocusedMenuItem(menuName);
              if (openMenu) setOpenMenu(menuName);
            }}
            onMouseLeave={() => setFocusedMenuItem(null)}
          >
            {menuName}
          </div>

          {openMenu === menuName && (
            <div role="menu" style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              minWidth: Math.min(280, window.innerWidth - 16),
              maxWidth: 'calc(100vw - 8px)',
              maxHeight: 'calc(100vh - 80px)',
              overflowY: 'auto',
              backgroundColor: theme.menuBg,
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              padding: '4px 0',
              zIndex: UI_ZINDEX_MODAL,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}>
              {items.map((item, i) => {
                if (item.type === 'separator') {
                  if (item.label && item.label.startsWith('\u2500')) {
                    return (
                      <div key={`sep-header-${i}`} style={{
                        padding: '4px 16px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: theme.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        cursor: 'default',
                      }}>
                        {item.label.replace(/\u2500 /g, '').replace(/ \u2500/g, '')}
                      </div>
                    );
                  }
                  return <div key={`sep-divider-${i}`} style={{ height: 1, backgroundColor: theme.border, margin: '4px 0' }} />;
                }

                const nonSeparatorItems = items.filter(it => it.type !== 'separator' && !it.label.startsWith('\u2500'));
                const itemIndex = nonSeparatorItems.findIndex(it => it.label === item.label);
                const itemKey = `${menuName}-${item.label}-${i}`;
                const isFocused = focusedSubmenuIndex === itemIndex;

                return (
                  <div
                    key={`${menuName}-${item.action || item.label}-${i}`}
                    role="menuitem"
                    tabIndex={isFocused ? 0 : -1}
                    style={{
                      padding: '5px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 24,
                      fontSize: 13,
                      backgroundColor: isFocused ? theme.bgHover : hoveredItem === itemKey ? theme.bgHover : 'transparent',
                      color: theme.menuText,
                      outline: isFocused ? `1px solid ${theme.accent}` : 'none',
                      outlineOffset: '-1px',
                    }}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => {
                      setHoveredItem(itemKey);
                      setFocusedSubmenuIndex(itemIndex);
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.type === 'checkbox' && (
                        <span style={{ width: 16, textAlign: 'center' }}>
                          {item.checked ? '\u2713' : ''}
                        </span>
                      )}
                      {item.label}
                    </span>
                    {item.shortcut && (
                      <span style={{ opacity: 0.5, fontSize: 11 }}>{item.shortcut}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Recording indicator */}
      {isRecordingMacro && (
        <div className="recording-indicator" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginLeft: 'auto',
          marginRight: 12,
          color: '#ff4444',
          fontSize: 12,
          fontWeight: 600,
        } as React.CSSProperties}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff4444', display: 'inline-block' }} />
          REC
        </div>
      )}
    </div>
  );
}
