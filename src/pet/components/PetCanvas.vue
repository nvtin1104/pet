<template>
  <div id="pet-container" ref="container" :class="mode === 'interactive' ? 'interactive-hitbox' : 'pointer-events-none'"
    class="overflow-hidden" style="touch-action: none;">
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
  // Only overlay should send bounds update - interactive window handles shrinking via App.vue
  if (mode === 'overlay') {
    // Force send current bounds immediately to restore hitbox position
    sendInteractiveBoundsIfNeeded(true);
  }
};

const FRAME_WIDTH = 120;
const FRAME_HEIGHT = 80;
const SPRITE_SCALE = 1.5;

// Visible knight bounds within the 120×80 frame (pixels where knight actually appears)
// Adjust these if you change sprite assets
const SPRITE_CONTENT = {
  left: 42,      // Knight pixels start ~35px from left edge of frame
  top: 42,       // Knight pixels start ~30px from top edge of frame
  right: 64,     // Knight pixels end ~85px from left edge
  bottom: 75     // Knight pixels end ~75px from top edge
};

const STATES = {
  IDLE: 'idle',
  RUN: 'run',
  SLEEP: 'sleep',
  ATTACK: 'attack',
  ATTACK2: 'attack2',
  WALL_SLIDE: 'wallSlide',
  WALL_CLIMB: 'wallClimb',
  WALL_HANG: 'wallHang',
  JUMP: 'jump',
  FALL: 'fall',
  JUMP_FALL_BETWEEN: 'jumpFallBetween',
  DASH: 'dash',
  ROLL: 'roll',
  SLIDE: 'slide',
  HIT: 'hit',
  TURN: 'turn',
  CROUCH: 'crouch'
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
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_CrouchFull.png',
    frames: 3,
    frameRate: 2
  },
  attack: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_Attack.png',
    frames: 4,
    frameRate: 10
  },
  attack2: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_Attack2.png',
    frames: 6,
    frameRate: 10
  },
  wallSlide: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_WallSlide.png',
    frames: 3,
    frameRate: 6
  },
  wallClimb: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_WallClimb.png',
    frames: 7,
    frameRate: 10
  },
  wallHang: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_WallHang.png',
    frames: 1,
    frameRate: 1
  },
  jump: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_Jump.png',
    frames: 3,
    frameRate: 8
  },
  fall: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_Fall.png',
    frames: 3,
    frameRate: 8
  },
  jumpFallBetween: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_JumpFallInbetween.png',
    frames: 2,
    frameRate: 6
  },
  dash: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_Dash.png',
    frames: 2,
    frameRate: 10
  },
  roll: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_Roll.png',
    frames: 12,
    frameRate: 16
  },
  slide: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_SlideFull.png',
    frames: 4,
    frameRate: 8
  },
  hit: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_Hit.png',
    frames: 1,
    frameRate: 1
  },
  turn: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_TurnAround.png',
    frames: 3,
    frameRate: 10
  },
  crouch: {
    src: '/assets/knight/Colour1/Outline/120x80_PNGSheets/_Crouch.png',
    frames: 1,
    frameRate: 1
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
  x: window.innerWidth - SPRITE_CONTENT.right * SPRITE_SCALE,
  y: window.innerHeight - SPRITE_CONTENT.bottom * SPRITE_SCALE,
  vx: 0,
  vy: 0,
  targetX: null,
  targetY: null,
  movingToTarget: false,
  locked: false,
  isDragging: false,
  contextMenuOpen: false,
  // Platformer physics
  grounded: false,
  currentPlatform: null,
  onWall: false,          // touching a vertical wall
  wallSide: 0,            // -1 = wall on left, 1 = wall on right
  jumping: false,
  jumpHoldTime: 0,
  canDoubleJump: false,
  stateTimer: 0,          // time spent in current state (ms)
  prevState: null
};

// ============= PHYSICS CONSTANTS =============
const PHYSICS = {
  GRAVITY: 600,             // px/s² — pull downward
  MAX_FALL_SPEED: 500,      // px/s — terminal velocity
  JUMP_VELOCITY: -320,      // px/s — initial upward velocity on jump
  WALL_JUMP_VX: 200,        // px/s — horizontal kick off wall
  WALL_JUMP_VY: -280,       // px/s — vertical kick off wall
  WALL_SLIDE_SPEED: 40,     // px/s — slow slide down wall
  WALL_CLIMB_SPEED: -80,    // px/s — climb up wall
  RUN_SPEED_MIN: 80,        // px/s
  RUN_SPEED_MAX: 180,       // px/s
  GROUND_FRICTION: 0.88,    // per-frame multiplier when not running
  AIR_FRICTION: 0.98,       // per-frame multiplier in air
  DASH_SPEED: 400,          // px/s
  DASH_DURATION: 200,       // ms
};

// ============= PLATFORM SYSTEM =============
// Platform: { id, x, y, width, type: 'floor'|'ceiling'|'wallLeft'|'wallRight', source: 'screen'|'window' }
let platforms = [];
let platformPollTimer = null;

// Build screen-edge platforms from current viewport
function buildScreenPlatforms() {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  // Foot position of pet = pet.y + SPRITE_CONTENT.bottom * SPRITE_SCALE
  return [
    { id: 'screen-bottom', x: 0, y: sh, width: sw, type: 'floor', source: 'screen' },
    { id: 'screen-top', x: 0, y: 0, width: sw, type: 'ceiling', source: 'screen' },
    { id: 'screen-left', x: 0, y: 0, height: sh, type: 'wallLeft', source: 'screen' },
    { id: 'screen-right', x: sw, y: 0, height: sh, type: 'wallRight', source: 'screen' },
  ];
}

function rebuildPlatforms(windowPlatforms = []) {
  platforms = [...buildScreenPlatforms(), ...windowPlatforms];
}

// Pet foot Y position (bottom of visible knight)
function petFootY() {
  return pet.y + SPRITE_CONTENT.bottom * SPRITE_SCALE;
}
function petHeadY() {
  return pet.y + SPRITE_CONTENT.top * SPRITE_SCALE;
}
function petLeftX() {
  return pet.x + SPRITE_CONTENT.left * SPRITE_SCALE;
}
function petRightX() {
  return pet.x + SPRITE_CONTENT.right * SPRITE_SCALE;
}
function petCenterX() {
  return pet.x + (FRAME_WIDTH * SPRITE_SCALE) / 2;
}

// Check if pet's feet are on a horizontal platform
function findFloorBelow(footY, centerX, vy) {
  let best = null;
  let bestDist = Infinity;
  // Tolerance scales with fall speed to prevent tunneling
  const speedTolerance = Math.max(4, Math.abs(vy) * 0.05);
  for (const p of platforms) {
    if (p.type !== 'floor') continue;
    // Pet must be horizontally within the platform
    if (centerX >= p.x && centerX <= p.x + p.width) {
      const dist = p.y - footY;
      // Accept if pet is near the floor (above or slightly below due to tunneling)
      if (dist >= -speedTolerance && dist < bestDist && (dist <= 2 || vy >= 0)) {
        best = p;
        bestDist = dist;
      }
    }
  }
  return best;
}

// Check if pet is touching a vertical wall
function findWall(leftX, rightX, headY, footY) {
  for (const p of platforms) {
    if (p.type === 'wallLeft') {
      // Wall on the left side of screen/window — pet's LEFT edge touches it
      if (leftX <= p.x + 4 && leftX >= p.x - 4) {
        if (footY > p.y && headY < p.y + (p.height || 0)) {
          return { platform: p, side: -1 };
        }
      }
    } else if (p.type === 'wallRight') {
      // Wall on the right side — pet's RIGHT edge touches it
      if (rightX >= p.x - 4 && rightX <= p.x + 4) {
        if (footY > p.y && headY < p.y + (p.height || 0)) {
          return { platform: p, side: 1 };
        }
      }
    }
  }
  return null;
}

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

  // Delta time (capped at 40ms to avoid physics explosions)
  const dt = Math.min(40, timestamp - (pet._lastTimestamp || timestamp));
  pet._lastTimestamp = timestamp;
  const dtSec = dt / 1000;

  // Track time in current state
  pet.stateTimer += dt;

  // Always send bounds to keep interactive window in sync
  sendInteractiveBoundsIfNeeded();

  // ====== PHYSICS UPDATE ======
  if (!pet.contextMenuOpen && !pet.isDragging && !pet.locked) {
    // --- Move to target (attack target system) ---
    if (pet.movingToTarget && pet.targetX !== null && pet.targetY !== null) {
      const dx = pet.targetX - pet.x;
      const dy = pet.targetY - pet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5) {
        const speed = 300;
        const moveDistance = speed * dtSec;
        const ratio = Math.min(moveDistance / distance, 1);
        pet.x += dx * ratio;
        pet.y += dy * ratio;
        pet.direction = dx > 0 ? 1 : -1;
        if (pet.state !== STATES.RUN) setState(STATES.RUN);
      } else {
        pet.movingToTarget = false;
        setState(STATES.ATTACK);
        setTimeout(() => {
          pet.targetX = null;
          pet.targetY = null;
          setState(STATES.IDLE);
        }, 400);
      }
    } else {
      // --- Gravity ---
      if (!pet.grounded && !pet.onWall) {
        pet.vy = Math.min(pet.vy + PHYSICS.GRAVITY * dtSec, PHYSICS.MAX_FALL_SPEED);
      } else if (pet.onWall) {
        // Wall slide: slow descent or climb
        if (pet.state === STATES.WALL_CLIMB) {
          pet.vy = PHYSICS.WALL_CLIMB_SPEED;
        } else {
          pet.vy = PHYSICS.WALL_SLIDE_SPEED;
        }
      }

      // --- Apply velocity ---
      const newX = pet.x + pet.vx * dtSec;
      const newY = pet.y + pet.vy * dtSec;

      // --- Clamp X to screen (allow transparent frame to go off-screen) ---
      const minX = -SPRITE_CONTENT.left * SPRITE_SCALE;
      const maxX = window.innerWidth - SPRITE_CONTENT.right * SPRITE_SCALE;
      pet.x = Math.max(minX, Math.min(maxX, newX));
      pet.y = newY;

      // --- Safety: never fall below screen bottom ---
      const maxY = window.innerHeight - SPRITE_CONTENT.bottom * SPRITE_SCALE;
      if (pet.y > maxY) {
        pet.y = maxY;
        pet.vy = 0;
        pet.grounded = true;
        pet.onWall = false;
        pet.currentPlatform = platforms.find(p => p.id === 'screen-bottom') || null;
        pet.canDoubleJump = true;
        if (pet.state === STATES.FALL || pet.state === STATES.JUMP || pet.state === STATES.JUMP_FALL_BETWEEN) {
          setState(Math.abs(pet.vx) > 10 ? STATES.RUN : STATES.IDLE);
        }
      }

      // --- Floor collision ---
      const foot = petFootY();
      const cx = petCenterX();
      const floor = findFloorBelow(foot, cx, pet.vy);

      if (floor && pet.vy >= 0) {
        // Land on platform
        const landY = floor.y - SPRITE_CONTENT.bottom * SPRITE_SCALE;
        if (pet.y >= landY - 2) {
          pet.y = landY;
          pet.vy = 0;
          if (!pet.grounded) {
            pet.grounded = true;
            pet.currentPlatform = floor;
            pet.onWall = false;
            pet.canDoubleJump = true;
            // Transition from air to ground
            if (pet.state === STATES.FALL || pet.state === STATES.JUMP || pet.state === STATES.JUMP_FALL_BETWEEN) {
              if (Math.abs(pet.vx) > 10) {
                setState(STATES.RUN);
              } else {
                setState(STATES.IDLE);
              }
            }
          }
        }
      } else if (pet.grounded && pet.vy >= 0) {
        // Check if we walked off the edge of our platform
        if (pet.currentPlatform) {
          const p = pet.currentPlatform;
          if (cx < p.x || cx > p.x + p.width) {
            pet.grounded = false;
            pet.currentPlatform = null;
            setState(STATES.FALL);
          }
        }
      }

      // --- Wall collision ---
      if (!pet.grounded) {
        const wall = findWall(petLeftX(), petRightX(), petHeadY(), petFootY());
        if (wall) {
          pet.onWall = true;
          pet.wallSide = wall.side;
          pet.direction = -wall.side; // Face away from wall
          if (pet.state !== STATES.WALL_SLIDE && pet.state !== STATES.WALL_CLIMB && pet.state !== STATES.WALL_HANG) {
            setState(STATES.WALL_SLIDE);
          }
        } else {
          pet.onWall = false;
        }
      } else {
        pet.onWall = false;
      }

      // --- Friction ---
      if (pet.grounded) {
        // Ground friction: only when not actively running
        if (pet.state !== STATES.RUN && pet.state !== STATES.DASH && pet.state !== STATES.ROLL) {
          pet.vx *= PHYSICS.GROUND_FRICTION;
          if (Math.abs(pet.vx) < 1) pet.vx = 0;
        }
      } else if (!pet.onWall) {
        // Air friction (very light)
        pet.vx *= PHYSICS.AIR_FRICTION;
      }

      // --- Ceiling collision ---
      const headY = petHeadY();
      if (headY <= 0 && pet.vy < 0) {
        pet.vy = 0;
        pet.y = -SPRITE_CONTENT.top * SPRITE_SCALE;
      }

      // --- Auto state transitions ---
      if (!pet.grounded && !pet.onWall) {
        if (pet.vy > 20 && pet.state === STATES.JUMP) {
          setState(STATES.JUMP_FALL_BETWEEN);
        } else if (pet.vy > 80 && pet.state === STATES.JUMP_FALL_BETWEEN) {
          setState(STATES.FALL);
        } else if (pet.vy > 20 && pet.state !== STATES.JUMP && pet.state !== STATES.JUMP_FALL_BETWEEN && pet.state !== STATES.FALL && pet.state !== STATES.ATTACK && pet.state !== STATES.DASH) {
          setState(STATES.FALL);
        }
      }

      // --- Direction from velocity ---
      if (pet.grounded && Math.abs(pet.vx) > 5 && pet.state === STATES.RUN) {
        pet.direction = pet.vx > 0 ? 1 : -1;
      }

      // --- Dash timer ---
      if (pet.state === STATES.DASH && pet.stateTimer > PHYSICS.DASH_DURATION) {
        pet.vx = pet.direction * PHYSICS.RUN_SPEED_MIN;
        if (pet.grounded) {
          setState(STATES.RUN);
        } else {
          setState(STATES.FALL);
        }
      }

      // --- Wall climb timer: auto release after 2s ---
      if (pet.state === STATES.WALL_CLIMB && pet.stateTimer > 2000) {
        // Jump off wall
        petWallJump();
      }
      if (pet.state === STATES.WALL_SLIDE && pet.stateTimer > 1500) {
        // Transition to wall hang or release
        if (Math.random() > 0.5) {
          setState(STATES.WALL_HANG);
        } else {
          setState(STATES.WALL_CLIMB);
        }
      }
      if (pet.state === STATES.WALL_HANG && pet.stateTimer > 1000) {
        if (Math.random() > 0.3) {
          setState(STATES.WALL_CLIMB);
        } else {
          petWallJump();
        }
      }
    }
  }

  // ====== ANIMATION FRAME UPDATE ======
  const config = SPRITES[pet.state];
  if (config && config.frames > 1) {
    const frameInterval = 1000 / config.frameRate;
    if (timestamp - pet.lastFrameTime >= frameInterval) {
      pet.currentFrame = (pet.currentFrame + 1) % config.frames;
      pet.lastFrameTime = timestamp;
    }
  }

  // ====== DRAW PET SPRITE ======
  ctx.save();
  ctx.translate(pet.x + (FRAME_WIDTH * SPRITE_SCALE) / 2, pet.y);
  if (pet.direction === -1) {
    ctx.scale(-1, 1);
  }
  ctx.translate(-(FRAME_WIDTH * SPRITE_SCALE) / 2, 0);

  const img = pet.images[pet.state];
  if (img) {
    const srcX = pet.currentFrame * FRAME_WIDTH;
    ctx.drawImage(
      img,
      srcX, 0, FRAME_WIDTH, FRAME_HEIGHT,
      0, 0, FRAME_WIDTH * SPRITE_SCALE, FRAME_HEIGHT * SPRITE_SCALE
    );
  }
  ctx.restore();
  raf = requestAnimationFrame(draw);
}

// ============= JUMP & WALL JUMP =============
function petJump() {
  if (pet.grounded) {
    pet.vy = PHYSICS.JUMP_VELOCITY;
    pet.grounded = false;
    pet.currentPlatform = null;
    setState(STATES.JUMP);
  } else if (pet.canDoubleJump) {
    pet.vy = PHYSICS.JUMP_VELOCITY * 0.85;
    pet.canDoubleJump = false;
    setState(STATES.JUMP);
  }
}

function petWallJump() {
  pet.vx = -pet.wallSide * PHYSICS.WALL_JUMP_VX;
  pet.vy = PHYSICS.WALL_JUMP_VY;
  pet.onWall = false;
  pet.direction = -pet.wallSide;
  setState(STATES.JUMP);
}

function petDash() {
  pet.vx = pet.direction * PHYSICS.DASH_SPEED;
  pet.vy = 0;
  setState(STATES.DASH);
}

function setState(newState) {
  if (pet.state !== newState) {
    pet.prevState = pet.state;
    pet.state = newState;
    pet.currentFrame = 0;
    pet.stateTimer = 0;
    console.log('Pet state:', newState);
  }
}

function startBehavior() {
  const scheduleNextBehavior = () => {
    const delay = 2000 + Math.random() * 4000;
    behaviorTimer = setTimeout(() => {
      if (pet.isDragging || pet.movingToTarget || pet.locked) {
        scheduleNextBehavior();
        return;
      }
      if (pet.contextMenuOpen) {
        scheduleNextBehavior();
        return;
      }
      // Only change behavior when grounded or on wall
      if (!pet.grounded && !pet.onWall) {
        scheduleNextBehavior();
        return;
      }

      if (pet.grounded) {
        const rand = Math.random();
        if (rand < 0.10) {
          // 10% — Idle
          setState(STATES.IDLE);
          pet.vx = 0;
        } else if (rand < 0.50) {
          // 40% — Run on current platform
          setState(STATES.RUN);
          pet.direction = Math.random() > 0.5 ? 1 : -1;
          const speed = PHYSICS.RUN_SPEED_MIN + Math.random() * (PHYSICS.RUN_SPEED_MAX - PHYSICS.RUN_SPEED_MIN);
          pet.vx = pet.direction * speed;
        } else if (rand < 0.75) {
          // 25% — Jump (may reach another platform)
          pet.direction = Math.random() > 0.5 ? 1 : -1;
          const speed = PHYSICS.RUN_SPEED_MIN + Math.random() * (PHYSICS.RUN_SPEED_MAX - PHYSICS.RUN_SPEED_MIN);
          pet.vx = pet.direction * speed;
          petJump();
        } else if (rand < 0.85) {
          // 10% — Dash
          pet.direction = Math.random() > 0.5 ? 1 : -1;
          petDash();
        } else if (rand < 0.92) {
          // 7% — Sleep
          setState(STATES.SLEEP);
          pet.vx = 0;
        } else {
          // 8% — Roll
          pet.direction = Math.random() > 0.5 ? 1 : -1;
          pet.vx = pet.direction * 200;
          setState(STATES.ROLL);
          setTimeout(() => {
            if (pet.state === STATES.ROLL) {
              if (pet.grounded) setState(STATES.IDLE);
              else setState(STATES.FALL);
              pet.vx *= 0.3;
            }
          }, 750);
        }
      } else if (pet.onWall) {
        const rand = Math.random();
        if (rand < 0.4) {
          // Climb
          setState(STATES.WALL_CLIMB);
        } else if (rand < 0.7) {
          // Jump off
          petWallJump();
        } else {
          // Hang
          setState(STATES.WALL_HANG);
          pet.vy = 0;
        }
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
    pet.vx = 0;
    pet.vy = 0;
    // Expand interactive window to fullscreen so menu clicks work
    if (window.petAPI && window.petAPI.window && window.petAPI.window.expandInteractiveForDrag) {
      window.petAPI.window.expandInteractiveForDrag(true);
    }
    // Pass raw click position - PetContextMenu will auto-clamp to viewport
    const petCenterX = pet.x + (FRAME_WIDTH * SPRITE_SCALE) / 2;
    const petTopY = pet.y + SPRITE_CONTENT.top * SPRITE_SCALE;
    const menuX = position ? position.x : petCenterX;
    const menuY = position ? position.y : petTopY;
    emit('show-context-menu', { x: menuX, y: menuY });
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

// Hitbox configuration - negative values SHRINK the hitbox inward from sprite edges
// Sprite renders at 180×120 CSS px (120×80 * 1.5 scale)
// Adjust these to tighten the clickable area around the visible knight pixels
const HITBOX_CONFIG = {
  minSize: 30,          // Minimum hitbox dimension (safety floor)
  topPadding: -55,      // Cut 55px from top (skip transparent sky area)
  sidePadding: -45,     // Cut 45px from each side (skip transparent edges)
  bottomPadding: -5     // Cut 5px from bottom
};
let _lastBoundsSentAt = 0; // throttle

function computeCssBounds() {
  const cssX = Math.round(window.screenX + pet.x);
  const cssY = Math.round(window.screenY + pet.y);
  const cssW = Math.max(HITBOX_CONFIG.minSize, Math.round(FRAME_WIDTH * SPRITE_SCALE));
  const cssH = Math.max(HITBOX_CONFIG.minSize, Math.round(FRAME_HEIGHT * SPRITE_SCALE));

  const padded = {
    x: Math.round(cssX - HITBOX_CONFIG.sidePadding),
    y: Math.round(cssY - HITBOX_CONFIG.topPadding),
    width: cssW + HITBOX_CONFIG.sidePadding * 2,
    height: cssH + HITBOX_CONFIG.topPadding + HITBOX_CONFIG.bottomPadding
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
        pet.isDragging = true;
        dragOffset.x = (FRAME_WIDTH * SPRITE_SCALE) / 2;
        dragOffset.y = (FRAME_HEIGHT * SPRITE_SCALE) / 2;
        document.body.style.cursor = 'grabbing';
        recentMoves = [{ x: localX, y: localY, t: performance.now() }];
        pet.grounded = false;
        pet.onWall = false;
        pet.currentPlatform = null;
        setState(STATES.HIT);

        // Expand interactive window to fullscreen to catch fast drags
        if (window.petAPI && window.petAPI.window && window.petAPI.window.expandInteractiveForDrag) {
          window.petAPI.window.expandInteractiveForDrag(true);
        }
      }
    } else if (type === 'mousemove') {
      if (pet.isDragging && !pet.locked && !pet.contextMenuOpen) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        let newX = localX - dragOffset.x;
        let newY = localY - dragOffset.y;
        newX = Math.max(-SPRITE_CONTENT.left * SPRITE_SCALE, Math.min(screenW - SPRITE_CONTENT.right * SPRITE_SCALE, newX));
        newY = Math.max(-SPRITE_CONTENT.top * SPRITE_SCALE, Math.min(screenH - SPRITE_CONTENT.bottom * SPRITE_SCALE, newY));
        pet.x = newX;
        pet.y = newY;
        recentMoves.push({ x: localX, y: localY, t: performance.now() });
        // Keep only last 5 moves
        if (recentMoves.length > 5) recentMoves.shift();

        // Inform main of new bounds (throttled)
        sendInteractiveBoundsIfNeeded();
      }
    } else if (type === 'mouseup') {
      // Only process throw if was dragging and menu is not open
      if (pet.isDragging && !pet.contextMenuOpen) {
        pet.isDragging = false;
        document.body.style.cursor = '';
        // After release: gravity takes over. Set FALL state — draw() will handle landing.
        pet.grounded = false;
        pet.onWall = false;
        setState(STATES.FALL);
        // Compute velocity from recent moves - only throw if actually dragged
        if (recentMoves.length >= 2 && !pet.locked) {
          const a = recentMoves[0];
          const b = recentMoves[recentMoves.length - 1];
          const dt = Math.max(1, b.t - a.t);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            pet.vx = Math.max(-600, Math.min(600, dx / dt * 1000));
            pet.vy = Math.max(-800, Math.min(200, dy / dt * 1000)); // cap throw velocity
          }
        }
        recentMoves = [];

        // Force send bounds update on release (not throttled)
        sendInteractiveBoundsIfNeeded(true);

        // Restore interactive window to normal size
        if (window.petAPI && window.petAPI.window && window.petAPI.window.expandInteractiveForDrag) {
          window.petAPI.window.expandInteractiveForDrag(false);
        }
      } else if (pet.isDragging && pet.contextMenuOpen) {
        // Menu opened during drag - cancel drag without throw
        pet.isDragging = false;
        document.body.style.cursor = '';
        recentMoves = [];
      }
    } else if (type === 'click') {
      if (button === 0 && isOnPetSpriteCoords(localX, localY)) onPetClick(false);
    } else if (type === 'contextmenu') {
      // Cancel any drag and clear recentMoves before showing menu
      if (pet.isDragging) {
        pet.isDragging = false;
        document.body.style.cursor = '';
        recentMoves = [];
        // Restore interactive window
        if (window.petAPI && window.petAPI.window && window.petAPI.window.expandInteractiveForDrag) {
          window.petAPI.window.expandInteractiveForDrag(false);
        }
      }
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
    let interactiveDragging = false;

    const mousedown = (e) => {
      if (e.button === 0) {
        interactiveDragging = true;
      }
      window.petAPI.window.sendPetInput({ type: 'mousedown', button: e.button, ...toScreen(e) });
    };

    // Use document for mousemove/mouseup to catch events even when cursor leaves window
    const mousemove = (e) => {
      if (interactiveDragging) {
        window.petAPI.window.sendPetInput({ type: 'mousemove', button: e.button, ...toScreen(e) });
      }
    };
    const mouseup = (e) => {
      if (interactiveDragging) {
        interactiveDragging = false;
        window.petAPI.window.sendPetInput({ type: 'mouseup', button: e.button, ...toScreen(e) });
      }
    };
    const click = (e) => {
      window.petAPI.window.sendPetInput({ type: 'click', button: e.button, ...toScreen(e) });
    };
    const dblclick = (e) => {
      window.petAPI.window.sendPetInput({ type: 'dblclick', button: e.button, ...toScreen(e) });
    };
    const contextmenu = (e) => {
      e.preventDefault();
      // Calculate screen position BEFORE expansion (for correct menu placement)
      const screenX = window.screenX + e.clientX;
      const screenY = window.screenY + e.clientY;

      // Expand window to fullscreen so menu clicks work
      if (window.petAPI?.window?.expandInteractiveForDrag) {
        window.petAPI.window.expandInteractiveForDrag(true);
      }
      // Notify overlay that menu is open (pause pet behavior)
      if (window.petAPI?.pet?.setContextMenuState) {
        window.petAPI.pet.setContextMenuState(true);
      }
      // Wait for window expansion, then show menu at click position
      // After expansion window is at 0,0, so screen coords = client coords
      // PetContextMenu auto-clamps to viewport edges
      setTimeout(() => {
        emit('show-context-menu', { x: screenX, y: screenY });
      }, 50);
    };

    containerEl.addEventListener('mousedown', mousedown);
    // Attach mousemove/mouseup to document to catch events outside container
    document.addEventListener('mousemove', mousemove);
    document.addEventListener('mouseup', mouseup);
    containerEl.addEventListener('click', click);
    containerEl.addEventListener('dblclick', dblclick);
    containerEl.addEventListener('contextmenu', contextmenu);

    return () => {
      containerEl.removeEventListener('mousedown', mousedown);
      document.removeEventListener('mousemove', mousemove);
      document.removeEventListener('mouseup', mouseup);
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
      newX = Math.max(-SPRITE_CONTENT.left * SPRITE_SCALE, Math.min(screenW - SPRITE_CONTENT.right * SPRITE_SCALE, newX));
      newY = Math.max(-SPRITE_CONTENT.top * SPRITE_SCALE, Math.min(screenH - SPRITE_CONTENT.bottom * SPRITE_SCALE, newY));
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
    window.removeEventListener('mousedown', () => { });
    window.removeEventListener('mousemove', () => { });
    window.removeEventListener('mouseup', () => { });
    window.removeEventListener('click', () => { });
    window.removeEventListener('dblclick', () => { });
    window.removeEventListener('contextmenu', () => { });
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

  window.addEventListener('resize', () => {
    resize();
    rebuildPlatforms();
  });
  resize();

  // Build initial platforms and place pet on screen bottom
  rebuildPlatforms();
  const bottomPlat = platforms.find(p => p.id === 'screen-bottom');
  if (bottomPlat) {
    const footOffset = SPRITE_CONTENT.bottom * SPRITE_SCALE;
    pet.y = bottomPlat.y - footOffset;
    pet.grounded = true;
    pet.currentPlatform = bottomPlat;
  }
  // Poll for platform changes (window moves etc.)
  platformPollTimer = setInterval(() => rebuildPlatforms(), 2000);

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
        // Convert screen coords to local coords
        pet.targetX = target.x - window.screenX;
        pet.targetY = target.y - window.screenY;
        pet.movingToTarget = true;
        console.log('Moving to target (IPC):', pet.targetX, pet.targetY);
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

    // Listen for context menu state from interactive window (overlay mode only)
    if (mode === 'overlay' && window.petAPI.on.contextMenuState) {
      window.petAPI.on.contextMenuState((open) => {
        pet.contextMenuOpen = open;
        console.log('Context menu state (from interactive):', open);
        // When menu closes, send updated bounds immediately to restore hitbox position
        if (!open) {
          sendInteractiveBoundsIfNeeded(true);
        }
      });
    }

    // Listen for display switch — reset pet position on new screen
    if (mode === 'overlay' && window.petAPI.on.displayChanged) {
      window.petAPI.on.displayChanged(() => {
        console.log('Display changed — rebuilding platforms');
        // After the overlay window is repositioned, innerWidth/innerHeight reflect new display
        setTimeout(() => {
          rebuildPlatforms();
          const bottomPlat = platforms.find(p => p.id === 'screen-bottom');
          if (bottomPlat) {
            pet.x = (window.innerWidth / 2) - (FRAME_WIDTH * SPRITE_SCALE / 2);
            pet.y = bottomPlat.y - SPRITE_CONTENT.bottom * SPRITE_SCALE;
            pet.vx = 0;
            pet.vy = 0;
            pet.grounded = true;
            pet.onWall = false;
            pet.currentPlatform = bottomPlat;
            setState(STATES.IDLE);
            sendInteractiveBoundsIfNeeded(true);
          }
        }, 200);
      });
    }
  }

  // Listen for local target attack event (same-window)
  const handleAttackTarget = (e) => {
    const target = e.detail;
    pet.targetX = target.x;
    pet.targetY = target.y;
    pet.movingToTarget = true;
    console.log('Moving to target (local):', pet.targetX, pet.targetY);
  };
  window.addEventListener('pet-attack-target', handleAttackTarget);

  window.addEventListener('pet-context-menu-closed', handleMenuClosed);

  await loadSprites();
  bindEvents();
  startBehavior();
  raf = requestAnimationFrame(draw);

  // Send initial pet bounds to interactive window (only from overlay)
  // Send multiple times to ensure interactive window receives correct position
  if (mode === 'overlay') {
    const sendInitialBounds = () => sendInteractiveBoundsIfNeeded(true);
    setTimeout(sendInitialBounds, 200);
    setTimeout(sendInitialBounds, 500);
    setTimeout(sendInitialBounds, 1000);
    setTimeout(sendInitialBounds, 2000);
  }

  // Initialize mouse passthrough after a short delay
  setTimeout(() => {
    MousePassthrough.init();
  }, 100);
});

onBeforeUnmount(() => {
  if (behaviorTimer) clearTimeout(behaviorTimer);
  if (pollInterval) clearInterval(pollInterval);
  if (platformPollTimer) clearInterval(platformPollTimer);
  if (raf) cancelAnimationFrame(raf);
  window.removeEventListener('resize', () => { });
  window.removeEventListener('pet-context-menu-closed', handleMenuClosed);
});
</script>

<style scoped>
#pet-container {
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
}

/* Debug styling for interactive hitbox */
.debug-hitbox {
  outline: 3px dashed rgba(255, 0, 0, 0.95);
  box-shadow: 0 0 0 6px rgba(255, 0, 0, 0.06) inset;
}
</style>