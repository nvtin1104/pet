<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  interface Props {
    animation?: string;
    direction?: "left" | "right";
  }

  let { animation = "idle", direction = "right" }: Props = $props();

  // Knight sprite configuration
  // Each animation is a separate horizontal sprite strip (120x80 per frame)
  const FRAME_WIDTH = 120;
  const FRAME_HEIGHT = 80;
  const SCALE = 1;

  // Animation definitions - each animation has its own sprite sheet file
  const ANIMATIONS: Record<string, { file: string; frames: number; fps: number }> = {
    idle: { file: "_Idle.png", frames: 10, fps: 8 },
    run: { file: "_Run.png", frames: 10, fps: 12 },
    attack: { file: "_Attack.png", frames: 4, fps: 10 },
    jump: { file: "_Jump.png", frames: 3, fps: 8 },
    fall: { file: "_Fall.png", frames: 3, fps: 8 },
    hit: { file: "_Hit.png", frames: 1, fps: 1 },
    death: { file: "_Death.png", frames: 10, fps: 8 },
    dash: { file: "_Dash.png", frames: 2, fps: 10 },
    roll: { file: "_Roll.png", frames: 12, fps: 12 },
    crouch: { file: "_Crouch.png", frames: 1, fps: 1 },
  };

  const SPRITE_BASE_PATH = "/assets/Colour1/Outline/120x80_PNGSheets";

  let frame = $state(0);
  let animationId: number;
  let lastFrameTime = 0;

  const currentAnim = $derived(ANIMATIONS[animation] || ANIMATIONS.idle);
  const frameInterval = $derived(1000 / currentAnim.fps);
  const spriteX = $derived(-(frame * FRAME_WIDTH));
  const spritePath = $derived(`${SPRITE_BASE_PATH}/${currentAnim.file}`);

  function animate(timestamp: number) {
    if (timestamp - lastFrameTime >= frameInterval) {
      frame = (frame + 1) % currentAnim.frames;
      lastFrameTime = timestamp;
    }
    animationId = requestAnimationFrame(animate);
  }

  onMount(() => {
    animationId = requestAnimationFrame(animate);
  });

  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
</script>

<div
  class="sprite"
  style="
    width: {FRAME_WIDTH * SCALE}px;
    height: {FRAME_HEIGHT * SCALE}px;
    background-image: url('{spritePath}');
    background-position: {spriteX * SCALE}px 0;
    background-size: {currentAnim.frames * FRAME_WIDTH * SCALE}px {FRAME_HEIGHT * SCALE}px;
    transform: scaleX({direction === 'left' ? -1 : 1});
  "
></div>

<style>
  .sprite {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    background-repeat: no-repeat;
  }
</style>
