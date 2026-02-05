import { ref, onMounted, watch } from 'vue';

export type Theme = 'light' | 'dark';

// Global reactive theme state
const theme = ref<Theme>('dark');

export function useTheme() {
  onMounted(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('petfocus-theme') as Theme | null;
    if (savedTheme) {
      theme.value = savedTheme;
    }
    applyTheme(theme.value);
  });

  watch(theme, (newTheme) => {
    applyTheme(newTheme);
    localStorage.setItem('petfocus-theme', newTheme);
  });

  function applyTheme(t: Theme) {
    const html = document.documentElement;
    if (t === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
  }

  function setTheme(t: Theme) {
    theme.value = t;
  }

  return {
    theme,
    toggleTheme,
    setTheme,
  };
}
