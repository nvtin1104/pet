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
      <button
        id="add-todo-btn"
        v-motion
        :tapped="{ scale: 0.95 }"
        @click="handleAddTodo"
      >
        <Plus :size="16" />
        Add
      </button>
    </div>

    <div id="todo-filters">
      <button
        v-for="filter in filters"
        :key="filter.value"
        class="filter-btn"
        :class="{ active: currentFilter === filter.value }"
        :data-filter="filter.value"
        v-motion
        :hovered="{ scale: 1.05 }"
        :tapped="{ scale: 0.95 }"
        @click="currentFilter = filter.value"
      >
        <component :is="filter.icon" :size="14" />
        {{ filter.label }}
      </button>
    </div>

    <ul id="todo-list">
      <li v-if="loading" class="todo-loading">Loading...</li>
      <li v-else-if="filteredTodos.length === 0" class="todo-empty">
        {{ currentFilter === 'completed' ? 'No completed todos' : 'No todos yet' }}
      </li>
      <TransitionGroup
        v-else
        name="todo"
        tag="div"
      >
        <li
          v-for="(todo, idx) in filteredTodos"
          :key="todo.id"
          class="todo-item"
          :class="{ completed: todo.completed }"
          v-motion
          :initial="{ opacity: 0, y: 8 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: idx * 50 } }"
        >
          <input
            type="checkbox"
            :checked="todo.completed"
            @change="toggleTodo(todo.id)"
          >
          <span class="todo-text">{{ todo.title }}</span>
          <button class="delete-btn" @click="deleteTodo(todo.id)">
            <Trash2 :size="14" />
          </button>
        </li>
      </TransitionGroup>
    </ul>

    <div id="todo-stats">
      <span id="todo-count">{{ todoStats }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus, Trash2, ListFilter, Circle, CheckCircle } from 'lucide-vue-next';
import { useTodos } from '../composables/useTodos';

const { todos, loading, addTodo, toggleTodo, deleteTodo } = useTodos();

const newTodoTitle = ref('');
const currentFilter = ref<'all' | 'active' | 'completed'>('all');

const filters = [
  { value: 'all' as const, label: 'All', icon: ListFilter },
  { value: 'active' as const, label: 'Active', icon: Circle },
  { value: 'completed' as const, label: 'Completed', icon: CheckCircle },
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
