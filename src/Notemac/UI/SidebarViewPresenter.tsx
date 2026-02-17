import React, { useState, useCallback } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import type { FileTreeNode } from "../Commons/Types";
import { detectLanguage, detectLineEnding } from '../../Shared/Helpers/FileHelpers';

interface SidebarProps {
  theme: ThemeColors;
}

export function Sidebar({ theme }: SidebarProps) {
  const {
    sidebarPanel,
    sidebarWidth,
    fileTree,
    workspacePath,
    tabs,
    activeTabId,
    setSidebarPanel,
    toggleTreeNode,
    addTab,
    setActiveTab,
    setFileTree,
    setWorkspacePath,
  } = useNotemacStore();

  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(sidebarWidth);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(150, Math.min(500, startWidth + e.clientX - startX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width]);

  const handleOpenFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        const tree = await buildWebFileTree(dirHandle);
        setFileTree(tree);
        setWorkspacePath(dirHandle.name);
      } catch {
        // User cancelled
      }
    }
  };

  const handleFileClick = async (node: FileTreeNode) => {
    if (node.isDirectory) {
      toggleTreeNode(node.path);
      return;
    }

    // Check if already open
    const existing = tabs.find(t => t.path === node.path || t.name === node.name);
    if (existing) {
      setActiveTab(existing.id);
      return;
    }

    // Open file
    if (window.electronAPI) {
      const content = await window.electronAPI.readFile(node.path);
      addTab({
        name: node.name,
        path: node.path,
        content,
        language: detectLanguage(node.name),
        lineEnding: detectLineEnding(content),
      });
    } else if ((node as any).handle) {
      try {
        const file = await (node as any).handle.getFile();
        const content = await file.text();
        addTab({
          name: node.name,
          path: node.path,
          content,
          language: detectLanguage(node.name),
          lineEnding: detectLineEnding(content),
        });
      } catch {
        // Permission denied
      }
    }
  };

  const TreeNode = ({ node, depth = 0 }: { node: FileTreeNode; depth?: number }) => {
    const [hovered, setHovered] = useState(false);
    const isOpen = node.isExpanded;
    const isActive = tabs.find(t => t.id === activeTabId)?.path === node.path;

    return (
      <div>
        <div
          onClick={() => handleFileClick(node)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            paddingLeft: 8 + depth * 16,
            cursor: 'pointer',
            backgroundColor: isActive ? theme.bgActive : hovered ? theme.bgHover : 'transparent',
            color: isActive ? theme.text : theme.sidebarText,
            fontSize: 13,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span style={{ fontSize: 10, width: 16, textAlign: 'center', flexShrink: 0 }}>
            {node.isDirectory ? (isOpen ? '\u25bc' : '\u25b6') : ''}
          </span>
          <span style={{ marginRight: 4, flexShrink: 0 }}>
            {node.isDirectory ? (isOpen ? '\ud83d\udcc2' : '\ud83d\udcc1') : getFileIcon(node.name)}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {node.name}
          </span>
        </div>
        {node.isDirectory && isOpen && node.children?.map((child, i) => (
          <TreeNode key={child.path || i} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  };

  const FunctionListPanel = () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return null;

    const functions = extractFunctions(activeTab.content, activeTab.language);

    return (
      <div style={{ padding: 8 }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Functions
        </div>
        {functions.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: 12, padding: 8 }}>No functions found</div>
        ) : (
          functions.map((fn, i) => (
            <div
              key={i}
              onClick={() => {
                document.dispatchEvent(new CustomEvent('notemac-goto-line', { detail: { line: fn.line } }));
              }}
              style={{
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 13,
                color: theme.sidebarText,
                borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = theme.bgHover}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
            >
              <span style={{ color: theme.accent, marginRight: 4 }}>f</span>
              {fn.name}
              <span style={{ color: theme.textMuted, fontSize: 11, marginLeft: 8 }}>:{fn.line}</span>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexShrink: 0 }}>
      {/* Panel icons */}
      <div style={{
        width: 40,
        backgroundColor: theme.bgSecondary,
        borderRight: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 8,
        gap: 4,
      }}>
        {([
          { panel: 'explorer' as const, icon: '\ud83d\udcc1', title: 'Explorer' },
          { panel: 'search' as const, icon: '\ud83d\udd0d', title: 'Search' },
          { panel: 'functions' as const, icon: '\ud83d\udce6', title: 'Function List' },
          { panel: 'docList' as const, icon: '\ud83d\udcdd', title: 'Document List' },
          { panel: 'project' as const, icon: '\ud83d\udcc8', title: 'Project' },
          { panel: 'clipboardHistory' as const, icon: '\ud83d\udccb', title: 'Clipboard History' },
          { panel: 'charPanel' as const, icon: '\ud83d\udd24', title: 'Character Panel' },
        ] as const).map(({ panel, icon, title }) => (
          <div
            key={panel}
            title={title}
            onClick={() => setSidebarPanel(sidebarPanel === panel ? null : panel)}
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: 6,
              fontSize: 16,
              backgroundColor: sidebarPanel === panel ? theme.bgHover : 'transparent',
              borderLeft: sidebarPanel === panel ? `2px solid ${theme.accent}` : '2px solid transparent',
            }}
          >
            {icon}
          </div>
        ))}
      </div>

      {/* Panel content */}
      <div style={{
        width: width - 40,
        backgroundColor: theme.sidebarBg,
        borderRight: `1px solid ${theme.border}`,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Panel header */}
        <div style={{
          padding: '8px 12px',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: theme.textSecondary,
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {sidebarPanel === 'explorer' ? 'Explorer' : sidebarPanel === 'search' ? 'Search' : sidebarPanel === 'functions' ? 'Functions' : sidebarPanel === 'docList' ? 'Document List' : sidebarPanel === 'project' ? 'Project' : sidebarPanel === 'clipboardHistory' ? 'Clipboard History' : sidebarPanel === 'charPanel' ? 'Character Panel' : ''}
        </div>

        {/* Panel body */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {sidebarPanel === 'explorer' && (
            <>
              {fileTree.length > 0 ? (
                <div style={{ paddingTop: 4 }}>
                  {workspacePath && (
                    <div style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: theme.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span>{'\ud83d\udcc2'}</span>
                      {typeof workspacePath === 'string' ? workspacePath.split('/').pop() || workspacePath : workspacePath}
                    </div>
                  )}
                  {fileTree.map((node, i) => (
                    <TreeNode key={node.path || i} node={node} />
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                  gap: 12,
                }}>
                  <div style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>
                    No folder opened
                  </div>
                  <button
                    onClick={handleOpenFolder}
                    style={{
                      backgroundColor: theme.accent,
                      color: theme.accentText,
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Open Folder
                  </button>
                </div>
              )}
            </>
          )}

          {sidebarPanel === 'search' && (
            <div style={{ padding: 12 }}>
              <SearchPanel theme={theme} />
            </div>
          )}

          {sidebarPanel === 'functions' && <FunctionListPanel />}

          {sidebarPanel === 'docList' && (
            <DocListPanel theme={theme} />
          )}

          {sidebarPanel === 'project' && (
            <div style={{ padding: 16, color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>
              {workspacePath ? (
                <div>
                  <div style={{ fontWeight: 600, color: theme.text, marginBottom: 8 }}>Project: {typeof workspacePath === 'string' ? workspacePath.split('/').pop() : workspacePath}</div>
                  <div>{fileTree.length} items</div>
                </div>
              ) : 'No project opened. Open a folder to use the project panel.'}
            </div>
          )}

          {sidebarPanel === 'clipboardHistory' && (
            <ClipboardHistoryPanel theme={theme} />
          )}

          {sidebarPanel === 'charPanel' && (
            <CharacterPanel theme={theme} />
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        className={`resizer ${isResizing ? 'active' : ''}`}
        onMouseDown={handleMouseDown}
        style={{ backgroundColor: isResizing ? theme.accent : theme.border }}
      />
    </div>
  );
}

function DocListPanel({ theme }: { theme: ThemeColors }) {
  const { tabs, activeTabId, setActiveTab } = useNotemacStore();
  return (
    <div style={{ padding: 4 }}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 8px',
            cursor: 'pointer',
            borderRadius: 4,
            fontSize: 13,
            color: tab.id === activeTabId ? theme.text : theme.sidebarText,
            backgroundColor: tab.id === activeTabId ? theme.bgActive : 'transparent',
          }}
        >
          <span style={{ fontSize: 10, color: tab.isModified ? theme.accent : 'transparent' }}>{'\u25cf'}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tab.name}</span>
          {tab.isPinned && <span style={{ fontSize: 10 }}>{'\ud83d\udccc'}</span>}
          {tab.isReadOnly && <span style={{ fontSize: 10 }}>{'\ud83d\udd12'}</span>}
        </div>
      ))}
    </div>
  );
}

function ClipboardHistoryPanel({ theme }: { theme: ThemeColors }) {
  const { clipboardHistory } = useNotemacStore();
  return (
    <div style={{ padding: 8 }}>
      <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
        Clipboard History
      </div>
      {clipboardHistory.length === 0 ? (
        <div style={{ color: theme.textMuted, fontSize: 12, padding: 8 }}>No clipboard entries yet</div>
      ) : (
        clipboardHistory.map((entry, i) => (
          <div
            key={i}
            onClick={() => navigator.clipboard.writeText(entry.text)}
            style={{
              padding: '6px 8px',
              cursor: 'pointer',
              fontSize: 12,
              color: theme.sidebarText,
              borderRadius: 4,
              borderBottom: `1px solid ${theme.border}`,
              marginBottom: 2,
            }}
            title="Click to copy"
          >
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
              {entry.text.slice(0, 100)}
            </div>
            <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>
              {new Date(entry.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function CharacterPanel({ theme }: { theme: ThemeColors }) {
  const { tabs, activeTabId } = useNotemacStore();
  const activeTab = tabs.find(t => t.id === activeTabId);
  const [charCode, setCharCode] = useState(65);

  const charGroups = [
    { label: 'Common Symbols', chars: '\u00a9\u00ae\u2122\u00b0\u00b1\u00d7\u00f7\u2190\u2191\u2192\u2193\u2194\u2195\u2022\u2026\u221e\u2248\u2260\u2264\u2265' },
    { label: 'Currency', chars: '\u0024\u20ac\u00a3\u00a5\u20a3\u20b9\u20a9\u20bd\u20ab\u20ba' },
    { label: 'Greek', chars: '\u03b1\u03b2\u03b3\u03b4\u03b5\u03b6\u03b7\u03b8\u03b9\u03ba\u03bb\u03bc\u03bd\u03be\u03bf\u03c0\u03c1\u03c3\u03c4\u03c5\u03c6\u03c7\u03c8\u03c9' },
    { label: 'Math', chars: '\u2200\u2202\u2203\u2205\u2207\u2208\u2209\u220b\u221a\u221e\u2227\u2228\u2229\u222a\u222b\u2234\u223c\u2245\u2248\u2260\u2261\u2264\u2265\u2282\u2283\u2286\u2287' },
    { label: 'Box Drawing', chars: '\u2500\u2502\u250c\u2510\u2514\u2518\u251c\u2524\u252c\u2534\u253c\u2550\u2551\u2552\u2553\u2554\u2555\u2556\u2557\u2558\u2559\u255a\u255b\u255c\u255d\u255e\u255f\u2560\u2561\u2562\u2563\u2564\u2565\u2566\u2567\u2568\u2569\u256a\u256b\u256c' },
  ];

  const handleInsertChar = (char: string) => {
    const editorAction = (window as any).__editorAction;
    if (editorAction) editorAction('insert-text', char);
  };

  return (
    <div style={{ padding: 8 }}>
      <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
        Character Panel
      </div>
      {activeTab && (
        <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8, padding: '4px 0', borderBottom: `1px solid ${theme.border}` }}>
          Cursor pos: Ln {activeTab.cursorLine}, Col {activeTab.cursorColumn}
        </div>
      )}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <input
          type="number"
          value={charCode}
          onChange={(e) => setCharCode(parseInt(e.target.value) || 0)}
          style={{ width: 60, height: 24, fontSize: 12, backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 3, padding: '0 4px' }}
        />
        <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 3, fontFamily: 'monospace', fontSize: 14, color: theme.accent }}>
          {String.fromCharCode(charCode)}
        </div>
        <button
          onClick={() => handleInsertChar(String.fromCharCode(charCode))}
          style={{ height: 24, fontSize: 11, backgroundColor: theme.accent, color: theme.accentText, border: 'none', borderRadius: 3, padding: '0 8px', cursor: 'pointer' }}
        >
          Insert
        </button>
      </div>
      {charGroups.map((group, gi) => (
        <div key={gi} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>{group.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {group.chars.split('').map((ch, ci) => (
              <div
                key={ci}
                onClick={() => handleInsertChar(ch)}
                title={`U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`}
                style={{
                  width: 24, height: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontFamily: 'monospace',
                  backgroundColor: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 2,
                  cursor: 'pointer', color: theme.text,
                }}
              >
                {ch}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchPanel({ theme }: { theme: ThemeColors }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ file: string; line: number; text: string }[]>([]);

  const handleSearch = () => {
    // Search through all open tabs
    const tabs = useNotemacStore.getState().tabs;
    const found: typeof results = [];

    for (const tab of tabs) {
      const lines = tab.content.split('\n');
      lines.forEach((line, i) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
          found.push({ file: tab.name, line: i + 1, text: line.trim() });
        }
      });
    }

    setResults(found);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          placeholder="Search in files..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{
            flex: 1,
            height: 28,
            backgroundColor: theme.bg,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            padding: '0 8px',
            fontSize: 13,
          }}
        />
      </div>
      {results.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>
            {results.length} results
          </div>
          {results.map((r, i) => (
            <div
              key={i}
              style={{
                padding: '4px 8px',
                fontSize: 12,
                color: theme.sidebarText,
                cursor: 'pointer',
                borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = theme.bgHover}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
            >
              <div style={{ color: theme.accent, fontSize: 11 }}>{r.file}:{r.line}</div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    js: '\ud83d\udfe8', jsx: '\ud83d\udfe8', ts: '\ud83d\udfe6', tsx: '\ud83d\udfe6',
    py: '\ud83d\udfe2', rb: '\ud83d\udd34', go: '\ud83d\udfe6', rs: '\ud83d\udfe0',
    html: '\ud83d\udfe0', css: '\ud83d\udfe3', json: '\ud83d\udfe1',
    md: '\u2b1c', txt: '\ud83d\udccb', svg: '\ud83d\uddbc\ufe0f',
  };
  return iconMap[ext || ''] || '\ud83d\udcc4';
}

function extractFunctions(content: string, language: string): { name: string; line: number }[] {
  const functions: { name: string; line: number }[] = [];
  const lines = content.split('\n');

  const patterns: Record<string, RegExp[]> = {
    javascript: [/function\s+(\w+)/, /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*=>/,  /(\w+)\s*\([^)]*\)\s*\{/],
    typescript: [/function\s+(\w+)/, /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|(\w+))\s*=>/, /(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/],
    python: [/def\s+(\w+)/, /class\s+(\w+)/],
    ruby: [/def\s+(\w+)/, /class\s+(\w+)/],
    go: [/func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)/],
    rust: [/fn\s+(\w+)/, /struct\s+(\w+)/, /impl\s+(\w+)/],
    java: [/(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\(/],
    c: [/(?:void|int|char|float|double|long|short|unsigned|\w+)\s+(\w+)\s*\(/],
    cpp: [/(?:void|int|char|float|double|long|short|unsigned|\w+)\s+(\w+)\s*\(/],
    csharp: [/(?:public|private|protected|internal|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\(/],
    swift: [/func\s+(\w+)/, /class\s+(\w+)/, /struct\s+(\w+)/],
    php: [/function\s+(\w+)/, /class\s+(\w+)/],
  };

  const langPatterns = patterns[language] || patterns.javascript || [];

  lines.forEach((line, i) => {
    for (const pattern of langPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        // Filter out common keywords
        const name = match[1];
        if (!['if', 'else', 'for', 'while', 'switch', 'catch', 'return', 'new'].includes(name)) {
          functions.push({ name, line: i + 1 });
        }
        break;
      }
    }
  });

  return functions;
}

async function buildWebFileTree(dirHandle: any, depth = 0): Promise<FileTreeNode[]> {
  if (depth > 4) return [];

  const entries: FileTreeNode[] = [];

  for await (const entry of dirHandle.values()) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    const node: FileTreeNode & { handle?: any } = {
      name: entry.name,
      path: entry.name,
      isDirectory: entry.kind === 'directory',
      isExpanded: false,
      handle: entry,
    };

    if (entry.kind === 'directory') {
      node.children = await buildWebFileTree(entry, depth + 1);
    }

    entries.push(node);
  }

  return entries.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}
