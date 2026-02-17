const languageMap: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.java': 'java',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.php': 'php',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
  '.json': 'json',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.sql': 'sql',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.ps1': 'powershell',
  '.r': 'r',
  '.lua': 'lua',
  '.pl': 'perl',
  '.pm': 'perl',
  '.dart': 'dart',
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.erl': 'erlang',
  '.hs': 'haskell',
  '.scala': 'scala',
  '.clj': 'clojure',
  '.coffee': 'coffeescript',
  '.bat': 'bat',
  '.cmd': 'bat',
  '.ini': 'ini',
  '.toml': 'ini',
  '.dockerfile': 'dockerfile',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.vue': 'html',
  '.svelte': 'html',
  '.log': 'plaintext',
  '.txt': 'plaintext',
  '.env': 'plaintext',
  '.gitignore': 'plaintext',
  '.makefile': 'plaintext',
};

export function detectLanguage(filename: string): string {
  if (!filename) return 'plaintext';
  const lower = filename.toLowerCase();

  if (lower === 'dockerfile') return 'dockerfile';
  if (lower === 'makefile') return 'makefile';
  if (lower === 'cmakelists.txt') return 'cmake';

  const lastDot = lower.lastIndexOf('.');
  if (lastDot === -1) return 'plaintext';

  const ext = lower.substring(lastDot);
  return languageMap[ext] || 'plaintext';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getLanguageDisplayName(langId: string): string {
  const names: Record<string, string> = {
    plaintext: 'Plain Text',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    ruby: 'Ruby',
    go: 'Go',
    rust: 'Rust',
    c: 'C',
    cpp: 'C++',
    csharp: 'C#',
    java: 'Java',
    swift: 'Swift',
    kotlin: 'Kotlin',
    php: 'PHP',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    less: 'LESS',
    json: 'JSON',
    xml: 'XML',
    yaml: 'YAML',
    markdown: 'Markdown',
    sql: 'SQL',
    shell: 'Shell',
    powershell: 'PowerShell',
    r: 'R',
    lua: 'Lua',
    perl: 'Perl',
    dart: 'Dart',
    elixir: 'Elixir',
    erlang: 'Erlang',
    haskell: 'Haskell',
    scala: 'Scala',
    clojure: 'Clojure',
    coffeescript: 'CoffeeScript',
    bat: 'Batch',
    ini: 'INI',
    dockerfile: 'Dockerfile',
    graphql: 'GraphQL',
  };
  return names[langId] || langId;
}

export function detectLineEnding(content: string): 'LF' | 'CRLF' | 'CR' {
  const crlf = (content.match(/\r\n/g) || []).length;
  const lf = (content.match(/(?<!\r)\n/g) || []).length;
  const cr = (content.match(/\r(?!\n)/g) || []).length;

  if (crlf >= lf && crlf >= cr) return 'CRLF';
  if (cr > lf) return 'CR';
  return 'LF';
}

export function convertLineEnding(content: string, to: 'LF' | 'CRLF' | 'CR'): string {
  const normalized = content.replace(/\r\n|\r|\n/g, '\n');
  switch (to) {
    case 'CRLF': return normalized.replace(/\n/g, '\r\n');
    case 'CR': return normalized.replace(/\n/g, '\r');
    default: return normalized;
  }
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countLines(text: string): number {
  if (!text) return 0;
  return text.split(/\r\n|\r|\n/).length;
}
