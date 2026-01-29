use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, WebviewWindow};

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::POINT;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

#[derive(Clone, Debug)]
pub struct PetBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

pub struct MouseTrackerState {
    pub pet_bounds: Option<PetBounds>,
    pub overlay_window: Option<WebviewWindow>,
    pub is_active: bool,
    pub current_ignore_state: bool,
    pub thread_started: bool,
}

impl MouseTrackerState {
    pub fn new() -> Self {
        Self {
            pet_bounds: None,
            overlay_window: None,
            is_active: false,
            current_ignore_state: false,
            thread_started: false,
        }
    }
}

#[cfg(target_os = "windows")]
fn get_cursor_position() -> Option<(f64, f64)> {
    let mut point = POINT::default();
    unsafe {
        if GetCursorPos(&mut point).is_ok() {
            Some((point.x as f64, point.y as f64))
        } else {
            None
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn get_cursor_position() -> Option<(f64, f64)> {
    // Not implemented for non-Windows platforms
    None
}

fn is_point_in_bounds(x: f64, y: f64, bounds: &PetBounds) -> bool {
    x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height
}

pub fn start_mouse_tracker(app: AppHandle, state: Arc<Mutex<MouseTrackerState>>) {
    thread::spawn(move || {
        loop {
            // Check if tracker should continue running
            let should_continue = {
                let state_guard = state.lock().unwrap();
                state_guard.is_active
            };

            if !should_continue {
                // When inactive, ensure overlay doesn't block clicks if it's still around
                if let Some(window) = app.get_webview_window("overlay") {
                    let _ = window.set_ignore_cursor_events(true);
                }
                thread::sleep(Duration::from_millis(50));
                continue;
            }

            // Get current mouse position
            if let Some((mouse_x, mouse_y)) = get_cursor_position() {
                let mut state_guard = state.lock().unwrap();

                // Check if we have overlay window
                if let Some(window) = &state_guard.overlay_window {
                    // If no bounds yet, default to click-through so we never soft-lock the desktop
                    let Some(bounds) = &state_guard.pet_bounds else {
                        if state_guard.current_ignore_state != true {
                            if let Err(e) = window.set_ignore_cursor_events(true) {
                                eprintln!("Failed to set ignore cursor events: {}", e);
                            } else {
                                state_guard.current_ignore_state = true;
                            }
                        }
                        thread::sleep(Duration::from_millis(50));
                        continue;
                    };

                    // DPI fix: GetCursorPos returns physical pixels, but frontend bounds are logical/CSS pixels.
                    // Convert mouse position to logical pixels using the monitor scale factor.
                    let mut logical_mouse_x = mouse_x;
                    let mut logical_mouse_y = mouse_y;
                    if let Ok(Some(monitor)) = window.current_monitor() {
                        let scale = monitor.scale_factor();
                        if scale > 0.0 {
                            logical_mouse_x = mouse_x / scale;
                            logical_mouse_y = mouse_y / scale;
                        }
                    }

                    let is_in_bounds = is_point_in_bounds(logical_mouse_x, logical_mouse_y, bounds);
                    let should_ignore = !is_in_bounds;

                    // Only update if state changed to avoid unnecessary calls
                    if should_ignore != state_guard.current_ignore_state {
                        if let Err(e) = window.set_ignore_cursor_events(should_ignore) {
                            eprintln!("Failed to set ignore cursor events: {}", e);
                        } else {
                            state_guard.current_ignore_state = should_ignore;
                        }
                    }
                }
            }

            // Sleep for 50ms to avoid high CPU usage
            thread::sleep(Duration::from_millis(50));
        }
    });
}
