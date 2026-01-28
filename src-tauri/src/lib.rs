use tauri::{AppHandle, Manager, WebviewWindow};

mod pet;

#[tauri::command]
fn get_pet_state() -> pet::PetData {
    pet::PetData::default()
}

#[tauri::command]
fn show_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        // Set to fullscreen for overlay mode
        window.set_fullscreen(true).map_err(|e| format!("Failed to set fullscreen: {}", e))?;
        window.show().map_err(|e| format!("Failed to show: {}", e))?;
        window.set_focus().map_err(|e| format!("Failed to focus: {}", e))?;
        Ok(())
    } else {
        Err("Overlay window not found. Make sure it's defined in tauri.conf.json".to_string())
    }
}

#[tauri::command]
fn hide_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        window.set_fullscreen(false).map_err(|e| format!("Failed to unset fullscreen: {}", e))?;
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn set_ignore_cursor_events(window: WebviewWindow, ignore: bool) -> Result<(), String> {
    window
        .set_ignore_cursor_events(ignore)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_screen_size(window: WebviewWindow) -> Result<(u32, u32), String> {
    let monitor = window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .ok_or("No monitor found")?;
    let size = monitor.size();
    Ok((size.width, size.height))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Get the overlay window
            if let Some(_window) = app.get_webview_window("overlay") {
                #[cfg(target_os = "windows")]
                {
                    // Window is configured via tauri.conf.json
                    // Transparent overlay ready
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_pet_state,
            show_overlay,
            hide_overlay,
            set_ignore_cursor_events,
            get_screen_size
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
