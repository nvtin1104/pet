# PetFocus - AI Assistant Context

## Project Overview
PetFocus is a desktop pet + productivity app built with Tauri v2 and Svelte 5.

## Tech Stack
- **Frontend**: Svelte 5 (with runes: `$state`, `$derived`, `$props`)
- **Backend**: Tauri v2 (Rust)
- **Styling**: TailwindCSS 3.x
- **Build**: Vite 6
- **Language**: TypeScript

## Project Structure
```
pet/
├── src/                    # Svelte frontend
│   ├── lib/
│   │   └── pet/           # Pet components
│   │       ├── Pet.svelte
│   │       └── Sprite.svelte
│   ├── styles/
│   ├── App.svelte
│   └── main.ts
├── src-tauri/             # Rust backend
│   ├── src/
│   │   └── lib.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── assets/                # Sprite assets
│   └── Colour1/Outline/120x80_PNGSheets/  # Knight sprites
└── package.json
```

## Sprite System
- Knight character sprites at `assets/Colour1/Outline/120x80_PNGSheets/`
- Frame size: **120x80px** per frame
- Animations are horizontal sprite strips (separate PNG per animation)
- Available animations: idle, run, attack, jump, fall, hit, death, dash, roll, crouch

## Development Commands
```bash
# Frontend dev server
npm run dev

# Build Tauri app (requires VS Developer Command Prompt on Windows)
cd src-tauri && cargo build

# Run full Tauri app
npm run tauri dev
```

## Windows Build Requirements
- Visual Studio 2022 with C++ Build Tools
- Run `cargo build` from **x64 Native Tools Command Prompt for VS 2022**
- Git's `link.exe` conflicts with MSVC linker - use Developer Command Prompt

## Svelte 5 Notes
- Use `$state()` for reactive state
- Use `$derived()` for computed values
- Use `$props()` for component props
- Avoid naming props `state` (conflicts with `$state` rune)

## Key Files
- `src/lib/pet/Sprite.svelte` - Sprite animation renderer
- `src/lib/pet/Pet.svelte` - Pet component wrapper
- `src-tauri/src/lib.rs` - Tauri backend logic
- `src-tauri/tauri.conf.json` - Tauri window config
