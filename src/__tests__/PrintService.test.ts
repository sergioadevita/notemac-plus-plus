import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeneratePrintHTML, Print } from '../Notemac/Services/PrintService';

describe('PrintService', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    describe('GeneratePrintHTML', () =>
    {
        it('should generate valid HTML string', () =>
        {
            const result = GeneratePrintHTML('const x = 1;', 'javascript', {});
            expect(result).toContain('<html');
            expect(result).toContain('</html>');
        });

        it('should include DOCTYPE declaration', () =>
        {
            const result = GeneratePrintHTML('test', 'plaintext', {});
            expect(result).toContain('<!DOCTYPE html>');
        });

        it('should include content in the output', () =>
        {
            const result = GeneratePrintHTML('hello world', 'plaintext', {});
            expect(result).toContain('hello world');
        });

        it('should add line numbers when option is true', () =>
        {
            const result = GeneratePrintHTML('line1\nline2', 'plaintext', { showLineNumbers: true });
            expect(result).toContain('1');
            expect(result).toContain('2');
        });

        it('should not add line numbers when option is false', () =>
        {
            const result = GeneratePrintHTML('line1\nline2', 'plaintext', { showLineNumbers: false });
            expect(result).not.toContain('user-select:none');
        });

        it('should include header when specified', () =>
        {
            const result = GeneratePrintHTML('content', 'plaintext', { headerText: 'My Document' });
            expect(result).toContain('My Document');
        });

        it('should include header class styling', () =>
        {
            const result = GeneratePrintHTML('content', 'plaintext', { headerText: 'Test' });
            expect(result).toContain('.header');
        });

        it('should include footer when specified', () =>
        {
            const result = GeneratePrintHTML('content', 'plaintext', { footerText: 'Page 1' });
            expect(result).toContain('Page 1');
        });

        it('should not include footer section when footerText is empty', () =>
        {
            const result = GeneratePrintHTML('content', 'plaintext', { footerText: '' });
            expect(result).not.toContain('<div class="footer">');
        });

        it('should handle empty content', () =>
        {
            const result = GeneratePrintHTML('', 'plaintext', {});
            expect(result).toContain('<html');
        });

        it('should apply font size setting', () =>
        {
            const result = GeneratePrintHTML('test', 'plaintext', { fontSize: 14 });
            expect(result).toContain('14');
        });

        it('should apply custom font family', () =>
        {
            const customFont = "'Georgia', serif";
            const result = GeneratePrintHTML('test', 'plaintext', { fontFamily: customFont });
            expect(result).toContain(customFont);
        });

        it('should handle multiline content', () =>
        {
            const content = 'line1\nline2\nline3\nline4\nline5';
            const result = GeneratePrintHTML(content, 'plaintext', {});
            expect(result).toContain('line1');
            expect(result).toContain('line5');
        });

        it('should escape HTML special characters', () =>
        {
            const result = GeneratePrintHTML('<script>alert("xss")</script>', 'plaintext', {});
            expect(result).toContain('&lt;');
            expect(result).toContain('&gt;');
        });

        it('should escape ampersands', () =>
        {
            const result = GeneratePrintHTML('A & B', 'plaintext', {});
            expect(result).toContain('&amp;');
        });

        it('should escape quotes', () =>
        {
            const result = GeneratePrintHTML('He said "hello"', 'plaintext', {});
            expect(result).toContain('&quot;');
        });

        it('should handle word wrap option true', () =>
        {
            const result = GeneratePrintHTML('test', 'plaintext', { wordWrap: true });
            expect(result).toContain('word-wrap: break-word');
        });

        it('should handle word wrap option false', () =>
        {
            const result = GeneratePrintHTML('test', 'plaintext', { wordWrap: false });
            expect(result).toContain('white-space: pre');
        });

        it('should set default font family when not specified', () =>
        {
            const result = GeneratePrintHTML('test', 'plaintext', {});
            expect(result).toContain('Courier New');
        });

        it('should include print media rules', () =>
        {
            const result = GeneratePrintHTML('test', 'plaintext', {});
            expect(result).toContain('@media print');
        });

        it('should set tab size in CSS', () =>
        {
            const result = GeneratePrintHTML('test', 'plaintext', {});
            expect(result).toContain('tab-size: 4');
        });
    });

    describe('Print', () =>
    {
        it('should not throw', () =>
        {
            const mockOpen = vi.fn().mockReturnValue({
                document: {
                    write: vi.fn(),
                    close: vi.fn(),
                },
                print: vi.fn(),
                close: vi.fn(),
            });
            window.open = mockOpen;

            expect(() => Print('test content', 'plaintext', {})).not.toThrow();
        });

        it('should open a new window', () =>
        {
            const mockOpen = vi.fn().mockReturnValue({
                document: {
                    write: vi.fn(),
                    close: vi.fn(),
                },
                print: vi.fn(),
                close: vi.fn(),
            });
            window.open = mockOpen;

            Print('test', 'plaintext', {});
            expect(mockOpen).toHaveBeenCalled();
        });

        it('should open window with blank target', () =>
        {
            const mockOpen = vi.fn().mockReturnValue({
                document: {
                    write: vi.fn(),
                    close: vi.fn(),
                },
                print: vi.fn(),
                close: vi.fn(),
            });
            window.open = mockOpen;

            Print('test', 'plaintext', {});
            expect(mockOpen.mock.calls[0][1]).toBe('_blank');
        });

        it('should write HTML to window document', () =>
        {
            const mockWrite = vi.fn();
            const mockOpen = vi.fn().mockReturnValue({
                document: {
                    write: mockWrite,
                    close: vi.fn(),
                },
                print: vi.fn(),
                close: vi.fn(),
            });
            window.open = mockOpen;

            Print('test', 'plaintext', {});
            expect(mockWrite).toHaveBeenCalled();
        });

        it('should close document after writing', () =>
        {
            const mockClose = vi.fn();
            const mockOpen = vi.fn().mockReturnValue({
                document: {
                    write: vi.fn(),
                    close: mockClose,
                },
                print: vi.fn(),
                close: vi.fn(),
            });
            window.open = mockOpen;

            Print('test', 'plaintext', {});
            expect(mockClose).toHaveBeenCalled();
        });

        it('should handle null window gracefully', () =>
        {
            const mockOpen = vi.fn().mockReturnValue(null);
            window.open = mockOpen;

            expect(() => Print('test', 'plaintext', {})).not.toThrow();
        });

        it('should call print after timeout', () =>
        {
            vi.useFakeTimers();
            const mockPrint = vi.fn();
            const mockOpen = vi.fn().mockReturnValue({
                document: {
                    write: vi.fn(),
                    close: vi.fn(),
                },
                print: mockPrint,
                close: vi.fn(),
            });
            window.open = mockOpen;

            Print('test', 'plaintext', {});
            vi.advanceTimersByTime(250);

            expect(mockPrint).toHaveBeenCalled();
            vi.useRealTimers();
        });

        it('should close window after print', () =>
        {
            vi.useFakeTimers();
            const mockWindowClose = vi.fn();
            const mockOpen = vi.fn().mockReturnValue({
                document: {
                    write: vi.fn(),
                    close: vi.fn(),
                },
                print: vi.fn(),
                close: mockWindowClose,
            });
            window.open = mockOpen;

            Print('test', 'plaintext', {});
            vi.advanceTimersByTime(250);

            expect(mockWindowClose).toHaveBeenCalled();
            vi.useRealTimers();
        });
    });
});
