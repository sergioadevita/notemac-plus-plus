import { describe, it, expect } from 'vitest';
import {
    BuildContextString,
    EstimateTokenCount,
    TruncateToTokenBudget,
    ExtractCodeBlocks,
} from '../Notemac/Controllers/LLMController';
import type { AIContextItem } from '../Notemac/Commons/Types';

// ============================================================
// LLMController — BuildContextString
// ============================================================
describe('LLMController — BuildContextString', () =>
{
    it('returns empty string for empty array', () =>
    {
        expect(BuildContextString([])).toBe('');
    });

    it('builds context from file items', () =>
    {
        const items: AIContextItem[] = [
            { type: 'file', label: 'index.ts', content: 'const x = 1;', language: 'typescript' },
        ];
        const result = BuildContextString(items);
        expect(result).toContain('File: index.ts');
        expect(result).toContain('typescript');
        expect(result).toContain('const x = 1;');
    });

    it('builds context from selection items', () =>
    {
        const items: AIContextItem[] = [
            { type: 'selection', label: 'selected', content: 'hello world', language: 'python' },
        ];
        const result = BuildContextString(items);
        expect(result).toContain('Selected code');
        expect(result).toContain('python');
        expect(result).toContain('hello world');
    });

    it('builds context from error items', () =>
    {
        const items: AIContextItem[] = [
            { type: 'error', label: 'err', content: 'TypeError: x is not a function' },
        ];
        const result = BuildContextString(items);
        expect(result).toContain('Error');
        expect(result).toContain('TypeError');
    });

    it('builds context from diff items', () =>
    {
        const items: AIContextItem[] = [
            { type: 'diff', label: 'diff', content: '+added\n-removed' },
        ];
        const result = BuildContextString(items);
        expect(result).toContain('Diff');
        expect(result).toContain('+added');
    });

    it('joins multiple items with double newline', () =>
    {
        const items: AIContextItem[] = [
            { type: 'file', label: 'a.ts', content: 'aaa', language: 'ts' },
            { type: 'file', label: 'b.ts', content: 'bbb', language: 'ts' },
        ];
        const result = BuildContextString(items);
        expect(result).toContain('a.ts');
        expect(result).toContain('b.ts');
        expect(result.includes('\n\n')).toBe(true);
    });

    it('handles unknown language gracefully', () =>
    {
        const items: AIContextItem[] = [
            { type: 'file', label: 'test', content: 'data' },
        ];
        const result = BuildContextString(items);
        expect(result).toContain('unknown');
    });
});

// ============================================================
// LLMController — EstimateTokenCount
// ============================================================
describe('LLMController — EstimateTokenCount', () =>
{
    it('returns 0 for empty string', () =>
    {
        expect(0 === EstimateTokenCount('')).toBe(true);
    });

    it('estimates roughly 1 token per 4 chars', () =>
    {
        const text = 'a'.repeat(100);
        expect(25 === EstimateTokenCount(text)).toBe(true);
    });

    it('rounds up for non-divisible lengths', () =>
    {
        const text = 'a'.repeat(5); // 5 / 4 = 1.25 → ceil = 2
        expect(2 === EstimateTokenCount(text)).toBe(true);
    });
});

// ============================================================
// LLMController — TruncateToTokenBudget
// ============================================================
describe('LLMController — TruncateToTokenBudget', () =>
{
    it('returns full text when within budget', () =>
    {
        const text = 'Hello world';
        expect(TruncateToTokenBudget(text, 1000)).toBe(text);
    });

    it('truncates text that exceeds budget', () =>
    {
        const text = 'a'.repeat(100);
        const result = TruncateToTokenBudget(text, 5); // 5 tokens * 4 = 20 chars
        expect(result.length < text.length).toBe(true);
        expect(result).toContain('truncated');
    });

    it('preserves exact content up to limit', () =>
    {
        const text = 'abcdefghijklmnopqrst'; // 20 chars
        const result = TruncateToTokenBudget(text, 5); // exactly 20 chars budget
        expect(result).toBe(text);
    });
});

// ============================================================
// LLMController — ExtractCodeBlocks
// ============================================================
describe('LLMController — ExtractCodeBlocks', () =>
{
    it('returns empty array for no code blocks', () =>
    {
        expect(0 === ExtractCodeBlocks('Hello world').length).toBe(true);
    });

    it('extracts a single code block', () =>
    {
        const content = 'Here is code:\n```typescript\nconst x = 1;\n```';
        const blocks = ExtractCodeBlocks(content);
        expect(1 === blocks.length).toBe(true);
        expect(blocks[0].language).toBe('typescript');
        expect(blocks[0].code).toBe('const x = 1;');
    });

    it('extracts multiple code blocks', () =>
    {
        const content = '```python\nprint("hi")\n```\nSome text\n```javascript\nalert("hello")\n```';
        const blocks = ExtractCodeBlocks(content);
        expect(2 === blocks.length).toBe(true);
        expect(blocks[0].language).toBe('python');
        expect(blocks[1].language).toBe('javascript');
    });

    it('defaults to text when no language specified', () =>
    {
        const content = '```\nplain text here\n```';
        const blocks = ExtractCodeBlocks(content);
        expect(1 === blocks.length).toBe(true);
        expect(blocks[0].language).toBe('text');
    });

    it('trims whitespace from extracted code', () =>
    {
        const content = '```js\n  spaced code  \n```';
        const blocks = ExtractCodeBlocks(content);
        expect(blocks[0].code).toBe('spaced code');
    });

    it('handles multiline code blocks', () =>
    {
        const content = '```ts\nline1\nline2\nline3\n```';
        const blocks = ExtractCodeBlocks(content);
        expect(blocks[0].code).toContain('line1');
        expect(blocks[0].code).toContain('line2');
        expect(blocks[0].code).toContain('line3');
    });
});
