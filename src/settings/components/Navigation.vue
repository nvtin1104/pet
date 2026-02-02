<template>
  <nav id="sidebar">
    <div class="logo">
      <div class="logo-icon"></div>
      <span>PetFocus</span>
    </div>

    <ul class="nav-items">
      <li
        v-for="item in navItems"
        :key="item.id"
        :class="{ active: activeSection === item.id }"
        :data-section="item.id"
        @click="$emit('change-section', item.id)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <component :is="() => item.icon" />
        </svg>
        <span>{{ item.label }}</span>
      </li>
    </ul>

    <!-- Pet Mode Toggle -->
    <div id="pet-mode-section">
      <div id="pet-mode-toggle">
        <label class="toggle-switch">
          <input
            type="checkbox"
            id="pet-mode-checkbox"
            v-model="petModeEnabled"
            @change="handlePetModeChange"
          >
          <span class="slider"></span>
        </label>
        <span class="toggle-label">Pet Mode</span>
      </div>
      <p class="pet-mode-hint">Enable to show desktop pet</p>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue';

interface NavItem {
  id: 'todos' | 'timer' | 'subscriptions' | 'settings';
  label: string;
  icon: () => any;
}

defineProps<{
  activeSection: 'todos' | 'timer' | 'subscriptions' | 'settings';
}>();

defineEmits<{
  'change-section': [section: 'todos' | 'timer' | 'subscriptions' | 'settings'];
}>();

const petModeEnabled = ref(false);

const navItems: NavItem[] = [
  {
    id: 'todos',
    label: 'Todos',
    icon: () => [
      h('path', { d: 'M9 11l3 3L22 4' }),
      h('path', { d: 'M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11' })
    ]
  },
  {
    id: 'timer',
    label: 'Timer',
    icon: () => [
      h('circle', { cx: '12', cy: '12', r: '10' }),
      h('polyline', { points: '12 6 12 12 16 14' })
    ]
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    icon: () => [
      h('rect', { x: '1', y: '4', width: '22', height: '16', rx: '2', ry: '2' }),
      h('line', { x1: '1', y1: '10', x2: '23', y2: '10' })
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: () => [
      h('circle', { cx: '12', cy: '12', r: '3' }),
      h('path', { d: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z' })
    ]
  }
];

onMounted(async () => {
  // Load pet mode setting
  const settings = await window.petAPI.db.getSettings();
  petModeEnabled.value = settings.petModeEnabled || false;

  // Listen for external pet mode changes
  window.petAPI.on.petModeChanged((enabled) => {
    petModeEnabled.value = enabled;
  });
});

async function handlePetModeChange() {
  const enabled = petModeEnabled.value;
  await window.petAPI.db.updateSettings({ petModeEnabled: enabled });
  window.petAPI.window.togglePetMode(enabled);
}
</script>
