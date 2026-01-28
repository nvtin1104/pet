# PetFocus - Cursor AI Rules

## Project Type
Tauri v2 + Svelte 5 desktop application

## Code Style
- Use TypeScript for all `.ts` and `.svelte` files
- Use Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`)
- Use TailwindCSS for styling
- Prefer functional components over class-based

## Svelte 5 Patterns
```svelte
<script lang="ts">
  // Props with $props()
  interface Props {
    name: string;
    count?: number;
  }
  let { name, count = 0 }: Props = $props();

  // Reactive state with $state()
  let value = $state(0);

  // Computed values with $derived()
  const doubled = $derived(value * 2);
</script>
```

## Important Rules
1. **Never name a prop `state`** - conflicts with `$state` rune
2. **Sprite assets** are at `/assets/Colour1/Outline/120x80_PNGSheets/`
3. **Frame size**: 120x80px per animation frame
4. **Tauri commands** go in `src-tauri/src/lib.rs`

## File Locations
| Purpose | Path |
|---------|------|
| Pet component | `src/lib/pet/Pet.svelte` |
| Sprite renderer | `src/lib/pet/Sprite.svelte` |
| Main app | `src/App.svelte` |
| Tauri config | `src-tauri/tauri.conf.json` |
| Rust backend | `src-tauri/src/lib.rs` |

## Animation System
Animations defined in `Sprite.svelte`:
```typescript
const ANIMATIONS = {
  idle: { file: "_Idle.png", frames: 10, fps: 8 },
  run: { file: "_Run.png", frames: 10, fps: 12 },
  attack: { file: "_Attack.png", frames: 4, fps: 10 },
  // ... more in Sprite.svelte
};
```

## Build Notes (Windows)
- Requires Visual Studio 2022 C++ Build Tools
- Run Rust builds from **x64 Native Tools Command Prompt**
- Regular PowerShell will fail with linker errors
