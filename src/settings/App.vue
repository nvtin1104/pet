<template>
  <div id="app" class="settings-container">
    <Navigation
      :active-section="activeSection"
      @change-section="handleSectionChange"
    />

    <main class="content-area">
      <TodosSection v-show="activeSection === 'todos'" />
      <TimerSection v-show="activeSection === 'timer'" />
      <SubscriptionsSection v-show="activeSection === 'subscriptions'" />
      <SettingsSection v-show="activeSection === 'settings'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Navigation from './components/Navigation.vue';
import TodosSection from './components/TodosSection.vue';
import TimerSection from './components/TimerSection.vue';
import SubscriptionsSection from './components/SubscriptionsSection.vue';
import SettingsSection from './components/SettingsSection.vue';

type SectionId = 'todos' | 'timer' | 'subscriptions' | 'settings';

const activeSection = ref<SectionId>('todos');

function handleSectionChange(sectionId: SectionId) {
  activeSection.value = sectionId;
}
</script>
