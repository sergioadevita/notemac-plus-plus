import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    PrintCurrentDocument,
    PrintSelection,
    ShowPrintPreview,
    GetPrintPreviewHTML,
} from '../Notemac/Controllers/PrintController';

vi.mock('../Notemac/Services/PrintService', () => ({
    GeneratePrintHTML: vi.fn().mockReturnValue('<html><body>test</body></html>'),
    Print: vi.fn(),
}));

vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

import { useNotemacStore } from '../Notemac/Model/Store';
import { Print, GeneratePrintHTML } from '../Notemac/Services/PrintService';

describe('PrintController', () =>
{
    beforeEach(() =>
    {
        (useNotemacStore.getState as any).mockReturnValue({
            tabs: [{ id: 'tab1', name: 'test.js', content: 'const x = 1;', language: 'javascript' }],
            activeTabId: 'tab1',
            settings: { fontSize: 12, fontFamily: 'monospace', showLineNumbers: true },
            setShowPrintPreview: vi.fn(),
        });
        vi.clearAllMocks();
    });

    describe('PrintCurrentDocument', () =>
    {
        it('should not throw when valid state', () =>
        {
            expect(() => PrintCurrentDocument()).not.toThrow();
        });

        it('should call Print service function', () =>
        {
            PrintCurrentDocument();
            expect(Print).toHaveBeenCalled();
        });

        it('should pass content to Print', () =>
        {
            PrintCurrentDocument();
            const calls = (Print as any).mock.calls;
            expect(0 < calls.length).toBe(true);
            const firstCall = calls[0];
            expect(firstCall[0]).toContain('const x = 1;');
        });

        it('should pass language to Print', () =>
        {
            PrintCurrentDocument();
            const calls = (Print as any).mock.calls;
            const firstCall = calls[0];
            expect(firstCall[1]).toBe('javascript');
        });

        it('should include settings in options', () =>
        {
            PrintCurrentDocument();
            const calls = (Print as any).mock.calls;
            const firstCall = calls[0];
            const options = firstCall[2];
            expect(options.fontSize).toBe(12);
            expect(options.fontFamily).toBe('monospace');
        });

        it('should not throw when no active tab', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                tabs: [],
                activeTabId: null,
                settings: { fontSize: 12, fontFamily: 'monospace', showLineNumbers: true },
            });
            expect(() => PrintCurrentDocument()).not.toThrow();
        });

        it('should not call Print when no active tab', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                tabs: [],
                activeTabId: null,
                settings: { fontSize: 12, fontFamily: 'monospace', showLineNumbers: true },
            });
            PrintCurrentDocument();
            expect(Print).not.toHaveBeenCalled();
        });

        it('should return undefined', () =>
        {
            const result = PrintCurrentDocument();
            expect(result).toBeUndefined();
        });

        it('should use tab name as header', () =>
        {
            PrintCurrentDocument();
            const calls = (Print as any).mock.calls;
            const firstCall = calls[0];
            const options = firstCall[2];
            expect(options.headerText).toBe('test.js');
        });
    });

    describe('PrintSelection', () =>
    {
        it('should not throw when valid state', () =>
        {
            expect(() => PrintSelection()).not.toThrow();
        });

        it('should call Print service function', () =>
        {
            PrintSelection();
            expect(Print).toHaveBeenCalled();
        });

        it('should not throw when no active tab', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                tabs: [],
                activeTabId: null,
                settings: { fontSize: 12, fontFamily: 'monospace', showLineNumbers: true },
            });
            expect(() => PrintSelection()).not.toThrow();
        });

        it('should not call Print when no active tab', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                tabs: [],
                activeTabId: null,
                settings: { fontSize: 12, fontFamily: 'monospace', showLineNumbers: true },
            });
            PrintSelection();
            expect(Print).not.toHaveBeenCalled();
        });

        it('should return undefined', () =>
        {
            const result = PrintSelection();
            expect(result).toBeUndefined();
        });

        it('should indicate selection in header', () =>
        {
            PrintSelection();
            const calls = (Print as any).mock.calls;
            const firstCall = calls[0];
            const options = firstCall[2];
            expect(options.headerText).toContain('Selection');
        });

        it('should use tab settings for printing', () =>
        {
            PrintSelection();
            const calls = (Print as any).mock.calls;
            const firstCall = calls[0];
            const options = firstCall[2];
            expect(options.fontSize).toBe(12);
        });
    });

    describe('ShowPrintPreview', () =>
    {
        it('should not throw', () =>
        {
            expect(() => ShowPrintPreview()).not.toThrow();
        });

        it('should call setShowPrintPreview', () =>
        {
            const mockSetShowPrintPreview = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                tabs: [],
                activeTabId: null,
                settings: { fontSize: 12, fontFamily: 'monospace', showLineNumbers: true },
                setShowPrintPreview: mockSetShowPrintPreview,
            });
            ShowPrintPreview();
            expect(mockSetShowPrintPreview).toHaveBeenCalled();
        });

        it('should call setShowPrintPreview with true', () =>
        {
            const mockSetShowPrintPreview = vi.fn();
            (useNotemacStore.getState as any).mockReturnValue({
                tabs: [],
                activeTabId: null,
                settings: { fontSize: 12, fontFamily: 'monospace', showLineNumbers: true },
                setShowPrintPreview: mockSetShowPrintPreview,
            });
            ShowPrintPreview();
            expect(mockSetShowPrintPreview).toHaveBeenCalledWith(true);
        });

        it('should return undefined', () =>
        {
            const result = ShowPrintPreview();
            expect(result).toBeUndefined();
        });
    });

    describe('GetPrintPreviewHTML', () =>
    {
        it('should return HTML string for preview', () =>
        {
            const html = GetPrintPreviewHTML();
            expect(typeof html).toBe('string');
        });

        it('should call GeneratePrintHTML', () =>
        {
            GetPrintPreviewHTML();
            expect(GeneratePrintHTML).toHaveBeenCalled();
        });

        it('should pass content to GeneratePrintHTML', () =>
        {
            GetPrintPreviewHTML();
            const calls = (GeneratePrintHTML as any).mock.calls;
            expect(0 < calls.length).toBe(true);
            const firstCall = calls[0];
            expect(firstCall[0]).toContain('const x = 1;');
        });

        it('should pass language to GeneratePrintHTML', () =>
        {
            GetPrintPreviewHTML();
            const calls = (GeneratePrintHTML as any).mock.calls;
            const firstCall = calls[0];
            expect(firstCall[1]).toBe('javascript');
        });

        it('should include settings in options', () =>
        {
            GetPrintPreviewHTML();
            const calls = (GeneratePrintHTML as any).mock.calls;
            const firstCall = calls[0];
            const options = firstCall[2];
            expect(options.fontSize).toBe(12);
            expect(options.fontFamily).toBe('monospace');
            expect(options.showLineNumbers).toBe(true);
        });

        it('should return empty string when no active tab', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                tabs: [],
                activeTabId: null,
                settings: { fontSize: 12, fontFamily: 'monospace', showLineNumbers: true },
            });
            const html = GetPrintPreviewHTML();
            expect(html).toBe('');
        });

        it('should return empty string when tab not found', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                tabs: [{ id: 'tab1', name: 'test.js', content: 'const x = 1;', language: 'javascript' }],
                activeTabId: 'nonexistent',
                settings: { fontSize: 12, fontFamily: 'monospace', showLineNumbers: true },
            });
            const html = GetPrintPreviewHTML();
            expect(html).toBe('');
        });

        it('should not call GeneratePrintHTML when tab not found', () =>
        {
            (useNotemacStore.getState as any).mockReturnValue({
                tabs: [{ id: 'tab1', name: 'test.js', content: 'const x = 1;', language: 'javascript' }],
                activeTabId: 'nonexistent',
                settings: { fontSize: 12, fontFamily: 'monospace', showLineNumbers: true },
            });
            vi.clearAllMocks();
            GetPrintPreviewHTML();
            expect(GeneratePrintHTML).not.toHaveBeenCalled();
        });

        it('should use tab name as header text', () =>
        {
            GetPrintPreviewHTML();
            const calls = (GeneratePrintHTML as any).mock.calls;
            const firstCall = calls[0];
            const options = firstCall[2];
            expect(options.headerText).toBe('test.js');
        });
    });
});
