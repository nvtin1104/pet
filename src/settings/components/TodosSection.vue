<template>
  <section id="section-todos" class="section active">
    <div class="section-header">
      <h1>Todos</h1>
    </div>

    <div id="todo-input-container">
      <input
        type="text"
        id="todo-input"
        v-model="newTodoTitle"
        @keyup.enter="handleAddTodo"
        placeholder="What needs to be done?"
      >
      <button id="add-todo-btn" @click="handleAddTodo">Add</button>
    </div>

    <div id="todo-filters">
      <button
        v-for="filter in filters"
        :key="filter.value"
        class="filter-btn"
        :class="{ active: currentFilter === filter.value }"
        :data-filter="filter.value"
        @click="currentFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>

    <ul id="todo-list">
      <li v-if="loading" class="todo-loading">Loading...</li>
      <li v-else-if="filteredTodos.length === 0" class="todo-empty">
        {{ currentFilter === 'completed' ? 'No completed todos' : 'No todos yet' }}
      </li>
      <li
        v-for="todo in filteredTodos"
        :key="todo.id"
        class="todo-item"
        :class="{ completed: todo.completed }"
      >
        <input
          type="checkbox"
          :checked="todo.completed"
          @change="toggleTodo(todo.id)"
        >
        <span class="todo-text">{{ todo.title }}</span>
        <button class="delete-btn" @click="deleteTodo(todo.id)">×</button>
      </li>
    </ul>

    <div id="todo-stats">
      <span id="todo-count">{{ todoStats }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTodos } from '../composables/useTodos';

const { todos, loading, addTodo, toggleTodo, deleteTodo } = useTodos();

const newTodoTitle = ref('');
const currentFilter = ref<'all' | 'active' | 'completed'>('all');

const filters = [
  { value: 'all' as const, label: 'All' },
  { value: 'active' as const, label: 'Active' },
  { value: 'completed' as const, label: 'Completed' }
];

const filteredTodos = computed(() => {
  if (currentFilter.value === 'all') {
    return todos.value;
  } else if (currentFilter.value === 'active') {
    return todos.value.filter(t => !t.completed);
  } else {
    return todos.value.filter(t => t.completed);
  }
});

const todoStats = computed(() => {
  const completed = todos.value.filter(t => t.completed).length;
  const total = todos.value.length;
  return `${completed} of ${total} completed`;
});

async function handleAddTodo() {
  if (!newTodoTitle.value.trim()) return;

  try {
    await addTodo(newTodoTitle.value);
    newTodoTitle.value = '';
  } catch (error) {
    console.error('Failed to add todo:', error);
  }
}
</script>
