#include "win32_window.h"

#include <dwmapi.h>
#include <flutter_windows.h>

#include "resource.h"

namespace {

/// Window attribute that enables dark mode window decorations.
#ifndef DWMWA_USE_IMMERSIVE_DARK_MODE
#define DWMWA_USE_IMMERSIVE_DARK_MODE 20
#endif

// Window class name for the overlay window
constexpr const wchar_t kWindowClassName[] = L"KNIGHT_FOCUS_OVERLAY_WINDOW";

// Transparent color key - Magenta (RGB 255, 0, 255)
// This color will be fully transparent in the window
constexpr COLORREF kTransparentColorKey = RGB(255, 0, 255);

/// Registry key for app theme preference.
constexpr const wchar_t kGetPreferredBrightnessRegKey[] =
    L"Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";
constexpr const wchar_t kGetPreferredBrightnessRegValue[] = L"AppsUseLightTheme";

// The number of Win32Window objects that currently exist.
static int g_active_window_count = 0;

using EnableNonClientDpiScaling = BOOL __stdcall(HWND hwnd);

// Scale helper to convert logical scaler values to physical using passed in
// scale factor
int Scale(int source, double scale_factor) {
  return static_cast<int>(source * scale_factor);
}

// Dynamically loads the |EnableNonClientDpiScaling| from the User32 module.
// This API is only needed for PerMonitor V1 awareness mode.
void EnableFullDpiSupportIfAvailable(HWND hwnd) {
  HMODULE user32_module = LoadLibraryA("User32.dll");
  if (!user32_module) {
    return;
  }
  auto enable_non_client_dpi_scaling =
      reinterpret_cast<EnableNonClientDpiScaling*>(
          GetProcAddress(user32_module, "EnableNonClientDpiScaling"));
  if (enable_non_client_dpi_scaling != nullptr) {
    enable_non_client_dpi_scaling(hwnd);
  }
  FreeLibrary(user32_module);
}

}  // namespace

// Manages the Win32Window's window class registration.
class WindowClassRegistrar {
 public:
  ~WindowClassRegistrar() = default;

  // Returns the singleton registrar instance.
  static WindowClassRegistrar* GetInstance() {
    if (!instance_) {
      instance_ = new WindowClassRegistrar();
    }
    return instance_;
  }

  // Returns the name of the window class, registering the class if it hasn't
  // previously been registered.
  const wchar_t* GetWindowClass();

  // Unregisters the window class. Should only be called if there are no
  // instances of the window.
  void UnregisterWindowClass();

 private:
  WindowClassRegistrar() = default;

  static WindowClassRegistrar* instance_;

  bool class_registered_ = false;
};

WindowClassRegistrar* WindowClassRegistrar::instance_ = nullptr;

const wchar_t* WindowClassRegistrar::GetWindowClass() {
  if (!class_registered_) {
    WNDCLASS window_class{};
    window_class.hCursor = LoadCursor(nullptr, IDC_ARROW);
    window_class.lpszClassName = kWindowClassName;
    window_class.style = CS_HREDRAW | CS_VREDRAW;
    window_class.cbClsExtra = 0;
    window_class.cbWndExtra = 0;
    window_class.hInstance = GetModuleHandle(nullptr);
    window_class.hIcon =
        LoadIcon(window_class.hInstance, MAKEINTRESOURCE(IDI_APP_ICON));
    // No background brush - important for transparency
    window_class.hbrBackground = nullptr;
    window_class.lpszMenuName = nullptr;
    window_class.lpfnWndProc = Win32Window::WndProc;
    RegisterClass(&window_class);
    class_registered_ = true;
  }
  return kWindowClassName;
}

void WindowClassRegistrar::UnregisterWindowClass() {
  UnregisterClass(kWindowClassName, nullptr);
  class_registered_ = false;
}

Win32Window::Win32Window() {
  ++g_active_window_count;
}

Win32Window::~Win32Window() {
  --g_active_window_count;
  Destroy();
}

bool Win32Window::Create(const std::wstring& title,
                         const Point& origin,
                         const Size& size) {
  Destroy();

  const wchar_t* window_class =
      WindowClassRegistrar::GetInstance()->GetWindowClass();

  const POINT target_point = {static_cast<LONG>(origin.x),
                              static_cast<LONG>(origin.y)};
  HMONITOR monitor = MonitorFromPoint(target_point, MONITOR_DEFAULTTONEAREST);
  UINT dpi = FlutterDesktopGetDpiForMonitor(monitor);
  double scale_factor = dpi / 96.0;

  // Extended window styles for transparent overlay:
  // WS_EX_LAYERED: Required for transparency via color key or alpha
  // WS_EX_TOPMOST: Always on top of other windows
  // WS_EX_TOOLWINDOW: Hide from taskbar and Alt+Tab
  // WS_EX_NOACTIVATE: Don't steal focus when shown
  DWORD ex_style = WS_EX_LAYERED | WS_EX_TOPMOST | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE;

  // Window style: Popup without border or title bar (frameless)
  DWORD style = WS_POPUP;

  HWND window = CreateWindowEx(
      ex_style,  // Extended style
      window_class,
      title.c_str(),
      style,  // Frameless popup
      Scale(origin.x, scale_factor),
      Scale(origin.y, scale_factor),
      Scale(size.width, scale_factor),
      Scale(size.height, scale_factor),
      nullptr,  // No parent
      nullptr,  // No menu
      GetModuleHandle(nullptr),
      this);  // Pass this pointer

  if (!window) {
    return false;
  }

  // Configure layered window for color-key transparency
  // Magenta (255, 0, 255) will be fully transparent
  // Alpha is set to 255 (fully opaque) for non-transparent areas
  if (!SetLayeredWindowAttributes(
          window,
          kTransparentColorKey,  // Color key (magenta)
          255,                    // Alpha for non-keyed areas
          LWA_COLORKEY)) {        // Use color key mode
    // Fallback: If color key fails, try per-pixel alpha
    SetLayeredWindowAttributes(window, 0, 255, LWA_ALPHA);
  }

  // Note: Theme update disabled for frameless transparent window
  // UpdateTheme(window);

  return OnCreate();
}

bool Win32Window::Show() {
  // Show window without activating (don't steal focus from other apps)
  return ShowWindow(window_handle_, SW_SHOWNOACTIVATE);
}

// static
LRESULT CALLBACK Win32Window::WndProc(HWND const window,
                                      UINT const message,
                                      WPARAM const wparam,
                                      LPARAM const lparam) noexcept {
  if (message == WM_NCCREATE) {
    auto window_struct = reinterpret_cast<CREATESTRUCT*>(lparam);
    SetWindowLongPtr(window, GWLP_USERDATA,
                     reinterpret_cast<LONG_PTR>(window_struct->lpCreateParams));

    auto that = static_cast<Win32Window*>(window_struct->lpCreateParams);
    EnableFullDpiSupportIfAvailable(window);
    that->window_handle_ = window;
  } else if (Win32Window* that = GetThisFromHandle(window)) {
    return that->MessageHandler(window, message, wparam, lparam);
  }

  return DefWindowProc(window, message, wparam, lparam);
}

// Critical: Handle WM_NCHITTEST for selective click-through behavior
LRESULT Win32Window::HandleNcHitTest(HWND hwnd, WPARAM wparam, LPARAM lparam) {
  // Get mouse position in screen coordinates
  POINT pt;
  pt.x = GET_X_LPARAM(lparam);
  pt.y = GET_Y_LPARAM(lparam);

  // Convert to client (window) coordinates
  ScreenToClient(hwnd, &pt);

  // Get current pet bounds (thread-safe access)
  PetBounds bounds = GetPetBounds();

  // Check if mouse is inside pet bounding box
  if (bounds.Contains(pt.x, pt.y)) {
    // Mouse is over the pet - capture the click
    return HTCLIENT;
  }

  // Mouse is outside the pet - pass click through to windows below
  return HTTRANSPARENT;
}

LRESULT
Win32Window::MessageHandler(HWND hwnd,
                            UINT const message,
                            WPARAM const wparam,
                            LPARAM const lparam) noexcept {
  switch (message) {
    // CRITICAL: Handle hit-testing for selective click-through
    case WM_NCHITTEST:
      return HandleNcHitTest(hwnd, wparam, lparam);

    case WM_DESTROY:
      window_handle_ = nullptr;
      Destroy();
      if (quit_on_close_) {
        PostQuitMessage(0);
      }
      return 0;

    case WM_DPICHANGED: {
      auto newRectSize = reinterpret_cast<RECT*>(lparam);
      LONG newWidth = newRectSize->right - newRectSize->left;
      LONG newHeight = newRectSize->bottom - newRectSize->top;

      SetWindowPos(hwnd, nullptr, newRectSize->left, newRectSize->top, newWidth,
                   newHeight, SWP_NOZORDER | SWP_NOACTIVATE);

      return 0;
    }

    case WM_SIZE: {
      RECT rect = GetClientArea();
      if (child_content_ != nullptr) {
        // Size and position the child window.
        MoveWindow(child_content_, rect.left, rect.top, rect.right - rect.left,
                   rect.bottom - rect.top, TRUE);
      }
      return 0;
    }

    // Prevent window activation on click
    case WM_MOUSEACTIVATE:
      return MA_NOACTIVATE;

    case WM_ACTIVATE:
      if (child_content_ != nullptr) {
        SetFocus(child_content_);
      }
      return 0;

    // Handle background erasing to prevent flicker
    case WM_ERASEBKGND:
      return 1;

    case WM_DWMCOLORIZATIONCOLORCHANGED:
      // Skip theme update for transparent window
      return 0;
  }

  return DefWindowProc(window_handle_, message, wparam, lparam);
}

void Win32Window::Destroy() {
  OnDestroy();

  if (window_handle_) {
    DestroyWindow(window_handle_);
    window_handle_ = nullptr;
  }
  if (g_active_window_count == 0) {
    WindowClassRegistrar::GetInstance()->UnregisterWindowClass();
  }
}

Win32Window* Win32Window::GetThisFromHandle(HWND const window) noexcept {
  return reinterpret_cast<Win32Window*>(
      GetWindowLongPtr(window, GWLP_USERDATA));
}

void Win32Window::SetChildContent(HWND content) {
  child_content_ = content;
  SetParent(content, window_handle_);
  RECT frame = GetClientArea();

  MoveWindow(content, frame.left, frame.top, frame.right - frame.left,
             frame.bottom - frame.top, true);

  SetFocus(child_content_);
}

RECT Win32Window::GetClientArea() {
  RECT frame;
  GetClientRect(window_handle_, &frame);
  return frame;
}

HWND Win32Window::GetHandle() {
  return window_handle_;
}

void Win32Window::SetQuitOnClose(bool quit_on_close) {
  quit_on_close_ = quit_on_close;
}

bool Win32Window::OnCreate() {
  // No-op; provided for subclasses.
  return true;
}

void Win32Window::OnDestroy() {
  // No-op; provided for subclasses.
}

// Thread-safe pet bounds setters/getters
void Win32Window::SetPetBounds(int x, int y, int width, int height) {
  std::lock_guard<std::mutex> lock(pet_bounds_mutex_);
  pet_bounds_ = PetBounds(x, y, width, height);
}

Win32Window::PetBounds Win32Window::GetPetBounds() const {
  std::lock_guard<std::mutex> lock(pet_bounds_mutex_);
  return pet_bounds_;
}

void Win32Window::ClearPetBounds() {
  std::lock_guard<std::mutex> lock(pet_bounds_mutex_);
  pet_bounds_ = PetBounds();
}

void Win32Window::UpdateTheme(HWND const window) {
  DWORD light_mode;
  DWORD light_mode_size = sizeof(light_mode);
  LSTATUS result = RegGetValue(HKEY_CURRENT_USER, kGetPreferredBrightnessRegKey,
                               kGetPreferredBrightnessRegValue,
                               RRF_RT_REG_DWORD, nullptr, &light_mode,
                               &light_mode_size);

  if (result == ERROR_SUCCESS) {
    BOOL enable_dark_mode = light_mode == 0;
    DwmSetWindowAttribute(window, DWMWA_USE_IMMERSIVE_DARK_MODE,
                          &enable_dark_mode, sizeof(enable_dark_mode));
  }
}
