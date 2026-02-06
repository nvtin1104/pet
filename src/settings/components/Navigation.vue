<template>
  <nav id="sidebar">
    <div class="logo">
      <svg width="32" height="32" viewBox="0 0 32 32" class="logo-icon">
        <circle cx="16" cy="16" r="14" fill="#000000" stroke="#4F46E5" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="1.5" fill="#4F46E5"/>
        <circle cx="20" cy="12" r="1.5" fill="#4F46E5"/>
        <path d="M16 16 Q13 18 16 20 Q19 18 16 16Z" fill="#4F46E5"/>
        <path d="M16 20 Q12 22 10 21" stroke="#4F46E5" stroke-width="1" fill="none" stroke-linecap="round"/>
        <path d="M16 20 Q20 22 22 21" stroke="#4F46E5" stroke-width="1" fill="none" stroke-linecap="round"/>
        <circle cx="16" cy="26" r="0.8" fill="#4F46E5" opacity="0.7"/>
      </svg>
      <div class="logo-text">
        <span class="logo-title">PetFocus</span>
        <span class="logo-subtitle">Desktop Pet</span>
      </div>
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
      h('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', stroke: 'currentColor', 'stroke-width': '1.5', fill: 'none' }),
      h('path', { d: 'M9 12l2 2 4-4', stroke: 'currentColor', 'stroke-width': '1.5', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
    ]
  },
  {
    id: 'timer',
    label: 'Timer',
    icon: () => [
      h('circle', { cx: '12', cy: '12', r: '9', stroke: 'currentColor', 'stroke-width': '1.5', fill: 'none' }),
      h('path', { d: 'M12 7v5l3 3', stroke: 'currentColor', 'stroke-width': '1.5', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      h('circle', { cx: '12', cy: '12', r: '1', fill: 'currentColor' })
    ]
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    icon: () => [
      h('rect', { x: '2', y: '6', width: '20', height: '12', rx: '2', stroke: 'currentColor', 'stroke-width': '1.5', fill: 'none' }),
      h('path', { d: 'M2 8h20', stroke: 'currentColor', 'stroke-width': '1.5' }),
      h('circle', { cx: '7', cy: '13', r: '1', fill: 'currentColor' }),
      h('circle', { cx: '12', cy: '13', r: '1', fill: 'currentColor' })
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: () => [
      h('circle', { cx: '12', cy: '12', r: '3', stroke: 'currentColor', 'stroke-width': '1.5', fill: 'none' }),
      h('path', { d: 'M12 1v6M12 17v6', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' }),
      h('path', { d: 'm21 12-6-6v12l6-6Z', stroke: 'currentColor', 'stroke-width': '1.5', fill: 'none', 'stroke-linejoin': 'round' }),
      h('path', { d: 'm3 12 6-6v12l-6-6Z', stroke: 'currentColor', 'stroke-width': '1.5', fill: 'none', 'stroke-linejoin': 'round' })
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
