<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  export let open: boolean = true;
  export let position: 'left' | 'right' = 'right';
  export let mode: 'overlay' | 'docked' = 'overlay';
  export let width: string = 'var(--panel-width)';
  export let title: string = '';

  const dispatch = createEventDispatcher();

  function handleClose() {
    open = false;
    dispatch('close');
  }

  function handleBackdropClick(e: MouseEvent | KeyboardEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }

  $: flyParams = {
    x: position === 'left' ? -300 : 300,
    duration: 250,
    easing: cubicOut
  };
</script>

{#if open}
  {#if mode === 'overlay'}
    <div
      class="backdrop"
      on:click={handleBackdropClick}
      on:keydown={(e) => { if (e.key === 'Escape') handleBackdropClick(e); }}
      role="button"
      tabindex="0"
      transition:fade={{ duration: 200 }}
    ></div>
  {/if}
  <aside
    class="drawer {position} {mode}"
    style="width: {width}"
    transition:fly={flyParams}
  >
    <header class="drawer-header">
      <h2 class="drawer-title">{title}</h2>
      <button class="drawer-close" on:click={handleClose} aria-label="Close panel">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 4l8 8M12 4l-8 8"/>
        </svg>
      </button>
    </header>
    <div class="drawer-body">
      <slot />
    </div>
    <div class="drawer-edge"></div>
  </aside>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
    z-index: var(--z-drawer);
  }

  .drawer {
    position: fixed;
    top: 0;
    bottom: 0;
    background: var(--surface-overlay);
    border: 1px solid var(--border-subtle);
    z-index: calc(var(--z-drawer) + 1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-lg);
  }

  .drawer.docked {
    position: absolute;
    z-index: var(--z-panel);
    box-shadow: none;
  }

  .drawer.left {
    left: 0;
    border-left: none;
    border-right-color: var(--border-default);
  }

  .drawer.right {
    right: 0;
    border-right: none;
    border-left-color: var(--border-default);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HEADER
     ═══════════════════════════════════════════════════════════════════════════ */

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    background: var(--surface-raised);
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }

  .drawer-title {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: var(--tracking-wide);
    margin: 0;
  }

  .drawer-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    transition: all var(--transition-fast);
  }

  .drawer-close:hover {
    background: var(--slate-800);
    color: var(--text-primary);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     BODY
     ═══════════════════════════════════════════════════════════════════════════ */

  .drawer-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--space-3);
  }

  .drawer-body::-webkit-scrollbar {
    width: 6px;
  }

  .drawer-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .drawer-body::-webkit-scrollbar-thumb {
    background: var(--slate-700);
    border-radius: 3px;
  }

  .drawer-body::-webkit-scrollbar-thumb:hover {
    background: var(--slate-600);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     EDGE ACCENT
     ═══════════════════════════════════════════════════════════════════════════ */

  .drawer-edge {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(
      180deg,
      var(--accent-primary) 0%,
      var(--accent-primary-dim) 50%,
      transparent 100%
    );
    opacity: 0.6;
  }

  .left .drawer-edge {
    right: 0;
  }

  .right .drawer-edge {
    left: 0;
  }
</style>
