import { ref, computed, onMounted } from 'vue';
import type { Subscription } from '@/types/petAPI';

export function useSubscriptions() {
  const subscriptions = ref<Subscription[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadSubscriptions() {
    loading.value = true;
    error.value = null;
    try {
      subscriptions.value = await window.petAPI.db.getSubscriptions();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load subscriptions';
      console.error('useSubscriptions: loadSubscriptions error:', e);
    } finally {
      loading.value = false;
    }
  }

  async function addSubscription(data: Omit<Subscription, 'id' | 'created_at'>) {
    try {
      await window.petAPI.db.createSubscription(data);
      await loadSubscriptions();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to add subscription';
      throw e;
    }
  }

  async function updateSubscription(id: number, data: Partial<Subscription>) {
    try {
      await window.petAPI.db.updateSubscription(id, data);
      await loadSubscriptions();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update subscription';
      throw e;
    }
  }

  async function deleteSubscription(id: number) {
    try {
      await window.petAPI.db.deleteSubscription(id);
      await loadSubscriptions();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete subscription';
      throw e;
    }
  }

  // Computed totals
  const monthlyTotal = computed(() => {
    return subscriptions.value.reduce((total, sub) => {
      if (sub.billing_cycle === 'monthly') {
        return total + sub.cost;
      } else {
        // Yearly subscriptions converted to monthly
        return total + (sub.cost / 12);
      }
    }, 0);
  });

  const yearlyTotal = computed(() => {
    return subscriptions.value.reduce((total, sub) => {
      if (sub.billing_cycle === 'yearly') {
        return total + sub.cost;
      } else {
        // Monthly subscriptions converted to yearly
        return total + (sub.cost * 12);
      }
    }, 0);
  });

  onMounted(loadSubscriptions);

  return {
    subscriptions,
    loading,
    error,
    monthlyTotal,
    yearlyTotal,
    loadSubscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  };
}
