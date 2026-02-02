<template>
  <div id="pet-root" class="w-full h-full">
    <PetCanvas />
  </div>
</template>

<script setup>
import PetCanvas from './components/PetCanvas.vue';
</script>

<style scoped>
#pet-root {
  width: 200px;
  height: 280px;
}
</style>