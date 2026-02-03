<template>
  <section id="section-settings" class="section">
    <div class="section-header">
      <h1>Settings</h1>
    </div>

    <!-- Pet Settings -->
    <div class="settings-group">
      <h2>Pet</h2>
      <div class="setting-item">
        <div class="setting-info">
          <label for="pet-name">Pet Name</label>
          <span class="setting-desc">Give your pet a name</span>
        </div>
        <input
          type="text"
          id="pet-name"
          v-model="settings.petName"
          @blur="updateSetting('petName', settings.petName)"
        >
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <label>Always on Top</label>
          <span class="setting-desc">Keep pet above other windows</span>
        </div>
        <label class="toggle-switch small">
          <input
            type="checkbox"
            id="always-on-top"
            v-model="settings.alwaysOnTop"
            @change="updateSetting('alwaysOnTop', settings.alwaysOnTop)"
          >
          <span class="slider"></span>
        </label>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <label>Fullscreen Pet Mode</label>
          <span class="setting-desc">Make pet visual fullscreen while only a small hit box accepts input</span>
        </div>
        <label class="toggle-switch small">
          <input
            type="checkbox"
            id="pet-fullscreen"
            v-model="settings.petFullscreen"
            @change="updateSetting('petFullscreen', settings.petFullscreen)"
          >
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Timer Settings -->
    <div class="settings-group">
      <h2>Timer</h2>
      <div class="setting-item">
        <div class="setting-info">
          <label for="pomodoro-minutes">Focus Duration</label>
          <span class="setting-desc">Minutes per focus session</span>
        </div>
        <input
          type="number"
          id="pomodoro-minutes"
          v-model.number="settings.focusDuration"
          @blur="updateSetting('focusDuration', settings.focusDuration)"
          min="1"
          max="60"
        >
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <label for="short-break">Short Break</label>
          <span class="setting-desc">Minutes for short breaks</span>
        </div>
        <input
          type="number"
          id="short-break"
          v-model.number="settings.shortBreakDuration"
          @blur="updateSetting('shortBreakDuration', settings.shortBreakDuration)"
          min="1"
          max="30"
        >
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <label for="long-break">Long Break</label>
          <span class="setting-desc">Minutes for long breaks</span>
        </div>
        <input
          type="number"
          id="long-break"
          v-model.number="settings.longBreakDuration"
          @blur="updateSetting('longBreakDuration', settings.longBreakDuration)"
          min="1"
          max="60"
        >
      </div>
    </div>

    <!-- System Settings -->
    <div class="settings-group">
      <h2>System</h2>
      <div class="setting-item">
        <div class="setting-info">
          <label>Start with Windows</label>
          <span class="setting-desc">Launch app on system startup</span>
        </div>
        <label class="toggle-switch small">
          <input
            type="checkbox"
            id="start-with-system"
            v-model="settings.startOnBoot"
            @change="updateSetting('startOnBoot', settings.startOnBoot)"
          >
          <span class="slider"></span>
        </label>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <label>Sound Enabled</label>
          <span class="setting-desc">Play sounds for notifications</span>
        </div>
        <label class="toggle-switch small">
          <input
            type="checkbox"
            id="sound-enabled"
            v-model="settings.soundEnabled"
            @change="updateSetting('soundEnabled', settings.soundEnabled)"
          >
          <span class="slider"></span>
        </label>
      </div>
      <div class="setting-item">
        <div class="setting-info">
          <label>Notifications Enabled</label>
          <span class="setting-desc">Show desktop notifications</span>
        </div>
        <label class="toggle-switch small">
          <input
            type="checkbox"
            id="notifications-enabled"
            v-model="settings.notificationsEnabled"
            @change="updateSetting('notificationsEnabled', settings.notificationsEnabled)"
          >
          <span class="slider"></span>
        </label>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useSettings } from '../composables/useSettings';

const { settings, updateSetting } = useSettings();
</script>
