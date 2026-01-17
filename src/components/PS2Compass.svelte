<script lang="ts">
  export let azimuth: number = 0;
  export let visible: boolean = true;

  // Convert azimuth to rotation angle (compass rotates opposite to camera)
  $: rotationDeg = (azimuth * 180 / Math.PI);
</script>

{#if visible}
<div class="compass" role="img" aria-label="Compass showing camera direction">
  <svg viewBox="0 0 64 64" class="compass-svg">
    <!-- Outer ring with tick marks -->
    <circle cx="32" cy="32" r="28" class="compass-ring"/>

    <!-- Tick marks at cardinal directions -->
    <g class="compass-ticks">
      <line x1="32" y1="6" x2="32" y2="10"/>
      <line x1="32" y1="54" x2="32" y2="58"/>
      <line x1="6" y1="32" x2="10" y2="32"/>
      <line x1="54" y1="32" x2="58" y2="32"/>
    </g>

    <!-- Minor tick marks -->
    <g class="compass-ticks-minor">
      <line x1="32" y1="6" x2="32" y2="8" transform="rotate(45 32 32)"/>
      <line x1="32" y1="6" x2="32" y2="8" transform="rotate(135 32 32)"/>
      <line x1="32" y1="6" x2="32" y2="8" transform="rotate(225 32 32)"/>
      <line x1="32" y1="6" x2="32" y2="8" transform="rotate(315 32 32)"/>
    </g>

    <!-- Rotating compass rose -->
    <g class="compass-rose" style="transform: rotate({rotationDeg}deg); transform-origin: 32px 32px;">
      <!-- North pointer (yellow) -->
      <polygon points="32,14 28,32 32,28 36,32" class="north-pointer"/>

      <!-- South pointer -->
      <polygon points="32,50 28,32 32,36 36,32" class="south-pointer"/>

      <!-- East/West lines -->
      <line x1="18" y1="32" x2="26" y2="32" class="compass-line"/>
      <line x1="38" y1="32" x2="46" y2="32" class="compass-line"/>
    </g>

    <!-- Cardinal direction labels (fixed) -->
    <text x="32" y="18" class="compass-label compass-label-n">N</text>
    <text x="32" y="52" class="compass-label">S</text>
    <text x="14" y="35" class="compass-label">W</text>
    <text x="50" y="35" class="compass-label">E</text>

    <!-- Center dot -->
    <circle cx="32" cy="32" r="2" class="compass-center"/>
  </svg>
</div>
{/if}

<style>
  .compass {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
  }

  .compass-svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.5));
  }

  .compass-ring {
    fill: none;
    stroke: var(--border-default, #3d4450);
    stroke-width: 1;
    stroke-dasharray: 4 2;
    opacity: 0.7;
  }

  .compass-ticks line {
    stroke: var(--text-secondary, #8b949e);
    stroke-width: 1.5;
  }

  .compass-ticks-minor line {
    stroke: var(--border-subtle, #2d333b);
    stroke-width: 1;
  }

  .compass-rose {
    transition: transform 0.1s ease-out;
  }

  .north-pointer {
    fill: var(--accent-primary, #e8a94e);
    filter: drop-shadow(0 0 3px var(--accent-primary, #e8a94e));
  }

  .south-pointer {
    fill: var(--text-muted, #6e7681);
  }

  .compass-line {
    stroke: var(--text-secondary, #8b949e);
    stroke-width: 1.5;
  }

  .compass-label {
    font-family: var(--font-mono, monospace);
    font-size: 8px;
    font-weight: 600;
    fill: var(--text-secondary, #8b949e);
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .compass-label-n {
    fill: var(--accent-primary, #e8a94e);
    filter: drop-shadow(0 0 2px var(--accent-primary, #e8a94e));
  }

  .compass-center {
    fill: var(--text-secondary, #8b949e);
  }
</style>
