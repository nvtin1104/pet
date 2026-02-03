<template>
  <div 
    id="pet-container" 
    ref="container" 
    :class="mode === 'interactive' ? 'interactive-hitbox' : 'pointer-events-none'" 
    class="overflow-hidden" 
    style="touch-action: none;"
  >
    <canvas ref="canvas" class="block"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const emit = defineEmits(['show-context-menu']);

const canvas = ref(null);
const container = ref(null);
let ctx = null;
let raf = null;
let behaviorTimer = null;
let pollInterval = null;
const handleMenuClosed = () => {
  pet.contextMenuOpen = false;
};

const FRAME_WIDTH = 120;
const FRAME_HEIGHT = 80;
const SPRITE_SCALE = 1.5;

const STATES = {
  IDLE: 'idle',
  RUN: 'run',
  SLEEP: 'sleep',
  ATTACK: 'attack',
  WALL_SLIDE: 'wallSlide'
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
  },
  attack: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_Attack.png',
    frames: 4,
    frameRate: 10
  },
  wallSlide: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_WallSlide.png',
    frames: 3,
    frameRate: 6
  }
};

const mode = new URLSearchParams(window.location.search).get('mode') || 'interactive';

const pet = {
  state: STATES.IDLE,
  currentFrame: 0,
  lastFrameTime: 0,
  direction: 1,
  images: {},
  loaded: false,
  x: window.innerWidth - FRAME_WIDTH * SPRITE_SCALE - 20,
  y: window.innerHeight - FRAME_HEIGHT * SPRITE_SCALE - 20,
  vx: 0,
  vy: 0,
  targetX: null,
  targetY: null,
  movingToTarget: false,
  locked: false,
  isDragging: false,
  contextMenuOpen: false
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

  // Interactive mode: don't render pet, just update position for hitbox
  if (mode === 'interactive') {
    raf = requestAnimationFrame(draw);
    return;
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  // Update physics (inertia/throw)
  const dt = Math.min(40, timestamp - (pet._lastTimestamp || timestamp));
  pet._lastTimestamp = timestamp;

  // Move to target if active
  if (pet.movingToTarget && pet.targetX !== null && pet.targetY !== null) {
    const dx = pet.targetX - pet.x;
    const dy = pet.targetY - pet.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      // Move towards target at constant speed
      const speed = 300; // pixels per second
      const moveDistance = speed * (dt / 1000);
      const ratio = Math.min(moveDistance / distance, 1);
      
      pet.x += dx * ratio;
      pet.y += dy * ratio;
      
      // Set direction based on movement
      pet.direction = dx > 0 ? 1 : -1;
      
      // Set state to RUN while moving
      if (pet.state !== STATES.RUN) {
        setState(STATES.RUN);
      }
      
      sendInteractiveBoundsIfNeeded();
    } else {
      // Reached target - perform attack
      pet.movingToTarget = false;
      setState(STATES.ATTACK);
      setTimeout(() => {
        pet.targetX = null;
        pet.targetY = null;
        setState(STATES.IDLE);
      }, 400);
    }
  } else if (Math.abs(pet.vx) > 0.01 || Math.abs(pet.vy) > 0.01) {
    // dt in ms, velocities are pixels/sec
    const dx = pet.vx * (dt / 1000);
    const dy = pet.vy * (dt / 1000);
    pet.x = Math.max(0, Math.min(window.innerWidth - FRAME_WIDTH * SPRITE_SCALE, pet.x + dx));
    pet.y = Math.max(0, Math.min(window.innerHeight - FRAME_HEIGHT * SPRITE_SCALE, pet.y + dy));

    // Apply friction
    const friction = 0.95;
    pet.vx *= friction;
    pet.vy *= friction;

    // If velocities are very small, zero them
    if (Math.abs(pet.vx) < 0.5) pet.vx = 0;
    if (Math.abs(pet.vy) < 0.5) pet.vy = 0;

    // Report interactive bounds so main can reposition the small interactive window
    sendInteractiveBoundsIfNeeded();
  }

  // Animation frame update
  const config = SPRITES[pet.state];
  if (config && config.frames > 1) {
    const frameInterval = 1000 / config.frameRate;
    if (timestamp - pet.lastFrameTime >= frameInterval) {
      pet.currentFrame = (pet.currentFrame + 1) % config.frames;
      pet.lastFrameTime = timestamp;
    }
  }

  // Draw pet sprite
  ctx.save();
  ctx.translate(pet.x + (FRAME_WIDTH * SPRITE_SCALE) / 2, pet.y);
  if (pet.direction === -1) {
    ctx.scale(-1, 1);
  }
  ctx.translate(-(FRAME_WIDTH * SPRITE_SCALE) / 2, 0);

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

function onPetClick(isRightClick = false, position = null) {
  if (isRightClick) {
    // Right-click shows context menu
    pet.contextMenuOpen = true;
    pet.isDragging = false;
    // Disable passthrough while menu is open
    if (window.petAPI && window.petAPI.window && window.petAPI.window.togglePassthrough) {
      window.petAPI.window.togglePassthrough(false);
    }
    const menuPos = position || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    emit('show-context-menu', menuPos);
    return;
  }
  
  // Left-click triggers attack animation (only if not dragging and menu closed)
  if (!pet.isDragging && !pet.contextMenuOpen) {
    if (pet.state === STATES.SLEEP) {
      setState(STATES.IDLE);
    } else {
      setState(STATES.ATTACK);
      setTimeout(() => setState(STATES.IDLE), 400);
    }
  }
}

function onPetDoubleClick() {
  window.petAPI.window.showSettings();
}

// Hitbox padding / minimum size (in CSS pixels) - reduced for precision
const HITBOX_PADDING = 3;
const MIN_HITBOX = 40;
let _lastBoundsSentAt = 0; // throttle

function computeCssBounds() {
  const cssX = Math.round(window.screenX + pet.x);
  const cssY = Math.round(window.screenY + pet.y);
  const cssW = Math.max(MIN_HITBOX, Math.round(FRAME_WIDTH * SPRITE_SCALE));
  const cssH = Math.max(MIN_HITBOX, Math.round(FRAME_HEIGHT * SPRITE_SCALE));

  // Asymmetric padding: smaller on top and sides, larger on bottom
  const topPadding = 1;
  const sidePadding = 1; 
  const bottomPadding = 5;

  const padded = {
    x: Math.round(cssX - sidePadding),
    y: Math.round(cssY - topPadding),
    width: cssW + sidePadding * 2,
    height: cssH + topPadding + bottomPadding
  };

  // Clamp to screen
  const sw = window.screen.availWidth || window.innerWidth;
  const sh = window.screen.availHeight || window.innerHeight;
  padded.x = Math.max(0, Math.min(padded.x, sw - 1));
  padded.y = Math.max(0, Math.min(padded.y, sh - 1));

  return { ...padded, dpr: window.devicePixelRatio || 1 };
}

function sendInteractiveBoundsIfNeeded(force = false) {
  const now = performance.now();
  if (!force && now - _lastBoundsSentAt < 50) return; // throttle to 50ms
  _lastBoundsSentAt = now;

  try {
    if (window.petAPI && window.petAPI.window && window.petAPI.window.updateInteractiveBounds) {
      const bounds = computeCssBounds();
      window.petAPI.window.updateInteractiveBounds(bounds);
      console.log('Sent bounds:', bounds);
    }
  } catch (e) {
    console.error('Failed to send bounds:', e);
  }
}

function bindEvents() {
  // Keep track of recent mouse positions to compute release velocity
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let recentMoves = []; // {x,y,t}

  function isOnPetSpriteCoords(x, y) {
    return (
      x >= pet.x && x <= pet.x + FRAME_WIDTH * SPRITE_SCALE &&
      y >= pet.y && y <= pet.y + FRAME_HEIGHT * SPRITE_SCALE
    );
  }

  // Handle inputs coming from interactive window (forwarded by main)
  function handleRemoteInput(data) {
    const { type, screenX, screenY, button } = data;
    const localX = screenX - window.screenX;
    const localY = screenY - window.screenY;

    if (type === 'mousedown') {
      if (button === 0 && !pet.contextMenuOpen && isOnPetSpriteCoords(localX, localY) && !pet.locked) {
        isDragging = true;
        pet.isDragging = true;
        dragOffset.x = (FRAME_WIDTH * SPRITE_SCALE) / 2;
        dragOffset.y = (FRAME_HEIGHT * SPRITE_SCALE) / 2;
        document.body.style.cursor = 'grabbing';
        recentMoves = [{ x: localX, y: localY, t: performance.now() }];
        setState(STATES.WALL_SLIDE);
      }
    } else if (type === 'mousemove') {
      if (isDragging && !pet.locked && !pet.contextMenuOpen) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        let newX = localX - dragOffset.x;
        let newY = localY - dragOffset.y;
        newX = Math.max(0, Math.min(screenW - FRAME_WIDTH * SPRITE_SCALE, newX));
        newY = Math.max(0, Math.min(screenH - FRAME_HEIGHT * SPRITE_SCALE, newY));
        pet.x = newX;
        pet.y = newY;
        recentMoves.push({ x: localX, y: localY, t: performance.now() });
        // Keep only last 5 moves
        if (recentMoves.length > 5) recentMoves.shift();

        // Inform main of new bounds (throttled)
        sendInteractiveBoundsIfNeeded();
      }
    } else if (type === 'mouseup') {
      if (isDragging) {
        isDragging = false;
        pet.isDragging = false;
        document.body.style.cursor = '';
        setState(STATES.IDLE);
        // Compute velocity from recent moves
        if (recentMoves.length >= 2 && !pet.locked) {
          const a = recentMoves[0];
          const b = recentMoves[recentMoves.length - 1];
          const dt = Math.max(1, b.t - a.t);
          pet.vx = (b.x - a.x) / dt * 1000; // pixels/sec
          pet.vy = (b.y - a.y) / dt * 1000;
        }
        recentMoves = [];

        // One last bounds update on release
        sendInteractiveBoundsIfNeeded();
      }
    } else if (type === 'click') {
      if (button === 0 && isOnPetSpriteCoords(localX, localY)) onPetClick(false);
    } else if (type === 'contextmenu') {
      if (isOnPetSpriteCoords(localX, localY)) {
        onPetClick(true, { x: localX, y: localY });
      }
    } else if (type === 'dblclick') {
      if (isOnPetSpriteCoords(localX, localY)) onPetDoubleClick();
    }
  }

  // Attach remote handler so overlay mode can accept events forwarded from the interactive window
  if (mode === 'overlay' && window.petAPI && window.petAPI.on && window.petAPI.on.petInput) {
    window.petAPI.on.petInput(handleRemoteInput);
  }

  // If we're in interactive mode (small window), forward DOM events to main which will forward to overlay
  if (mode === 'interactive') {
    const containerEl = container.value;
    const toScreen = (e) => ({ screenX: window.screenX + e.clientX, screenY: window.screenY + e.clientY });

    const mousedown = (e) => {
      window.petAPI.window.sendPetInput({ type: 'mousedown', button: e.button, ...toScreen(e) });
    };
    const mousemove = (e) => {
      window.petAPI.window.sendPetInput({ type: 'mousemove', button: e.button, ...toScreen(e) });
    };
    const mouseup = (e) => {
      window.petAPI.window.sendPetInput({ type: 'mouseup', button: e.button, ...toScreen(e) });
    };
    const click = (e) => {
      window.petAPI.window.sendPetInput({ type: 'click', button: e.button, ...toScreen(e) });
    };
    const dblclick = (e) => {
      window.petAPI.window.sendPetInput({ type: 'dblclick', button: e.button, ...toScreen(e) });
    };
    const contextmenu = (e) => {
      e.preventDefault();
      window.petAPI.window.sendPetInput({ type: 'contextmenu', button: e.button, ...toScreen(e) });
    };

    containerEl.addEventListener('mousedown', mousedown);
    containerEl.addEventListener('mousemove', mousemove);
    containerEl.addEventListener('mouseup', mouseup);
    containerEl.addEventListener('click', click);
    containerEl.addEventListener('dblclick', dblclick);
    containerEl.addEventListener('contextmenu', contextmenu);

    return () => {
      containerEl.removeEventListener('mousedown', mousedown);
      containerEl.removeEventListener('mousemove', mousemove);
      containerEl.removeEventListener('mouseup', mouseup);
      containerEl.removeEventListener('click', click);
      containerEl.removeEventListener('dblclick', dblclick);
      containerEl.removeEventListener('contextmenu', contextmenu);
    };
  }

  // If neither overlay nor interactive (unexpected), keep existing behavior in-window
  // (for backward compatibility)
  let localIsDragging = false;
  let localDragOffset = { x: 0, y: 0 };

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
      localIsDragging = true;
      localDragOffset.x = e.clientX - pet.x;
      localDragOffset.y = e.clientY - pet.y;
      document.body.style.cursor = 'grabbing';
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (localIsDragging) {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      let newX = e.clientX - localDragOffset.x;
      let newY = e.clientY - localDragOffset.y;
      newX = Math.max(0, Math.min(screenW - FRAME_WIDTH * SPRITE_SCALE, newX));
      newY = Math.max(0, Math.min(screenH - FRAME_HEIGHT * SPRITE_SCALE, newY));
      pet.x = newX;
      pet.y = newY;
    }
  });

  window.addEventListener('mouseup', () => {
    localIsDragging = false;
    document.body.style.cursor = '';
  });

  window.addEventListener('click', (e) => {
    if (isOnPetSprite(e)) onPetClick(false);
  });

  window.addEventListener('dblclick', (e) => {
    if (isOnPetSprite(e)) onPetDoubleClick();
  });

  window.addEventListener('contextmenu', (e) => {
    if (isOnPetSprite(e)) {
      e.preventDefault();
      onPetClick(true, { x: e.clientX, y: e.clientY });
    }
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

  // Listen for hitbox debug toggle events
  if (window.petAPI && window.petAPI.on && window.petAPI.on.hitboxDebug) {
    window.petAPI.on.hitboxDebug((enabled) => {
      if (container.value) container.value.classList.toggle('debug-hitbox', enabled);
    });
  }

  // Listen for target system events
  if (window.petAPI && window.petAPI.on) {
    if (window.petAPI.on.targetSet) {
      window.petAPI.on.targetSet((target) => {
        pet.targetX = target.x;
        pet.targetY = target.y;
        pet.movingToTarget = true;
        console.log('Moving to target:', target);
      });
    }

    if (window.petAPI.on.targetCancelled) {
      window.petAPI.on.targetCancelled(() => {
        pet.targetX = null;
        pet.targetY = null;
        pet.movingToTarget = false;
        console.log('Target cancelled');
      });
    }

    if (window.petAPI.on.positionLocked) {
      window.petAPI.on.positionLocked((locked) => {
        pet.locked = locked;
        console.log('Position locked:', locked);
      });
    }
  }

  window.addEventListener('pet-context-menu-closed', handleMenuClosed);

  await loadSprites();
  bindEvents();
  startBehavior();
  raf = requestAnimationFrame(draw);

  // Send initial pet bounds to interactive window (only from overlay)
  if (mode === 'overlay') {
    setTimeout(() => {
      sendInteractiveBoundsIfNeeded(true);
    }, 200);
  }

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
  window.removeEventListener('pet-context-menu-closed', handleMenuClosed);
});
</script>

<style scoped>
#pet-container {
  width: 100%;
  height: 100%;
}
canvas { display: block; }

/* Debug styling for interactive hitbox */
.debug-hitbox {
  outline: 3px dashed rgba(255, 0, 0, 0.95);
  box-shadow: 0 0 0 6px rgba(255, 0, 0, 0.06) inset;
}
</style> 