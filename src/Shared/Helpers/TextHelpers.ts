export function countWords(text: string): number
{
    return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countLines(text: string): number
{
    if (!text)
        return 0;
    return text.split(/\r\n|\r|\n/).length;
}

export function formatFileSize(bytes: number): string
{
    if (1024 > bytes)
        return `${bytes} B`;
    if (1024 * 1024 > bytes)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getLanguageDisplayName(langId: string): string
{
    const names: Record<string, string> =
    {
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
