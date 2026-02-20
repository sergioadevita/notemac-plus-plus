use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn set_always_on_top(app: AppHandle, value: bool) -> Result<(), String>
{
    let window = app.get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    window.set_always_on_top(value)
        .map_err(|e| format!("Failed to set always-on-top: {}", e))
}

#[tauri::command]
pub async fn minimize_window(app: AppHandle) -> Result<(), String>
{
    let window = app.get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    window.minimize()
        .map_err(|e| format!("Failed to minimize window: {}", e))
}

#[tauri::command]
pub async fn maximize_window(app: AppHandle) -> Result<(), String>
{
    let window = app.get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    window.maximize()
        .map_err(|e| format!("Failed to maximize window: {}", e))
}
