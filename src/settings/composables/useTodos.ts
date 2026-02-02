import { ref, onMounted } from 'vue';
import type { Todo } from '@/types/petAPI';

export function useTodos() {
  const todos = ref<Todo[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadTodos() {
    loading.value = true;
    error.value = null;
    try {
      todos.value = await window.petAPI.db.getTodos();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load todos';
      console.error('useTodos: loadTodos error:', e);
    } finally {
      loading.value = false;
    }
  }

  async function addTodo(title: string) {
    if (!title.trim()) return;

    try {
      await window.petAPI.db.createTodo({ title: title.trim() });
      await loadTodos();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to add todo';
      throw e;
    }
  }

  async function toggleTodo(id: number) {
    const todo = todos.value.find(t => t.id === id);
    if (!todo) return;

    try {
      await window.petAPI.db.updateTodo(id, { completed: !todo.completed });
      await loadTodos();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to toggle todo';
      throw e;
    }
  }

  async function deleteTodo(id: number) {
    try {
      await window.petAPI.db.deleteTodo(id);
      await loadTodos();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete todo';
      throw e;
    }
  }

  onMounted(loadTodos);

  return {
    todos,
    loading,
    error,
    loadTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
}
