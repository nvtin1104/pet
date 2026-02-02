import { ref, onMounted } from 'vue';
import type { Settings } from '@/types/petAPI';

export function useSettings() {
  const settings = ref<Settings>({
    petName: 'Knight',
    alwaysOnTop: false,
    petModeEnabled: false,
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    soundEnabled: true,
    notificationsEnabled: true,
    startOnBoot: false,
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadSettings() {
    loading.value = true;
    error.value = null;
    try {
      const loadedSettings = await window.petAPI.db.getSettings();
      settings.value = { ...settings.value, ...loadedSettings };
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load settings';
      console.error('useSettings: loadSettings error:', e);
    } finally {
      loading.value = false;
    }
  }

  async function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    try {
      const updated = await window.petAPI.db.updateSettings({ [key]: value });
      settings.value = { ...settings.value, ...updated };

      // Trigger window-level updates for specific settings
      if (key === 'alwaysOnTop') {
        window.petAPI.window.setAlwaysOnTop(value as boolean);
      } else if (key === 'petModeEnabled') {
        window.petAPI.window.togglePetMode(value as boolean);
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update setting';
      throw e;
    }
  }

  async function updateMultipleSettings(data: Partial<Settings>) {
    try {
      const updated = await window.petAPI.db.updateSettings(data);
      settings.value = { ...settings.value, ...updated };

      // Handle window-level updates
      if ('alwaysOnTop' in data) {
        window.petAPI.window.setAlwaysOnTop(data.alwaysOnTop!);
      }
      if ('petModeEnabled' in data) {
        window.petAPI.window.togglePetMode(data.petModeEnabled!);
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update settings';
      throw e;
    }
  }

  // Listen for pet mode changes from other sources
  onMounted(() => {
    loadSettings();

    window.petAPI.on.petModeChanged((enabled) => {
      settings.value.petModeEnabled = enabled;
    });
  });

  return {
    settings,
    loading,
    error,
    loadSettings,
    updateSetting,
    updateMultipleSettings,
  };
}
