import { ref, computed, onUnmounted, watch } from 'vue';

export type TimerType = 'focus' | 'short' | 'long';

interface TimerSettings {
  focus: number;
  short: number;
  long: number;
}

export function useTimer(initialSettings?: TimerSettings) {
  const settings = ref<TimerSettings>({
    focus: initialSettings?.focus || 25,
    short: initialSettings?.short || 5,
    long: initialSettings?.long || 15,
  });

  const currentType = ref<TimerType>('focus');
  const timeLeft = ref(settings.value.focus * 60); // in seconds
  const isRunning = ref(false);
  let intervalId: number | null = null;

  // Computed properties
  const minutes = computed(() => Math.floor(timeLeft.value / 60));
  const seconds = computed(() => timeLeft.value % 60);

  const displayMinutes = computed(() => minutes.value.toString().padStart(2, '0'));
  const displaySeconds = computed(() => seconds.value.toString().padStart(2, '0'));

  const label = computed(() => {
    const labels = {
      focus: 'Focus Time',
      short: 'Short Break',
      long: 'Long Break'
    };
    return labels[currentType.value];
  });

  function setType(type: TimerType) {
    currentType.value = type;
    timeLeft.value = settings.value[type] * 60;
    reset();
  }

  function start() {
    if (isRunning.value) return;

    isRunning.value = true;
    intervalId = window.setInterval(() => {
      timeLeft.value--;

      if (timeLeft.value <= 0) {
        complete();
      }
    }, 1000);
  }

  function pause() {
    isRunning.value = false;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function reset() {
    pause();
    timeLeft.value = settings.value[currentType.value] * 60;
  }

  function complete() {
    pause();
    // Could add notification here
    reset();
  }

  function updateSettings(newSettings: Partial<TimerSettings>) {
    settings.value = { ...settings.value, ...newSettings };

    // Reset current timer if not running
    if (!isRunning.value) {
      timeLeft.value = settings.value[currentType.value] * 60;
    }
  }

  // Watch for settings changes from external sources
  watch(() => settings.value[currentType.value], (newDuration) => {
    if (!isRunning.value) {
      timeLeft.value = newDuration * 60;
    }
  });

  // Cleanup on unmount
  onUnmounted(() => {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
  });

  return {
    // State
    currentType,
    timeLeft,
    isRunning,
    settings,

    // Computed
    minutes,
    seconds,
    displayMinutes,
    displaySeconds,
    label,

    // Methods
    setType,
    start,
    pause,
    reset,
    complete,
    updateSettings,
  };
}
