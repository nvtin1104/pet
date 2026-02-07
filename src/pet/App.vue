<template>
  <div id="pet-root" class="w-full h-full">
    <PetCanvas @show-context-menu="handleShowContextMenu" />
    <PetContextMenu
      :visible="contextMenuVisible"
      :position="contextMenuPosition"
      :locked="positionLocked"
      @close="handleCloseContextMenu"
      @set-target="handleSetTarget"
      @open-settings="handleOpenSettings"
      @toggle-lock="handleToggleLock"
      @switch-display="handleSwitchDisplay"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import PetCanvas from './components/PetCanvas.vue';
import PetContextMenu from './components/PetContextMenu.vue';

const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const positionLocked = ref(false);

function handleShowContextMenu(position) {
  contextMenuPosition.value = position;
  contextMenuVisible.value = true;
}

function handleCloseContextMenu() {
  contextMenuVisible.value = false;
  // Dispatch event so PetCanvas can re-enable passthrough
  window.dispatchEvent(new Event('pet-context-menu-closed'));

  // Notify overlay that menu is closed (resume pet behavior)
  if (window.petAPI?.pet?.setContextMenuState) {
    window.petAPI.pet.setContextMenuState(false);
  }
  // Restore interactive window to hitbox size
  if (window.petAPI?.window?.expandInteractiveForDrag) {
    window.petAPI.window.expandInteractiveForDrag(false);
  }
}

function handleSetTarget() {
  // Generate a random target position on screen
  const screenWidth = window.screen.availWidth || window.innerWidth;
  const screenHeight = window.screen.availHeight || window.innerHeight;

  // Random position with some padding from edges
  const padding = 100;
  const targetX = padding + Math.random() * (screenWidth - padding * 2);
  const targetY = padding + Math.random() * (screenHeight - padding * 2);

  console.log('Random target generated:', { x: targetX, y: targetY });

  // Send target to overlay via IPC (screen coordinates)
  if (window.petAPI && window.petAPI.pet && window.petAPI.pet.moveToTarget) {
    window.petAPI.pet.moveToTarget(targetX, targetY);
  }
}

function handleOpenSettings() {
  if (window.petAPI && window.petAPI.window && window.petAPI.window.showSettings) {
    window.petAPI.window.showSettings();
  }
}

function handleToggleLock() {
  positionLocked.value = !positionLocked.value;
  console.log('Position lock:', positionLocked.value);
  
  // Send IPC to toggle position lock
  if (window.petAPI && window.petAPI.pet && window.petAPI.pet.toggleLock) {
    window.petAPI.pet.toggleLock(positionLocked.value);
  }
}

function handleSwitchDisplay(displayId) {
  console.log('Switching to display:', displayId);
  if (window.petAPI?.pet?.moveToDisplay) {
    window.petAPI.pet.moveToDisplay(displayId);
  }
}

</script>

<style scoped>
#pet-root {
  width: 100vw;
  height: 100vh;
  background: transparent !important;
}
</style>