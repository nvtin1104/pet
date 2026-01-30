// ============================================
// PetFocus Settings Window Renderer
// ============================================

// ============================================
// Navigation Module
// ============================================

const Navigation = {
  init() {
    const navItems = document.querySelectorAll('.nav-items li');
    const sections = document.querySelectorAll('.section');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const sectionId = item.dataset.section;

        // Update nav active state
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Show corresponding section
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById(`section-${sectionId}`).classList.add('active');
      });
    });
  }
};

// ============================================
// Pet Mode Module
// ============================================

const PetMode = {
  checkbox: null,

  async init() {
    this.checkbox = document.getElementById('pet-mode-checkbox');

    // Load current state from database
    const settings = await window.petAPI.db.getSettings();
    this.checkbox.checked = settings.petModeEnabled || false;

    // Handle toggle
    this.checkbox.addEventListener('change', async () => {
      const enabled = this.checkbox.checked;
      await window.petAPI.db.updateSettings({ petModeEnabled: enabled });
      window.petAPI.window.togglePetMode(enabled);
    });

    // Listen for external changes (from tray menu)
    window.petAPI.on.petModeChanged((enabled) => {
      this.checkbox.checked = enabled;
    });
  }
};

// ============================================
// Todos Module
// ============================================

const TodosUI = {
  list: null,
  input: null,
  addBtn: null,
  countEl: null,
  currentFilter: 'all',
  todos: [],

  async init() {
    this.list = document.getElementById('todo-list');
    this.input = document.getElementById('todo-input');
    this.addBtn = document.getElementById('add-todo-btn');
    this.countEl = document.getElementById('todo-count');

    // Event listeners
    this.addBtn.addEventListener('click', () => this.addTodo());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTodo();
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.render();
      });
    });

    await this.loadTodos();
  },

  async loadTodos() {
    this.todos = await window.petAPI.db.getTodos();
    this.render();
  },

  render() {
    let filtered = this.todos;

    if (this.currentFilter === 'active') {
      filtered = this.todos.filter(t => !t.completed);
    } else if (this.currentFilter === 'completed') {
      filtered = this.todos.filter(t => t.completed);
    }

    this.list.innerHTML = filtered.map(todo => `
      <li data-id="${todo.id}" class="${todo.completed ? 'completed' : ''}">
        <input type="checkbox" ${todo.completed ? 'checked' : ''}
               onchange="TodosUI.toggle(${todo.id})">
        <span class="todo-title">${this.escapeHtml(todo.title)}</span>
        <button class="delete-btn" onclick="TodosUI.delete(${todo.id})">×</button>
      </li>
    `).join('');

    // Update stats
    const active = this.todos.filter(t => !t.completed).length;
    const total = this.todos.length;
    this.countEl.textContent = `${active} active / ${total} total`;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  async addTodo() {
    const title = this.input.value.trim();
    if (!title) return;

    await window.petAPI.db.createTodo({ title });
    this.input.value = '';
    await this.loadTodos();
  },

  async toggle(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      await window.petAPI.db.updateTodo(id, { completed: !todo.completed });
      await this.loadTodos();
    }
  },

  async delete(id) {
    await window.petAPI.db.deleteTodo(id);
    await this.loadTodos();
  }
};

// ============================================
// Timer Module
// ============================================

const TimerUI = {
  display: { minutes: null, seconds: null },
  label: null,
  startBtn: null,
  pauseBtn: null,
  resetBtn: null,
  presetBtns: null,

  timeLeft: 25 * 60, // seconds
  isRunning: false,
  intervalId: null,
  currentType: 'focus',
  settings: {
    focus: 25,
    short: 5,
    long: 15
  },

  async init() {
    this.display.minutes = document.getElementById('timer-minutes');
    this.display.seconds = document.getElementById('timer-seconds');
    this.label = document.getElementById('timer-label');
    this.startBtn = document.getElementById('timer-start');
    this.pauseBtn = document.getElementById('timer-pause');
    this.resetBtn = document.getElementById('timer-reset');
    this.presetBtns = document.querySelectorAll('.preset-btn');

    // Load settings
    const settings = await window.petAPI.db.getSettings();
    this.settings.focus = settings.pomodoroMinutes || 25;
    this.settings.short = settings.shortBreakMinutes || 5;
    this.settings.long = settings.longBreakMinutes || 15;

    this.timeLeft = this.settings.focus * 60;
    this.updateDisplay();

    // Event listeners
    this.startBtn.addEventListener('click', () => this.start());
    this.pauseBtn.addEventListener('click', () => this.pause());
    this.resetBtn.addEventListener('click', () => this.reset());

    this.presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setType(btn.dataset.type);
      });
    });
  },

  setType(type) {
    this.currentType = type;
    this.timeLeft = this.settings[type] * 60;
    this.updateDisplay();
    this.updateLabel();
    this.reset();
  },

  updateLabel() {
    const labels = {
      focus: 'Focus Time',
      short: 'Short Break',
      long: 'Long Break'
    };
    this.label.textContent = labels[this.currentType] || 'Focus Time';
  },

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startBtn.disabled = true;
    this.pauseBtn.disabled = false;

    this.intervalId = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();

      if (this.timeLeft <= 0) {
        this.complete();
      }
    }, 1000);
  },

  pause() {
    this.isRunning = false;
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
    clearInterval(this.intervalId);
  },

  reset() {
    this.pause();
    this.timeLeft = this.settings[this.currentType] * 60;
    this.updateDisplay();
  },

  complete() {
    this.pause();
    // Could add notification here
    this.reset();
  },

  updateDisplay() {
    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    this.display.minutes.textContent = mins.toString().padStart(2, '0');
    this.display.seconds.textContent = secs.toString().padStart(2, '0');
  },

  // Update settings from Settings section
  updateSettings(newSettings) {
    if (newSettings.pomodoroMinutes) this.settings.focus = newSettings.pomodoroMinutes;
    if (newSettings.shortBreakMinutes) this.settings.short = newSettings.shortBreakMinutes;
    if (newSettings.longBreakMinutes) this.settings.long = newSettings.longBreakMinutes;

    // Reset current timer if not running
    if (!this.isRunning) {
      this.timeLeft = this.settings[this.currentType] * 60;
      this.updateDisplay();
    }
  }
};

// ============================================
// Subscriptions Module
// ============================================

const SubscriptionsUI = {
  list: null,
  monthlyTotal: null,
  yearlyTotal: null,
  addBtn: null,
  modal: null,
  form: null,
  subscriptions: [],

  async init() {
    this.list = document.getElementById('subscription-list');
    this.monthlyTotal = document.getElementById('monthly-total');
    this.yearlyTotal = document.getElementById('yearly-total');
    this.addBtn = document.getElementById('add-subscription-btn');
    this.modal = document.getElementById('subscription-modal');
    this.form = document.getElementById('subscription-form');

    // Event listeners
    this.addBtn.addEventListener('click', () => this.showModal());
    this.modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    this.modal.querySelector('.btn-cancel').addEventListener('click', () => this.hideModal());
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Close modal on outside click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hideModal();
    });

    await this.loadSubscriptions();
  },

  async loadSubscriptions() {
    this.subscriptions = await window.petAPI.db.getSubscriptions();
    this.render();
    this.updateTotals();
  },

  render() {
    this.list.innerHTML = this.subscriptions.map(sub => `
      <li data-id="${sub.id}">
        <div class="sub-info">
          <span class="sub-name">${this.escapeHtml(sub.name)}</span>
          <span class="sub-details">${sub.billing_cycle} • ${sub.category || 'other'}</span>
        </div>
        <span class="sub-amount">${sub.currency || '$'}${parseFloat(sub.amount).toFixed(2)}</span>
        <button class="delete-btn" onclick="SubscriptionsUI.delete(${sub.id})">×</button>
      </li>
    `).join('');
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  updateTotals() {
    let monthly = 0;

    this.subscriptions.forEach(sub => {
      const amount = parseFloat(sub.amount);
      switch (sub.billing_cycle) {
        case 'monthly':
          monthly += amount;
          break;
        case 'yearly':
          monthly += amount / 12;
          break;
        case 'weekly':
          monthly += amount * 4.33;
          break;
      }
    });

    this.monthlyTotal.textContent = `$${monthly.toFixed(2)}`;
    this.yearlyTotal.textContent = `$${(monthly * 12).toFixed(2)}`;
  },

  showModal() {
    this.modal.classList.remove('hidden');
    this.form.reset();
  },

  hideModal() {
    this.modal.classList.add('hidden');
  },

  async handleSubmit(e) {
    e.preventDefault();

    const data = {
      name: document.getElementById('sub-name').value,
      amount: parseFloat(document.getElementById('sub-amount').value),
      currency: document.getElementById('sub-currency').value,
      billingCycle: document.getElementById('sub-cycle').value,
      category: document.getElementById('sub-category').value
    };

    await window.petAPI.db.createSubscription(data);
    this.hideModal();
    await this.loadSubscriptions();
  },

  async delete(id) {
    await window.petAPI.db.deleteSubscription(id);
    await this.loadSubscriptions();
  }
};

// ============================================
// Settings Module
// ============================================

const SettingsUI = {
  fields: [
    { id: 'pet-name', key: 'petName', type: 'text' },
    { id: 'always-on-top', key: 'alwaysOnTop', type: 'checkbox' },
    { id: 'pomodoro-minutes', key: 'pomodoroMinutes', type: 'number' },
    { id: 'short-break', key: 'shortBreakMinutes', type: 'number' },
    { id: 'long-break', key: 'longBreakMinutes', type: 'number' },
    { id: 'start-with-system', key: 'startWithSystem', type: 'checkbox' },
    { id: 'sound-enabled', key: 'soundEnabled', type: 'checkbox' }
  ],

  async init() {
    const settings = await window.petAPI.db.getSettings();

    // Populate form
    this.fields.forEach(({ id, key, type }) => {
      const el = document.getElementById(id);
      if (!el) return;

      if (type === 'checkbox') {
        el.checked = settings[key] !== false && settings[key] !== undefined ? settings[key] : false;
      } else if (type === 'number') {
        el.value = settings[key] || el.value;
      } else {
        el.value = settings[key] || el.value;
      }
    });

    // Bind change events
    this.bindSettings();
  },

  bindSettings() {
    this.fields.forEach(({ id, key, type }) => {
      const el = document.getElementById(id);
      if (!el) return;

      el.addEventListener('change', async () => {
        let value;
        if (type === 'checkbox') value = el.checked;
        else if (type === 'number') value = parseInt(el.value, 10);
        else value = el.value;

        await window.petAPI.db.updateSettings({ [key]: value });

        // Apply settings that need immediate effect
        if (key === 'alwaysOnTop') {
          window.petAPI.window.setAlwaysOnTop(value);
        }

        // Update timer settings
        if (['pomodoroMinutes', 'shortBreakMinutes', 'longBreakMinutes'].includes(key)) {
          TimerUI.updateSettings({ [key]: value });
        }
      });
    });
  }
};

// ============================================
// Initialization
// ============================================

async function init() {
  console.log('Settings window initializing...');

  try {
    Navigation.init();
    await PetMode.init();
    await TodosUI.init();
    await TimerUI.init();
    await SubscriptionsUI.init();
    await SettingsUI.init();

    console.log('Settings window ready!');
  } catch (error) {
    console.error('Failed to initialize settings window:', error);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
