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
        v-for="(item, idx) in navItems"
        :key="item.id"
        :class="{ active: activeSection === item.id }"
        :data-section="item.id"
        v-motion
        :initial="{ opacity: 0, x: -12 }"
        :enter="{ opacity: 1, x: 0, transition: { delay: idx * 50 } }"
        :hovered="{ x: 4 }"
        @click="$emit('change-section', item.id)"
      >
        <component :is="item.icon" :size="18" />
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
import { ref, onMounted } from 'vue';
import { CheckSquare, Clock, CreditCard, Settings } from 'lucide-vue-next';
import type { FunctionalComponent } from 'vue';

interface NavItem {
  id: 'todos' | 'timer' | 'subscriptions' | 'settings';
  label: string;
  icon: FunctionalComponent;
}

defineProps<{
  activeSection: 'todos' | 'timer' | 'subscriptions' | 'settings';
}>();

defineEmits<{
  'change-section': [section: 'todos' | 'timer' | 'subscriptions' | 'settings'];
}>();

const petModeEnabled = ref(false);

const navItems: NavItem[] = [
  { id: 'todos', label: 'Todos', icon: CheckSquare },
  { id: 'timer', label: 'Timer', icon: Clock },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
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
