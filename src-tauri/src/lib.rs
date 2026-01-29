use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, WebviewWindow};

mod pet;
mod mouse_tracker;

use mouse_tracker::{MouseTrackerState, PetBounds, start_mouse_tracker};

#[tauri::command]
fn get_pet_state() -> pet::PetData {
    pet::PetData::default()
}

#[tauri::command]
fn show_overlay(app: AppHandle, state: tauri::State<'_, Arc<Mutex<MouseTrackerState>>>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        // Set to fullscreen for overlay mode
        window.set_fullscreen(true).map_err(|e| format!("Failed to set fullscreen: {}", e))?;
        window.show().map_err(|e| format!("Failed to show: {}", e))?;
        window.set_focus().map_err(|e| format!("Failed to focus: {}", e))?;
        
        // Activate mouse tracking
        {
            let mut tracker_state = state.lock().unwrap();
            tracker_state.overlay_window = Some(window.clone());
            tracker_state.is_active = true;
        }
        
        Ok(())
    } else {
        Err("Overlay window not found. Make sure it's defined in tauri.conf.json".to_string())
    }
}

#[tauri::command]
fn hide_overlay(app: AppHandle, state: tauri::State<'_, Arc<Mutex<MouseTrackerState>>>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        // Stop mouse tracking
        {
            let mut tracker_state = state.lock().unwrap();
            tracker_state.is_active = false;
            tracker_state.overlay_window = None;
            tracker_state.pet_bounds = None;
        }
        
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

#[tauri::command]
fn update_pet_bounds(
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    state: tauri::State<'_, Arc<Mutex<MouseTrackerState>>>,
) -> Result<(), String> {
    let mut tracker_state = state.lock().unwrap();
    tracker_state.pet_bounds = Some(PetBounds { x, y, width, height });
    Ok(())
}

#[tauri::command]
fn start_mouse_tracking(
    app: AppHandle,
    state: tauri::State<'_, Arc<Mutex<MouseTrackerState>>>,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        let mut tracker_state = state.lock().unwrap();
        tracker_state.overlay_window = Some(window.clone());
        tracker_state.is_active = true;
        Ok(())
    } else {
        Err("Overlay window not found".to_string())
    }
}

#[tauri::command]
fn stop_mouse_tracking(state: tauri::State<'_, Arc<Mutex<MouseTrackerState>>>) -> Result<(), String> {
    let mut tracker_state = state.lock().unwrap();
    tracker_state.is_active = false;
    tracker_state.overlay_window = None;
    tracker_state.pet_bounds = None;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize mouse tracker state
            let tracker_state = Arc::new(Mutex::new(MouseTrackerState::new()));
            let tracker_state_clone = tracker_state.clone();
            app.manage(tracker_state);
            
            // Start the background mouse tracking thread once
            #[cfg(target_os = "windows")]
            {
                start_mouse_tracker(app.handle().clone(), tracker_state_clone);
            }
            
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
            get_screen_size,
            update_pet_bounds,
            start_mouse_tracking,
            stop_mouse_tracking
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
