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
  // Re-enable passthrough when menu closes
  setTimeout(() => {
    if (window.petAPI && window.petAPI.window && window.petAPI.window.togglePassthrough) {
      window.petAPI.window.togglePassthrough(true);
    }
  }, 100);
  window.dispatchEvent(new Event('pet-context-menu-closed'));
}

function handleSetTarget() {
  // Enable target selection mode
  targetMode.value = true;
  console.log('Target mode enabled - click anywhere to set attack target');
  
  // Send IPC to enable target selection mode
  if (window.petAPI && window.petAPI.pet && window.petAPI.pet.setTargetMode) {
    window.petAPI.pet.setTargetMode(true);
  }

  // Listen for next click to set target
  const handleTargetClick = (e) => {
    if (targetMode.value) {
      const target = { x: e.clientX, y: e.clientY };
      
      if (window.petAPI && window.petAPI.pet && window.petAPI.pet.moveToTarget) {
        window.petAPI.pet.moveToTarget(target.x, target.y);
      }
      
      targetMode.value = false;
      window.removeEventListener('click', handleTargetClick);
      console.log('Target set:', target);
    }
  };

  setTimeout(() => {
    window.addEventListener('click', handleTargetClick, { once: false });
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