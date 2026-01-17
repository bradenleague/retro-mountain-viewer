<script lang="ts">
  export let type: 'primary' | 'secondary' | 'ghost' = 'secondary';
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let disabled: boolean = false;
  export let icon: string | null = null;

  let btnElement: HTMLButtonElement;
</script>

<button
  bind:this={btnElement}
  class="btn {type} {size}"
  {disabled}
  on:click
  on:mouseenter
  on:mouseleave
>
  {#if icon}
    <span class="icon">{@html icon}</span>
  {/if}
  <slot />
</button>

<style>
  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    font-family: var(--font-sans);
    font-weight: 500;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
    cursor: pointer;
  }

  /* Sizes */
  .btn.small {
    padding: 6px 10px;
    font-size: var(--text-xs);
  }

  .btn.medium {
    padding: 8px 14px;
    font-size: var(--text-sm);
  }

  .btn.large {
    padding: 10px 18px;
    font-size: var(--text-base);
  }

  /* Primary variant */
  .btn.primary {
    background: var(--accent-primary);
    border: 1px solid var(--accent-primary);
    color: var(--slate-950);
  }

  .btn.primary:hover:not(:disabled) {
    background: var(--accent-primary-bright);
    border-color: var(--accent-primary-bright);
  }

  .btn.primary:active:not(:disabled) {
    background: var(--accent-primary-dim);
    border-color: var(--accent-primary-dim);
  }

  /* Secondary variant */
  .btn.secondary {
    background: var(--slate-800);
    border: 1px solid var(--border-default);
    color: var(--text-primary);
  }

  .btn.secondary:hover:not(:disabled) {
    background: var(--slate-700);
    border-color: var(--border-emphasis);
  }

  .btn.secondary:active:not(:disabled) {
    background: var(--slate-600);
  }

  /* Ghost variant */
  .btn.ghost {
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-secondary);
  }

  .btn.ghost:hover:not(:disabled) {
    background: var(--slate-800);
    color: var(--text-primary);
  }

  .btn.ghost:active:not(:disabled) {
    background: var(--slate-700);
  }

  /* Disabled state */
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Icon */
  .icon {
    display: flex;
    align-items: center;
    line-height: 1;
  }
</style>
