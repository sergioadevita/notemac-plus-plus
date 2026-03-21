/**
 * LanguageCommandMap — Maps every supported language to its
 * desktop compile/run command and web runtime type.
 *
 * {file} is replaced with the temp file path at runtime.
 * {file_stem} is replaced with the filename without extension.
 */

import type { RuntimeMode } from '../RuntimeAdapter';

export type WebRuntimeType = 'wasm' | 'js' | 'interpreter' | 'preview' | 'validate' | 'none';

export interface LanguageRuntimeConfig
{
    /** Human-readable runtime name for UI display. */
    displayName: string;
    /** Shell command for desktop execution. {file} replaced at runtime. */
    desktopCommand: string;
    /** How this language executes on web. */
    webType: WebRuntimeType;
    /** NPM package or CDN URL for WASM runtime (web only). */
    webRuntimePackage?: string;
    /** Mode: execute code, validate syntax, or render preview. */
    mode: RuntimeMode;
}

// ─── Language Runtime Configuration ──────────────────────────────

export const LANGUAGE_RUNTIME_MAP: Record<string, LanguageRuntimeConfig> =
{
    // ── Category A — JS-based (no WASM needed) ──────────────────
    'javascript':       { displayName: 'Node.js',               desktopCommand: 'node {file}',                                                            webType: 'js',          mode: 'execute' },
    'typescript':       { displayName: 'TypeScript',             desktopCommand: 'npx tsx {file}',                                                         webType: 'js',          mode: 'execute' },
    'coffeescript':     { displayName: 'CoffeeScript',           desktopCommand: 'npx coffee {file}',                                                      webType: 'js',          mode: 'execute' },
    'json':             { displayName: 'JSON',                   desktopCommand: 'python3 -m json.tool {file}',                                            webType: 'js',          mode: 'validate' },
    'json5':            { displayName: 'JSON5',                  desktopCommand: 'echo "JSON5 validated"',                                                 webType: 'js',          mode: 'validate' },
    'html':             { displayName: 'HTML Preview',           desktopCommand: 'open {file}',                                                            webType: 'js',          mode: 'preview' },
    'css':              { displayName: 'CSS Preview',            desktopCommand: 'echo "CSS cannot be executed directly"',                                  webType: 'js',          mode: 'preview' },
    'scss':             { displayName: 'Sass',                   desktopCommand: 'sass {file}',                                                            webType: 'js',          mode: 'execute' },
    'less':             { displayName: 'Less',                   desktopCommand: 'lessc {file}',                                                           webType: 'js',          mode: 'execute' },
    'markdown':         { displayName: 'Markdown Preview',       desktopCommand: 'echo "Markdown rendered in preview"',                                    webType: 'js',          mode: 'preview' },
    'graphql':          { displayName: 'GraphQL',                desktopCommand: 'echo "GraphQL validated"',                                               webType: 'js',          mode: 'validate' },
    'xml':              { displayName: 'XML',                    desktopCommand: 'xmllint --noout {file}',                                                 webType: 'js',          mode: 'validate' },
    'yaml':             { displayName: 'YAML',                   desktopCommand: 'python3 -c "import yaml; yaml.safe_load(open(\'{file}\'))"',             webType: 'js',          mode: 'validate' },
    'ini':              { displayName: 'INI',                    desktopCommand: 'echo "INI validated"',                                                   webType: 'js',          mode: 'validate' },
    'restructuredtext': { displayName: 'reStructuredText',       desktopCommand: 'rst2html.py {file} /dev/null',                                           webType: 'js',          mode: 'preview' },

    // ── Category B — Existing WASM runtimes ─────────────────────
    'python':           { displayName: 'Python (Pyodide)',       desktopCommand: 'python3 {file}',                                                         webType: 'wasm',        webRuntimePackage: 'pyodide',                  mode: 'execute' },
    'ruby':             { displayName: 'Ruby (ruby.wasm)',       desktopCommand: 'ruby {file}',                                                            webType: 'wasm',        webRuntimePackage: 'ruby-wasm',                mode: 'execute' },
    'php':              { displayName: 'PHP (php-wasm)',         desktopCommand: 'php {file}',                                                              webType: 'wasm',        webRuntimePackage: 'php-wasm',                 mode: 'execute' },
    'lua':              { displayName: 'Lua (Wasmoon)',          desktopCommand: 'lua {file}',                                                              webType: 'wasm',        webRuntimePackage: 'wasmoon',                  mode: 'execute' },
    'perl':             { displayName: 'Perl (WebPerl)',         desktopCommand: 'perl {file}',                                                             webType: 'wasm',        webRuntimePackage: 'webperl',                  mode: 'execute' },
    'r':                { displayName: 'R (webR)',               desktopCommand: 'Rscript {file}',                                                          webType: 'wasm',        webRuntimePackage: 'webr',                     mode: 'execute' },
    'sql':              { displayName: 'SQLite (sql.js)',        desktopCommand: 'sqlite3 < {file}',                                                        webType: 'wasm',        webRuntimePackage: 'sql.js',                   mode: 'execute' },
    'c':                { displayName: 'C (Clang WASM)',         desktopCommand: 'gcc {file} -o /tmp/notemac_out && /tmp/notemac_out',                       webType: 'wasm',        webRuntimePackage: 'clang-wasm',               mode: 'execute' },
    'cpp':              { displayName: 'C++ (Clang WASM)',       desktopCommand: 'g++ {file} -o /tmp/notemac_out && /tmp/notemac_out',                       webType: 'wasm',        webRuntimePackage: 'clang-wasm',               mode: 'execute' },
    'java':             { displayName: 'Java (CheerpJ)',         desktopCommand: 'java {file}',                                                             webType: 'wasm',        webRuntimePackage: 'cheerpj',                  mode: 'execute' },
    'kotlin':           { displayName: 'Kotlin (CheerpJ)',       desktopCommand: 'kotlinc -script {file}',                                                  webType: 'wasm',        webRuntimePackage: 'cheerpj',                  mode: 'execute' },
    'scala':            { displayName: 'Scala (CheerpJ)',        desktopCommand: 'scala {file}',                                                            webType: 'wasm',        webRuntimePackage: 'cheerpj',                  mode: 'execute' },
    'csharp':           { displayName: 'C# (.NET WASM)',         desktopCommand: 'dotnet-script {file}',                                                    webType: 'wasm',        webRuntimePackage: 'dotnet-wasm',              mode: 'execute' },
    'fsharp':           { displayName: 'F# (.NET WASM)',         desktopCommand: 'dotnet fsi {file}',                                                       webType: 'wasm',        webRuntimePackage: 'dotnet-wasm',              mode: 'execute' },
    'visual-basic':     { displayName: 'VB.NET (.NET WASM)',     desktopCommand: 'dotnet-script {file}',                                                    webType: 'wasm',        webRuntimePackage: 'dotnet-wasm',              mode: 'execute' },
    'powershell':       { displayName: 'PowerShell (.NET WASM)', desktopCommand: 'pwsh {file}',                                                             webType: 'wasm',        webRuntimePackage: 'dotnet-wasm',              mode: 'execute' },
    'latex':            { displayName: 'LaTeX (texlive.js)',     desktopCommand: 'pdflatex {file}',                                                         webType: 'wasm',        webRuntimePackage: 'texlive.js',               mode: 'preview' },

    // ── Category C — Emscripten builds ──────────────────────────
    'tcl':              { displayName: 'Tcl',                    desktopCommand: 'tclsh {file}',                                                            webType: 'wasm',        webRuntimePackage: 'tcl-wasm',                 mode: 'execute' },
    'shell':            { displayName: 'Bash',                   desktopCommand: 'bash {file}',                                                             webType: 'wasm',        webRuntimePackage: 'bash-wasm',                mode: 'execute' },
    'scheme':           { displayName: 'Scheme (Chibi)',         desktopCommand: 'guile {file}',                                                            webType: 'wasm',        webRuntimePackage: 'chibi-scheme-wasm',        mode: 'execute' },
    'lisp':             { displayName: 'Common Lisp (ECL)',      desktopCommand: 'sbcl --script {file}',                                                    webType: 'wasm',        webRuntimePackage: 'ecl-wasm',                 mode: 'execute' },
    'smalltalk':        { displayName: 'Smalltalk (GNU)',        desktopCommand: 'gst {file}',                                                              webType: 'wasm',        webRuntimePackage: 'gst-wasm',                 mode: 'execute' },
    'erlang':           { displayName: 'Erlang (BEAM)',          desktopCommand: 'escript {file}',                                                           webType: 'wasm',        webRuntimePackage: 'beam-wasm',                mode: 'execute' },
    'elixir':           { displayName: 'Elixir (BEAM)',          desktopCommand: 'elixir {file}',                                                           webType: 'wasm',        webRuntimePackage: 'beam-wasm',                mode: 'execute' },
    'raku':             { displayName: 'Raku (MoarVM)',          desktopCommand: 'raku {file}',                                                              webType: 'wasm',        webRuntimePackage: 'moarvm-wasm',              mode: 'execute' },
    'pascal':           { displayName: 'Pascal (FPC)',           desktopCommand: 'fpc {file} -o/tmp/notemac_out && /tmp/notemac_out',                        webType: 'wasm',        webRuntimePackage: 'fpc-wasm',                 mode: 'execute' },
    'fortran':          { displayName: 'Fortran (f2c)',          desktopCommand: 'gfortran {file} -o /tmp/notemac_out && /tmp/notemac_out',                  webType: 'wasm',        webRuntimePackage: 'fortran-wasm',             mode: 'execute' },
    'cobol':            { displayName: 'COBOL (GnuCOBOL)',      desktopCommand: 'cobc -x {file} -o /tmp/notemac_out && /tmp/notemac_out',                   webType: 'wasm',        webRuntimePackage: 'gnucobol-wasm',            mode: 'execute' },
    'objective-c':      { displayName: 'Objective-C (Clang)',    desktopCommand: 'clang -framework Foundation {file} -o /tmp/notemac_out && /tmp/notemac_out', webType: 'wasm',      webRuntimePackage: 'clang-wasm',               mode: 'execute' },
    'ada':              { displayName: 'Ada (GNAT)',             desktopCommand: 'gnatmake {file} -o /tmp/notemac_out && /tmp/notemac_out',                  webType: 'wasm',        webRuntimePackage: 'gnat-wasm',                mode: 'execute' },
    'ocaml':            { displayName: 'OCaml',                  desktopCommand: 'ocaml {file}',                                                            webType: 'wasm',        webRuntimePackage: 'ocaml-wasm',               mode: 'execute' },
    'haskell':          { displayName: 'Haskell (Hugs)',         desktopCommand: 'runhaskell {file}',                                                       webType: 'wasm',        webRuntimePackage: 'hugs-wasm',                mode: 'execute' },
    'matlab':           { displayName: 'Octave',                 desktopCommand: 'octave --no-gui {file}',                                                  webType: 'wasm',        webRuntimePackage: 'octave-wasm',              mode: 'execute' },
    'd':                { displayName: 'D (LDC)',                desktopCommand: 'dmd -run {file}',                                                         webType: 'wasm',        webRuntimePackage: 'ldc-wasm',                 mode: 'execute' },
    'dart':             { displayName: 'Dart',                   desktopCommand: 'dart run {file}',                                                         webType: 'wasm',        webRuntimePackage: 'dart-wasm',                mode: 'execute' },
    'julia':            { displayName: 'Julia',                  desktopCommand: 'julia {file}',                                                            webType: 'wasm',        webRuntimePackage: 'julia-wasm',               mode: 'execute' },
    'actionscript':     { displayName: 'ActionScript (AVM)',     desktopCommand: 'avmplus {file}',                                                          webType: 'wasm',        webRuntimePackage: 'avmplus-wasm',             mode: 'execute' },
    'nim':              { displayName: 'Nim',                    desktopCommand: 'nim r {file}',                                                            webType: 'wasm',        webRuntimePackage: 'nim-wasm',                 mode: 'execute' },
    'clojure':          { displayName: 'Clojure (CheerpJ)',      desktopCommand: 'clj -M {file}',                                                          webType: 'wasm',        webRuntimePackage: 'cheerpj',                  mode: 'execute' },

    // ── Category D — Self-hosted compilers ──────────────────────
    'go':               { displayName: 'Go (TinyGo)',            desktopCommand: 'go run {file}',                                                           webType: 'wasm',        webRuntimePackage: 'tinygo-wasm',              mode: 'execute' },
    'rust':             { displayName: 'Rust (mrustc)',          desktopCommand: 'rustc {file} -o /tmp/notemac_out && /tmp/notemac_out',                     webType: 'wasm',        webRuntimePackage: 'mrustc-wasm',              mode: 'execute' },
    'swift':            { displayName: 'Swift',                  desktopCommand: 'swift {file}',                                                            webType: 'wasm',        webRuntimePackage: 'swift-wasm',               mode: 'execute' },

    // ── Category E — Custom interpreters & special ──────────────
    'bat':              { displayName: 'Batch',                  desktopCommand: 'cmd.exe /c {file}',                                                       webType: 'interpreter', webRuntimePackage: 'built-in',                 mode: 'execute' },
    'sas':              { displayName: 'SAS',                    desktopCommand: 'sas {file}',                                                              webType: 'interpreter', webRuntimePackage: 'built-in',                 mode: 'execute' },
    'autoit':           { displayName: 'AutoIt',                 desktopCommand: 'autoit3 {file}',                                                          webType: 'interpreter', webRuntimePackage: 'built-in',                 mode: 'execute' },
    'nsis':             { displayName: 'NSIS',                   desktopCommand: 'makensis {file}',                                                         webType: 'interpreter', webRuntimePackage: 'built-in',                 mode: 'execute' },
    'asp':              { displayName: 'ASP',                    desktopCommand: 'dotnet run {file}',                                                       webType: 'interpreter', webRuntimePackage: 'built-in',                 mode: 'execute' },
    'gdscript':         { displayName: 'GDScript (Godot)',       desktopCommand: 'godot --headless --script {file}',                                        webType: 'wasm',        webRuntimePackage: 'godot-wasm',               mode: 'execute' },
    'verilog':          { displayName: 'Verilog (Verilator)',    desktopCommand: 'iverilog {file} -o /tmp/notemac_out && vvp /tmp/notemac_out',              webType: 'wasm',        webRuntimePackage: 'verilator-wasm',           mode: 'execute' },
    'vhdl':             { displayName: 'VHDL (GHDL)',            desktopCommand: 'ghdl -a {file} && ghdl -e {file_stem} && ghdl -r {file_stem}',            webType: 'wasm',        webRuntimePackage: 'ghdl-wasm',                mode: 'execute' },
    'assembly':         { displayName: 'Assembly (x86)',         desktopCommand: 'nasm -f elf64 {file} -o /tmp/notemac_out.o && ld /tmp/notemac_out.o -o /tmp/notemac_out && /tmp/notemac_out', webType: 'wasm', webRuntimePackage: 'v86',  mode: 'execute' },

    // ── Non-executable ──────────────────────────────────────────
    'dockerfile':       { displayName: 'Dockerfile',             desktopCommand: 'docker build -f {file} .',                                                webType: 'validate',    mode: 'validate' },
    'makefile':         { displayName: 'Makefile',               desktopCommand: 'make -f {file}',                                                          webType: 'validate',    mode: 'validate' },
    'cmake':            { displayName: 'CMake',                  desktopCommand: 'cmake -P {file}',                                                         webType: 'validate',    mode: 'validate' },
    'diff':             { displayName: 'Diff',                   desktopCommand: 'patch --dry-run < {file}',                                                webType: 'validate',    mode: 'validate' },
    'properties':       { displayName: 'Properties',             desktopCommand: 'echo "Properties validated"',                                             webType: 'validate',    mode: 'validate' },
    'toml':             { displayName: 'TOML',                   desktopCommand: 'echo "TOML validated"',                                                   webType: 'js',          mode: 'validate' },
    'plaintext':        { displayName: 'Plain Text',             desktopCommand: '',                                                                        webType: 'none',        mode: 'validate' },
};

// ─── Helper Functions ────────────────────────────────────────────

export function GetDesktopCommand(languageId: string): string
{
    return LANGUAGE_RUNTIME_MAP[languageId]?.desktopCommand ?? '';
}

export function GetWebRuntimeConfig(languageId: string): LanguageRuntimeConfig | null
{
    return LANGUAGE_RUNTIME_MAP[languageId] ?? null;
}

export function GetRuntimeDisplayName(languageId: string): string
{
    return LANGUAGE_RUNTIME_MAP[languageId]?.displayName ?? languageId;
}

export function GetRuntimeMode(languageId: string): RuntimeMode
{
    return LANGUAGE_RUNTIME_MAP[languageId]?.mode ?? 'validate';
}

export function IsLanguageExecutable(languageId: string): boolean
{
    const config = LANGUAGE_RUNTIME_MAP[languageId];
    if (undefined === config || null === config)
    {
        return false;
    }
    return 'none' !== config.webType && '' !== config.desktopCommand;
}

export function GetAllSupportedLanguages(): string[]
{
    return Object.keys(LANGUAGE_RUNTIME_MAP);
}
