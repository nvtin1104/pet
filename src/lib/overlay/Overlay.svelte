<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Pet from "../pet/Pet.svelte";
  import { PetBehavior, PET_WIDTH, PET_HEIGHT } from "../pet/PetBehavior";
  import {
    defaultPetState,
    getScreenSize,
    updatePetBounds,
    startMouseTracking,
    stopMouseTracking,
    type PetState,
  } from "../stores/pet";

  let petState: PetState = $state({ ...defaultPetState });
  let behavior: PetBehavior | null = $state(null);
  let animationFrameId: number;
  let lastTime: number = 0;

  async function initBehavior() {
    try {
      const screenSize = await getScreenSize();
      // Position pet at bottom center initially
      petState.position = {
        x: screenSize.width / 2 - 60,
        y: screenSize.height - 150,
      };
      behavior = new PetBehavior(petState, screenSize);
    } catch (e) {
      // Fallback for dev mode without Tauri
      console.warn("Could not get screen size, using defaults", e);
      behavior = new PetBehavior(petState, { width: 1920, height: 1080 });
    }
  }

  function gameLoop(timestamp: number) {
    if (!behavior) {
      animationFrameId = requestAnimationFrame(gameLoop);
      return;
    }

    const deltaTime = lastTime ? timestamp - lastTime : 16;
    lastTime = timestamp;

    behavior.update(deltaTime);

    // Sync state from behavior
    petState = { ...behavior.state };

    // Update pet bounds in Rust backend for mouse tracking
    // Add padding for easier clicking (10px on each side)
    const padding = 10;
    updatePetBounds(
      petState.position.x - padding,
      petState.position.y - padding,
      PET_WIDTH + padding * 2,
      PET_HEIGHT + padding * 2
    ).catch(console.error);

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function handleMouseDown(e: MouseEvent) {
    if (!behavior) return;
    
    // Check if click is within pet bounds (120x80 pet size + some padding for easier clicking)
    const petX = petState.position.x;
    const petY = petState.position.y;
    const petWidth = 120;
    const petHeight = 80;
    const padding = 10; // Extra padding for easier clicking
    
    if (
      e.clientX >= petX - padding &&
      e.clientX <= petX + petWidth + padding &&
      e.clientY >= petY - padding &&
      e.clientY <= petY + petHeight + padding
    ) {
      if (e.button === 0) {
        // Left click on pet - start drag
        e.preventDefault();
        e.stopPropagation();
        behavior.startDrag();
      }
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!behavior || !petState.isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    behavior.updateDragPosition(e.clientX, e.clientY);
  }

  function handleMouseUp(e: MouseEvent) {
    if (!behavior || !petState.isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    behavior.endDrag();
  }

  function handlePetClick() {
    if (!behavior || petState.isDragging) return;
    behavior.handleClick();
  }

  function handlePetMouseEnter() {
    // Mouse enter handler kept for potential future use
  }

  function handlePetMouseLeave() {
    // Mouse leave handler kept for potential future use
  }

  onMount(async () => {
    await initBehavior();
    // Start mouse tracking in Rust backend
    startMouseTracking().catch(console.error);
    animationFrameId = requestAnimationFrame(gameLoop);
  });

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    // Stop mouse tracking when overlay is destroyed
    stopMouseTracking().catch(console.error);
  });
</script>

<svelte:window
  onmousedown={handleMouseDown}
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
/>

<div class="overlay">
  <div
    class="pet-wrapper"
    onmouseenter={handlePetMouseEnter}
    onmouseleave={handlePetMouseLeave}
    onclick={handlePetClick}
    role="button"
    tabindex="0"
  >
    <Pet
      x={petState.position.x}
      y={petState.position.y}
      animation={petState.animation}
      direction={petState.direction}
    />
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: transparent;
    pointer-events: none;
  }

  .pet-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: auto;
    cursor: grab;
    z-index: 9999;
  }

  .pet-wrapper:active {
    cursor: grabbing;
  }
</style>
