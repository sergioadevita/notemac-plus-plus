import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HandleDragOver, HandleDrop, SetupElectronIPC } from '../Notemac/Controllers/FileController';
import { useNotemacStore } from '../Notemac/Model/Store';

// Mock the store
vi.mock('../Notemac/Model/Store', () => ({
    useNotemacStore: {
        getState: vi.fn(),
    },
}));

// Mock file helpers
vi.mock('../../Shared/Helpers/FileHelpers', () => ({
    detectLanguage: vi.fn((filename: string) =>
    {
        if (filename.endsWith('.ts'))
            return 'typescript';
        if (filename.endsWith('.js'))
            return 'javascript';
        if (filename.endsWith('.py'))
            return 'python';
        if (filename.endsWith('.css'))
            return 'css';
        return 'plaintext';
    }),
    detectLineEnding: vi.fn((content: string) =>
    {
        if (content.includes('\r\n'))
            return 'CRLF';
        return 'LF';
    }),
}));

// Mock MenuActionController
vi.mock('../Notemac/Controllers/MenuActionController', () => ({
    HandleMenuAction: vi.fn(),
}));

describe('FileController — HandleDragOver', () =>
{
    it('prevents default drag over behavior', () =>
    {
        const event: any = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
        };

        HandleDragOver(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
    });
});

describe('FileController — HandleDrop', () =>
{
    let mockStore: any;

    beforeEach(() =>
    {
        mockStore = {
            addTab: vi.fn(),
            tabs: [],
            setActiveTab: vi.fn(),
            addRecentFile: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);
        vi.clearAllMocks();
    });

    it('creates tabs from dropped files', async () =>
    {
        const mockFile = new File(['console.log("hello");'], 'test.js', { type: 'text/plain' });

        const event: any = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            dataTransfer: {
                files: [mockFile],
            },
        };

        await HandleDrop(event);

        expect(mockStore.addTab).toHaveBeenCalledWith(expect.objectContaining({
            name: 'test.js',
            content: 'console.log("hello");',
            language: 'javascript',
        }));
    });

    it('detects language from dropped file name', async () =>
    {
        const mockFile = new File(['def hello():\n    pass'], 'script.py', { type: 'text/plain' });

        const event: any = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            dataTransfer: {
                files: [mockFile],
            },
        };

        await HandleDrop(event);

        expect(mockStore.addTab).toHaveBeenCalledWith(expect.objectContaining({
            language: 'python',
        }));
    });

    it('detects line ending from content', async () =>
    {
        const mockFile = new File(['line1\r\nline2\r\n'], 'test.txt', { type: 'text/plain' });

        const event: any = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            dataTransfer: {
                files: [mockFile],
            },
        };

        await HandleDrop(event);

        expect(mockStore.addTab).toHaveBeenCalledWith(expect.objectContaining({
            lineEnding: 'CRLF',
        }));
    });

    it('handles multiple dropped files', async () =>
    {
        const file1 = new File(['content1'], 'file1.ts', { type: 'text/plain' });
        const file2 = new File(['content2'], 'file2.py', { type: 'text/plain' });

        const event: any = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            dataTransfer: {
                files: [file1, file2],
            },
        };

        await HandleDrop(event);

        expect(mockStore.addTab).toHaveBeenCalledTimes(2);
    });

    it('prevents default drop behavior', async () =>
    {
        const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

        const event: any = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            dataTransfer: {
                files: [mockFile],
            },
        };

        await HandleDrop(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('handles drop with no files gracefully', async () =>
    {
        const event: any = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            dataTransfer: null,
        };

        await HandleDrop(event);

        expect(mockStore.addTab).not.toHaveBeenCalled();
    });
});

describe('FileController — SetupElectronIPC', () =>
{
    let mockStore: any;
    let mockElectronAPI: any;

    beforeEach(() =>
    {
        mockStore = {
            addTab: vi.fn(),
            setActiveTab: vi.fn(),
            tabs: [],
            setFileTree: vi.fn(),
            setWorkspacePath: vi.fn(),
            setSidebarPanel: vi.fn(),
            updateTab: vi.fn(),
            activeTabId: null,
            addRecentFile: vi.fn(),
        };

        (useNotemacStore.getState as any).mockReturnValue(mockStore);

        mockElectronAPI = {
            onFileOpened: vi.fn((callback) => {
                mockElectronAPI._fileOpenedCallback = callback;
            }),
            onFolderOpened: vi.fn((callback) => {
                mockElectronAPI._folderOpenedCallback = callback;
            }),
            onMenuAction: vi.fn((callback) => {
                mockElectronAPI._menuActionCallback = callback;
            }),
            onFileSaved: vi.fn((callback) => {
                mockElectronAPI._fileSavedCallback = callback;
            }),
        };

        (window as any).electronAPI = mockElectronAPI;
        vi.clearAllMocks();
    });

    afterEach(() =>
    {
        delete (window as any).electronAPI;
    });

    it('registers file open listener', () =>
    {
        SetupElectronIPC();
        expect(mockElectronAPI.onFileOpened).toHaveBeenCalled();
    });

    it('registers folder open listener', () =>
    {
        SetupElectronIPC();
        expect(mockElectronAPI.onFolderOpened).toHaveBeenCalled();
    });

    it('registers menu action listener', () =>
    {
        SetupElectronIPC();
        expect(mockElectronAPI.onMenuAction).toHaveBeenCalled();
    });

    it('registers file saved listener', () =>
    {
        SetupElectronIPC();
        expect(mockElectronAPI.onFileSaved).toHaveBeenCalled();
    });

    it('opens existing file when already in tabs', () =>
    {
        mockStore.tabs = [
            {
                id: 'tab-1',
                path: '/path/to/existing.ts',
            },
        ];

        SetupElectronIPC();
        mockElectronAPI._fileOpenedCallback({
            path: '/path/to/existing.ts',
            name: 'existing.ts',
            content: 'new content',
        });

        expect(mockStore.setActiveTab).toHaveBeenCalledWith('tab-1');
        expect(mockStore.addTab).not.toHaveBeenCalled();
    });

    it('creates new tab for new file', () =>
    {
        mockStore.tabs = [];

        SetupElectronIPC();
        mockElectronAPI._fileOpenedCallback({
            path: '/path/to/new.ts',
            name: 'new.ts',
            content: 'new content',
        });

        expect(mockStore.addTab).toHaveBeenCalledWith(expect.objectContaining({
            path: '/path/to/new.ts',
            name: 'new.ts',
            content: 'new content',
        }));
        expect(mockStore.addRecentFile).toHaveBeenCalledWith('/path/to/new.ts', 'new.ts');
    });

    it('handles folder open with file tree', () =>
    {
        SetupElectronIPC();
        const fileTree = { name: 'root', path: '/root', isDirectory: true };

        mockElectronAPI._folderOpenedCallback({
            path: '/root',
            tree: fileTree,
        });

        expect(mockStore.setFileTree).toHaveBeenCalledWith(fileTree);
        expect(mockStore.setWorkspacePath).toHaveBeenCalledWith('/root');
        expect(mockStore.setSidebarPanel).toHaveBeenCalledWith('explorer');
    });

    it('does not setup IPC if electronAPI is unavailable', () =>
    {
        delete (window as any).electronAPI;

        // Should not throw
        expect(() =>
        {
            SetupElectronIPC();
        }).not.toThrow();
    });

    it('updates tab when file is saved', () =>
    {
        mockStore.activeTabId = 'tab-1';

        SetupElectronIPC();
        mockElectronAPI._fileSavedCallback({
            path: '/path/to/saved.ts',
            name: 'saved.ts',
        });

        expect(mockStore.updateTab).toHaveBeenCalledWith('tab-1', expect.objectContaining({
            path: '/path/to/saved.ts',
            name: 'saved.ts',
            isModified: false,
        }));
    });

    it('detects language when file is opened', () =>
    {
        mockStore.tabs = [];

        SetupElectronIPC();
        mockElectronAPI._fileOpenedCallback({
            path: '/path/to/test.ts',
            name: 'test.ts',
            content: 'const x = 1;',
        });

        expect(mockStore.addTab).toHaveBeenCalledWith(expect.objectContaining({
            language: 'typescript',
        }));
    });
});
