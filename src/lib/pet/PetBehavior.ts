import type { PetAnimation, Direction, PetState } from "../stores/pet";

export interface ScreenBounds {
  width: number;
  height: number;
}

export const PET_WIDTH = 120;
export const PET_HEIGHT = 80;
const WALK_SPEED = 50; // pixels per second
const RUN_SPEED = 150;

// Time ranges for state transitions (in ms)
const IDLE_MIN_TIME = 2000;
const IDLE_MAX_TIME = 5000;
const WALK_MIN_TIME = 3000;
const WALK_MAX_TIME = 8000;

export class PetBehavior {
  private stateTimer: number = 0;
  private stateEndTime: number = 0;
  private attackTimer: number = 0;
  private isAttacking: boolean = false;

  constructor(
    public state: PetState,
    public screenBounds: ScreenBounds
  ) {
    this.scheduleNextState();
  }

  private randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private scheduleNextState(): void {
    if (this.state.animation === "idle") {
      this.stateEndTime = this.randomRange(IDLE_MIN_TIME, IDLE_MAX_TIME);
    } else if (this.state.animation === "walk" || this.state.animation === "run") {
      this.stateEndTime = this.randomRange(WALK_MIN_TIME, WALK_MAX_TIME);
    }
    this.stateTimer = 0;
  }

  private pickRandomDirection(): Direction {
    return Math.random() > 0.5 ? "left" : "right";
  }

  update(deltaTime: number): void {
    // Handle attack animation
    if (this.isAttacking) {
      this.attackTimer += deltaTime;
      if (this.attackTimer >= 400) {
        // Attack animation duration ~400ms (4 frames at 10fps)
        this.isAttacking = false;
        this.attackTimer = 0;
        this.state.animation = "idle";
        this.scheduleNextState();
      }
      return;
    }

    // Don't update if dragging
    if (this.state.isDragging) {
      return;
    }

    this.stateTimer += deltaTime;

    // Move pet if walking/running
    if (this.state.animation === "walk" || this.state.animation === "run") {
      const speed = this.state.animation === "run" ? RUN_SPEED : WALK_SPEED;
      const moveAmount = (speed * deltaTime) / 1000;
      const direction = this.state.direction === "right" ? 1 : -1;

      this.state.position.x += moveAmount * direction;

      // Check screen bounds and reverse direction
      if (this.state.position.x <= 0) {
        this.state.position.x = 0;
        this.state.direction = "right";
      } else if (this.state.position.x >= this.screenBounds.width - PET_WIDTH) {
        this.state.position.x = this.screenBounds.width - PET_WIDTH;
        this.state.direction = "left";
      }
    }

    // State transition
    if (this.stateTimer >= this.stateEndTime) {
      this.transitionToNextState();
    }
  }

  private transitionToNextState(): void {
    if (this.state.animation === "idle") {
      // From idle, go to walk or run
      const rand = Math.random();
      if (rand < 0.7) {
        this.state.animation = "walk";
      } else {
        this.state.animation = "run";
      }
      this.state.direction = this.pickRandomDirection();
    } else {
      // From walk/run, go back to idle
      this.state.animation = "idle";
    }
    this.scheduleNextState();
  }

  handleClick(): void {
    if (this.state.isDragging) return;

    // Trigger attack animation
    this.isAttacking = true;
    this.attackTimer = 0;
    this.state.animation = "attack";
  }

  startDrag(): void {
    this.state.isDragging = true;
    this.state.animation = "idle";
  }

  updateDragPosition(x: number, y: number): void {
    if (!this.state.isDragging) return;

    // Center pet on cursor
    this.state.position.x = Math.max(
      0,
      Math.min(x - PET_WIDTH / 2, this.screenBounds.width - PET_WIDTH)
    );
    this.state.position.y = Math.max(
      0,
      Math.min(y - PET_HEIGHT / 2, this.screenBounds.height - PET_HEIGHT)
    );
  }

  endDrag(): void {
    this.state.isDragging = false;
    this.scheduleNextState();
  }

  updateScreenBounds(bounds: ScreenBounds): void {
    this.screenBounds = bounds;
    // Ensure pet is within new bounds
    this.state.position.x = Math.min(
      this.state.position.x,
      bounds.width - PET_WIDTH
    );
    this.state.position.y = Math.min(
      this.state.position.y,
      bounds.height - PET_HEIGHT
    );
  }
}
