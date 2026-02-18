/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    onMenuAction: (callback: (action: string, value?: any) => void) => void;
    onFileOpened: (callback: (data: { path: string; content: string; name: string }) => void) => void;
    onFolderOpened: (callback: (data: { path: string; tree: any[] }) => void) => void;
    onFileSaveAsPath: (callback: (path: string) => void) => void;
    onFileSaved?: (callback: (data: { path: string; name: string }) => void) => void;
    openFile?: () => void;
    openFolder?: () => void;
    saveFile?: (content: string, path: string) => void;
    saveFileAs?: (content: string, suggestedName: string) => void;
    renameFile?: (oldPath: string, newName: string) => void;
    setAlwaysOnTop?: (value: boolean) => void;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<boolean>;
    readDir: (path: string) => Promise<any[]>;
    runCommand?: (command: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
    safeStorageEncrypt?: (plaintext: string) => Promise<string>;
    safeStorageDecrypt?: (base64: string) => Promise<string>;
    isSafeStorageAvailable?: () => Promise<boolean>;
  };
  showDirectoryPicker?: (options?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
  showOpenFilePicker?: (options?: { multiple?: boolean; types?: Array<{ description?: string; accept?: Record<string, string[]> }> }) => Promise<FileSystemFileHandle[]>;
  __editorAction?: (action: string, value?: unknown) => void;
}

interface HTMLInputElement {
  webkitdirectory: boolean;
}
