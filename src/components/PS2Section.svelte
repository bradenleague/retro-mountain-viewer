<script lang="ts">
  export let title: string = '';
  export let expanded: boolean = true;
  export let collapsible: boolean = true;

  function toggle() {
    if (collapsible) {
      expanded = !expanded;
    }
  }

  $: isExpanded = collapsible ? expanded : true;
</script>

<section class="section" class:expanded={isExpanded}>
  {#if collapsible}
    <button class="section-header" on:click={toggle} aria-expanded={isExpanded}>
      <span class="section-title">{title}</span>
      <svg
        class="section-chevron"
        class:rotated={isExpanded}
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M4 5.5l3 3 3-3"/>
      </svg>
    </button>
  {:else}
    <div class="section-header static">
      <span class="section-title">{title}</span>
    </div>
  {/if}

  <div class="section-content" class:visible={isExpanded}>
    <div class="section-inner">
      <slot />
    </div>
  </div>
</section>

<style>
  .section {
    margin-bottom: var(--space-2);
  }

  .section-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: var(--slate-850);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
  }

  .section-header:hover {
    background: var(--slate-800);
    border-color: var(--border-default);
  }

  .section-header.static {
    cursor: default;
  }

  .section-header.static:hover {
    background: var(--slate-850);
    border-color: var(--border-subtle);
  }

  .section-title {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
  }

  .section-chevron {
    color: var(--text-muted);
    transition: transform var(--transition-normal);
    flex-shrink: 0;
  }

  .section-chevron.rotated {
    transform: rotate(180deg);
  }

  .section-content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--transition-normal);
  }

  .section-content.visible {
    grid-template-rows: 1fr;
  }

  .section-inner {
    overflow: hidden;
    padding: 0 var(--space-1);
  }

  .section-content.visible .section-inner {
    padding-top: var(--space-3);
    padding-bottom: var(--space-1);
  }

  /* Active state for expanded sections */
  .section.expanded .section-header {
    border-color: var(--border-default);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .section.expanded .section-title {
    color: var(--text-primary);
  }

  .section.expanded .section-chevron {
    color: var(--accent-primary);
  }
</style>
