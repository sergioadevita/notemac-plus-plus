const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Listeners for main → renderer events
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (_, action, value) => callback(action, value)),
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (_, data) => callback(data)),
  onFolderOpened: (callback) => ipcRenderer.on('folder-opened', (_, data) => callback(data)),
  onFileSaveAsPath: (callback) => ipcRenderer.on('file-save-as-path', (_, path) => callback(path)),
  onFileSaved: (callback) => ipcRenderer.on('file-saved', (_, data) => callback(data)),

  // Renderer → main actions (dialogs)
  openFile: () => ipcRenderer.send('open-file-dialog'),
  openFolder: () => ipcRenderer.send('open-folder-dialog'),

  // File operations
  readFile: (path) => ipcRenderer.invoke('read-file', path),
  writeFile: (path, content) => ipcRenderer.invoke('write-file', path, content),
  readDir: (path) => ipcRenderer.invoke('read-dir', path),
  saveFile: (content, filePath) => ipcRenderer.invoke('write-file', filePath, content),
  saveFileAs: (content, suggestedName) => ipcRenderer.send('save-file-as-dialog', { content, suggestedName }),
  renameFile: (oldPath, newName) => ipcRenderer.send('rename-file', { oldPath, newName }),
  setAlwaysOnTop: (value) => ipcRenderer.send('set-always-on-top', value),
});
