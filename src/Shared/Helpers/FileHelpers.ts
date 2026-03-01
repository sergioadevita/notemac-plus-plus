import { LineEnding } from "../../Notemac/Commons/Enums";
import type { CustomLanguageDefinition } from "../../Notemac/Commons/Types";

const languageMap: Record<string, string> =
{
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

export function detectLanguage(
    filename: string,
    customLanguages?: CustomLanguageDefinition[],
    overrides?: Record<string, string>,
): string
{
    if (!filename)
        return 'plaintext';

    const lower = filename.toLowerCase();

    // Check file association overrides first
    if (overrides)
    {
        const lastDotOvr = lower.lastIndexOf('.');
        if (-1 !== lastDotOvr)
        {
            const extOvr = lower.substring(lastDotOvr);
            if (overrides[extOvr])
                return overrides[extOvr];
        }
    }

    // Check custom language extensions
    if (customLanguages && 0 < customLanguages.length)
    {
        const lastDotCust = lower.lastIndexOf('.');
        if (-1 !== lastDotCust)
        {
            const extCust = lower.substring(lastDotCust);
            for (const lang of customLanguages)
            {
                if (lang.extensions.some(e => e.toLowerCase() === extCust))
                    return lang.id;
            }
        }
    }

    if ('dockerfile' === lower)
        return 'dockerfile';
    if ('makefile' === lower)
        return 'makefile';
    if ('cmakelists.txt' === lower)
        return 'cmake';

    const lastDot = lower.lastIndexOf('.');
    if (-1 === lastDot)
        return 'plaintext';

    const ext = lower.substring(lastDot);
    return languageMap[ext] || 'plaintext';
}

export function detectLineEnding(content: string): LineEnding
{
    const crlf = (content.match(/\r\n/g) || []).length;
    const lf = (content.match(/(?<!\r)\n/g) || []).length;
    const cr = (content.match(/\r(?!\n)/g) || []).length;

    if (crlf >= lf && crlf >= cr)
        return 'CRLF';
    if (cr > lf)
        return 'CR';
    return 'LF';
}

export function convertLineEnding(content: string, to: LineEnding): string
{
    const normalized = content.replace(/\r\n|\r|\n/g, '\n');
    switch (to)
    {
        case 'CRLF': return normalized.replace(/\n/g, '\r\n');
        case 'CR': return normalized.replace(/\n/g, '\r');
        default: return normalized;
    }
}
