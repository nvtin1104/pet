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
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import PetCanvas from './components/PetCanvas.vue';
import PetContextMenu from './components/PetContextMenu.vue';

const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const positionLocked = ref(false);
const targetMode = ref(false);

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
  // Enable target selection mode
  targetMode.value = true;
  console.log('Target mode enabled - click anywhere to set attack target');
  
  // Change cursor to crosshair
  document.body.style.cursor = 'crosshair';

  // Listen for next click to set target
  const handleTargetClick = (e) => {
    if (targetMode.value) {
      // Get screen coordinates for target
      const target = { 
        x: window.screenX + e.clientX, 
        y: window.screenY + e.clientY 
      };
      
      // Send target to overlay via IPC
      if (window.petAPI && window.petAPI.pet && window.petAPI.pet.moveToTarget) {
        window.petAPI.pet.moveToTarget(target.x, target.y);
      }
      
      // Also dispatch local event for same-window handling
      window.dispatchEvent(new CustomEvent('pet-attack-target', { 
        detail: { x: e.clientX, y: e.clientY } 
      }));
      
      targetMode.value = false;
      document.body.style.cursor = '';
      window.removeEventListener('click', handleTargetClick);
      console.log('Target set:', target);
    }
  };
  
  // Cancel on right-click or Escape
  const handleCancel = (e) => {
    if (e.type === 'contextmenu' || e.key === 'Escape') {
      targetMode.value = false;
      document.body.style.cursor = '';
      window.removeEventListener('click', handleTargetClick);
      window.removeEventListener('contextmenu', handleCancel);
      window.removeEventListener('keydown', handleCancel);
      console.log('Target mode cancelled');
    }
  };

  setTimeout(() => {
    window.addEventListener('click', handleTargetClick);
    window.addEventListener('contextmenu', handleCancel);
    window.addEventListener('keydown', handleCancel);
  }, 100);
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

onMounted(() => {
  // Listen for target mode activation from IPC
  if (window.petAPI && window.petAPI.on && window.petAPI.on.targetModeActive) {
    window.petAPI.on.targetModeActive((active) => {
      targetMode.value = active;
      console.log('Target mode from IPC:', active);
    });
  }
});
</script>

<style scoped>
#pet-root {
  width: 100vw;
  height: 100vh;
  background: transparent !important;
}
</style>