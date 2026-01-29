import { invoke } from "@tauri-apps/api/core";

export type PetAnimation =
  | "idle"
  | "walk"
  | "run"
  | "attack"
  | "jump"
  | "fall"
  | "hit"
  | "death"
  | "dash"
  | "roll"
  | "crouch";

export type Direction = "left" | "right";

export interface PetState {
  animation: PetAnimation;
  direction: Direction;
  position: { x: number; y: number };
  isDragging: boolean;
}

export const defaultPetState: PetState = {
  animation: "idle",
  direction: "right",
  position: { x: 500, y: 500 },
  isDragging: false,
};

// Tauri commands
export async function setIgnoreCursorEvents(ignore: boolean): Promise<void> {
  await invoke("set_ignore_cursor_events", { ignore });
}

export async function getScreenSize(): Promise<{ width: number; height: number }> {
  const [width, height] = await invoke<[number, number]>("get_screen_size");
  return { width, height };
}

export async function showOverlay(): Promise<void> {
  await invoke("show_overlay");
}

export async function hideOverlay(): Promise<void> {
  await invoke("hide_overlay");
}

export async function updatePetBounds(
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  await invoke("update_pet_bounds", { x, y, width, height });
}

export async function startMouseTracking(): Promise<void> {
  await invoke("start_mouse_tracking");
}

export async function stopMouseTracking(): Promise<void> {
  await invoke("stop_mouse_tracking");
}
