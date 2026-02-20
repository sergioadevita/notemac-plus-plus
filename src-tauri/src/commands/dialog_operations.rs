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
