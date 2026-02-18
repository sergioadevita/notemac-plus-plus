import { app, BrowserWindow, Menu, dialog, ipcMain, safeStorage } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  buildMenu();
}

function buildMenu() {
  const template = [
    {
      label: 'Notemac++',
      submenu: [
        { label: 'About Notemac++', role: 'about' },
        { type: 'separator' },
        { label: 'Preferences...', accelerator: 'Cmd+,', click: () => mainWindow.webContents.send('menu-action', 'preferences') },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-action', 'new') },
        { type: 'separator' },
        { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: () => handleFileOpen() },
        { label: 'Open Folder as Workspace', click: () => handleOpenFolder() },
        { label: 'Reload from Disk', click: () => mainWindow.webContents.send('menu-action', 'reload-from-disk') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('menu-action', 'save') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => handleFileSaveAs() },
        { label: 'Save All', click: () => mainWindow.webContents.send('menu-action', 'save-all') },
        { type: 'separator' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', click: () => mainWindow.webContents.send('menu-action', 'close-tab') },
        { label: 'Close All', click: () => mainWindow.webContents.send('menu-action', 'close-all') },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Duplicate Line', accelerator: 'CmdOrCtrl+D', click: () => mainWindow.webContents.send('menu-action', 'duplicate-line') },
        { label: 'Sort Lines Ascending', click: () => mainWindow.webContents.send('menu-action', 'sort-asc') },
        { label: 'Sort Lines Descending', click: () => mainWindow.webContents.send('menu-action', 'sort-desc') },
        { type: 'separator' },
        { label: 'UPPERCASE', click: () => mainWindow.webContents.send('menu-action', 'uppercase') },
        { label: 'lowercase', click: () => mainWindow.webContents.send('menu-action', 'lowercase') },
        { type: 'separator' },
        { label: 'Remove Duplicate Lines', click: () => mainWindow.webContents.send('menu-action', 'remove-duplicates') },
        { label: 'Remove Empty Lines', click: () => mainWindow.webContents.send('menu-action', 'remove-empty-lines') },
        { label: 'Trim Trailing Spaces', click: () => mainWindow.webContents.send('menu-action', 'trim-trailing') },
      ],
    },
    {
      label: 'Search',
      submenu: [
        { label: 'Find...', accelerator: 'CmdOrCtrl+F', click: () => mainWindow.webContents.send('menu-action', 'find') },
        { label: 'Replace...', accelerator: 'CmdOrCtrl+H', click: () => mainWindow.webContents.send('menu-action', 'replace') },
        { label: 'Find in Files...', accelerator: 'CmdOrCtrl+Shift+F', click: () => mainWindow.webContents.send('menu-action', 'find-in-files') },
        { type: 'separator' },
        { label: 'Go to Line...', accelerator: 'CmdOrCtrl+G', click: () => mainWindow.webContents.send('menu-action', 'goto-line') },
        { type: 'separator' },
        { label: 'Toggle Bookmark', accelerator: 'CmdOrCtrl+F2', click: () => mainWindow.webContents.send('menu-action', 'toggle-bookmark') },
        { label: 'Next Bookmark', accelerator: 'F2', click: () => mainWindow.webContents.send('menu-action', 'next-bookmark') },
        { label: 'Previous Bookmark', accelerator: 'Shift+F2', click: () => mainWindow.webContents.send('menu-action', 'prev-bookmark') },
        { label: 'Clear All Bookmarks', click: () => mainWindow.webContents.send('menu-action', 'clear-bookmarks') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Word Wrap', type: 'checkbox', click: (item) => mainWindow.webContents.send('menu-action', 'word-wrap', item.checked) },
        { type: 'separator' },
        { label: 'Show Whitespace', type: 'checkbox', click: (item) => mainWindow.webContents.send('menu-action', 'show-whitespace', item.checked) },
        { label: 'Show End of Line', type: 'checkbox', click: (item) => mainWindow.webContents.send('menu-action', 'show-eol', item.checked) },
        { label: 'Show Indent Guide', type: 'checkbox', checked: true, click: (item) => mainWindow.webContents.send('menu-action', 'indent-guide', item.checked) },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => mainWindow.webContents.send('menu-action', 'zoom-in') },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.send('menu-action', 'zoom-out') },
        { label: 'Restore Default Zoom', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.send('menu-action', 'zoom-reset') },
        { type: 'separator' },
        { label: 'Toggle Minimap', type: 'checkbox', checked: true, click: (item) => mainWindow.webContents.send('menu-action', 'toggle-minimap', item.checked) },
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B', click: () => mainWindow.webContents.send('menu-action', 'toggle-sidebar') },
        { type: 'separator' },
        { label: 'Split Editor Right', click: () => mainWindow.webContents.send('menu-action', 'split-right') },
        { label: 'Split Editor Down', click: () => mainWindow.webContents.send('menu-action', 'split-down') },
        { label: 'Close Split', click: () => mainWindow.webContents.send('menu-action', 'close-split') },
        { type: 'separator' },
        { label: 'Toggle Full Screen', accelerator: 'Ctrl+Cmd+F', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Encoding',
      submenu: [
        { label: 'UTF-8', type: 'radio', click: () => mainWindow.webContents.send('menu-action', 'encoding', 'utf-8') },
        { label: 'UTF-8 with BOM', type: 'radio', click: () => mainWindow.webContents.send('menu-action', 'encoding', 'utf-8-bom') },
        { label: 'UTF-16 LE', type: 'radio', click: () => mainWindow.webContents.send('menu-action', 'encoding', 'utf-16le') },
        { label: 'UTF-16 BE', type: 'radio', click: () => mainWindow.webContents.send('menu-action', 'encoding', 'utf-16be') },
        { label: 'ISO 8859-1 (Latin)', type: 'radio', click: () => mainWindow.webContents.send('menu-action', 'encoding', 'iso-8859-1') },
        { label: 'Windows-1252', type: 'radio', click: () => mainWindow.webContents.send('menu-action', 'encoding', 'windows-1252') },
      ],
    },
    {
      label: 'Language',
      submenu: [
        { label: 'Plain Text', click: () => mainWindow.webContents.send('menu-action', 'language', 'plaintext') },
        { type: 'separator' },
        { label: 'C', click: () => mainWindow.webContents.send('menu-action', 'language', 'c') },
        { label: 'C++', click: () => mainWindow.webContents.send('menu-action', 'language', 'cpp') },
        { label: 'C#', click: () => mainWindow.webContents.send('menu-action', 'language', 'csharp') },
        { label: 'CSS', click: () => mainWindow.webContents.send('menu-action', 'language', 'css') },
        { label: 'Go', click: () => mainWindow.webContents.send('menu-action', 'language', 'go') },
        { label: 'HTML', click: () => mainWindow.webContents.send('menu-action', 'language', 'html') },
        { label: 'Java', click: () => mainWindow.webContents.send('menu-action', 'language', 'java') },
        { label: 'JavaScript', click: () => mainWindow.webContents.send('menu-action', 'language', 'javascript') },
        { label: 'JSON', click: () => mainWindow.webContents.send('menu-action', 'language', 'json') },
        { label: 'Markdown', click: () => mainWindow.webContents.send('menu-action', 'language', 'markdown') },
        { label: 'PHP', click: () => mainWindow.webContents.send('menu-action', 'language', 'php') },
        { label: 'Python', click: () => mainWindow.webContents.send('menu-action', 'language', 'python') },
        { label: 'Ruby', click: () => mainWindow.webContents.send('menu-action', 'language', 'ruby') },
        { label: 'Rust', click: () => mainWindow.webContents.send('menu-action', 'language', 'rust') },
        { label: 'SQL', click: () => mainWindow.webContents.send('menu-action', 'language', 'sql') },
        { label: 'Swift', click: () => mainWindow.webContents.send('menu-action', 'language', 'swift') },
        { label: 'TypeScript', click: () => mainWindow.webContents.send('menu-action', 'language', 'typescript') },
        { label: 'XML', click: () => mainWindow.webContents.send('menu-action', 'language', 'xml') },
        { label: 'YAML', click: () => mainWindow.webContents.send('menu-action', 'language', 'yaml') },
      ],
    },
    {
      label: 'Macro',
      submenu: [
        { label: 'Start Recording', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow.webContents.send('menu-action', 'macro-start') },
        { label: 'Stop Recording', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow.webContents.send('menu-action', 'macro-stop') },
        { label: 'Playback', accelerator: 'CmdOrCtrl+Shift+P', click: () => mainWindow.webContents.send('menu-action', 'macro-playback') },
        { type: 'separator' },
        { label: 'Run Macro Multiple Times...', click: () => mainWindow.webContents.send('menu-action', 'macro-run-multiple') },
        { label: 'Save Recorded Macro...', click: () => mainWindow.webContents.send('menu-action', 'macro-save') },
      ],
    },
    {
      label: 'Tools',
      submenu: [
        { label: 'MD5 Hash', click: () => mainWindow.webContents.send('menu-action', 'hash-md5') },
        { label: 'SHA-1 Hash', click: () => mainWindow.webContents.send('menu-action', 'hash-sha1') },
        { label: 'SHA-256 Hash', click: () => mainWindow.webContents.send('menu-action', 'hash-sha256') },
        { label: 'SHA-512 Hash', click: () => mainWindow.webContents.send('menu-action', 'hash-sha512') },
        { type: 'separator' },
        { label: 'Base64 Encode', click: () => mainWindow.webContents.send('menu-action', 'base64-encode') },
        { label: 'Base64 Decode', click: () => mainWindow.webContents.send('menu-action', 'base64-decode') },
        { type: 'separator' },
        { label: 'URL Encode', click: () => mainWindow.webContents.send('menu-action', 'url-encode') },
        { label: 'URL Decode', click: () => mainWindow.webContents.send('menu-action', 'url-decode') },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function handleFileOpen() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Text Files', extensions: ['txt', 'md', 'log'] },
      { name: 'Source Code', extensions: ['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'c', 'cpp', 'h', 'java', 'swift', 'php'] },
      { name: 'Web Files', extensions: ['html', 'css', 'json', 'xml', 'yaml', 'yml'] },
    ],
  });

  if (!result.canceled) {
    for (const filePath of result.filePaths) {
      const content = fs.readFileSync(filePath, 'utf-8');
      mainWindow.webContents.send('file-opened', { path: filePath, content, name: path.basename(filePath) });
    }
  }
}

async function handleOpenFolder() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0];
    const tree = buildFileTree(folderPath);
    mainWindow.webContents.send('folder-opened', { path: folderPath, tree });
  }
}

function buildFileTree(dirPath, depth = 0) {
  if (depth > 5) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries
    .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules')
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    })
    .map(entry => ({
      name: entry.name,
      path: path.join(dirPath, entry.name),
      isDirectory: entry.isDirectory(),
      children: entry.isDirectory() ? buildFileTree(path.join(dirPath, entry.name), depth + 1) : undefined,
    }));
}

async function handleFileSaveAs() {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Text Files', extensions: ['txt'] },
    ],
  });

  if (!result.canceled) {
    mainWindow.webContents.send('file-save-as-path', result.filePath);
  }
}

ipcMain.handle('read-file', async (_, filePath) => {
  return fs.readFileSync(filePath, 'utf-8');
});

ipcMain.handle('write-file', async (_, filePath, content) => {
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
});

ipcMain.handle('read-dir', async (_, dirPath) => {
  return buildFileTree(dirPath);
});

// Safe Storage — OS keychain encryption for credentials
ipcMain.handle('safe-storage-encrypt', (_, plaintext) => {
  try {
    const encrypted = safeStorage.encryptString(plaintext);
    return encrypted.toString('base64');
  } catch (e) {
    console.error('SafeStorage encrypt failed:', e);
    return null;
  }
});

ipcMain.handle('safe-storage-decrypt', (_, base64) => {
  try {
    const encrypted = Buffer.from(base64, 'base64');
    return safeStorage.decryptString(encrypted);
  } catch (e) {
    console.error('SafeStorage decrypt failed:', e);
    return null;
  }
});

ipcMain.handle('safe-storage-available', () => {
  return safeStorage.isEncryptionAvailable();
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
