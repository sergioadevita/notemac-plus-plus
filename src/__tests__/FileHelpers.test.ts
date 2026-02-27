import { describe, it, expect } from 'vitest';
import { detectLanguage, detectLineEnding, convertLineEnding } from '../Shared/Helpers/FileHelpers';

// ============================================================
// FileHelpers — detectLanguage
// ============================================================
describe('detectLanguage', () =>
{
    it('returns plaintext for empty filename', () =>
    {
        expect(detectLanguage('')).toBe('plaintext');
    });

    it('detects javascript from .js extension', () =>
    {
        expect(detectLanguage('app.js')).toBe('javascript');
    });

    it('detects typescript from .ts extension', () =>
    {
        expect(detectLanguage('index.ts')).toBe('typescript');
    });

    it('detects typescript from .tsx extension', () =>
    {
        expect(detectLanguage('Component.tsx')).toBe('typescript');
    });

    it('detects python from .py extension', () =>
    {
        expect(detectLanguage('script.py')).toBe('python');
    });

    it('detects html from .html extension', () =>
    {
        expect(detectLanguage('page.html')).toBe('html');
    });

    it('detects css from .css extension', () =>
    {
        expect(detectLanguage('styles.css')).toBe('css');
    });

    it('detects json from .json extension', () =>
    {
        expect(detectLanguage('package.json')).toBe('json');
    });

    it('detects markdown from .md extension', () =>
    {
        expect(detectLanguage('README.md')).toBe('markdown');
    });

    it('detects yaml from .yml extension', () =>
    {
        expect(detectLanguage('config.yml')).toBe('yaml');
    });

    it('detects dockerfile from exact name', () =>
    {
        expect(detectLanguage('Dockerfile')).toBe('dockerfile');
    });

    it('detects makefile from exact name', () =>
    {
        expect(detectLanguage('Makefile')).toBe('makefile');
    });

    it('detects cmake from CMakeLists.txt', () =>
    {
        expect(detectLanguage('CMakeLists.txt')).toBe('cmake');
    });

    it('returns plaintext for unknown extension', () =>
    {
        expect(detectLanguage('file.xyz')).toBe('plaintext');
    });

    it('returns plaintext for no extension', () =>
    {
        expect(detectLanguage('noextension')).toBe('plaintext');
    });

    it('is case insensitive', () =>
    {
        expect(detectLanguage('FILE.JS')).toBe('javascript');
        expect(detectLanguage('App.TSX')).toBe('typescript');
    });

    it('detects shell scripts', () =>
    {
        expect(detectLanguage('run.sh')).toBe('shell');
        expect(detectLanguage('setup.bash')).toBe('shell');
    });

    it('detects go from .go extension', () =>
    {
        expect(detectLanguage('main.go')).toBe('go');
    });

    it('detects rust from .rs extension', () =>
    {
        expect(detectLanguage('lib.rs')).toBe('rust');
    });

    it('detects csharp from .cs extension', () =>
    {
        expect(detectLanguage('Program.cs')).toBe('csharp');
    });

    it('detects ruby from .rb extension', () =>
    {
        expect(detectLanguage('app.rb')).toBe('ruby');
    });

    it('detects sql from .sql extension', () =>
    {
        expect(detectLanguage('query.sql')).toBe('sql');
    });

    it('detects graphql from .graphql extension', () =>
    {
        expect(detectLanguage('schema.graphql')).toBe('graphql');
    });

    it('detects kotlin from .kt extension', () =>
    {
        expect(detectLanguage('Main.kt')).toBe('kotlin');
    });

    it('detects swift from .swift extension', () =>
    {
        expect(detectLanguage('ViewController.swift')).toBe('swift');
    });

    it('detects perl from .pl extension', () =>
    {
        expect(detectLanguage('script.pl')).toBe('perl');
    });

    it('detects lua from .lua extension', () =>
    {
        expect(detectLanguage('init.lua')).toBe('lua');
    });

    it('detects dart from .dart extension', () =>
    {
        expect(detectLanguage('main.dart')).toBe('dart');
    });

    it('detects haskell from .hs extension', () =>
    {
        expect(detectLanguage('Main.hs')).toBe('haskell');
    });

    it('detects scala from .scala extension', () =>
    {
        expect(detectLanguage('App.scala')).toBe('scala');
    });
});

// ============================================================
// FileHelpers — detectLineEnding
// ============================================================
describe('detectLineEnding', () =>
{
    it('detects LF line endings', () =>
    {
        expect(detectLineEnding('line1\nline2\nline3')).toBe('LF');
    });

    it('detects CRLF line endings', () =>
    {
        expect(detectLineEnding('line1\r\nline2\r\nline3')).toBe('CRLF');
    });

    it('detects CR line endings', () =>
    {
        expect(detectLineEnding('line1\rline2\rline3')).toBe('CR');
    });

    it('returns CRLF for empty string (all counts equal at zero)', () =>
    {
        expect(detectLineEnding('')).toBe('CRLF');
    });

    it('returns CRLF for no line endings (all counts equal at zero)', () =>
    {
        expect(detectLineEnding('single line')).toBe('CRLF');
    });

    it('detects majority CRLF in mixed content', () =>
    {
        expect(detectLineEnding('a\r\nb\r\nc\nd')).toBe('CRLF');
    });
});

// ============================================================
// FileHelpers — convertLineEnding
// ============================================================
describe('convertLineEnding', () =>
{
    it('converts LF to CRLF', () =>
    {
        expect(convertLineEnding('a\nb\nc', 'CRLF')).toBe('a\r\nb\r\nc');
    });

    it('converts CRLF to LF', () =>
    {
        expect(convertLineEnding('a\r\nb\r\nc', 'LF')).toBe('a\nb\nc');
    });

    it('converts LF to CR', () =>
    {
        expect(convertLineEnding('a\nb\nc', 'CR')).toBe('a\rb\rc');
    });

    it('converts CR to LF', () =>
    {
        expect(convertLineEnding('a\rb\rc', 'LF')).toBe('a\nb\nc');
    });

    it('converts mixed endings to LF', () =>
    {
        expect(convertLineEnding('a\r\nb\rc\nd', 'LF')).toBe('a\nb\nc\nd');
    });

    it('converts mixed endings to CRLF', () =>
    {
        expect(convertLineEnding('a\r\nb\rc\nd', 'CRLF')).toBe('a\r\nb\r\nc\r\nd');
    });

    it('handles empty string', () =>
    {
        expect(convertLineEnding('', 'LF')).toBe('');
        expect(convertLineEnding('', 'CRLF')).toBe('');
        expect(convertLineEnding('', 'CR')).toBe('');
    });

    it('handles string with no line endings', () =>
    {
        expect(convertLineEnding('no breaks', 'CRLF')).toBe('no breaks');
    });
});
