#include "flutter_window.h"

#include <optional>
#include <variant>

#include "flutter/generated_plugin_registrant.h"

FlutterWindow::FlutterWindow(const flutter::DartProject& project)
    : project_(project) {}

FlutterWindow::~FlutterWindow() {}

bool FlutterWindow::OnCreate() {
  if (!Win32Window::OnCreate()) {
    return false;
  }

  RECT frame = GetClientArea();

  // The size here must match the window dimensions to avoid unnecessary surface
  // creation / destruction in the startup path.
  flutter_controller_ = std::make_unique<flutter::FlutterViewController>(
      frame.right - frame.left, frame.bottom - frame.top, project_);
  // Ensure that basic setup of the controller was successful.
  if (!flutter_controller_->engine() || !flutter_controller_->view()) {
    return false;
  }
  RegisterPlugins(flutter_controller_->engine());

  // Initialize method channel for pet bounds communication
  InitPetBoundsChannel();

  SetChildContent(flutter_controller_->view()->GetNativeWindow());

  flutter_controller_->engine()->SetNextFrameCallback([&]() { this->Show(); });

  // Flutter can complete the first frame before the "show window" callback is
  // registered. The following call ensures a frame is pending to ensure the
  // window is shown. It is a no-op if the first frame hasn't completed yet.
  flutter_controller_->ForceRedraw();

  return true;
}

void FlutterWindow::InitPetBoundsChannel() {
  // Channel name must match the Dart side
  const std::string channel_name = "com.knightfocus/pet_bounds";

  pet_bounds_channel_ =
      std::make_unique<flutter::MethodChannel<flutter::EncodableValue>>(
          flutter_controller_->engine()->messenger(), channel_name,
          &flutter::StandardMethodCodec::GetInstance());

  // Set up the method call handler
  pet_bounds_channel_->SetMethodCallHandler(
      [this](const flutter::MethodCall<flutter::EncodableValue>& call,
             std::unique_ptr<flutter::MethodResult<flutter::EncodableValue>>
                 result) {
        HandlePetBoundsMethodCall(call, std::move(result));
      });
}

void FlutterWindow::HandlePetBoundsMethodCall(
    const flutter::MethodCall<flutter::EncodableValue>& call,
    std::unique_ptr<flutter::MethodResult<flutter::EncodableValue>> result) {
  const std::string& method = call.method_name();

  if (method == "updatePetBounds") {
    // Extract bounds from arguments
    const auto* arguments =
        std::get_if<flutter::EncodableMap>(call.arguments());
    if (!arguments) {
      result->Error("INVALID_ARGUMENTS", "Expected map arguments");
      return;
    }

    // Helper to extract int from EncodableValue (handles both int and double)
    auto get_int = [&arguments](const std::string& key) -> std::optional<int> {
      auto it = arguments->find(flutter::EncodableValue(key));
      if (it == arguments->end()) return std::nullopt;

      if (auto* int_val = std::get_if<int32_t>(&it->second)) {
        return *int_val;
      }
      if (auto* double_val = std::get_if<double>(&it->second)) {
        return static_cast<int>(*double_val);
      }
      return std::nullopt;
    };

    auto x = get_int("x");
    auto y = get_int("y");
    auto width = get_int("width");
    auto height = get_int("height");

    if (!x || !y || !width || !height) {
      result->Error("INVALID_ARGUMENTS",
                    "Missing or invalid bounds values (x, y, width, height)");
      return;
    }

    // Update pet bounds in the window (thread-safe)
    SetPetBounds(*x, *y, *width, *height);

    result->Success(flutter::EncodableValue(true));

  } else if (method == "clearPetBounds") {
    ClearPetBounds();
    result->Success(flutter::EncodableValue(true));

  } else if (method == "getPetBounds") {
    // Return current bounds to Flutter
    auto bounds = GetPetBounds();
    flutter::EncodableMap response;
    response[flutter::EncodableValue("x")] =
        flutter::EncodableValue(bounds.x);
    response[flutter::EncodableValue("y")] =
        flutter::EncodableValue(bounds.y);
    response[flutter::EncodableValue("width")] =
        flutter::EncodableValue(bounds.width);
    response[flutter::EncodableValue("height")] =
        flutter::EncodableValue(bounds.height);
    response[flutter::EncodableValue("valid")] =
        flutter::EncodableValue(bounds.valid);
    result->Success(flutter::EncodableValue(response));

  } else {
    result->NotImplemented();
  }
}

void FlutterWindow::OnDestroy() {
  if (flutter_controller_) {
    flutter_controller_ = nullptr;
  }

  Win32Window::OnDestroy();
}

LRESULT
FlutterWindow::MessageHandler(HWND hwnd, UINT const message,
                              WPARAM const wparam,
                              LPARAM const lparam) noexcept {
  // Give Flutter, including plugins, an opportunity to handle window messages.
  if (flutter_controller_) {
    std::optional<LRESULT> result =
        flutter_controller_->HandleTopLevelWindowProc(hwnd, message, wparam,
                                                      lparam);
    if (result) {
      return *result;
    }
  }

  switch (message) {
    case WM_FONTCHANGE:
      flutter_controller_->engine()->ReloadSystemFonts();
      break;
  }

  return Win32Window::MessageHandler(hwnd, message, wparam, lparam);
}
