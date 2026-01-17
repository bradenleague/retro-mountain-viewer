<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import PS2Compass from './PS2Compass.svelte';

  export let title: string = '';
  export let showPerf: boolean = false;
  export let showMountains: boolean = false;
  export let showSettings: boolean = false;
  export let fps: number = 0;
  export let gpuTime: number = 0;
  export let mountainName: string = '';
  export let cameraAzimuth: number = 0;
  export let cameraElevation: number = 0;
  export let showCompass: boolean = true;
  export let mountainElevation: number = 0;

  const dispatch = createEventDispatcher();

  function toggleMountains() {
    dispatch('toggleMountains');
  }

  function toggleSettings() {
    dispatch('toggleSettings');
  }

  function togglePerf() {
    dispatch('togglePerf');
  }

  function toggleUi() {
    dispatch('toggleUi');
  }

  function handleReframe() {
    dispatch('reframe');
  }

  // Format elevation angle for display
  $: elevationDeg = Math.round(cameraElevation * 180 / Math.PI);
</script>

<div class="hud">
  <!-- Top bar with title and controls -->
  <header class="hud-header">
    <div class="hud-brand">
      <svg class="brand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 17l6-8 4 5 3-4 5 7H3z"/>
        <circle cx="18" cy="6" r="2"/>
      </svg>
      <span class="brand-text">{title}</span>
    </div>

    <div class="hud-toolbar">
      {#if showPerf}
        <div class="perf-badge">
          <span class="perf-value" class:good={fps >= 55} class:warn={fps < 55 && fps >= 30} class:bad={fps < 30}>
            {Math.round(fps)}
          </span>
          <span class="perf-unit">fps</span>
          {#if gpuTime > 0}
            <span class="perf-divider"></span>
            <span class="perf-value">{gpuTime.toFixed(1)}</span>
            <span class="perf-unit">ms</span>
          {/if}
        </div>
      {/if}

      <div class="toolbar-actions">
        <button
          class="toolbar-btn"
          on:click={handleReframe}
          title="Reframe (F)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M3 12h3M18 12h3M12 3v3M12 18v3"/>
            <path d="M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          class:active={showMountains}
          on:click={toggleMountains}
          title="Mountains"
          aria-pressed={showMountains}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 17l6-8 4 5 3-4 5 7H3z"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          class:active={showSettings}
          on:click={toggleSettings}
          title="Settings"
          aria-pressed={showSettings}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          class:active={showPerf}
          on:click={togglePerf}
          title="Performance"
          aria-pressed={showPerf}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </button>
        <button
          class="toolbar-btn toolbar-btn-hide"
          on:click={toggleUi}
          title="Hide UI (U)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </div>
  </header>

  <!-- Bottom info bar -->
  <footer class="hud-footer">
    <div class="footer-left">
      {#if showCompass}
        <PS2Compass azimuth={cameraAzimuth} visible={showCompass} />
      {/if}
      <div class="current-mountain">
        <span class="mountain-label">Viewing</span>
        <span class="mountain-name">{mountainName}</span>
        {#if mountainElevation > 0}
          <span class="mountain-stats">
            {mountainElevation.toLocaleString()} ft · {elevationDeg}° view
          </span>
        {/if}
      </div>
    </div>
    <div class="controls-hint">
      <span>Drag to orbit</span>
      <span class="hint-divider"></span>
      <span>Scroll to zoom</span>
      <span class="hint-divider"></span>
      <span>Shift+drag to pan</span>
    </div>
  </footer>
</div>

<style>
  .hud {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: var(--z-hud);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HEADER
     ═══════════════════════════════════════════════════════════════════════════ */

  .hud-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    pointer-events: auto;
    background: linear-gradient(180deg, rgba(13, 17, 23, 0.85) 0%, transparent 100%);
  }

  .hud-brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .brand-icon {
    color: var(--accent-primary);
    opacity: 0.9;
  }

  .brand-text {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: var(--tracking-wide);
  }

  .hud-toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  /* Performance badge */
  .perf-badge {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background: var(--surface-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .perf-value {
    font-weight: 600;
    color: var(--status-active);
  }

  .perf-value.good { color: var(--status-active); }
  .perf-value.warn { color: var(--status-warn); }
  .perf-value.bad { color: var(--status-error); }

  .perf-unit {
    color: var(--text-muted);
    font-weight: 400;
  }

  .perf-divider {
    width: 1px;
    height: 10px;
    background: var(--border-default);
    margin: 0 var(--space-1);
  }

  /* Toolbar buttons */
  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--surface-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    transition: all var(--transition-fast);
  }

  .toolbar-btn:hover {
    background: var(--slate-800);
    border-color: var(--border-default);
    color: var(--text-primary);
  }

  .toolbar-btn.active {
    background: rgba(232, 169, 78, 0.15);
    border-color: var(--accent-primary-dim);
    color: var(--accent-primary);
  }

  .toolbar-btn-hide {
    margin-left: var(--space-2);
    border-left: 1px solid var(--border-subtle);
    padding-left: var(--space-2);
    border-radius: 0;
    background: transparent;
    border: none;
    width: auto;
    padding: var(--space-2);
  }

  .toolbar-btn-hide:hover {
    color: var(--accent-primary);
    background: transparent;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     FOOTER
     ═══════════════════════════════════════════════════════════════════════════ */

  .hud-footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding: var(--space-4);
    pointer-events: auto;
    background: linear-gradient(0deg, rgba(13, 17, 23, 0.85) 0%, transparent 100%);
  }

  .footer-left {
    display: flex;
    align-items: flex-end;
    gap: var(--space-3);
  }

  .current-mountain {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .mountain-label {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wider);
  }

  .mountain-name {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  .mountain-stats {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--accent-primary);
    letter-spacing: var(--tracking-wide);
  }

  .controls-hint {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  .hint-divider {
    width: 3px;
    height: 3px;
    background: var(--border-default);
    border-radius: 50%;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RESPONSIVE
     ═══════════════════════════════════════════════════════════════════════════ */

  @media (max-width: 640px) {
    .hud-header {
      padding: var(--space-2) var(--space-3);
    }

    .brand-text {
      display: none;
    }

    .perf-badge {
      font-size: 0.625rem;
    }

    .toolbar-btn {
      width: 32px;
      height: 32px;
    }

    .toolbar-btn svg {
      width: 16px;
      height: 16px;
    }

    .hud-footer {
      padding: var(--space-3);
    }

    .controls-hint {
      display: none;
    }

    .mountain-name {
      font-size: var(--text-base);
    }
  }
</style>
