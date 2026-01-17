<script lang="ts">
  export let enabled: boolean = false;
  export let intensity: number = 0.3;
</script>

{#if enabled}
  <div class="crt-overlay" style="--scanline-opacity: {intensity * 0.02}">
    <div class="scanlines"></div>
    <div class="vignette"></div>
  </div>
{/if}

<style>
  .crt-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 9998;
  }

  .scanlines {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, var(--scanline-opacity, 0.02)),
      rgba(0, 0, 0, var(--scanline-opacity, 0.02)) 50%,
      transparent 50%
    );
    background-size: 100% 3px;
    animation: scanlineScroll 0.15s linear infinite;
  }

  @keyframes scanlineScroll {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 0 3px;
    }
  }

  .vignette {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      ellipse at center,
      transparent 0%,
      transparent 70%,
      rgba(0, 0, 0, var(--scanline-overlay, 0.15)) 100%
    );
  }
</style>