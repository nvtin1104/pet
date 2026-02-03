export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface Subscription {
  id: number;
  name: string;
  cost: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  next_billing_date: string;
  created_at: string;
}

export interface Settings {
  petName: string;
  alwaysOnTop: boolean;
  petModeEnabled: boolean;
  petFullscreen: boolean;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  startOnBoot: boolean;
}

export interface PetAPI {
  db: {
    getTodos(): Promise<Todo[]>;
    createTodo(data: { title: string }): Promise<Todo>;
    updateTodo(id: number, data: Partial<Todo>): Promise<Todo>;
    deleteTodo(id: number): Promise<void>;

    getSubscriptions(): Promise<Subscription[]>;
    createSubscription(data: Omit<Subscription, 'id' | 'created_at'>): Promise<Subscription>;
    updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription>;
    deleteSubscription(id: number): Promise<void>;

    getSettings(): Promise<Settings>;
    updateSettings(data: Partial<Settings>): Promise<Settings>;
  };

  window: {
    togglePassthrough(ignore: boolean): void;
    setPosition(x: number, y: number): void;
    getCursorInWindow(): Promise<boolean>;
    togglePetMode(enabled: boolean): void;
    setPetFullscreen(enabled: boolean): void;
    setAlwaysOnTop(enabled: boolean): void;
    showSettings(): void;
    minimizeToTray(): void;
    showUI(): void;
    hideUI(): void;
    updateInteractiveBounds(bounds: { x: number; y: number; width: number; height: number; dpr: number }): void;
    sendPetInput(data: { type: string; screenX: number; screenY: number; button?: number }): void;
    toggleHitboxDebug(): void;
  };

  pet: {
    setTargetMode(enabled: boolean): void;
    moveToTarget(x: number, y: number): void;
    cancelTarget(): void;
    toggleLock(locked: boolean): void;
  };

  on: {
    petStateChange(callback: (state: string) => void): () => void;
    timerTick(callback: (data: { minutes: number; seconds: number }) => void): () => void;
    timerComplete(callback: () => void): () => void;
    petModeChanged(callback: (enabled: boolean) => void): () => void;
    hitboxDebug(callback: (enabled: boolean) => void): () => void;
    petInput(callback: (data: { type: string; screenX: number; screenY: number; button?: number }) => void): () => void;
    targetSet(callback: (target: { x: number; y: number }) => void): () => void;
    targetCancelled(callback: () => void): () => void;
    positionLocked(callback: (locked: boolean) => void): () => void;
    targetModeActive(callback: (active: boolean) => void): () => void;
  };
}

declare global {
  interface Window {
    petAPI: PetAPI;
  }
}
