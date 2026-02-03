<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="pet-context-menu"
      :style="{
        left: position.x + 'px',
        top: position.y + 'px'
      }"
      @contextmenu.prevent
    >
      <div class="menu-item" @click="handleSetTarget">
        <Target class="icon" :size="16" />
        <span>Set Attack Target</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="handleOpenSettings">
        <Settings class="icon" :size="16" />
        <span>Settings</span>
      </div>
      <div class="menu-item" @click="handleToggleLock">
        <Lock v-if="!locked" class="icon" :size="16" />
        <Unlock v-else class="icon" :size="16" />
        <span>{{ locked ? 'Unlock Position' : 'Lock Position' }}</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="handleClose">
        <X class="icon" :size="16" />
        <span>Close Menu</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { Target, Settings, Lock, Unlock, X } from 'lucide-vue-next';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  locked: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'set-target', 'open-settings', 'toggle-lock']);

const menuRef = ref(null);

function handleSetTarget() {
  emit('set-target');
  emit('close');
}

function handleOpenSettings() {
  emit('open-settings');
  emit('close');
}

function handleToggleLock() {
  emit('toggle-lock');
  emit('close');
}

function handleClose() {
  emit('close');
}

// Close menu when clicking outside
function handleClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    emit('close');
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 10);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.pet-context-menu {
  position: fixed;
  z-index: 99999;
  background: rgba(15, 15, 26, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  min-width: 200px;
  padding: 8px 0;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  user-select: none;
  animation: menuFadeIn 0.15s ease-out;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.15s ease;
}

.menu-item:hover {
  background: rgba(139, 92, 246, 0.2);
  color: #fff;
}

.menu-item:active {
  background: rgba(139, 92, 246, 0.3);
  transform: scale(0.98);
}

.menu-item .icon {
  flex-shrink: 0;
  color: rgba(139, 92, 246, 0.8);
}

.menu-divider {
  height: 1px;
  background: rgba(139, 92, 246, 0.2);
  margin: 4px 0;
}
</style>
