use tauri::{
    menu::{Menu, MenuBuilder, MenuItemBuilder, SubmenuBuilder, PredefinedMenuItem, CheckMenuItemBuilder},
    AppHandle, Emitter,
};

// ─── Menu Action Event ──────────────────────────────────────────

#[derive(Clone, serde::Serialize)]
struct MenuActionPayload
{
    action: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    value: Option<serde_json::Value>,
}

fn emit_action(app: &AppHandle, action: &str, value: Option<serde_json::Value>)
{
    let _ = app.emit("menu-action", MenuActionPayload {
        action: action.to_string(),
        value,
    });
}

// ─── Helpers ────────────────────────────────────────────────────

/// Creates a simple menu item that emits a menu-action event
macro_rules! action_item {
    ($builder:expr, $id:expr, $label:expr, $app:expr) => {{
        let item = MenuItemBuilder::new($label)
            .id($id)
            .build($app)
            .expect(&format!("Failed to build menu item: {}", $id));
        $builder = $builder.item(&item);
    }};
    ($builder:expr, $id:expr, $label:expr, $accel:expr, $app:expr) => {{
        let item = MenuItemBuilder::new($label)
            .id($id)
            .accelerator($accel)
            .build($app)
            .expect(&format!("Failed to build menu item: {}", $id));
        $builder = $builder.item(&item);
    }};
}

macro_rules! check_item {
    ($builder:expr, $id:expr, $label:expr, $checked:expr, $app:expr) => {{
        let item = CheckMenuItemBuilder::new($label)
            .id($id)
            .checked($checked)
            .build($app)
            .expect(&format!("Failed to build check item: {}", $id));
        $builder = $builder.item(&item);
    }};
}

macro_rules! separator {
    ($builder:expr, $app:expr) => {{
        let sep = PredefinedMenuItem::separator($app)
            .expect("Failed to build separator");
        $builder = $builder.item(&sep);
    }};
}

// ─── Build Menu ─────────────────────────────────────────────────

pub fn build_menu(app: &AppHandle) -> Result<Menu<tauri::Wry>, tauri::Error>
{
    // ── App Menu (Notemac++) ─────────────────────────────────────
    let about = PredefinedMenuItem::about(app, Some("About Notemac++"), None)?;
    let hide = PredefinedMenuItem::hide(app, None)?;
    let hide_others = PredefinedMenuItem::hide_others(app, None)?;
    let show_all = PredefinedMenuItem::show_all(app, None)?;
    let quit = PredefinedMenuItem::quit(app, None)?;

    let mut app_menu = SubmenuBuilder::new(app, "Notemac++")
        .item(&about);
    separator!(app_menu, app);
    action_item!(app_menu, "preferences", "Preferences...", "CmdOrCtrl+,", app);
    action_item!(app_menu, "shortcut-mapper", "Shortcut Mapper...", app);
    separator!(app_menu, app);
    app_menu = app_menu.item(&hide).item(&hide_others).item(&show_all);
    separator!(app_menu, app);
    app_menu = app_menu.item(&quit);
    let app_submenu = app_menu.build()?;

    // ── File Menu ───────────────────────────────────────────────
    let mut file_menu = SubmenuBuilder::new(app, "File");
    action_item!(file_menu, "new", "New", "CmdOrCtrl+N", app);
    separator!(file_menu, app);
    action_item!(file_menu, "open", "Open...", "CmdOrCtrl+O", app);
    action_item!(file_menu, "open-folder", "Open Folder as Workspace", app);
    action_item!(file_menu, "reload-from-disk", "Reload from Disk", app);
    separator!(file_menu, app);
    action_item!(file_menu, "save", "Save", "CmdOrCtrl+S", app);
    action_item!(file_menu, "save-as", "Save As...", "CmdOrCtrl+Shift+S", app);
    action_item!(file_menu, "save-copy-as", "Save Copy As...", app);
    action_item!(file_menu, "save-all", "Save All", app);
    separator!(file_menu, app);
    action_item!(file_menu, "rename-file", "Rename...", app);
    action_item!(file_menu, "delete-file", "Delete from Disk", app);
    separator!(file_menu, app);
    action_item!(file_menu, "restore-last-closed", "Restore Last Closed Tab", "CmdOrCtrl+Shift+T", app);
    separator!(file_menu, app);
    action_item!(file_menu, "close-tab", "Close Tab", "CmdOrCtrl+W", app);
    action_item!(file_menu, "close-all", "Close All", app);
    action_item!(file_menu, "close-others", "Close Others", app);
    action_item!(file_menu, "close-tabs-to-left", "Close Tabs to Left", app);
    action_item!(file_menu, "close-tabs-to-right", "Close Tabs to Right", app);
    action_item!(file_menu, "close-unchanged", "Close Unchanged", app);
    action_item!(file_menu, "close-all-but-pinned", "Close All but Pinned", app);
    separator!(file_menu, app);
    action_item!(file_menu, "pin-tab", "Pin Tab", app);
    separator!(file_menu, app);
    action_item!(file_menu, "load-session", "Load Session...", app);
    action_item!(file_menu, "save-session", "Save Session...", app);
    separator!(file_menu, app);
    action_item!(file_menu, "print", "Print...", "CmdOrCtrl+P", app);
    let file_submenu = file_menu.build()?;

    // ── Edit Menu ───────────────────────────────────────────────
    let undo = PredefinedMenuItem::undo(app, None)?;
    let redo = PredefinedMenuItem::redo(app, None)?;
    let cut = PredefinedMenuItem::cut(app, None)?;
    let copy = PredefinedMenuItem::copy(app, None)?;
    let paste = PredefinedMenuItem::paste(app, None)?;
    let select_all = PredefinedMenuItem::select_all(app, None)?;

    let mut edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(&undo)
        .item(&redo);
    separator!(edit_menu, app);
    edit_menu = edit_menu.item(&cut).item(&copy).item(&paste).item(&select_all);
    separator!(edit_menu, app);
    action_item!(edit_menu, "duplicate-line", "Duplicate Line", "CmdOrCtrl+D", app);
    action_item!(edit_menu, "delete-line", "Delete Line", "CmdOrCtrl+Shift+K", app);
    action_item!(edit_menu, "transpose-line", "Transpose Line", app);
    action_item!(edit_menu, "move-line-up", "Move Line Up", "Alt+Up", app);
    action_item!(edit_menu, "move-line-down", "Move Line Down", "Alt+Down", app);
    action_item!(edit_menu, "split-lines", "Split Lines", app);
    action_item!(edit_menu, "join-lines", "Join Lines", app);
    separator!(edit_menu, app);
    action_item!(edit_menu, "toggle-comment", "Toggle Comment", "CmdOrCtrl+/", app);
    action_item!(edit_menu, "block-comment", "Block Comment", "CmdOrCtrl+Shift+A", app);
    separator!(edit_menu, app);
    action_item!(edit_menu, "uppercase", "UPPERCASE", "CmdOrCtrl+Shift+U", app);
    action_item!(edit_menu, "lowercase", "lowercase", "CmdOrCtrl+U", app);
    action_item!(edit_menu, "proper-case", "Proper Case", app);
    action_item!(edit_menu, "sentence-case", "Sentence Case", app);
    action_item!(edit_menu, "invert-case", "Invert Case", app);
    action_item!(edit_menu, "random-case", "Random Case", app);
    separator!(edit_menu, app);
    action_item!(edit_menu, "insert-datetime", "Insert Date/Time", app);
    separator!(edit_menu, app);
    action_item!(edit_menu, "column-editor", "Column Editor...", "Alt+C", app);
    action_item!(edit_menu, "clipboard-history", "Clipboard History", "CmdOrCtrl+Shift+V", app);
    action_item!(edit_menu, "char-panel", "Character Panel", app);
    separator!(edit_menu, app);
    action_item!(edit_menu, "copy-file-path", "Copy File Path", app);
    action_item!(edit_menu, "copy-file-name", "Copy File Name", app);
    action_item!(edit_menu, "copy-file-dir", "Copy File Dir", app);
    separator!(edit_menu, app);
    action_item!(edit_menu, "toggle-readonly", "Set Read-Only", app);
    let edit_submenu = edit_menu.build()?;

    // ── Search Menu ─────────────────────────────────────────────
    let mut search_menu = SubmenuBuilder::new(app, "Search");
    action_item!(search_menu, "find", "Find...", "CmdOrCtrl+F", app);
    action_item!(search_menu, "replace", "Replace...", "CmdOrCtrl+H", app);
    action_item!(search_menu, "find-in-files", "Find in Files...", "CmdOrCtrl+Shift+F", app);
    action_item!(search_menu, "incremental-search", "Incremental Search", app);
    separator!(search_menu, app);
    action_item!(search_menu, "mark", "Mark...", app);
    action_item!(search_menu, "clear-marks", "Clear All Marks", app);
    separator!(search_menu, app);
    action_item!(search_menu, "goto-line", "Go to Line...", "CmdOrCtrl+G", app);
    action_item!(search_menu, "goto-bracket", "Go to Matching Bracket", "CmdOrCtrl+Shift+\\", app);
    separator!(search_menu, app);
    action_item!(search_menu, "toggle-bookmark", "Toggle Bookmark", "CmdOrCtrl+F2", app);
    action_item!(search_menu, "next-bookmark", "Next Bookmark", "F2", app);
    action_item!(search_menu, "prev-bookmark", "Previous Bookmark", "Shift+F2", app);
    action_item!(search_menu, "clear-bookmarks", "Clear All Bookmarks", app);
    separator!(search_menu, app);
    action_item!(search_menu, "find-char-in-range", "Find Characters in Range...", app);
    let search_submenu = search_menu.build()?;

    // ── View Menu ───────────────────────────────────────────────
    let mut view_menu = SubmenuBuilder::new(app, "View");
    check_item!(view_menu, "word-wrap", "Word Wrap", false, app);
    separator!(view_menu, app);
    check_item!(view_menu, "show-whitespace", "Show Whitespace", false, app);
    check_item!(view_menu, "show-eol", "Show End of Line", false, app);
    check_item!(view_menu, "show-non-printable", "Show Non-Printable Characters", false, app);
    check_item!(view_menu, "show-wrap-symbol", "Show Wrap Symbol", false, app);
    check_item!(view_menu, "indent-guide", "Show Indent Guides", true, app);
    check_item!(view_menu, "show-line-numbers", "Show Line Numbers", true, app);
    check_item!(view_menu, "toggle-minimap", "Show Minimap", true, app);
    separator!(view_menu, app);
    action_item!(view_menu, "fold-all", "Fold All", app);
    action_item!(view_menu, "unfold-all", "Unfold All", app);
    separator!(view_menu, app);
    action_item!(view_menu, "zoom-in", "Zoom In", "CmdOrCtrl+=", app);
    action_item!(view_menu, "zoom-out", "Zoom Out", "CmdOrCtrl+-", app);
    action_item!(view_menu, "zoom-reset", "Restore Default Zoom", "CmdOrCtrl+0", app);
    separator!(view_menu, app);
    action_item!(view_menu, "toggle-sidebar", "Toggle Sidebar", "CmdOrCtrl+B", app);
    action_item!(view_menu, "show-doc-list", "Document List", app);
    action_item!(view_menu, "show-function-list", "Function List", app);
    action_item!(view_menu, "show-project-panel", "Project Panel", app);
    separator!(view_menu, app);
    check_item!(view_menu, "distraction-free", "Distraction-Free Mode", false, app);
    check_item!(view_menu, "always-on-top", "Always on Top", false, app);
    separator!(view_menu, app);
    action_item!(view_menu, "split-right", "Split Editor Right", app);
    action_item!(view_menu, "split-down", "Split Editor Down", app);
    action_item!(view_menu, "close-split", "Close Split", app);
    separator!(view_menu, app);
    action_item!(view_menu, "show-summary", "Summary...", app);
    action_item!(view_menu, "toggle-monitoring", "Monitoring (tail -f)", app);
    separator!(view_menu, app);
    let fullscreen = PredefinedMenuItem::fullscreen(app, None)?;
    view_menu = view_menu.item(&fullscreen);
    let view_submenu = view_menu.build()?;

    // ── Encoding Menu ───────────────────────────────────────────
    let mut encoding_menu = SubmenuBuilder::new(app, "Encoding");
    action_item!(encoding_menu, "encoding-utf-8", "UTF-8", app);
    action_item!(encoding_menu, "encoding-utf-8-bom", "UTF-8 with BOM", app);
    action_item!(encoding_menu, "encoding-utf-16le", "UTF-16 LE", app);
    action_item!(encoding_menu, "encoding-utf-16be", "UTF-16 BE", app);
    action_item!(encoding_menu, "encoding-iso-8859-1", "ISO 8859-1 (Latin)", app);
    action_item!(encoding_menu, "encoding-windows-1252", "Windows-1252", app);
    separator!(encoding_menu, app);
    action_item!(encoding_menu, "line-ending-lf", "Line Ending: LF (Unix/Mac)", app);
    action_item!(encoding_menu, "line-ending-crlf", "Line Ending: CRLF (Windows)", app);
    action_item!(encoding_menu, "line-ending-cr", "Line Ending: CR (Old Mac)", app);
    let encoding_submenu = encoding_menu.build()?;

    // ── Language Menu ───────────────────────────────────────────
    let mut lang_menu = SubmenuBuilder::new(app, "Language");
    action_item!(lang_menu, "lang-plaintext", "Plain Text", app);
    separator!(lang_menu, app);
    action_item!(lang_menu, "lang-c", "C", app);
    action_item!(lang_menu, "lang-cpp", "C++", app);
    action_item!(lang_menu, "lang-csharp", "C#", app);
    action_item!(lang_menu, "lang-css", "CSS", app);
    action_item!(lang_menu, "lang-go", "Go", app);
    action_item!(lang_menu, "lang-html", "HTML", app);
    action_item!(lang_menu, "lang-java", "Java", app);
    action_item!(lang_menu, "lang-javascript", "JavaScript", app);
    action_item!(lang_menu, "lang-json", "JSON", app);
    action_item!(lang_menu, "lang-markdown", "Markdown", app);
    action_item!(lang_menu, "lang-php", "PHP", app);
    action_item!(lang_menu, "lang-python", "Python", app);
    action_item!(lang_menu, "lang-ruby", "Ruby", app);
    action_item!(lang_menu, "lang-rust", "Rust", app);
    action_item!(lang_menu, "lang-sql", "SQL", app);
    action_item!(lang_menu, "lang-swift", "Swift", app);
    action_item!(lang_menu, "lang-typescript", "TypeScript", app);
    action_item!(lang_menu, "lang-xml", "XML", app);
    action_item!(lang_menu, "lang-yaml", "YAML", app);
    let lang_submenu = lang_menu.build()?;

    // ── Line Ops Menu ───────────────────────────────────────────
    let mut lineops_menu = SubmenuBuilder::new(app, "Line Ops");
    action_item!(lineops_menu, "sort-asc", "Sort Lines Ascending", app);
    action_item!(lineops_menu, "sort-desc", "Sort Lines Descending", app);
    action_item!(lineops_menu, "sort-asc-ci", "Sort Lines Case Insensitive (Asc)", app);
    action_item!(lineops_menu, "sort-desc-ci", "Sort Lines Case Insensitive (Desc)", app);
    action_item!(lineops_menu, "sort-len-asc", "Sort Lines by Length (Asc)", app);
    action_item!(lineops_menu, "sort-len-desc", "Sort Lines by Length (Desc)", app);
    separator!(lineops_menu, app);
    action_item!(lineops_menu, "remove-duplicates", "Remove Duplicate Lines", app);
    action_item!(lineops_menu, "remove-consecutive-duplicates", "Remove Consecutive Duplicate Lines", app);
    action_item!(lineops_menu, "remove-empty-lines", "Remove Empty Lines", app);
    action_item!(lineops_menu, "remove-blank-lines", "Remove Empty Lines (Containing Blank)", app);
    separator!(lineops_menu, app);
    action_item!(lineops_menu, "trim-trailing", "Trim Trailing Spaces", app);
    action_item!(lineops_menu, "trim-leading", "Trim Leading Spaces", app);
    action_item!(lineops_menu, "trim-both", "Trim Leading and Trailing Spaces", app);
    action_item!(lineops_menu, "eol-to-space", "EOL to Space", app);
    separator!(lineops_menu, app);
    action_item!(lineops_menu, "tab-to-space", "TAB to Space", app);
    action_item!(lineops_menu, "space-to-tab-leading", "Space to TAB (Leading)", app);
    action_item!(lineops_menu, "space-to-tab-all", "Space to TAB (All)", app);
    separator!(lineops_menu, app);
    action_item!(lineops_menu, "insert-blank-above", "Insert Blank Line Above", app);
    action_item!(lineops_menu, "insert-blank-below", "Insert Blank Line Below", app);
    action_item!(lineops_menu, "reverse-lines", "Reverse Line Order", app);
    let lineops_submenu = lineops_menu.build()?;

    // ── Macro Menu ──────────────────────────────────────────────
    let mut macro_menu = SubmenuBuilder::new(app, "Macro");
    action_item!(macro_menu, "macro-start", "Start Recording", "CmdOrCtrl+Shift+R", app);
    action_item!(macro_menu, "macro-stop", "Stop Recording", app);
    action_item!(macro_menu, "macro-playback", "Playback", "CmdOrCtrl+Shift+P", app);
    separator!(macro_menu, app);
    action_item!(macro_menu, "macro-run-multiple", "Run Macro Multiple Times...", app);
    action_item!(macro_menu, "macro-save", "Save Recorded Macro...", app);
    let macro_submenu = macro_menu.build()?;

    // ── Run Menu ────────────────────────────────────────────────
    let mut run_menu = SubmenuBuilder::new(app, "Run");
    action_item!(run_menu, "run-command", "Run Command...", app);
    separator!(run_menu, app);
    action_item!(run_menu, "search-google", "Search on Google", app);
    action_item!(run_menu, "search-wikipedia", "Search on Wikipedia", app);
    action_item!(run_menu, "open-in-browser", "Open in Browser", app);
    let run_submenu = run_menu.build()?;

    // ── Tools Menu ──────────────────────────────────────────────
    let mut tools_menu = SubmenuBuilder::new(app, "Tools");
    action_item!(tools_menu, "hash-md5", "MD5 - Generate", app);
    action_item!(tools_menu, "hash-md5-clipboard", "MD5 - Copy to Clipboard", app);
    action_item!(tools_menu, "hash-sha1", "SHA-1 - Generate", app);
    action_item!(tools_menu, "hash-sha1-clipboard", "SHA-1 - Copy to Clipboard", app);
    action_item!(tools_menu, "hash-sha256", "SHA-256 - Generate", app);
    action_item!(tools_menu, "hash-sha256-clipboard", "SHA-256 - Copy to Clipboard", app);
    action_item!(tools_menu, "hash-sha512", "SHA-512 - Generate", app);
    action_item!(tools_menu, "hash-sha512-clipboard", "SHA-512 - Copy to Clipboard", app);
    separator!(tools_menu, app);
    action_item!(tools_menu, "hash-md5-file", "MD5 - Generate from File", app);
    action_item!(tools_menu, "hash-sha256-file", "SHA-256 - Generate from File", app);
    separator!(tools_menu, app);
    action_item!(tools_menu, "base64-encode", "Base64 Encode", app);
    action_item!(tools_menu, "base64-decode", "Base64 Decode", app);
    separator!(tools_menu, app);
    action_item!(tools_menu, "url-encode", "URL Encode", app);
    action_item!(tools_menu, "url-decode", "URL Decode", app);
    separator!(tools_menu, app);
    action_item!(tools_menu, "json-format", "JSON Format", app);
    action_item!(tools_menu, "json-minify", "JSON Minify", app);
    let tools_submenu = tools_menu.build()?;

    // ── Window Menu ─────────────────────────────────────────────
    let minimize = PredefinedMenuItem::minimize(app, None)?;
    let zoom = PredefinedMenuItem::maximize(app, None)?;
    let window_submenu = SubmenuBuilder::new(app, "Window")
        .item(&minimize)
        .item(&zoom)
        .build()?;

    // ── Build Full Menu ─────────────────────────────────────────
    MenuBuilder::new(app)
        .item(&app_submenu)
        .item(&file_submenu)
        .item(&edit_submenu)
        .item(&search_submenu)
        .item(&view_submenu)
        .item(&encoding_submenu)
        .item(&lang_submenu)
        .item(&lineops_submenu)
        .item(&macro_submenu)
        .item(&run_submenu)
        .item(&tools_submenu)
        .item(&window_submenu)
        .build()
}

// ─── Menu Event Handler ─────────────────────────────────────────

// ─── Menu Event Routing ─────────────────────────────────────────

/// Parsed result of a menu event ID.
#[derive(Debug, Clone, PartialEq)]
pub enum MenuEventAction
{
    /// Encoding change: action="encoding", value=encoding name
    Encoding(String),
    /// Language change: action="language", value=language name
    Language(String),
    /// Line ending change: action="line-ending", value=uppercased ending
    LineEnding(String),
    /// Checkbox toggle: action=event_id, no value
    Checkbox(String),
    /// Dialog command: open file or folder picker
    Dialog(String),
    /// Generic action: ID maps directly to action string
    Action(String),
}

/// List of menu item IDs that represent checkbox toggles.
pub const CHECKBOX_IDS: &[&str] = &[
    "word-wrap", "show-whitespace", "show-eol", "show-non-printable",
    "show-wrap-symbol", "indent-guide", "show-line-numbers", "toggle-minimap",
    "distraction-free", "always-on-top",
];

/// Pure function: parses a menu event ID into a structured action.
/// This contains all the routing logic, separated from side effects.
pub fn parse_menu_event(event_id: &str) -> MenuEventAction
{
    // Encoding items: "encoding-utf-8" → Encoding("utf-8")
    if let Some(encoding) = event_id.strip_prefix("encoding-")
    {
        return MenuEventAction::Encoding(encoding.to_string());
    }

    // Language items: "lang-javascript" → Language("javascript")
    if let Some(lang) = event_id.strip_prefix("lang-")
    {
        return MenuEventAction::Language(lang.to_string());
    }

    // Line ending items: "line-ending-lf" → LineEnding("LF")
    if let Some(le) = event_id.strip_prefix("line-ending-")
    {
        return MenuEventAction::LineEnding(le.to_uppercase());
    }

    // Checkbox items
    if CHECKBOX_IDS.contains(&event_id)
    {
        return MenuEventAction::Checkbox(event_id.to_string());
    }

    // Dialog commands
    if event_id == "open" || event_id == "open-folder"
    {
        return MenuEventAction::Dialog(event_id.to_string());
    }

    // All other items: generic action
    MenuEventAction::Action(event_id.to_string())
}

/// Maps menu item IDs to action strings and emits them to the frontend.
/// For items with values (encoding, language, line-ending), we parse the
/// ID prefix and send the value separately.
pub fn handle_menu_event(app: &AppHandle, event_id: &str)
{
    match parse_menu_event(event_id)
    {
        MenuEventAction::Encoding(enc) => {
            emit_action(app, "encoding", Some(serde_json::Value::String(enc)));
        },
        MenuEventAction::Language(lang) => {
            emit_action(app, "language", Some(serde_json::Value::String(lang)));
        },
        MenuEventAction::LineEnding(le) => {
            emit_action(app, "line-ending", Some(serde_json::Value::String(le)));
        },
        MenuEventAction::Checkbox(id) => {
            emit_action(app, &id, None);
        },
        MenuEventAction::Dialog(id) => {
            match id.as_str()
            {
                "open" => {
                    let app_clone = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let _ = crate::commands::dialog_operations::open_file_dialog(app_clone).await;
                    });
                },
                "open-folder" => {
                    let app_clone = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let _ = crate::commands::dialog_operations::open_folder_dialog(app_clone).await;
                    });
                },
                _ => {}
            }
        },
        MenuEventAction::Action(id) => {
            emit_action(app, &id, None);
        },
    }
}

// ─── Tests ─────────────────────────────────────────────────────

#[cfg(test)]
mod tests
{
    use super::*;

    // ── Encoding parsing ─────────────────────────────────────────

    #[test]
    fn parse_encoding_utf8()
    {
        assert_eq!(
            parse_menu_event("encoding-utf-8"),
            MenuEventAction::Encoding("utf-8".into())
        );
    }

    #[test]
    fn parse_encoding_utf8_bom()
    {
        assert_eq!(
            parse_menu_event("encoding-utf-8-bom"),
            MenuEventAction::Encoding("utf-8-bom".into())
        );
    }

    #[test]
    fn parse_encoding_utf16le()
    {
        assert_eq!(
            parse_menu_event("encoding-utf-16le"),
            MenuEventAction::Encoding("utf-16le".into())
        );
    }

    #[test]
    fn parse_encoding_windows_1252()
    {
        assert_eq!(
            parse_menu_event("encoding-windows-1252"),
            MenuEventAction::Encoding("windows-1252".into())
        );
    }

    // ── Language parsing ─────────────────────────────────────────

    #[test]
    fn parse_language_javascript()
    {
        assert_eq!(
            parse_menu_event("lang-javascript"),
            MenuEventAction::Language("javascript".into())
        );
    }

    #[test]
    fn parse_language_typescript()
    {
        assert_eq!(
            parse_menu_event("lang-typescript"),
            MenuEventAction::Language("typescript".into())
        );
    }

    #[test]
    fn parse_language_rust()
    {
        assert_eq!(
            parse_menu_event("lang-rust"),
            MenuEventAction::Language("rust".into())
        );
    }

    #[test]
    fn parse_language_plaintext()
    {
        assert_eq!(
            parse_menu_event("lang-plaintext"),
            MenuEventAction::Language("plaintext".into())
        );
    }

    // ── Line ending parsing ──────────────────────────────────────

    #[test]
    fn parse_line_ending_lf()
    {
        assert_eq!(
            parse_menu_event("line-ending-lf"),
            MenuEventAction::LineEnding("LF".into())
        );
    }

    #[test]
    fn parse_line_ending_crlf()
    {
        assert_eq!(
            parse_menu_event("line-ending-crlf"),
            MenuEventAction::LineEnding("CRLF".into())
        );
    }

    #[test]
    fn parse_line_ending_cr()
    {
        assert_eq!(
            parse_menu_event("line-ending-cr"),
            MenuEventAction::LineEnding("CR".into())
        );
    }

    // ── Checkbox parsing ─────────────────────────────────────────

    #[test]
    fn parse_checkbox_word_wrap()
    {
        assert_eq!(
            parse_menu_event("word-wrap"),
            MenuEventAction::Checkbox("word-wrap".into())
        );
    }

    #[test]
    fn parse_checkbox_show_whitespace()
    {
        assert_eq!(
            parse_menu_event("show-whitespace"),
            MenuEventAction::Checkbox("show-whitespace".into())
        );
    }

    #[test]
    fn parse_checkbox_always_on_top()
    {
        assert_eq!(
            parse_menu_event("always-on-top"),
            MenuEventAction::Checkbox("always-on-top".into())
        );
    }

    #[test]
    fn parse_all_checkbox_ids()
    {
        for id in CHECKBOX_IDS
        {
            assert_eq!(
                parse_menu_event(id),
                MenuEventAction::Checkbox(id.to_string()),
                "Failed for checkbox: {}",
                id
            );
        }
    }

    // ── Dialog parsing ───────────────────────────────────────────

    #[test]
    fn parse_dialog_open()
    {
        assert_eq!(
            parse_menu_event("open"),
            MenuEventAction::Dialog("open".into())
        );
    }

    #[test]
    fn parse_dialog_open_folder()
    {
        assert_eq!(
            parse_menu_event("open-folder"),
            MenuEventAction::Dialog("open-folder".into())
        );
    }

    // ── Generic action parsing ───────────────────────────────────

    #[test]
    fn parse_generic_save()
    {
        assert_eq!(
            parse_menu_event("save"),
            MenuEventAction::Action("save".into())
        );
    }

    #[test]
    fn parse_generic_new()
    {
        assert_eq!(
            parse_menu_event("new"),
            MenuEventAction::Action("new".into())
        );
    }

    #[test]
    fn parse_generic_close_tab()
    {
        assert_eq!(
            parse_menu_event("close-tab"),
            MenuEventAction::Action("close-tab".into())
        );
    }

    #[test]
    fn parse_generic_find()
    {
        assert_eq!(
            parse_menu_event("find"),
            MenuEventAction::Action("find".into())
        );
    }

    #[test]
    fn parse_generic_sort_asc()
    {
        assert_eq!(
            parse_menu_event("sort-asc"),
            MenuEventAction::Action("sort-asc".into())
        );
    }

    #[test]
    fn parse_generic_toggle_comment()
    {
        assert_eq!(
            parse_menu_event("toggle-comment"),
            MenuEventAction::Action("toggle-comment".into())
        );
    }

    #[test]
    fn parse_generic_base64_encode()
    {
        assert_eq!(
            parse_menu_event("base64-encode"),
            MenuEventAction::Action("base64-encode".into())
        );
    }

    #[test]
    fn parse_generic_macro_start()
    {
        assert_eq!(
            parse_menu_event("macro-start"),
            MenuEventAction::Action("macro-start".into())
        );
    }

    // ── Edge cases ───────────────────────────────────────────────

    #[test]
    fn parse_empty_string()
    {
        assert_eq!(
            parse_menu_event(""),
            MenuEventAction::Action("".into())
        );
    }

    #[test]
    fn parse_unknown_action()
    {
        assert_eq!(
            parse_menu_event("some-unknown-action"),
            MenuEventAction::Action("some-unknown-action".into())
        );
    }

    #[test]
    fn encoding_prefix_not_confused_with_similar()
    {
        // "encoding" without hyphen should be generic action
        assert_eq!(
            parse_menu_event("encoding"),
            MenuEventAction::Action("encoding".into())
        );
    }

    #[test]
    fn lang_prefix_not_confused_with_similar()
    {
        // "language" should not match "lang-" prefix
        assert_eq!(
            parse_menu_event("language"),
            MenuEventAction::Action("language".into())
        );
    }

    // ── MenuEventAction coverage ─────────────────────────────────

    #[test]
    fn all_menu_categories_have_coverage()
    {
        // Verify all 6 variants are reachable
        let cases: Vec<(&str, MenuEventAction)> = vec![
            ("encoding-utf-8", MenuEventAction::Encoding("utf-8".into())),
            ("lang-python", MenuEventAction::Language("python".into())),
            ("line-ending-lf", MenuEventAction::LineEnding("LF".into())),
            ("word-wrap", MenuEventAction::Checkbox("word-wrap".into())),
            ("open", MenuEventAction::Dialog("open".into())),
            ("save", MenuEventAction::Action("save".into())),
        ];

        for (input, expected) in cases
        {
            assert_eq!(parse_menu_event(input), expected, "Failed for: {}", input);
        }
    }
}
