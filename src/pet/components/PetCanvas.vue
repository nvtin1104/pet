<template>
  <div id="pet-container" ref="container" class="pointer-events-none">
    <canvas ref="canvas" class="block"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const canvas = ref(null);
const container = ref(null);
let ctx = null;
let raf = null;
let behaviorTimer = null;
let pollInterval = null;

const FRAME_WIDTH = 120;
const FRAME_HEIGHT = 80;
const SPRITE_SCALE = 1.5;

const STATES = {
  IDLE: 'idle',
  RUN: 'run',
  SLEEP: 'sleep'
};

const SPRITES = {
  idle: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_Idle.png',
    frames: 10,
    frameRate: 8
  },
  run: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_Run.png',
    frames: 10,
    frameRate: 12
  },
  sleep: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_Crouch.png',
    frames: 1,
    frameRate: 1
  }
};

const pet = {
  state: STATES.IDLE,
  currentFrame: 0,
  lastFrameTime: 0,
  direction: 1,
  images: {},
  loaded: false,
  x: window.innerWidth - FRAME_WIDTH * SPRITE_SCALE - 20,
  y: window.innerHeight - FRAME_HEIGHT * SPRITE_SCALE - 20
};

// Mouse Passthrough Module (ported)
const MousePassthrough = {
  interactiveElements: [],
  interactiveBounds: [],
  _lastState: false,
  _hoverCount: 0,

  init() {
    // Start with passthrough DISABLED so we can receive mouse events
    window.petAPI.window.togglePassthrough(false);

    // Register interactive elements (pet container)
    this.registerElement(container.value);

    document.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: true });
    document.addEventListener('mouseleave', () => {
      this._hoverCount = 0;
      this.setPassthrough(true);
    });

    this.startPolling();

    console.log('MousePassthrough initialized');
  },

  registerElement(element) {
    if (!element) return;

    this.interactiveElements.push(element);

    element.addEventListener('mouseenter', () => {
      this._hoverCount++;
      this.setPassthrough(false);
      element.classList.add('mouse-active');
    });

    element.addEventListener('mouseleave', () => {
      this._hoverCount = Math.max(0, this._hoverCount - 1);
      if (this._hoverCount === 0) {
        this.setPassthrough(true);
      }
      element.classList.remove('mouse-active');
    });
  },

  updateBounds() {
    this.interactiveBounds = this.interactiveElements.map(el => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    }).filter(Boolean);
  },

  isPointOverInteractive(x, y) {
    return this.interactiveBounds.some(bounds => (
      x >= bounds.x &&
      x < bounds.x + bounds.width &&
      y >= bounds.y &&
      y < bounds.y + bounds.height
    ));
  },

  startPolling() {
    this.updateBounds();

    pollInterval = setInterval(async () => {
      if (!this._lastState) return;

      try {
        const cursor = await window.petAPI.window.getCursorInWindow();

        if (cursor && this.isPointOverInteractive(cursor.x, cursor.y)) {
          this.setPassthrough(false);
          this._hoverCount = 1;
        } else if (!cursor) {
          this._hoverCount = 0;
        }
      } catch (e) {
        // Ignore
      }
    }, 100);
  },

  setPassthrough(enabled) {
    if (this._lastState !== enabled) {
      this._lastState = enabled;
      window.petAPI.window.togglePassthrough(enabled);
    }
  },

  handleMouseMove(event) {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    const isOverInteractive = this.interactiveElements.some(
      el => el && (el === element || el.contains(element))
    );

    this.updateBounds();

    if (!isOverInteractive && this._hoverCount === 0) {
      this.setPassthrough(true);
    } else if (isOverInteractive) {
      this.setPassthrough(false);
    }
  }
};

// Sprite loading
async function loadSprites() {
  const loadPromises = Object.entries(SPRITES).map(([key, config]) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        pet.images[key] = img;
        resolve();
      };
      img.onerror = reject;
      img.src = config.src;
    });
  });

  try {
    await Promise.all(loadPromises);
    pet.loaded = true;
    console.log('Sprites loaded');
  } catch (err) {
    console.error('Failed to load sprites:', err);
  }
}

function draw(timestamp) {
  if (!pet.loaded) {
    raf = requestAnimationFrame(draw);
    return;
  }

  const config = SPRITES[pet.state];
  const frameInterval = 1000 / config.frameRate;

  if (timestamp - pet.lastFrameTime >= frameInterval) {
    pet.currentFrame = (pet.currentFrame + 1) % config.frames;
    pet.lastFrameTime = timestamp;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.save();
  ctx.translate(pet.x, pet.y);
  if (pet.direction === -1) {
    ctx.scale(-1, 1);
    ctx.translate(-FRAME_WIDTH * SPRITE_SCALE, 0);
  }
  const img = pet.images[pet.state];
  const srcX = pet.currentFrame * FRAME_WIDTH;
  ctx.drawImage(
    img,
    srcX, 0, FRAME_WIDTH, FRAME_HEIGHT,
    0, 0, FRAME_WIDTH * SPRITE_SCALE, FRAME_HEIGHT * SPRITE_SCALE
  );
  ctx.restore();
  raf = requestAnimationFrame(draw);
}

function setState(newState) {
  if (pet.state !== newState) {
    pet.state = newState;
    pet.currentFrame = 0;
    console.log('Pet state:', newState);
  }
}

function startBehavior() {
  const scheduleNextBehavior = () => {
    const delay = 5000 + Math.random() * 10000;
    behaviorTimer = setTimeout(() => {
      const rand = Math.random();
      if (rand < 0.6) {
        setState(STATES.IDLE);
      } else if (rand < 0.9) {
        setState(STATES.RUN);
        pet.direction = Math.random() > 0.5 ? 1 : -1;
      } else {
        setState(STATES.SLEEP);
      }
      scheduleNextBehavior();
    }, delay);
  };

  scheduleNextBehavior();
}

function onPetClick() {
  if (pet.state === STATES.SLEEP) {
    setState(STATES.IDLE);
  } else {
    setState(STATES.RUN);
    pet.direction *= -1;
    setTimeout(() => setState(STATES.IDLE), 1500);
  }
}

function onPetDoubleClick() {
  window.petAPI.window.showSettings();
}

function bindEvents() {
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  function isOnPetSprite(e) {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    return (
      mouseX >= pet.x && mouseX <= pet.x + FRAME_WIDTH * SPRITE_SCALE &&
      mouseY >= pet.y && mouseY <= pet.y + FRAME_HEIGHT * SPRITE_SCALE
    );
  }

  window.addEventListener('mousedown', (e) => {
    if (isOnPetSprite(e)) {
      isDragging = true;
      dragOffset.x = e.clientX - pet.x;
      dragOffset.y = e.clientY - pet.y;
      document.body.style.cursor = 'grabbing';
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      newX = Math.max(0, Math.min(screenW - FRAME_WIDTH * SPRITE_SCALE, newX));
      newY = Math.max(0, Math.min(screenH - FRAME_HEIGHT * SPRITE_SCALE, newY));
      pet.x = newX;
      pet.y = newY;
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.cursor = '';
  });

  window.addEventListener('click', (e) => {
    if (isOnPetSprite(e)) onPetClick();
  });

  window.addEventListener('dblclick', (e) => {
    if (isOnPetSprite(e)) onPetDoubleClick();
  });

  window.addEventListener('contextmenu', (e) => {
    if (isOnPetSprite(e)) e.preventDefault();
  });

  // Cleanup function to remove event listeners on unmount
  return () => {
    window.removeEventListener('mousedown', () => {});
    window.removeEventListener('mousemove', () => {});
    window.removeEventListener('mouseup', () => {});
    window.removeEventListener('click', () => {});
    window.removeEventListener('dblclick', () => {});
    window.removeEventListener('contextmenu', () => {});
  };
}

onMounted(async () => {
  const c = canvas.value;
  ctx = c.getContext('2d');

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(window.innerWidth * dpr);
    c.height = Math.round(window.innerHeight * dpr);
    c.style.width = window.innerWidth + 'px';
    c.style.height = window.innerHeight + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resize);
  resize();

  await loadSprites();
  bindEvents();
  startBehavior();
  raf = requestAnimationFrame(draw);

  // Initialize mouse passthrough after a short delay
  setTimeout(() => {
    MousePassthrough.init();
  }, 100);
});

onBeforeUnmount(() => {
  if (behaviorTimer) clearTimeout(behaviorTimer);
  if (pollInterval) clearInterval(pollInterval);
  if (raf) cancelAnimationFrame(raf);
  window.removeEventListener('resize', () => {});
});
</script>

<style scoped>
#pet-container {
  width: 100%;
  height: 100%;
}
canvas { display: block; }
</style> 