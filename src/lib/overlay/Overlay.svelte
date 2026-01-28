<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Pet from "../pet/Pet.svelte";
  import { PetBehavior } from "../pet/PetBehavior";
  import {
    defaultPetState,
    getScreenSize,
    setIgnoreCursorEvents,
    type PetState,
  } from "../stores/pet";

  let petState: PetState = $state({ ...defaultPetState });
  let behavior: PetBehavior | null = $state(null);
  let animationFrameId: number;
  let lastTime: number = 0;
  let isMouseOverPet: boolean = $state(false);
  let mousePosition = $state({ x: 0, y: 0 });
  let clickThroughTimeout: number | null = null;

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

    // Check distance from mouse to pet and enable/disable click-through accordingly
    if (!petState.isDragging) {
      const petX = petState.position.x + 60; // Center of pet
      const petY = petState.position.y + 40;
      const distance = Math.sqrt(
        Math.pow(mousePosition.x - petX, 2) + Math.pow(mousePosition.y - petY, 2)
      );
      const threshold = 150; // Enable click-through if mouse is more than 150px away
      
      if (distance > threshold && !isMouseOverPet) {
        // Mouse is far from pet, enable click-through
        if (clickThroughTimeout === null) {
          clickThroughTimeout = window.setTimeout(() => {
            setIgnoreCursorEvents(true).catch(console.error);
            clickThroughTimeout = null;
          }, 300); // Wait 300ms before enabling click-through
        }
      } else {
        // Mouse is near pet, disable click-through
        if (clickThroughTimeout !== null) {
          clearTimeout(clickThroughTimeout);
          clickThroughTimeout = null;
        }
        setIgnoreCursorEvents(false).catch(console.error);
      }
    }

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
        isMouseOverPet = true;
        e.preventDefault();
        e.stopPropagation();
        behavior.startDrag();
      }
    }
  }

  function handleMouseMove(e: MouseEvent) {
    // Update mouse position for distance calculation
    mousePosition = { x: e.clientX, y: e.clientY };
    
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
    isMouseOverPet = true;
  }

  function handlePetMouseLeave() {
    if (!petState.isDragging) {
      isMouseOverPet = false;
    }
  }

  onMount(async () => {
    await initBehavior();
    // Always disable click-through so overlay window can receive mouse events
    // This allows us to detect when mouse enters pet area and enable interaction
    setIgnoreCursorEvents(false).catch(console.error);
    animationFrameId = requestAnimationFrame(gameLoop);
  });

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (clickThroughTimeout !== null) {
      clearTimeout(clickThroughTimeout);
    }
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
