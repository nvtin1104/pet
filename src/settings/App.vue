<template>
  <div id="app" class="settings-container">
    <Navigation
      :active-section="activeSection"
      @change-section="handleSectionChange"
    />

    <main class="content-area">
      <Transition name="section" mode="out-in">
        <component :is="sectionComponents[activeSection]" :key="activeSection" />
      </Transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, type Component } from 'vue';
import Navigation from './components/Navigation.vue';
import TodosSection from './components/TodosSection.vue';
import TimerSection from './components/TimerSection.vue';
import SubscriptionsSection from './components/SubscriptionsSection.vue';
import SettingsSection from './components/SettingsSection.vue';

type SectionId = 'todos' | 'timer' | 'subscriptions' | 'settings';

const activeSection = ref<SectionId>('todos');

const sectionComponents: Record<SectionId, Component> = {
  todos: TodosSection,
  timer: TimerSection,
  subscriptions: SubscriptionsSection,
  settings: SettingsSection,
};

function handleSectionChange(sectionId: SectionId) {
  activeSection.value = sectionId;
}
</script>
