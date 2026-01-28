<script lang="ts">
  import { onMount } from "svelte";
  import Pet from "./lib/pet/Pet.svelte";
  import Overlay from "./lib/overlay/Overlay.svelte";
  import { showOverlay, hideOverlay } from "./lib/stores/pet";

  let windowLabel = "pet";

  onMount(async () => {
    try {
      const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
      const current = getCurrentWebviewWindow();
      windowLabel = current.label;

      if (windowLabel === "pet") {
        // mở overlay mode khi main window khởi động
        await showOverlay();
      }
    } catch (e) {
      console.warn("Running outside Tauri, defaulting to pet window", e);
    }
  });
</script>

{#if windowLabel === "overlay"}
  <Overlay />
{:else}
  <div class="main-window">
    <h1>PetFocus</h1>
    <p>Main Dashboard (Coming Soon)</p>
    <div class="controls">
      <button on:click={() => showOverlay()}>Bật Pet Mode</button>
      <button on:click={() => hideOverlay()}>Tắt Pet Mode</button>
    </div>
    <div class="pet-preview">
      <Pet animation="idle" direction="right" />
    </div>
  </div>
{/if}

<style>
  .main-window {
    padding: 20px;
    background: #f5f5f5;
    min-height: 100vh;
  }

  .controls {
    margin: 20px 0;
    display: flex;
    gap: 10px;
  }

  .controls button {
    padding: 10px 20px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .controls button:hover {
    background: #0056b3;
  }

  .pet-preview {
    margin-top: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    display: inline-block;
  }
</style>