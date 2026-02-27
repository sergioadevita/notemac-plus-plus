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

// ─── Tests ─────────────────────────────────────────────────────

#[cfg(test)]
mod tests
{
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    // ── read_file ────────────────────────────────────────────────

    #[tokio::test]
    async fn read_file_returns_contents()
    {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("hello.txt");
        fs::write(&path, "Hello, Notemac!").unwrap();

        let result = read_file(path.to_string_lossy().into_owned()).await;
        assert_eq!(result.unwrap(), "Hello, Notemac!");
    }

    #[tokio::test]
    async fn read_file_returns_error_for_missing_file()
    {
        let result = read_file("/nonexistent/path/file.txt".into()).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to read file"));
    }

    #[tokio::test]
    async fn read_file_handles_utf8_content()
    {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("unicode.txt");
        fs::write(&path, "日本語テスト 🚀 émojis").unwrap();

        let result = read_file(path.to_string_lossy().into_owned()).await;
        assert_eq!(result.unwrap(), "日本語テスト 🚀 émojis");
    }

    #[tokio::test]
    async fn read_file_handles_empty_file()
    {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("empty.txt");
        fs::write(&path, "").unwrap();

        let result = read_file(path.to_string_lossy().into_owned()).await;
        assert_eq!(result.unwrap(), "");
    }

    // ── write_file ───────────────────────────────────────────────

    #[tokio::test]
    async fn write_file_creates_file()
    {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("output.txt");

        let result = write_file(
            path.to_string_lossy().into_owned(),
            "Written by test".into(),
        ).await;

        assert!(result.unwrap());
        assert_eq!(fs::read_to_string(&path).unwrap(), "Written by test");
    }

    #[tokio::test]
    async fn write_file_creates_parent_directories()
    {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("deep").join("nested").join("file.txt");

        let result = write_file(
            path.to_string_lossy().into_owned(),
            "nested content".into(),
        ).await;

        assert!(result.unwrap());
        assert_eq!(fs::read_to_string(&path).unwrap(), "nested content");
    }

    #[tokio::test]
    async fn write_file_overwrites_existing()
    {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("overwrite.txt");
        fs::write(&path, "original").unwrap();

        write_file(
            path.to_string_lossy().into_owned(),
            "replaced".into(),
        ).await.unwrap();

        assert_eq!(fs::read_to_string(&path).unwrap(), "replaced");
    }

    // ── file_exists ──────────────────────────────────────────────

    #[tokio::test]
    async fn file_exists_returns_true_for_existing_file()
    {
        let dir = TempDir::new().unwrap();
        let path = dir.path().join("exists.txt");
        fs::write(&path, "yes").unwrap();

        let result = file_exists(path.to_string_lossy().into_owned()).await;
        assert!(result.unwrap());
    }

    #[tokio::test]
    async fn file_exists_returns_false_for_missing_file()
    {
        let result = file_exists("/nonexistent/file.txt".into()).await;
        assert!(!result.unwrap());
    }

    #[tokio::test]
    async fn file_exists_returns_true_for_directory()
    {
        let dir = TempDir::new().unwrap();
        let result = file_exists(dir.path().to_string_lossy().into_owned()).await;
        assert!(result.unwrap());
    }

    // ── rename_file ──────────────────────────────────────────────

    #[tokio::test]
    async fn rename_file_renames_successfully()
    {
        let dir = TempDir::new().unwrap();
        let old_path = dir.path().join("old.txt");
        fs::write(&old_path, "content").unwrap();

        let result = rename_file(
            old_path.to_string_lossy().into_owned(),
            "new.txt".into(),
        ).await;

        let new_path = dir.path().join("new.txt");
        assert_eq!(result.unwrap(), new_path.to_string_lossy().into_owned());
        assert!(!old_path.exists());
        assert!(new_path.exists());
        assert_eq!(fs::read_to_string(&new_path).unwrap(), "content");
    }

    #[tokio::test]
    async fn rename_file_returns_error_for_missing_source()
    {
        let dir = TempDir::new().unwrap();
        let old_path = dir.path().join("nonexistent.txt");

        let result = rename_file(
            old_path.to_string_lossy().into_owned(),
            "new.txt".into(),
        ).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to rename file"));
    }

    // ── read_dir / build_file_tree ───────────────────────────────

    #[tokio::test]
    async fn read_dir_lists_files_and_directories()
    {
        let dir = TempDir::new().unwrap();
        fs::write(dir.path().join("file_b.txt"), "b").unwrap();
        fs::write(dir.path().join("file_a.txt"), "a").unwrap();
        fs::create_dir(dir.path().join("subdir")).unwrap();

        let result = read_dir(dir.path().to_string_lossy().into_owned()).await;
        let entries = result.unwrap();

        // Directories come first, then alphabetical
        assert_eq!(entries[0].name, "subdir");
        assert!(entries[0].is_directory);
        assert_eq!(entries[1].name, "file_a.txt");
        assert!(!entries[1].is_directory);
        assert_eq!(entries[2].name, "file_b.txt");
        assert!(!entries[2].is_directory);
    }

    #[tokio::test]
    async fn read_dir_excludes_dotfiles_and_node_modules()
    {
        let dir = TempDir::new().unwrap();
        fs::write(dir.path().join("visible.txt"), "yes").unwrap();
        fs::write(dir.path().join(".hidden"), "no").unwrap();
        fs::create_dir(dir.path().join(".git")).unwrap();
        fs::create_dir(dir.path().join("node_modules")).unwrap();

        let result = read_dir(dir.path().to_string_lossy().into_owned()).await;
        let entries = result.unwrap();

        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].name, "visible.txt");
    }

    #[tokio::test]
    async fn read_dir_returns_error_for_missing_directory()
    {
        let result = read_dir("/nonexistent/directory".into()).await;
        assert!(result.is_err());
    }

    #[test]
    fn build_file_tree_respects_max_depth()
    {
        let dir = TempDir::new().unwrap();
        // Create a deeply nested structure: 0/1/2/3/4/5/6/deep.txt
        let mut current = dir.path().to_path_buf();
        for i in 0..7
        {
            current = current.join(i.to_string());
            fs::create_dir_all(&current).unwrap();
        }
        fs::write(current.join("deep.txt"), "deep").unwrap();

        let tree = build_file_tree(dir.path(), 0).unwrap();
        // Traverse into the tree — at depth 5 should stop
        let mut node = &tree[0]; // "0"
        for _ in 0..5
        {
            let children = node.children.as_ref().unwrap();
            if children.is_empty()
            {
                break;
            }
            node = &children[0];
        }
        // At depth 5, children should be empty (depth > 5 returns empty)
        let children = node.children.as_ref().unwrap();
        assert!(children.is_empty());
    }

    #[test]
    fn build_file_tree_sorts_dirs_before_files()
    {
        let dir = TempDir::new().unwrap();
        fs::write(dir.path().join("zebra.txt"), "").unwrap();
        fs::create_dir(dir.path().join("alpha_dir")).unwrap();
        fs::write(dir.path().join("apple.txt"), "").unwrap();

        let tree = build_file_tree(dir.path(), 0).unwrap();
        assert_eq!(tree[0].name, "alpha_dir");
        assert!(tree[0].is_directory);
        assert_eq!(tree[1].name, "apple.txt");
        assert!(!tree[1].is_directory);
        assert_eq!(tree[2].name, "zebra.txt");
    }

    #[test]
    fn build_file_tree_case_insensitive_sort()
    {
        let dir = TempDir::new().unwrap();
        fs::write(dir.path().join("Banana.txt"), "").unwrap();
        fs::write(dir.path().join("apple.txt"), "").unwrap();
        fs::write(dir.path().join("Cherry.txt"), "").unwrap();

        let tree = build_file_tree(dir.path(), 0).unwrap();
        assert_eq!(tree[0].name, "apple.txt");
        assert_eq!(tree[1].name, "Banana.txt");
        assert_eq!(tree[2].name, "Cherry.txt");
    }

    // ── FileTreeNode serialization ───────────────────────────────

    #[test]
    fn file_tree_node_serializes_correctly()
    {
        let node = FileTreeNode {
            name: "test.txt".into(),
            path: "/tmp/test.txt".into(),
            is_directory: false,
            children: None,
        };

        let json = serde_json::to_value(&node).unwrap();
        assert_eq!(json["name"], "test.txt");
        assert_eq!(json["path"], "/tmp/test.txt");
        assert_eq!(json["isDirectory"], false);
        assert!(json.get("children").is_none()); // skip_serializing_if
    }

    #[test]
    fn file_tree_node_serializes_directory_with_children()
    {
        let node = FileTreeNode {
            name: "src".into(),
            path: "/tmp/src".into(),
            is_directory: true,
            children: Some(vec![
                FileTreeNode {
                    name: "main.rs".into(),
                    path: "/tmp/src/main.rs".into(),
                    is_directory: false,
                    children: None,
                },
            ]),
        };

        let json = serde_json::to_value(&node).unwrap();
        assert_eq!(json["isDirectory"], true);
        assert_eq!(json["children"][0]["name"], "main.rs");
    }
}
