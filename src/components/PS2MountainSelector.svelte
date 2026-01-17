<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  interface Mountain {
    id: string;
    name: string;
    elevation: { min: number; max: number };
    elevation_ft?: number;
    state?: string;
    range?: string;
  }

  export let mountains: Mountain[] = [];
  export let selectedId: string = '';
  export let loading: boolean = false;
  export let groupByState: boolean = true;

  const dispatch = createEventDispatcher();

  // State display names
  const stateNames: Record<string, string> = {
    colorado: 'Colorado',
    california: 'California',
    washington: 'Washington',
    oregon: 'Oregon',
    alaska: 'Alaska',
    arizona: 'Arizona',
    wyoming: 'Wyoming',
    unknown: 'Other',
  };

  // Group mountains by state
  $: groupedMountains = groupByState ? groupByStateFunc(mountains) : { all: mountains };

  function groupByStateFunc(mtns: Mountain[]): Record<string, Mountain[]> {
    const groups: Record<string, Mountain[]> = {};
    for (const m of mtns) {
      const state = m.state || 'unknown';
      if (!groups[state]) groups[state] = [];
      groups[state].push(m);
    }
    // Sort states alphabetically
    const sorted: Record<string, Mountain[]> = {};
    const keys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    for (const k of keys) {
      sorted[k] = groups[k];
    }
    return sorted;
  }

  function selectMountain(id: string) {
    if (loading) return;
    selectedId = id;
    dispatch('select', { id });
  }

  function formatElevation(m: Mountain): string {
    if (m.elevation_ft) {
      return `${m.elevation_ft.toLocaleString()} ft`;
    }
    return `${m.elevation.max.toFixed(0)}m`;
  }
</script>

<div class="mountain-selector">
  <div class="mountain-list">
    {#each Object.entries(groupedMountains) as [state, mtns] (state)}
      {#if groupByState && Object.keys(groupedMountains).length > 1}
        <div class="state-group">
          <div class="state-header">
            <span class="state-name">{stateNames[state] || state}</span>
            <span class="state-count">{mtns.length}</span>
          </div>
        </div>
      {/if}
      {#each mtns as mountain (mountain.id)}
        <button
          class="mountain-item"
          class:selected={selectedId === mountain.id}
          class:loading
          on:click={() => selectMountain(mountain.id)}
          disabled={loading}
        >
          <div class="mountain-info">
            <span class="mountain-name">{mountain.name}</span>
            <span class="mountain-meta">
              <span class="mountain-elevation">{formatElevation(mountain)}</span>
            </span>
          </div>
          {#if selectedId === mountain.id}
            <div class="selected-indicator"></div>
          {/if}
        </button>
      {/each}
    {/each}
  </div>
</div>

<style>
  .mountain-selector {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .mountain-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    min-height: 0;
    padding-right: var(--space-1);
  }

  /* Scrollbar styling */
  .mountain-list::-webkit-scrollbar {
    width: 5px;
  }

  .mountain-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .mountain-list::-webkit-scrollbar-thumb {
    background: var(--slate-700);
    border-radius: 3px;
  }

  .mountain-list::-webkit-scrollbar-thumb:hover {
    background: var(--slate-600);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     STATE GROUPS
     ═══════════════════════════════════════════════════════════════════════════ */

  .state-group {
    margin-top: var(--space-3);
  }

  .state-group:first-child {
    margin-top: 0;
  }

  .state-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-2);
    margin-bottom: var(--space-1);
  }

  .state-name {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wider);
    color: var(--text-muted);
  }

  .state-count {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
    background: var(--slate-800);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     MOUNTAIN ITEMS
     ═══════════════════════════════════════════════════════════════════════════ */

  .mountain-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
    width: 100%;
  }

  .mountain-item:hover:not(:disabled) {
    background: var(--slate-850);
    border-color: var(--border-subtle);
  }

  .mountain-item.selected:not(:disabled) {
    background: rgba(232, 169, 78, 0.08);
    border-color: var(--accent-primary-dim);
  }

  .mountain-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .mountain-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }

  .mountain-name {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mountain-item.selected .mountain-name {
    color: var(--accent-primary);
  }

  .mountain-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .mountain-elevation {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  .selected-indicator {
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 2px;
    background: var(--accent-primary);
    border-radius: 1px;
  }
</style>
