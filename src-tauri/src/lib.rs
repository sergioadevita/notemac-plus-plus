pub mod commands;
pub mod menu;

use commands::file_operations;
use commands::dialog_operations;
use commands::window_operations;
use commands::crypto_operations;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run()
{
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let menu = menu::build_menu(&handle)?;
            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            menu::handle_menu_event(app, event.id().as_ref());
        })
        .invoke_handler(tauri::generate_handler![
            // File operations
            file_operations::read_file,
            file_operations::write_file,
            file_operations::read_dir,
            file_operations::rename_file,
            file_operations::file_exists,
            // Dialog operations
            dialog_operations::open_file_dialog,
            dialog_operations::open_folder_dialog,
            dialog_operations::save_file_dialog,
            // Window operations
            window_operations::set_always_on_top,
            window_operations::minimize_window,
            window_operations::maximize_window,
            // Crypto operations
            crypto_operations::safe_storage_encrypt,
            crypto_operations::safe_storage_decrypt,
            crypto_operations::is_safe_storage_available,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
