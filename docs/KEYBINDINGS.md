# Keybindings Reference

All default keyboard shortcuts in Notemac++. Shortcuts can be customized via Settings > Shortcut Mapper. Multiple preset mappings are available (Notemac++ Default, ReSharper) and can be selected from the dropdown in the Shortcut Mapper dialog. Plugins can also install custom preset mappings.

## Quick Access

| Shortcut | Action |
|---|---|
| `Cmd+Shift+P` | Command Palette |
| `Cmd+P` | Quick Open (file search) |
| `` Ctrl+` `` | Toggle Terminal |

## File Operations

| Shortcut | Action |
|---|---|
| `Cmd+N` | New file |
| `Cmd+O` | Open file |
| `Cmd+S` | Save |
| `Cmd+Shift+S` | Save As |
| `Cmd+Alt+S` | Save All |
| `Cmd+W` | Close tab |
| `Cmd+Shift+T` | Restore last closed tab |

## Editing

| Shortcut | Action |
|---|---|
| `Cmd+Z` | Undo |
| `Cmd+Shift+Z` | Redo |
| `Cmd+X` | Cut |
| `Cmd+C` | Copy |
| `Cmd+V` | Paste |
| `Cmd+A` | Select All |
| `Cmd+D` | Duplicate line |
| `Cmd+Shift+K` | Delete line |
| `Alt+T` | Transpose line |
| `Alt+Up` | Move line up |
| `Alt+Down` | Move line down |
| `Cmd+/` | Toggle comment |
| `Alt+Shift+A` | Block comment |
| `Cmd+Shift+U` | UPPERCASE |
| `Cmd+U` | lowercase |
| `Alt+C` | Column Editor |
| `Cmd+Shift+V` | Clipboard History |

## Search & Navigation

| Shortcut | Action |
|---|---|
| `Cmd+F` | Find |
| `Cmd+H` | Replace |
| `Cmd+Shift+F` | Find in Files |
| `Cmd+Alt+I` | Incremental Search |
| `Cmd+M` | Mark |
| `Cmd+G` | Go to Line |
| `Cmd+Shift+\` | Go to Matching Bracket |
| `Cmd+F2` | Toggle Bookmark |
| `F2` | Next Bookmark |
| `Shift+F2` | Previous Bookmark |

## View

| Shortcut | Action |
|---|---|
| `Cmd+B` | Toggle Sidebar |
| `Cmd++` | Zoom In |
| `Cmd+-` | Zoom Out |
| `Cmd+0` | Reset Zoom |
| `Alt+Z` | Toggle Word Wrap |
| `Cmd+K Cmd+0` | Fold All |
| `Cmd+K Cmd+J` | Unfold All |

## Macros

| Shortcut | Action |
|---|---|
| `Cmd+Shift+R` | Start / Stop Recording |
| `Cmd+Shift+P` | Playback Macro (Electron only; in web, use Macro menu or Command Palette) |

Note: In web mode, `Cmd+Shift+P` opens the Command Palette. Macro playback is accessible via the Macro menu, toolbar, or by searching "Playback" in the Command Palette.

## Settings

| Shortcut | Action |
|---|---|
| `Cmd+,` | Open Preferences |

## Formatting & Linting

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+I` | Format Document |
| `Ctrl+K Ctrl+F` | Format Selection |
| `F8` | Next Error |
| `Shift+F8` | Previous Error |

## Hex Editor & Binary Files

| Shortcut | Action |
|---|---|
| *(View as Hex)* | Switch to hex viewer (Command Palette) |
| *(View as Text)* | Switch to text view (Command Palette) |
| *(Hex: Go to Offset)* | Jump to offset in hex file (Command Palette) |
| *(Hex: Toggle Bytes Per Row)* | Switch between 8 and 16 bytes-per-row (Command Palette) |

**Note:** Hex editor commands are accessed via Command Palette. Default keyboard shortcuts can be customized via Settings > Keybindings.

## Collaboration & Git

| Shortcut | Action |
|---|---|
| *(Git Blame)* | Toggle Blame (View menu) |
| *(Merge Conflicts)* | Resolve Conflicts (View menu or inline actions) |
| *(Collaboration)* | Create / Join Session (Edit > Collaboration menu) |

**Note:** Git Blame, Merge Conflict Resolution, and Collaborative Editing features are accessed primarily through menu commands and inline controls. Breadcrumb Navigation, Sticky Scroll, Emmet Support, Print Support, and Git Stash Management are controlled via Settings or menu options.

## Compile & Run

| Shortcut | Action |
|---|---|
| `F5` | Run File |
| `Shift+F5` | Run with Arguments |
| `Ctrl+F5` | Stop Execution |
| `Cmd+Shift+Y` | Toggle Output Panel |

## Plugins

| Shortcut | Action |
|---|---|
| `Cmd+Shift+X` | Open Plugin Manager |

## Shortcut Mapping Presets

Notemac++ ships with two built-in shortcut mapping presets. Select a preset from the dropdown at the top of the Shortcut Mapper dialog. User overrides persist across preset switches.

### Notemac++ Default
The standard shortcut layout shown in the tables above.

### ReSharper
JetBrains ReSharper / IntelliJ IDEA style shortcuts. Key differences from the default preset:

| Action | Default | ReSharper |
|---|---|---|
| New File | `Cmd+N` | `Cmd+Alt+N` |
| Quick Open | `Cmd+P` | `Cmd+Shift+N` |
| Delete Line | `Cmd+Shift+K` | `Cmd+Y` |
| Move Line Up | `Alt+Up` | `Shift+Alt+Up` |
| Move Line Down | `Alt+Down` | `Shift+Alt+Down` |
| Replace | `Cmd+H` | `Cmd+R` |
| Go to Line | `Cmd+G` | `Cmd+L` |
| Command Palette | `Cmd+Shift+P` | `Cmd+Shift+A` |
| Toggle Sidebar | `Cmd+B` | `Alt+1` |
| Toggle Terminal | `` Ctrl+` `` | `Alt+F12` |
| Source Control | `Cmd+Shift+G` | `Alt+9` |
| AI Refactor | — | `Ctrl+Alt+R` |
| Fold All | `Cmd+K Cmd+0` | `Cmd+Shift+-` |
| Unfold All | `Cmd+K Cmd+J` | `Cmd+Shift+=` |
