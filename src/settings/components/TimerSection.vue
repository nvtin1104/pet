<template>
  <section id="section-timer" class="section">
    <div class="section-header">
      <h1>Pomodoro Timer</h1>
    </div>

    <div
      id="timer-container"
      v-motion
      :initial="{ opacity: 0, y: 12 }"
      :enter="{ opacity: 1, y: 0 }"
    >
      <div id="timer-display">
        <span id="timer-minutes">{{ timer.displayMinutes }}</span>
        <span class="timer-separator">:</span>
        <span id="timer-seconds">{{ timer.displaySeconds }}</span>
      </div>

      <div id="timer-label">{{ timer.label }}</div>

      <div id="timer-controls">
        <button
          id="timer-start"
          class="timer-btn primary"
          :disabled="timer.isRunning.value"
          v-motion
          :tapped="{ scale: 0.95 }"
          @click="timer.start()"
        >
          <Play :size="16" />
          Start
        </button>
        <button
          id="timer-pause"
          class="timer-btn"
          :disabled="!timer.isRunning.value"
          v-motion
          :tapped="{ scale: 0.95 }"
          @click="timer.pause()"
        >
          <Pause :size="16" />
          Pause
        </button>
        <button
          id="timer-reset"
          class="timer-btn"
          v-motion
          :tapped="{ scale: 0.95 }"
          @click="timer.reset()"
        >
          <RotateCcw :size="16" />
          Reset
        </button>
      </div>

      <div id="timer-presets">
        <button
          v-for="preset in presets"
          :key="preset.type"
          class="preset-btn"
          :class="{ active: timer.currentType.value === preset.type }"
          :data-type="preset.type"
          v-motion
          :hovered="{ scale: 1.05 }"
          :tapped="{ scale: 0.95 }"
          @click="timer.setType(preset.type)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { Play, Pause, RotateCcw } from 'lucide-vue-next';
import { useTimer, type TimerType } from '../composables/useTimer';
import { useSettings } from '../composables/useSettings';

const { settings } = useSettings();

const timer = useTimer();

const presets: Array<{ type: TimerType; label: string }> = [
  { type: 'focus', label: 'Focus' },
  { type: 'short', label: 'Short Break' },
  { type: 'long', label: 'Long Break' }
];

onMounted(async () => {
  // Update timer settings from database
  timer.updateSettings({
    focus: settings.value.focusDuration || 25,
    short: settings.value.shortBreakDuration || 5,
    long: settings.value.longBreakDuration || 15,
  });
});
</script>
