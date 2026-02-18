const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (_, action, value) => callback(action, value)),
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (_, data) => callback(data)),
  onFolderOpened: (callback) => ipcRenderer.on('folder-opened', (_, data) => callback(data)),
  onFileSaveAsPath: (callback) => ipcRenderer.on('file-save-as-path', (_, path) => callback(path)),
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
  readDir: (path) => ipcRenderer.invoke('read-dir', path),
  safeStorageEncrypt: (plaintext) => ipcRenderer.invoke('safe-storage-encrypt', plaintext),
  safeStorageDecrypt: (base64) => ipcRenderer.invoke('safe-storage-decrypt', base64),
  isSafeStorageAvailable: () => ipcRenderer.invoke('safe-storage-available'),
});
