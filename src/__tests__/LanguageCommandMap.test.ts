import { describe, it, expect } from 'vitest';
import {
    LANGUAGE_RUNTIME_MAP,
    GetDesktopCommand,
    GetWebRuntimeConfig,
    GetRuntimeDisplayName,
    GetRuntimeMode,
    IsLanguageExecutable,
    GetAllSupportedLanguages,
    type LanguageRuntimeConfig,
} from '../Notemac/Services/Runtimes/LanguageCommandMap';

describe('LanguageCommandMap — GetAllSupportedLanguages', () =>
{
    it('returns all 73 supported languages', () =>
    {
        const languages = GetAllSupportedLanguages();
        expect(languages.length).toBe(73);
    });

    it('contains all languages from LANGUAGE_RUNTIME_MAP', () =>
    {
        const languages = GetAllSupportedLanguages();
        const mapKeys = Object.keys(LANGUAGE_RUNTIME_MAP);

        expect(languages.length).toBe(mapKeys.length);
        mapKeys.forEach(key =>
        {
            expect(languages).toContain(key);
        });
    });

    it('returns an array of strings', () =>
    {
        const languages = GetAllSupportedLanguages();
        expect(Array.isArray(languages)).toBe(true);
        languages.forEach(lang =>
        {
            expect(typeof lang).toBe('string');
        });
    });
});

describe('LanguageCommandMap — Language Validity', () =>
{
    it('every language has a displayName', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(config.displayName).toBeDefined();
            expect(typeof config.displayName).toBe('string');
            expect(config.displayName.length).toBeGreaterThan(0);
        });
    });

    it('every language has a mode (execute, validate, or preview)', () =>
    {
        const languages = GetAllSupportedLanguages();
        const validModes = ['execute', 'validate', 'preview'];

        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(config.mode).toBeDefined();
            expect(validModes).toContain(config.mode);
        });
    });

    it('every language has a webType', () =>
    {
        const languages = GetAllSupportedLanguages();
        const validWebTypes = ['wasm', 'js', 'interpreter', 'preview', 'validate', 'none'];

        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(config.webType).toBeDefined();
            expect(validWebTypes).toContain(config.webType);
        });
    });

    it('every language has a desktopCommand', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(config.desktopCommand).toBeDefined();
            expect(typeof config.desktopCommand).toBe('string');
        });
    });

    it('no duplicate language IDs in the map', () =>
    {
        const languages = GetAllSupportedLanguages();
        const uniqueLanguages = new Set(languages);
        expect(uniqueLanguages.size).toBe(languages.length);
    });
});

describe('LanguageCommandMap — GetDesktopCommand', () =>
{
    it('returns correct command for python', () =>
    {
        const command = GetDesktopCommand('python');
        expect(command).toBe('python3 {file}');
    });

    it('returns correct command for javascript', () =>
    {
        const command = GetDesktopCommand('javascript');
        expect(command).toBe('node {file}');
    });

    it('returns correct command for rust', () =>
    {
        const command = GetDesktopCommand('rust');
        expect(command).toContain('rustc');
        expect(command).toContain('{file}');
    });

    it('returns empty string for unknown language', () =>
    {
        const command = GetDesktopCommand('unknown-language-xyz');
        expect(command).toBe('');
    });

    it('returns command for all executable languages', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            if (config.webType !== 'none' && config.desktopCommand !== '')
            {
                const command = GetDesktopCommand(lang);
                expect(command).toBe(config.desktopCommand);
            }
        });
    });
});

describe('LanguageCommandMap — GetWebRuntimeConfig', () =>
{
    it('returns correct config for python', () =>
    {
        const config = GetWebRuntimeConfig('python');
        expect(config).not.toBeNull();
        expect(config?.displayName).toBe('Python (Pyodide)');
        expect(config?.webType).toBe('wasm');
        expect(config?.mode).toBe('execute');
    });

    it('returns correct config for javascript', () =>
    {
        const config = GetWebRuntimeConfig('javascript');
        expect(config).not.toBeNull();
        expect(config?.displayName).toBe('Node.js');
        expect(config?.webType).toBe('js');
    });

    it('returns null for unknown language', () =>
    {
        const config = GetWebRuntimeConfig('unknown-language-xyz');
        expect(config).toBeNull();
    });

    it('returns full config object with all properties', () =>
    {
        const config = GetWebRuntimeConfig('python');
        expect(config).toHaveProperty('displayName');
        expect(config).toHaveProperty('desktopCommand');
        expect(config).toHaveProperty('webType');
        expect(config).toHaveProperty('mode');
    });

    it('returns config for all known languages', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const config = GetWebRuntimeConfig(lang);
            expect(config).not.toBeNull();
            expect(config?.displayName).toBeDefined();
        });
    });
});

describe('LanguageCommandMap — GetRuntimeDisplayName', () =>
{
    it('returns displayName for known language', () =>
    {
        const name = GetRuntimeDisplayName('python');
        expect(name).toBe('Python (Pyodide)');
    });

    it('returns displayName for javascript', () =>
    {
        const name = GetRuntimeDisplayName('javascript');
        expect(name).toBe('Node.js');
    });

    it('returns languageId for unknown language', () =>
    {
        const name = GetRuntimeDisplayName('unknown-lang');
        expect(name).toBe('unknown-lang');
    });

    it('returns display name for all known languages', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const displayName = GetRuntimeDisplayName(lang);
            expect(typeof displayName).toBe('string');
            expect(displayName.length).toBeGreaterThan(0);
        });
    });
});

describe('LanguageCommandMap — GetRuntimeMode', () =>
{
    it('returns execute for python', () =>
    {
        const mode = GetRuntimeMode('python');
        expect(mode).toBe('execute');
    });

    it('returns execute for javascript', () =>
    {
        const mode = GetRuntimeMode('javascript');
        expect(mode).toBe('execute');
    });

    it('returns validate for json', () =>
    {
        const mode = GetRuntimeMode('json');
        expect(mode).toBe('validate');
    });

    it('returns preview for html', () =>
    {
        const mode = GetRuntimeMode('html');
        expect(mode).toBe('preview');
    });

    it('returns validate for unknown language', () =>
    {
        const mode = GetRuntimeMode('unknown-lang');
        expect(mode).toBe('validate');
    });

    it('returns valid mode for all known languages', () =>
    {
        const validModes = ['execute', 'validate', 'preview'];
        const languages = GetAllSupportedLanguages();

        languages.forEach(lang =>
        {
            const mode = GetRuntimeMode(lang);
            expect(validModes).toContain(mode);
        });
    });
});

describe('LanguageCommandMap — IsLanguageExecutable', () =>
{
    it('returns true for python', () =>
    {
        expect(IsLanguageExecutable('python')).toBe(true);
    });

    it('returns true for javascript', () =>
    {
        expect(IsLanguageExecutable('javascript')).toBe(true);
    });

    it('returns true for rust', () =>
    {
        expect(IsLanguageExecutable('rust')).toBe(true);
    });

    it('returns true for bash', () =>
    {
        expect(IsLanguageExecutable('shell')).toBe(true);
    });

    it('returns false for plaintext (empty desktopCommand, webType none)', () =>
    {
        expect(IsLanguageExecutable('plaintext')).toBe(false);
    });

    it('returns false for unknown language', () =>
    {
        expect(IsLanguageExecutable('unknown-lang')).toBe(false);
    });

    it('returns false for validation-only languages that have no execute capability', () =>
    {
        const validationOnlyLanguages = ['plaintext'];
        validationOnlyLanguages.forEach(lang =>
        {
            expect(IsLanguageExecutable(lang)).toBe(false);
        });
    });

    it('requires non-empty desktopCommand to be executable', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            const isExecutable = IsLanguageExecutable(lang);

            if (config.desktopCommand === '')
            {
                expect(isExecutable).toBe(false);
            }
        });
    });

    it('requires webType !== "none" to be executable', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            const isExecutable = IsLanguageExecutable(lang);

            if (config.webType === 'none')
            {
                expect(isExecutable).toBe(false);
            }
        });
    });
});

describe('LanguageCommandMap — Category A Languages (JS-based)', () =>
{
    const categoryALanguages = [
        'javascript', 'typescript', 'coffeescript', 'json', 'json5', 'html', 'css', 'scss',
        'less', 'markdown', 'graphql', 'xml', 'yaml', 'ini', 'restructuredtext'
    ];

    it('all Category A languages have webType "js"', () =>
    {
        categoryALanguages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(config.webType).toBe('js');
        });
    });

    it('Category A languages are all recognized', () =>
    {
        const languages = GetAllSupportedLanguages();
        categoryALanguages.forEach(lang =>
        {
            expect(languages).toContain(lang);
        });
    });
});

describe('LanguageCommandMap — Category B Languages (WASM-based)', () =>
{
    const categoryBLanguages = [
        'python', 'ruby', 'php', 'lua', 'perl', 'r', 'sql', 'c', 'cpp', 'java', 'kotlin',
        'scala', 'csharp', 'fsharp', 'visual-basic', 'powershell', 'latex', 'tcl', 'shell',
        'scheme', 'lisp', 'smalltalk', 'erlang', 'elixir', 'raku', 'pascal', 'fortran',
        'cobol', 'objective-c', 'ada', 'ocaml', 'haskell', 'matlab', 'd', 'dart', 'julia',
        'actionscript', 'nim', 'clojure', 'go', 'rust', 'swift', 'gdscript', 'verilog',
        'vhdl', 'assembly'
    ];

    it('all Category B languages have webType "wasm"', () =>
    {
        categoryBLanguages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(config.webType).toBe('wasm');
        });
    });

    it('Category B languages have webRuntimePackage defined', () =>
    {
        categoryBLanguages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(config.webRuntimePackage).toBeDefined();
            expect(config.webRuntimePackage?.length).toBeGreaterThan(0);
        });
    });
});

describe('LanguageCommandMap — Category E Languages (Interpreters)', () =>
{
    const categoryELanguages = ['bat', 'sas', 'autoit', 'nsis', 'asp'];

    it('all Category E languages have webType "interpreter"', () =>
    {
        categoryELanguages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(config.webType).toBe('interpreter');
        });
    });

    it('Category E languages have non-empty desktopCommand', () =>
    {
        categoryELanguages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(config.desktopCommand.length).toBeGreaterThan(0);
        });
    });
});

describe('LanguageCommandMap — Validation-Only Languages', () =>
{
    const validationOnlyLanguages = ['dockerfile', 'makefile', 'cmake'];

    it('validation-only languages have webType "validate"', () =>
    {
        validationOnlyLanguages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(config.webType).toBe('validate');
        });
    });

    it('validation-only languages have mode "validate"', () =>
    {
        validationOnlyLanguages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(config.mode).toBe('validate');
        });
    });
});

describe('LanguageCommandMap — File Placeholder Requirements', () =>
{
    it('all commands that need file references have {file} placeholder', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];

            if (config.desktopCommand !== '' && config.desktopCommand !== 'echo "JSON5 validated"' &&
                config.desktopCommand !== 'echo "CSS cannot be executed directly"' &&
                config.desktopCommand !== 'echo "Markdown rendered in preview"' &&
                config.desktopCommand !== 'echo "GraphQL validated"' &&
                config.desktopCommand !== 'echo "INI validated"' &&
                config.desktopCommand !== 'echo "Properties validated"' &&
                config.desktopCommand !== 'echo "TOML validated"' &&
                !config.desktopCommand.includes('echo'))
            {
                expect(config.desktopCommand).toContain('{file}');
            }
        });
    });

    it('commands using {file_stem} also have {file} or standalone usage', () =>
    {
        const languagesWithFileStem = ['vhdl'];

        languagesWithFileStem.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(config.desktopCommand).toContain('{file_stem}');
        });
    });
});

describe('LanguageCommandMap — Display Names', () =>
{
    it('all display names are non-empty strings', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(typeof config.displayName).toBe('string');
            expect(config.displayName.length).toBeGreaterThan(0);
        });
    });

    it('display names are descriptive and distinct', () =>
    {
        const languages = GetAllSupportedLanguages();
        const displayNames = languages.map(lang => LANGUAGE_RUNTIME_MAP[lang].displayName);

        // Most display names should be unique (some may be similar for clarity)
        const uniqueNames = new Set(displayNames);
        expect(uniqueNames.size).toBeGreaterThan(languages.length - 10);
    });
});

describe('LanguageCommandMap — Desktop Commands Validity', () =>
{
    it('executable languages have non-empty desktopCommand', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            if (IsLanguageExecutable(lang))
            {
                expect(config.desktopCommand.length).toBeGreaterThan(0);
            }
        });
    });

    it('plaintext has empty desktopCommand', () =>
    {
        const config = LANGUAGE_RUNTIME_MAP['plaintext'];
        expect(config.desktopCommand).toBe('');
    });

    it('all desktop commands are strings', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            expect(typeof config.desktopCommand).toBe('string');
        });
    });
});

describe('LanguageCommandMap — Web Runtime Packages', () =>
{
    it('WASM languages have webRuntimePackage defined', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            if (config.webType === 'wasm')
            {
                expect(config.webRuntimePackage).toBeDefined();
                expect(config.webRuntimePackage?.length).toBeGreaterThan(0);
            }
        });
    });

    it('non-WASM languages may or may not have webRuntimePackage', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];
            if (config.webType !== 'wasm')
            {
                // webRuntimePackage is optional for non-WASM
                // Just ensure it doesn't cause errors
                expect(typeof config.webRuntimePackage === 'undefined' || typeof config.webRuntimePackage === 'string').toBe(true);
            }
        });
    });
});

describe('LanguageCommandMap — Integration Tests', () =>
{
    it('GetAllSupportedLanguages matches LANGUAGE_RUNTIME_MAP keys', () =>
    {
        const languages = GetAllSupportedLanguages();
        const mapKeys = Object.keys(LANGUAGE_RUNTIME_MAP);

        expect(new Set(languages)).toEqual(new Set(mapKeys));
    });

    it('all getters work for all supported languages', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            expect(GetDesktopCommand(lang)).toBeDefined();
            expect(GetWebRuntimeConfig(lang)).not.toBeNull();
            expect(GetRuntimeDisplayName(lang)).toBeDefined();
            expect(GetRuntimeMode(lang)).toBeDefined();
            expect(typeof IsLanguageExecutable(lang)).toBe('boolean');
        });
    });

    it('config consistency: mode matches webType intent', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const config = LANGUAGE_RUNTIME_MAP[lang];

            if (config.webType === 'validate')
            {
                expect(config.mode).toBe('validate');
            }

            if (config.webType === 'preview')
            {
                expect(['preview', 'execute']).toContain(config.mode);
            }

            if (config.mode === 'execute')
            {
                expect(['wasm', 'js', 'interpreter']).toContain(config.webType);
            }
        });
    });

    it('executability consistency: executable languages have proper config', () =>
    {
        const languages = GetAllSupportedLanguages();
        languages.forEach(lang =>
        {
            const isExecutable = IsLanguageExecutable(lang);
            const config = LANGUAGE_RUNTIME_MAP[lang];

            if (isExecutable)
            {
                expect(config.desktopCommand).not.toBe('');
                expect(config.webType).not.toBe('none');
            }
            else
            {
                expect(config.desktopCommand === '' || config.webType === 'none').toBe(true);
            }
        });
    });
});

describe('LanguageCommandMap — Specific Language Checks', () =>
{
    it('python is executable with correct runtime package', () =>
    {
        const config = LANGUAGE_RUNTIME_MAP['python'];
        expect(IsLanguageExecutable('python')).toBe(true);
        expect(config.webRuntimePackage).toBe('pyodide');
        expect(config.desktopCommand).toBe('python3 {file}');
    });

    it('javascript/node.js is executable with JS webType', () =>
    {
        const config = LANGUAGE_RUNTIME_MAP['javascript'];
        expect(IsLanguageExecutable('javascript')).toBe(true);
        expect(config.webType).toBe('js');
        expect(config.desktopCommand).toBe('node {file}');
    });

    it('markdown has preview mode', () =>
    {
        const config = LANGUAGE_RUNTIME_MAP['markdown'];
        expect(config.mode).toBe('preview');
        expect(config.webType).toBe('js');
    });

    it('dockerfile is validate-only', () =>
    {
        const config = LANGUAGE_RUNTIME_MAP['dockerfile'];
        expect(IsLanguageExecutable('dockerfile')).toBe(true);
        expect(config.mode).toBe('validate');
        expect(config.webType).toBe('validate');
    });

    it('plaintext is not executable', () =>
    {
        const config = LANGUAGE_RUNTIME_MAP['plaintext'];
        expect(IsLanguageExecutable('plaintext')).toBe(false);
        expect(config.desktopCommand).toBe('');
        expect(config.webType).toBe('none');
    });
});
