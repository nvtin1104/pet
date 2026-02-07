<template>
  <section id="section-subscriptions" class="section">
    <div class="section-header">
      <h1>Subscriptions</h1>
      <button
        id="add-subscription-btn"
        class="header-btn"
        v-motion
        :tapped="{ scale: 0.95 }"
        @click="showModal = true"
      >
        <Plus :size="16" />
        Add
      </button>
    </div>

    <div id="subscription-summary">
      <div
        class="summary-card"
        v-motion
        :initial="{ opacity: 0, scale: 0.95 }"
        :enter="{ opacity: 1, scale: 1 }"
      >
        <span class="summary-label">Monthly Total</span>
        <span id="monthly-total" class="summary-value">
          ${{ monthlyTotal.toFixed(2) }}
        </span>
      </div>
      <div
        class="summary-card"
        v-motion
        :initial="{ opacity: 0, scale: 0.95 }"
        :enter="{ opacity: 1, scale: 1, transition: { delay: 100 } }"
      >
        <span class="summary-label">Yearly Total</span>
        <span id="yearly-total" class="summary-value">
          ${{ yearlyTotal.toFixed(2) }}
        </span>
      </div>
    </div>

    <ul id="subscription-list">
      <li v-if="loading" class="subscription-loading">Loading...</li>
      <li v-else-if="subscriptions.length === 0" class="subscription-empty">
        No subscriptions yet. Click "+ Add" to create one.
      </li>
      <li
        v-for="(sub, idx) in subscriptions"
        :key="sub.id"
        class="subscription-item"
        v-motion
        :initial="{ opacity: 0, y: 8 }"
        :enter="{ opacity: 1, y: 0, transition: { delay: idx * 50 } }"
      >
        <div class="subscription-info">
          <div class="subscription-name">{{ sub.name }}</div>
          <div class="subscription-details">
            {{ sub.currency }} {{ sub.cost }} / {{ sub.billing_cycle }}
          </div>
        </div>
        <button class="delete-btn" @click="deleteSubscription(sub.id)">
          <Trash2 :size="14" />
        </button>
      </li>
    </ul>

    <!-- Add Subscription Modal -->
    <Transition name="modal">
      <div v-if="showModal" id="subscription-modal" class="modal">
        <div
          class="modal-content"
          v-motion
          :initial="{ opacity: 0, scale: 0.9, y: 20 }"
          :enter="{ opacity: 1, scale: 1, y: 0 }"
        >
          <div class="modal-header">
            <h2>Add Subscription</h2>
            <button class="modal-close" @click="closeModal">
              <X :size="18" />
            </button>
          </div>
        <form id="subscription-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="sub-name">Name</label>
            <input
              type="text"
              id="sub-name"
              v-model="formData.name"
              required
              placeholder="Netflix, Spotify..."
            >
          </div>
          <div class="form-group">
            <label for="sub-amount">Amount</label>
            <input
              type="number"
              id="sub-amount"
              v-model.number="formData.cost"
              required
              step="0.01"
              min="0"
              placeholder="9.99"
            >
          </div>
          <div class="form-group">
            <label for="sub-currency">Currency</label>
            <select id="sub-currency" v-model="formData.currency">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="VND">VND (₫)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="sub-cycle">Billing Cycle</label>
            <select id="sub-cycle" v-model="formData.billing_cycle">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="btn-submit">Add Subscription</button>
          </div>
        </form>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Plus, Trash2, X } from 'lucide-vue-next';
import { useSubscriptions } from '../composables/useSubscriptions';

const {
  subscriptions,
  loading,
  monthlyTotal,
  yearlyTotal,
  addSubscription,
  deleteSubscription
} = useSubscriptions();

const showModal = ref(false);

const formData = ref({
  name: '',
  cost: 0,
  currency: 'USD',
  billing_cycle: 'monthly' as 'monthly' | 'yearly',
  next_billing_date: new Date().toISOString().split('T')[0],
});

function closeModal() {
  showModal.value = false;
  resetForm();
}

function resetForm() {
  formData.value = {
    name: '',
    cost: 0,
    currency: 'USD',
    billing_cycle: 'monthly',
    next_billing_date: new Date().toISOString().split('T')[0],
  };
}

async function handleSubmit() {
  try {
    await addSubscription(formData.value);
    closeModal();
  } catch (error) {
    console.error('Failed to add subscription:', error);
  }
}
</script>
