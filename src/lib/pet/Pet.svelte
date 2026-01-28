<script lang="ts">
  import Sprite from "./Sprite.svelte";
  import type { PetAnimation, Direction } from "../stores/pet";

  interface Props {
    animation?: PetAnimation;
    direction?: Direction;
    x?: number;
    y?: number;
  }

  let {
    animation = "idle",
    direction = "right",
    x = 0,
    y = 0,
  }: Props = $props();
</script>

<div
  class="pet-container"
  style="transform: translate({x}px, {y}px)"
>
  <Sprite {animation} {direction} />
</div>

<style>
  .pet-container {
    display: inline-block;
  }
</style>
