# KnightFocus - Desktop Pet & Productivity Application

## Project Overview
KnightFocus is a Windows Desktop Pet application built with Flutter and custom C++ window management for click-through transparency.

## Tech Stack
| Component | Technology |
|-----------|------------|
| UI Framework | Flutter 3.x (Windows Desktop) |
| Animation | Flame Engine (sprite sheets) |
| State Management | Riverpod |
| Local Database | JSON file storage (expandable to Isar) |
| Native Integration | Custom C++ Win32 API |

## Critical Technical Feature: Click-Through Transparency

### The Problem
Flutter renders a rectangular window. Making it transparent blocks mouse clicks meant for desktop/apps behind it.

### The Solution
- Window must be "click-through" in transparent areas
- Window must capture clicks on the Knight character (for dragging/poking)
- Implemented via custom `WM_NCHITTEST` handler in C++

### Key Files for Click-Through Logic
1. `windows/runner/win32_window.h` - PetBounds struct with thread-safe mutex
2. `windows/runner/win32_window.cpp` - WM_NCHITTEST returns HTCLIENT/HTTRANSPARENT
3. `windows/runner/flutter_window.cpp` - MethodChannel for Flutter↔C++ communication
4. `lib/native/window_channel.dart` - Dart platform channel

### Color Key Transparency
- Magenta `RGB(255, 0, 255)` / `0xFFFF00FF` is the transparent color
- All backgrounds must use this color to appear transparent
- `SetLayeredWindowAttributes` with `LWA_COLORKEY` flag

## Project Structure
```
knight_focus/
├── windows/runner/           # C++ native code (CRITICAL)
│   ├── win32_window.h/cpp    # Transparency + WM_NCHITTEST
│   └── flutter_window.h/cpp  # MethodChannel handler
├── lib/
│   ├── main.dart             # Entry point
│   ├── native/               # Platform channels
│   │   └── window_channel.dart
│   ├── domain/providers/     # Riverpod state
│   │   └── pet_bounds_provider.dart
│   ├── presentation/
│   │   ├── game/             # Flame game
│   │   ├── components/       # KnightComponent
│   │   └── animations/       # Animation controller
│   ├── core/services/        # Settings service
│   └── data/models/          # Data models
└── assets/
    ├── Colour1/Outline/120x80_PNGSheets/
    ├── Colour1/NoOutline/120x80_PNGSheets/
    ├── Colour2/Outline/120x80_PNGSheets/
    └── Colour2/NoOutline/120x80_PNGSheets/
```

## Sprite Sheet Format
- Frame size: 120x80 pixels
- Sheet size: 1200x80 pixels (10 frames per row)
- Available animations: Idle, Run, Jump, Fall, Crouch, Attack, WallClimb, Death, Hit, Roll, Dash, etc.

## Key Features

### Pet Mode (Overlay Engine)
- Knight character renders on desktop with transparent background
- Frameless, always-on-top window (`WS_EX_TOPMOST | WS_EX_TOOLWINDOW`)
- Draggable via `DragCallbacks` in Flame
- Poke reaction on tap (attack animation)

### State Machine Behaviors
- Idle, Run, Jump, Fall, Crouch, Attack, WallClimb, WallSlide

### MethodChannel Protocol
- Channel: `com.knightfocus/pet_bounds`
- Methods:
  - `updatePetBounds({x, y, width, height})` → bool
  - `clearPetBounds()` → bool
  - `getPetBounds()` → {x, y, width, height, valid}

## Build Commands
```bash
# Install dependencies
flutter pub get

# Build Windows debug
flutter build windows --debug

# Run
flutter run -d windows
```

## Important Notes
- Requires Developer Mode enabled on Windows (for symlinks)
- Visual Studio 2022 with "Desktop development with C++" required
- Thread safety: Pet bounds use mutex for cross-thread access
