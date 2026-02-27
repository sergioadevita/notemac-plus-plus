use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Emitter};
use tauri_plugin_dialog::DialogExt;

use super::file_operations::{FileTreeNode, build_file_tree_public};

// ─── Types ──────────────────────────────────────────────────────

#[derive(Serialize, Clone)]
pub struct OpenedFileData
{
    pub path: String,
    pub content: String,
    pub name: String,
}

#[derive(Serialize, Clone)]
pub struct FolderData
{
    pub path: String,
    pub tree: Vec<FileTreeNode>,
}

#[derive(Serialize, Clone)]
pub struct FileSavedData
{
    pub path: String,
    pub name: String,
}

// ─── Commands ───────────────────────────────────────────────────

#[tauri::command]
pub async fn open_file_dialog(app: AppHandle) -> Result<(), String>
{
    let file_paths = app.dialog()
        .file()
        .add_filter("All Files", &["*"])
        .add_filter("Text Files", &["txt", "md", "log"])
        .add_filter("Source Code", &["js", "ts", "jsx", "tsx", "py", "rb", "go", "rs", "c", "cpp", "h", "java", "swift", "php"])
        .add_filter("Web Files", &["html", "css", "json", "xml", "yaml", "yml"])
        .blocking_pick_files();

    if let Some(paths) = file_paths
    {
        for file_path in paths
        {
            let path_str = file_path.to_string();
            // Remove file:// prefix if present
            let clean_path = if path_str.starts_with("file://")
            {
                &path_str[7..]
            }
            else
            {
                &path_str
            };

            match fs::read_to_string(clean_path)
            {
                Ok(content) => {
                    let name = Path::new(clean_path)
                        .file_name()
                        .map(|n| n.to_string_lossy().into_owned())
                        .unwrap_or_else(|| "untitled".to_string());

                    let _ = app.emit("file-opened", OpenedFileData {
                        path: clean_path.to_string(),
                        content,
                        name,
                    });
                },
                Err(e) => {
                    eprintln!("Failed to read file '{}': {}", clean_path, e);
                }
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn open_folder_dialog(app: AppHandle) -> Result<(), String>
{
    let folder = app.dialog()
        .file()
        .blocking_pick_folder();

    if let Some(folder_path) = folder
    {
        let path_str = folder_path.to_string();
        let clean_path = if path_str.starts_with("file://")
        {
            &path_str[7..]
        }
        else
        {
            &path_str
        };

        let tree = build_file_tree_public(Path::new(clean_path))
            .map_err(|e| format!("Failed to read folder: {}", e))?;

        let _ = app.emit("folder-opened", FolderData {
            path: clean_path.to_string(),
            tree,
        });
    }

    Ok(())
}

#[tauri::command]
pub async fn save_file_dialog(
    app: AppHandle,
    content: String,
    suggested_name: String,
) -> Result<(), String>
{
    let default_name = if suggested_name.is_empty()
    {
        "untitled.txt".to_string()
    }
    else
    {
        suggested_name
    };

    let save_path = app.dialog()
        .file()
        .set_file_name(&default_name)
        .add_filter("All Files", &["*"])
        .add_filter("Text Files", &["txt"])
        .blocking_save_file();

    if let Some(file_path) = save_path
    {
        let path_str = file_path.to_string();
        let clean_path = if path_str.starts_with("file://")
        {
            &path_str[7..]
        }
        else
        {
            &path_str
        };

        fs::write(clean_path, &content)
            .map_err(|e| format!("Failed to save file: {}", e))?;

        let name = Path::new(clean_path)
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_else(|| "untitled".to_string());

        let _ = app.emit("file-saved", FileSavedData {
            path: clean_path.to_string(),
            name,
        });
    }

    Ok(())
}

// ─── Path Cleaning Helper ───────────────────────────────────────

/// Strips the file:// protocol prefix from a path string if present.
/// Used by dialog operations to normalize file paths from OS dialogs.
pub fn clean_file_path(path: &str) -> &str
{
    if path.starts_with("file://")
    {
        &path[7..]
    }
    else
    {
        path
    }
}

// ─── Tests ─────────────────────────────────────────────────────

#[cfg(test)]
mod tests
{
    use super::*;

    // ── Path cleaning ────────────────────────────────────────────

    #[test]
    fn clean_path_strips_file_protocol()
    {
        assert_eq!(clean_file_path("file:///Users/test/file.txt"), "/Users/test/file.txt");
    }

    #[test]
    fn clean_path_preserves_normal_path()
    {
        assert_eq!(clean_file_path("/Users/test/file.txt"), "/Users/test/file.txt");
    }

    #[test]
    fn clean_path_handles_empty_string()
    {
        assert_eq!(clean_file_path(""), "");
    }

    #[test]
    fn clean_path_handles_file_protocol_only()
    {
        assert_eq!(clean_file_path("file://"), "");
    }

    #[test]
    fn clean_path_preserves_spaces_in_path()
    {
        assert_eq!(
            clean_file_path("file:///Users/test/My Documents/file.txt"),
            "/Users/test/My Documents/file.txt"
        );
    }

    #[test]
    fn clean_path_preserves_unicode_path()
    {
        assert_eq!(
            clean_file_path("file:///Users/日本語/ファイル.txt"),
            "/Users/日本語/ファイル.txt"
        );
    }

    // ── Data type serialization ──────────────────────────────────

    #[test]
    fn opened_file_data_serializes_correctly()
    {
        let data = OpenedFileData {
            path: "/tmp/test.txt".into(),
            content: "hello world".into(),
            name: "test.txt".into(),
        };

        let json = serde_json::to_value(&data).unwrap();
        assert_eq!(json["path"], "/tmp/test.txt");
        assert_eq!(json["content"], "hello world");
        assert_eq!(json["name"], "test.txt");
    }

    #[test]
    fn folder_data_serializes_correctly()
    {
        let data = FolderData {
            path: "/tmp/project".into(),
            tree: vec![
                FileTreeNode {
                    name: "src".into(),
                    path: "/tmp/project/src".into(),
                    is_directory: true,
                    children: Some(vec![]),
                },
                FileTreeNode {
                    name: "README.md".into(),
                    path: "/tmp/project/README.md".into(),
                    is_directory: false,
                    children: None,
                },
            ],
        };

        let json = serde_json::to_value(&data).unwrap();
        assert_eq!(json["path"], "/tmp/project");
        assert_eq!(json["tree"][0]["name"], "src");
        assert_eq!(json["tree"][0]["isDirectory"], true);
        assert_eq!(json["tree"][1]["name"], "README.md");
        assert_eq!(json["tree"][1]["isDirectory"], false);
    }

    #[test]
    fn file_saved_data_serializes_correctly()
    {
        let data = FileSavedData {
            path: "/tmp/saved.txt".into(),
            name: "saved.txt".into(),
        };

        let json = serde_json::to_value(&data).unwrap();
        assert_eq!(json["path"], "/tmp/saved.txt");
        assert_eq!(json["name"], "saved.txt");
    }

    #[test]
    fn opened_file_data_clone_works()
    {
        let data = OpenedFileData {
            path: "/tmp/test.txt".into(),
            content: "hello".into(),
            name: "test.txt".into(),
        };

        let cloned = data.clone();
        assert_eq!(cloned.path, data.path);
        assert_eq!(cloned.content, data.content);
        assert_eq!(cloned.name, data.name);
    }

    #[test]
    fn folder_data_empty_tree()
    {
        let data = FolderData {
            path: "/tmp/empty".into(),
            tree: vec![],
        };

        let json = serde_json::to_value(&data).unwrap();
        assert_eq!(json["tree"].as_array().unwrap().len(), 0);
    }
}
