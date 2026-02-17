interface LanguageItem
{
    value: string;
    label: string;
}

const ALL_LANGUAGES: readonly LanguageItem[] = [
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

export function GetLanguages(): readonly LanguageItem[]
{
    return ALL_LANGUAGES;
}

export function GetLanguageById(value: string): LanguageItem | undefined
{
    return ALL_LANGUAGES.find(lang => lang.value === value) as LanguageItem | undefined;
}

export function GetLanguageLabel(value: string): string
{
    const lang = ALL_LANGUAGES.find(l => l.value === value);
    if (lang)
        return lang.label;
    return value;
}
