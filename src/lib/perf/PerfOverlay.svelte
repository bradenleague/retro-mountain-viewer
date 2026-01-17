<script lang="ts">
  import { perfEnabled, perfMetrics } from './store';
</script>

{#if $perfEnabled}
  <div class="perf-overlay">
    <div class="metric">
      <span class="label">FPS</span>
      <span class="value" class:good={$perfMetrics.fps >= 55} class:warn={$perfMetrics.fps < 55 && $perfMetrics.fps >= 30} class:bad={$perfMetrics.fps < 30}>
        {$perfMetrics.fps}
      </span>
    </div>
    <div class="metric">
      <span class="label">JS</span>
      <span class="value">{$perfMetrics.jsTime.toFixed(1)}ms</span>
    </div>
    {#if $perfMetrics.gpuSupported}
      <div class="metric">
        <span class="label">GPU</span>
        <span class="value">{$perfMetrics.gpuTime.toFixed(2)}ms</span>
      </div>
    {:else}
      <div class="metric unsupported">
        <span class="label">GPU</span>
        <span class="value">N/A</span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .perf-overlay {
    position: fixed;
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    padding: 8px 12px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 12px;
    color: #fff;
    z-index: 9999;
    display: flex;
    gap: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .label {
    font-size: 9px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .value {
    font-size: 14px;
    font-weight: 600;
    color: #4ade80;
  }

  .value.good {
    color: #4ade80;
  }

  .value.warn {
    color: #fbbf24;
  }

  .value.bad {
    color: #f87171;
  }

  .unsupported .value {
    color: #666;
    font-size: 11px;
  }
</style>
