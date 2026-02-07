<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="pet-context-menu"
      :style="menuStyle"
      v-motion
      :initial="{ opacity: 0, scale: 0.95, y: -4 }"
      :enter="{ opacity: 1, scale: 1, y: 0 }"
      @contextmenu.prevent
    >
      <div
        class="menu-item"
        v-motion
        :initial="{ opacity: 0, x: -8 }"
        :enter="{ opacity: 1, x: 0, transition: { delay: 30 } }"
        @click="handleSetTarget"
      >
        <Target class="icon" :size="16" />
        <span>Attack Random Target</span>
      </div>
      <div class="menu-divider"></div>
      <div v-if="displays.length > 1" class="menu-item submenu-parent" @mouseenter="showSubmenu = true" @mouseleave="showSubmenu = false">
        <Monitor class="icon" :size="16" />
        <span>Switch Screen</span>
        <ChevronRight class="icon submenu-arrow" :size="14" />
        <div v-if="showSubmenu" class="submenu" @click.stop>
          <div
            v-for="d in displays"
            :key="d.id"
            class="menu-item"
            :class="{ 'menu-item-disabled': d.isCurrent }"
            @click="!d.isCurrent && handleSwitchDisplay(d.id)"
          >
            <Monitor class="icon" :size="14" />
            <span>Screen {{ d.index + 1 }} — {{ d.label }}</span>
          </div>
        </div>
      </div>
      <div
        class="menu-item"
        v-motion
        :initial="{ opacity: 0, x: -8 }"
        :enter="{ opacity: 1, x: 0, transition: { delay: 60 } }"
        @click="handleOpenSettings"
      >
        <Settings class="icon" :size="16" />
        <span>Settings</span>
      </div>
      <div
        class="menu-item"
        v-motion
        :initial="{ opacity: 0, x: -8 }"
        :enter="{ opacity: 1, x: 0, transition: { delay: 90 } }"
        @click="handleToggleLock"
      >
        <Lock v-if="!locked" class="icon" :size="16" />
        <Unlock v-else class="icon" :size="16" />
        <span>{{ locked ? 'Unlock Position' : 'Lock Position' }}</span>
      </div>
      <div class="menu-divider"></div>
      <div
        class="menu-item"
        v-motion
        :initial="{ opacity: 0, x: -8 }"
        :enter="{ opacity: 1, x: 0, transition: { delay: 120 } }"
        @click="handleClose"
      >
        <X class="icon" :size="16" />
        <span>Close Menu</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { Target, Settings, Lock, Unlock, X, Monitor, ChevronRight } from 'lucide-vue-next';

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

const emit = defineEmits(['close', 'set-target', 'open-settings', 'toggle-lock', 'switch-display']);

const menuRef = ref(null);
const adjustedPos = ref({ x: 0, y: 0 });
const showSubmenu = ref(false);
const displays = ref([]);

// Compute clamped position after menu renders so we use real measured size
const menuStyle = computed(() => ({
  left: adjustedPos.value.x + 'px',
  top: adjustedPos.value.y + 'px'
}));

function clampMenuPosition() {
  const margin = 8;
  let x = props.position.x;
  let y = props.position.y;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (menuRef.value) {
    const rect = menuRef.value.getBoundingClientRect();
    // Flip left if overflowing right
    if (x + rect.width + margin > vw) x = vw - rect.width - margin;
    // Flip up if overflowing bottom
    if (y + rect.height + margin > vh) y = vh - rect.height - margin;
  } else {
    // Fallback: estimate
    if (x + 230 > vw) x = vw - 230;
    if (y + 210 > vh) y = vh - 210;
  }

  adjustedPos.value = { x: Math.max(margin, x), y: Math.max(margin, y) };
}

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
  showSubmenu.value = false;
  emit('close');
}

function handleSwitchDisplay(displayId) {
  showSubmenu.value = false;
  emit('switch-display', displayId);
  emit('close');
}

// Fetch displays list when menu opens
async function fetchDisplays() {
  try {
    if (window.petAPI?.pet?.getDisplays) {
      displays.value = await window.petAPI.pet.getDisplays();
    }
  } catch (e) {
    console.warn('Failed to fetch displays:', e);
    displays.value = [];
  }
}

// Close menu when clicking outside
function handleClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    emit('close');
  }
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    showSubmenu.value = false;
    fetchDisplays();
    // Initial position from raw click coords
    adjustedPos.value = { x: props.position.x, y: props.position.y };
    // After render, measure actual menu size and clamp
    nextTick(() => {
      clampMenuPosition();
    });
    setTimeout(() => {
      // Re-clamp after animation settles
      clampMenuPosition();
      document.addEventListener('click', handleClickOutside);
    }, 60);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});

// Also re-clamp when position prop changes while visible
watch(() => props.position, () => {
  if (props.visible) {
    adjustedPos.value = { x: props.position.x, y: props.position.y };
    nextTick(() => clampMenuPosition());
  }
}, { deep: true });

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.pet-context-menu {
  position: fixed;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(79, 70, 229, 0.3);
  border-radius: 8px;
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
  min-width: 200px;
  padding: 8px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 500;
  user-select: none;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.menu-item:hover {
  background: rgba(79, 70, 229, 0.15);
  color: #4F46E5;
  transform: translateY(-1px);
}

.menu-item:active {
  background: rgba(79, 70, 229, 0.25);
  transform: scale(0.98);
}

.menu-item .icon {
  flex-shrink: 0;
  color: #4F46E5;
  opacity: 0.9;
}

.menu-item:hover .icon {
  opacity: 1;
  transform: scale(1.1);
}

.menu-divider {
  height: 1px;
  background: rgba(79, 70, 229, 0.2);
  margin: 6px 8px;
  border-radius: 1px;
}

.submenu-parent {
  position: relative;
}

.submenu-parent .submenu-arrow {
  margin-left: auto;
  opacity: 0.6;
}

.submenu {
  position: absolute;
  left: 100%;
  top: -8px;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(79, 70, 229, 0.3);
  border-radius: 8px;
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
  min-width: 180px;
  padding: 6px;
}

.menu-item-disabled {
  opacity: 0.4;
  pointer-events: none;
}
</style>
