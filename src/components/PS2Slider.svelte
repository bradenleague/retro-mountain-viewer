<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: number;
  export let min: number;
  export let max: number;
  export let step: number;
  export let label: string = '';
  export let displayValue: string | null = null;
  export let hint: string | null = null;

  const dispatch = createEventDispatcher();

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    value = parseFloat(target.value);
  }

  function handleChange(e: Event) {
    handleInput(e);
    dispatch('commit', { value });
  }

  $: percentage = ((value - min) / (max - min)) * 100;
</script>

<label class="slider">
  <div class="slider-header">
    <span class="slider-label">{label}{#if hint}<span class="slider-hint">{hint}</span>{/if}</span>
    <span class="slider-value">{displayValue ?? value.toFixed(2)}</span>
  </div>
  <div class="slider-track-container">
    <input
      type="range"
      {min}
      {max}
      {step}
      {value}
      on:input={handleInput}
      on:change={handleChange}
    />
    <div class="slider-track">
      <div class="slider-fill" style="width: {percentage}%"></div>
    </div>
    <div class="slider-thumb" style="left: {percentage}%"></div>
  </div>
</label>

<style>
  .slider {
    display: block;
    margin-bottom: var(--space-3);
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-1);
    gap: var(--space-2);
  }

  .slider-label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-secondary);
  }

  .slider-hint {
    font-size: var(--text-xs);
    font-weight: 400;
    color: var(--text-muted);
    margin-left: 6px;
    opacity: 0.7;
  }

  .slider-value {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--accent-primary);
    background: rgba(232, 169, 78, 0.1);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    min-width: 42px;
    text-align: right;
  }

  .slider-track-container {
    position: relative;
    height: 20px;
    display: flex;
    align-items: center;
  }

  input[type="range"] {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 2;
    margin: 0;
  }

  .slider-track {
    position: absolute;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--slate-700);
    border-radius: 2px;
    overflow: hidden;
  }

  .slider-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--slate-500) 0%, var(--accent-primary) 100%);
    border-radius: 2px;
    transition: width 50ms ease-out;
  }

  .slider-thumb {
    position: absolute;
    width: 14px;
    height: 14px;
    background: var(--slate-100);
    border: 2px solid var(--accent-primary);
    border-radius: 50%;
    transform: translateX(-50%);
    z-index: 1;
    transition: transform 100ms ease, box-shadow 100ms ease;
    pointer-events: none;
  }

  /* Hover and active states */
  input:hover ~ .slider-thumb {
    box-shadow: 0 0 0 4px var(--accent-glow);
  }

  input:active ~ .slider-thumb {
    transform: translateX(-50%) scale(1.15);
    box-shadow: 0 0 0 6px var(--accent-glow-strong);
  }

  /* Focus state for accessibility */
  input:focus-visible ~ .slider-track {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
</style>
