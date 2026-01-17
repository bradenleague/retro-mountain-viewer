<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import PS2Button from './PS2Button.svelte';
  import PS2Slider from './PS2Slider.svelte';
  import PS2Section from './PS2Section.svelte';

  export let renderScale: number;
  export let wobbleStrength: number;
  export let colorSteps: number;
  export let ditherStrength: number;
  export let chromaStrength: number;
  export let chromaRadial: number;
  export let vignette: number;
  export let filmGrain: number;
  export let bloomThreshold: number;
  export let bloomIntensity: number;
  export let saturation: number;
  export let terrainScale: number;
  export let heightExaggeration: number;
  export let snowLine: number;
  export let treeLine: number;
  export let autoSpin: boolean;
  export let spinSpeed: number;
  export let cameraAzimuth: number;
  export let cameraElevation: number;
  export let cameraDistance: number;
  export let cameraHeight: number;
  export let cameraTilt: number;
  export let cameraFov: number;
  export let handheldIntensity: number;
  export let lightIntensity: number;
  export let ambientIntensity: number;
  export let lightAzimuth: number;
  export let sunHeight: number;
  export let fogDensity: number;
  export let cloudCoverage: number;
  export let cloudBrightness: number;
  export let cloudContrast: number;
  export let cloudSpeed: number;
  export let scanlineIntensity: number;
  export let scanlineCount: number;
  export let scanlineSpeed: number;
  export let frameMode: 'none' | 'ig-4x5' | 'story-9x16';
  export let showCompass: boolean;
  export let colorPresets: { id: string; name: string }[] = [];
  export let selectedPresetId: string = "default";

  const dispatch = createEventDispatcher();

  let sections = {
    colorPalette: true,
    ps2Effects: false,
    terrain: true,
    camera: false,
    lighting: false,
    clouds: false,
    framing: false
  };

  function handleSelectPreset(id: string) {
    dispatch('selectPreset', { id });
  }

  function handleParamChange() {
    dispatch('paramChange');
  }

  function handleResetCamera() {
    dispatch('resetCamera');
  }

  function handleReframeCamera() {
    dispatch('reframeCamera');
  }
</script>

<div class="controls">
  <!-- Quick access section -->
  <div class="quick-controls">
    <div class="quick-header">
      <span class="quick-title">Quick Settings</span>
    </div>
    <div class="quick-sliders">
      <PS2Slider label="Resolution" bind:value={renderScale} min={0.1} max={1} step={0.05} displayValue={`${Math.round(renderScale * 100)}%`} />
      <PS2Slider label="PS2 Wobble" bind:value={wobbleStrength} min={0} max={1} step={0.05} displayValue={wobbleStrength > 0 ? `${Math.round(wobbleStrength * 100)}%` : 'Off'} />
    </div>
    <div class="quick-toggles">
      <label class="toggle-chip" class:active={autoSpin}>
        <input type="checkbox" bind:checked={autoSpin} />
        <span>Auto Rotate</span>
      </label>
      <button type="button" class="toggle-chip" class:active={scanlineIntensity > 0} on:click={() => { scanlineIntensity = scanlineIntensity > 0 ? 0 : 0.35; handleParamChange(); }}>
        <span>Scanlines</span>
      </button>
      <label class="toggle-chip" class:active={showCompass}>
        <input type="checkbox" bind:checked={showCompass} />
        <span>Compass</span>
      </label>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Collapsible sections -->
  <div class="sections">
    <PS2Section title="Color Palette" bind:expanded={sections.colorPalette}>
      <div class="preset-grid">
        {#each colorPresets as preset}
          <button
            type="button"
            class="preset-btn"
            class:active={selectedPresetId === preset.id}
            on:click={() => handleSelectPreset(preset.id)}
          >
            {preset.name}
          </button>
        {/each}
      </div>
    </PS2Section>

    <PS2Section title="Terrain" bind:expanded={sections.terrain}>
      <PS2Slider label="Scale" bind:value={terrainScale} min={0.3} max={2} step={0.1} />
      <div class="height-row">
        <PS2Slider label="Height Exaggeration" bind:value={heightExaggeration} min={1} max={10} step={0.5} displayValue={`${heightExaggeration.toFixed(1)}x`} />
        <button
          type="button"
          class="true-scale-btn"
          class:active={Math.abs(heightExaggeration - 1.0) < 0.05}
          on:click={() => (heightExaggeration = 1.0)}
          title="Set to true geographic proportions"
        >
          1:1
        </button>
      </div>
      <PS2Slider label="Snow Line" bind:value={snowLine} min={0.3} max={0.9} step={0.05} displayValue={`${Math.round(snowLine * 100)}%`} />
      <PS2Slider label="Tree Line" bind:value={treeLine} min={0.1} max={0.6} step={0.05} displayValue={`${Math.round(treeLine * 100)}%`} />
    </PS2Section>

    <PS2Section title="Camera" bind:expanded={sections.camera}>
      <div class="camera-actions">
        <PS2Button type="secondary" size="small" on:click={handleReframeCamera}>
          Reframe
        </PS2Button>
        <PS2Button type="secondary" size="small" on:click={handleResetCamera}>
          Reset
        </PS2Button>
        <span class="camera-hint">R to reset</span>
      </div>

      <div class="toggle-row">
        <label class="toggle-inline">
          <input type="checkbox" bind:checked={autoSpin} />
          <span>Auto Rotate</span>
        </label>
        {#if autoSpin}
          <PS2Slider label="Rotation Speed" bind:value={spinSpeed} min={0} max={0.5} step={0.01} />
        {/if}
      </div>

      <!-- Orbit Controls -->
      <div class="control-group">
        <span class="control-group-label">Orbit</span>
        {#if !autoSpin}
          <PS2Slider label="Orbit" bind:value={cameraAzimuth} min={-3.14159} max={3.14159} step={0.1} displayValue={`${Math.round(cameraAzimuth * 180 / Math.PI)}°`} hint="drag left/right" />
        {/if}
        <PS2Slider label="Pitch" bind:value={cameraElevation} min={-1.4} max={1.4} step={0.05} displayValue={`${Math.round(cameraElevation * 180 / Math.PI)}°`} hint="drag up/down" />
        <PS2Slider label="Distance" bind:value={cameraDistance} min={0.5} max={10} step={0.1} hint="scroll wheel" />
      </div>

      <!-- Position Controls -->
      <div class="control-group">
        <span class="control-group-label">Position</span>
        <PS2Slider label="Height" bind:value={cameraHeight} min={-1} max={2} step={0.05} />
        <PS2Slider label="Roll" bind:value={cameraTilt} min={-30} max={30} step={1} displayValue={`${Math.round(cameraTilt)}°`} />
      </div>

      <!-- Lens Controls -->
      <div class="control-group">
        <span class="control-group-label">Lens</span>
        <PS2Slider label="Field of View" bind:value={cameraFov} min={30} max={120} step={5} displayValue={`${Math.round(cameraFov)}°`} />
      </div>

      <!-- Effects -->
      <div class="control-group">
        <span class="control-group-label">Effects</span>
        <PS2Slider label="Handheld" bind:value={handheldIntensity} min={0} max={1} step={0.05} displayValue={handheldIntensity > 0 ? `${Math.round(handheldIntensity * 100)}%` : 'Off'} />
      </div>
    </PS2Section>

    <PS2Section title="PS2 Effects" bind:expanded={sections.ps2Effects}>
      <PS2Slider label="Resolution" bind:value={renderScale} min={0.1} max={1} step={0.05} displayValue={`${Math.round(renderScale * 100)}%`} />
      <PS2Slider label="Vertex Wobble" bind:value={wobbleStrength} min={0} max={1} step={0.05} displayValue={wobbleStrength > 0 ? `${Math.round(wobbleStrength * 100)}%` : 'Off'} />
      <PS2Slider label="Color Depth" bind:value={colorSteps} min={8} max={256} step={8} displayValue={colorSteps.toString()} on:commit={handleParamChange} />
      <PS2Slider label="Dithering" bind:value={ditherStrength} min={0} max={4} step={0.1} on:commit={handleParamChange} />
      <PS2Slider label="Chromatic Aberration" bind:value={chromaStrength} min={0} max={2} step={0.1} on:commit={handleParamChange} />
      <PS2Slider label="Vignette" bind:value={vignette} min={0} max={1} step={0.05} on:commit={handleParamChange} />
      <PS2Slider label="Film Grain" bind:value={filmGrain} min={0} max={0.3} step={0.01} displayValue={filmGrain > 0 ? `${Math.round(filmGrain * 100)}%` : 'Off'} on:commit={handleParamChange} />
      <PS2Slider label="Bloom Threshold" bind:value={bloomThreshold} min={0.2} max={1} step={0.05} on:commit={handleParamChange} />
      <PS2Slider label="Bloom Intensity" bind:value={bloomIntensity} min={0} max={1} step={0.05} displayValue={bloomIntensity > 0 ? `${Math.round(bloomIntensity * 100)}%` : 'Off'} on:commit={handleParamChange} />
      <PS2Slider label="Saturation" bind:value={saturation} min={0} max={1.5} step={0.05} displayValue={saturation < 1 ? `${Math.round(saturation * 100)}%` : saturation > 1 ? `+${Math.round((saturation - 1) * 100)}%` : '100%'} on:commit={handleParamChange} />
      <PS2Slider label="CRT Scanlines" bind:value={scanlineIntensity} min={0} max={1} step={0.05} displayValue={scanlineIntensity > 0 ? `${Math.round(scanlineIntensity * 100)}%` : 'Off'} on:commit={handleParamChange} />
      <PS2Slider label="Scanline Count" bind:value={scanlineCount} min={60} max={300} step={10} displayValue={scanlineCount.toString()} on:commit={handleParamChange} />
      <PS2Slider label="Scanline Scroll" bind:value={scanlineSpeed} min={0} max={2} step={0.1} displayValue={scanlineSpeed > 0 ? `${scanlineSpeed.toFixed(1)}x` : 'Static'} on:commit={handleParamChange} />
    </PS2Section>

    <PS2Section title="Lighting" bind:expanded={sections.lighting}>
      <PS2Slider label="Sun Intensity" bind:value={lightIntensity} min={0} max={2} step={0.1} />
      <PS2Slider label="Ambient Light" bind:value={ambientIntensity} min={0} max={1} step={0.05} />
      <PS2Slider label="Sun Angle" bind:value={lightAzimuth} min={-1} max={1} step={0.05} displayValue={`${Math.round(lightAzimuth * 180)}°`} />
      <PS2Slider label="Sun Height" bind:value={sunHeight} min={0.1} max={0.9} step={0.05} on:commit={handleParamChange} />
      <PS2Slider label="Fog Density" bind:value={fogDensity} min={0} max={0.5} step={0.01} on:commit={handleParamChange} />
    </PS2Section>

    <PS2Section title="Sky & Clouds" bind:expanded={sections.clouds}>
      <PS2Slider label="Cloud Coverage" bind:value={cloudCoverage} min={0} max={1} step={0.05} on:commit={handleParamChange} displayValue={cloudCoverage > 0 ? `${Math.round(cloudCoverage * 100)}%` : 'Clear'} />
      <PS2Slider label="Cloud Brightness" bind:value={cloudBrightness} min={0.5} max={1} step={0.05} on:commit={handleParamChange} />
      <PS2Slider label="Cloud Contrast" bind:value={cloudContrast} min={0} max={0.5} step={0.05} on:commit={handleParamChange} />
      <PS2Slider label="Cloud Speed" bind:value={cloudSpeed} min={0} max={1} step={0.05} on:commit={handleParamChange} />
    </PS2Section>

    <PS2Section title="Export Framing" bind:expanded={sections.framing}>
      <p class="framing-desc">Frame the canvas for screenshots</p>
      <div class="frame-options">
        <button
          type="button"
          class="frame-btn"
          class:active={frameMode === 'none'}
          on:click={() => (frameMode = 'none')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="2" width="12" height="12" rx="1"/>
          </svg>
          <span>Full</span>
        </button>
        <button
          type="button"
          class="frame-btn"
          class:active={frameMode === 'ig-4x5'}
          on:click={() => (frameMode = 'ig-4x5')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="1.5" width="10" height="13" rx="1"/>
          </svg>
          <span>4:5</span>
        </button>
        <button
          type="button"
          class="frame-btn"
          class:active={frameMode === 'story-9x16'}
          on:click={() => (frameMode = 'story-9x16')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="4" y="1" width="8" height="14" rx="1"/>
          </svg>
          <span>9:16</span>
        </button>
      </div>
    </PS2Section>
  </div>
</div>

<style>
  .controls {
    display: flex;
    flex-direction: column;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     QUICK CONTROLS
     ═══════════════════════════════════════════════════════════════════════════ */

  .quick-controls {
    padding-bottom: var(--space-3);
  }

  .quick-header {
    margin-bottom: var(--space-3);
  }

  .quick-title {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--accent-primary);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
  }

  .quick-sliders {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-bottom: var(--space-3);
  }

  .quick-toggles {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .toggle-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: var(--slate-800);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    font-size: var(--text-xs);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .toggle-chip:hover {
    border-color: var(--border-default);
    color: var(--text-primary);
  }

  .toggle-chip.active {
    background: rgba(232, 169, 78, 0.12);
    border-color: var(--accent-primary-dim);
    color: var(--accent-primary);
  }

  .toggle-chip input {
    display: none;
  }

  .divider {
    height: 1px;
    background: var(--border-subtle);
    margin-bottom: var(--space-3);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     SECTIONS
     ═══════════════════════════════════════════════════════════════════════════ */

  .sections {
    display: flex;
    flex-direction: column;
  }

  /* Color palette presets */
  .preset-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
  }

  .preset-btn {
    padding: var(--space-2) var(--space-3);
    background: var(--slate-800);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .preset-btn:hover {
    background: var(--slate-700);
    border-color: var(--border-default);
    color: var(--text-primary);
  }

  .preset-btn.active {
    background: rgba(232, 169, 78, 0.12);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }

  /* Height exaggeration row with true scale button */
  .height-row {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
  }

  .height-row :global(.slider-container) {
    flex: 1;
  }

  .true-scale-btn {
    flex-shrink: 0;
    padding: 6px 10px;
    margin-bottom: 4px;
    background: var(--slate-800);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .true-scale-btn:hover {
    background: var(--slate-700);
    border-color: var(--border-default);
    color: var(--text-primary);
  }

  .true-scale-btn.active {
    background: rgba(232, 169, 78, 0.12);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }

  /* Camera helpers */
  .camera-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .camera-hint {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin-left: auto;
  }

  .toggle-row {
    margin-bottom: var(--space-3);
  }

  .toggle-inline {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .toggle-inline:hover {
    color: var(--text-primary);
  }

  .toggle-inline input[type="checkbox"] {
    width: 14px;
    height: 14px;
    accent-color: var(--accent-primary);
    cursor: pointer;
  }

  /* Control groups */
  .control-group {
    margin-bottom: var(--space-3);
    padding-top: var(--space-2);
    border-top: 1px solid var(--border-subtle);
  }

  .control-group:first-of-type {
    border-top: none;
    padding-top: 0;
  }

  .control-group-label {
    display: block;
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: var(--space-2);
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     FRAMING
     ═══════════════════════════════════════════════════════════════════════════ */

  .framing-desc {
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin: 0 0 var(--space-3) 0;
  }

  .frame-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-2);
  }

  .frame-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: var(--space-2);
    background: var(--slate-800);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: 500;
    transition: all var(--transition-fast);
  }

  .frame-btn:hover {
    background: var(--slate-700);
    border-color: var(--border-default);
    color: var(--text-primary);
  }

  .frame-btn.active {
    background: rgba(232, 169, 78, 0.12);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }
</style>
