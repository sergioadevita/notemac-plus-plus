use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

// ─── Types ──────────────────────────────────────────────────────

#[derive(Serialize, Clone)]
pub struct FileTreeNode
{
    pub name: String,
    pub path: String,
    #[serde(rename = "isDirectory")]
    pub is_directory: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileTreeNode>>,
}

// ─── Commands ───────────────────────────────────────────────────

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String>
{
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file '{}': {}", path, e))
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<bool, String>
{
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent()
    {
        if !parent.exists()
        {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }

    fs::write(&path, &content)
        .map_err(|e| format!("Failed to write file '{}': {}", path, e))?;
    Ok(true)
}

#[tauri::command]
pub async fn read_dir(path: String) -> Result<Vec<FileTreeNode>, String>
{
    let dir_path = PathBuf::from(&path);
    build_file_tree(&dir_path, 0)
        .map_err(|e| format!("Failed to read directory '{}': {}", path, e))
}

#[tauri::command]
pub async fn rename_file(old_path: String, new_name: String) -> Result<String, String>
{
    let old = PathBuf::from(&old_path);
    let parent = old.parent()
        .ok_or_else(|| "Cannot determine parent directory".to_string())?;
    let new_path = parent.join(&new_name);

    fs::rename(&old, &new_path)
        .map_err(|e| format!("Failed to rename file: {}", e))?;

    Ok(new_path.to_string_lossy().into_owned())
}

#[tauri::command]
pub async fn file_exists(path: String) -> Result<bool, String>
{
    Ok(Path::new(&path).exists())
}

// ─── Helper ─────────────────────────────────────────────────────

/// Public entry point for building file tree from other modules.
pub fn build_file_tree_public(dir_path: &Path) -> Result<Vec<FileTreeNode>, std::io::Error>
{
    build_file_tree(dir_path, 0)
}

/// Recursively builds a file tree, matching the Electron buildFileTree() logic:
/// - Max depth 5
/// - Excludes dotfiles and node_modules
/// - Directories sorted before files, then alphabetical
fn build_file_tree(dir_path: &Path, depth: u32) -> Result<Vec<FileTreeNode>, std::io::Error>
{
    if depth > 5
    {
        return Ok(Vec::new());
    }

    let mut entries: Vec<FileTreeNode> = Vec::new();
    let read_dir = fs::read_dir(dir_path)?;

    let mut raw_entries: Vec<(String, PathBuf, bool)> = Vec::new();
    for entry in read_dir
    {
        let entry = entry?;
        let name = entry.file_name().to_string_lossy().into_owned();

        // Skip dotfiles and node_modules (matching Electron logic)
        if name.starts_with('.') || name == "node_modules"
        {
            continue;
        }

        let path = entry.path();
        let is_dir = entry.file_type()?.is_dir();
        raw_entries.push((name, path, is_dir));
    }

    // Sort: directories first, then alphabetical
    raw_entries.sort_by(|a, b| {
        if a.2 && !b.2 { return std::cmp::Ordering::Less; }
        if !a.2 && b.2 { return std::cmp::Ordering::Greater; }
        a.0.to_lowercase().cmp(&b.0.to_lowercase())
    });

    for (name, path, is_dir) in raw_entries
    {
        let children = if is_dir
        {
            Some(build_file_tree(&path, depth + 1)?)
        }
        else
        {
            None
        };

        entries.push(FileTreeNode {
            name,
            path: path.to_string_lossy().into_owned(),
            is_directory: is_dir,
            children,
        });
    }

    Ok(entries)
}
