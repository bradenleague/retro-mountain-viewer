<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { PerfMonitor, perfEnabled, perfMetrics } from "./lib/perf";
  import { initWebGPU, type WebGPUContext } from "./lib/webgpu/init";
  import PS2Drawer from "./components/PS2Drawer.svelte";
  import PS2ControlPanel from "./components/PS2ControlPanel.svelte";
  import PS2MountainSelector from "./components/PS2MountainSelector.svelte";
  import PS2HUD from "./components/PS2HUD.svelte";
  import mountainData from "./lib/mountains.json";

  // Mountain configurations
  interface MountainConfig {
    id: string;
    name: string;
    heightmap: string;
    width: number;
    height: number;
    elevation: { min: number; max: number };
    snowLine: number;
    treeLine: number;
    state?: string;
    range?: string;
    elevation_ft?: number;
  }

  interface ColorPreset {
    id: string;
    name: string;
    // Atmosphere
    fog: [number, number, number];
    fogDensity: number;
    skyTop: [number, number, number];
    skyHorizon: [number, number, number];
    glowColor: [number, number, number];
    horizonGlow: number;
    // Terrain
    snow: [number, number, number];
    rock: [number, number, number];
    forest: [number, number, number];
    meadow: [number, number, number];
    // Lighting
    ambientColor: [number, number, number];
    lightColor: [number, number, number];
    lightIntensity: number;
    ambientIntensity: number;
    cloudBrightness: number;
    cloudContrast: number;
  }

  const colorPresets: ColorPreset[] = [
    {
      id: "default",
      name: "Default",
      fog: [0.55, 0.65, 0.8],
      fogDensity: 0.16,
      skyTop: [0.3, 0.55, 0.85],
      skyHorizon: [0.75, 0.82, 0.92],
      glowColor: [0.9, 0.85, 0.75],
      horizonGlow: 0.6,
      snow: [1.0, 1.0, 1.0],
      rock: [0.40, 0.38, 0.35],
      forest: [0.12, 0.22, 0.10],
      meadow: [0.30, 0.42, 0.22],
      ambientColor: [0.25, 0.28, 0.35],
      lightColor: [0.92, 0.86, 0.76],  // warm off-white
      lightIntensity: 0.8,
      ambientIntensity: 0.55,
      cloudBrightness: 0.75,
      cloudContrast: 0.35,
    },
    {
      id: "ps2-alpine",
      name: "PS2 Alpine",
      fog: [0.58, 0.65, 0.78],
      fogDensity: 0.18,
      skyTop: [0.35, 0.52, 0.75],
      skyHorizon: [0.70, 0.75, 0.82],
      glowColor: [0.85, 0.80, 0.72],
      horizonGlow: 0.5,
      snow: [0.92, 0.91, 0.88],
      rock: [0.42, 0.40, 0.38],
      forest: [0.14, 0.20, 0.12],
      meadow: [0.32, 0.38, 0.24],
      ambientColor: [0.28, 0.30, 0.38],
      lightColor: [0.88, 0.84, 0.78],  // cooler
      lightIntensity: 0.7,
      ambientIntensity: 0.60,
      cloudBrightness: 0.70,
      cloudContrast: 0.30,
    },
    {
      id: "ps2-overcast",
      name: "PS2 Overcast",
      fog: [0.62, 0.64, 0.68],
      fogDensity: 0.22,
      skyTop: [0.45, 0.50, 0.58],
      skyHorizon: [0.65, 0.68, 0.72],
      glowColor: [0.75, 0.73, 0.70],
      horizonGlow: 0.3,
      snow: [0.85, 0.85, 0.87],
      rock: [0.38, 0.37, 0.36],
      forest: [0.12, 0.16, 0.12],
      meadow: [0.28, 0.32, 0.24],
      ambientColor: [0.32, 0.33, 0.36],
      lightColor: [0.80, 0.80, 0.82],  // neutral gray-blue
      lightIntensity: 0.5,
      ambientIntensity: 0.70,
      cloudBrightness: 0.60,
      cloudContrast: 0.20,
    },
    {
      id: "ps2-golden",
      name: "PS2 Golden Hour",
      fog: [0.72, 0.62, 0.52],
      fogDensity: 0.14,
      skyTop: [0.45, 0.50, 0.70],
      skyHorizon: [0.85, 0.75, 0.65],
      glowColor: [1.0, 0.85, 0.6],
      horizonGlow: 0.8,
      snow: [0.98, 0.94, 0.86],
      rock: [0.48, 0.42, 0.35],
      forest: [0.15, 0.18, 0.10],
      meadow: [0.38, 0.40, 0.22],
      ambientColor: [0.30, 0.28, 0.35],
      lightColor: [1.0, 0.85, 0.65],   // warm amber
      lightIntensity: 0.9,
      ambientIntensity: 0.50,
      cloudBrightness: 0.80,
      cloudContrast: 0.25,
    },
    {
      id: "ps2-coastal",
      name: "PS2 Coastal",
      fog: [0.68, 0.78, 0.82],
      fogDensity: 0.20,
      skyTop: [0.50, 0.70, 0.85],
      skyHorizon: [0.80, 0.88, 0.92],
      glowColor: [0.95, 0.92, 0.85],
      horizonGlow: 0.5,
      snow: [0.95, 0.95, 0.93],
      rock: [0.55, 0.52, 0.48],
      forest: [0.18, 0.28, 0.20],
      meadow: [0.45, 0.52, 0.35],
      ambientColor: [0.30, 0.35, 0.40],
      lightColor: [0.95, 0.92, 0.88],  // bright warm
      lightIntensity: 0.75,
      ambientIntensity: 0.58,
      cloudBrightness: 0.85,
      cloudContrast: 0.30,
    },
  ];

  // Load mountains from generated JSON
  const mountains: MountainConfig[] = mountainData.mountains;

  let selectedMountain = mountains.find(m => m.id === 'rainier') || mountains[0];

  let canvas: HTMLCanvasElement;
  let ctx: WebGPUContext | null = null;
  let perf: PerfMonitor | null = null;
  let error = "";
  let loading = true;
  let animationId: number;

  let showMountainDrawer: boolean = false;
  let showControlsDrawer: boolean = false;
  let isDesktop: boolean = false;
  let showUI: boolean = true;
  let showCompass: boolean = true;
  let showMobileTouchHint: boolean = false;
  let mobileTouchHintTimer: ReturnType<typeof setTimeout> | null = null;
  type FrameMode = "none" | "ig-4x5" | "story-9x16";
  let frameMode: FrameMode = "none";
  $: frameRatio =
    frameMode === "ig-4x5" ? 4 / 5 : frameMode === "story-9x16" ? 9 / 16 : 1;
  $: frameLabel =
    frameMode === "ig-4x5" ? "IG 4:5" : frameMode === "story-9x16" ? "Story 9:16" : "";

  // Viewport tracking for export framing
  let viewportWidth = 0;
  let viewportHeight = 0;

  // Computed canvas dimensions for constrained framing
  $: canvasDimensions = (() => {
    if (frameMode === "none" || !viewportWidth || !viewportHeight) {
      return { width: "100%", height: "100%", constrained: false };
    }

    // Height-capped sizing
    let targetHeight = viewportHeight;
    let targetWidth = targetHeight * frameRatio;

    // If width exceeds viewport, cap by width instead
    if (targetWidth > viewportWidth) {
      targetWidth = viewportWidth;
      targetHeight = targetWidth / frameRatio;
    }

    return {
      width: `${targetWidth}px`,
      height: `${targetHeight}px`,
      constrained: true
    };
  })();

  let lastMountainDrawer: boolean = false;
  let lastControlsDrawer: boolean = false;
  let lastTapTime = 0;
  let lastTapX = 0;
  let lastTapY = 0;


  function togglePerf() {
    perfEnabled.update(v => !v);
  }

  const defaultCamera = {
    distance: 1.4,
    azimuth: -187 * Math.PI / 180,
    elevation: 13 * Math.PI / 180,
    height: 0.10,
    tilt: -7,
    fov: 65,
    target: [0, 0, 0] as [number, number, number],
    autoSpin: false,
    spinSpeed: 0.15,
    handheldIntensity: 0.15,
  };

  function resetCamera() {
    cameraDistance = defaultCamera.distance;
    cameraAzimuth = defaultCamera.azimuth;
    cameraElevation = defaultCamera.elevation;
    cameraHeight = defaultCamera.height;
    cameraTilt = defaultCamera.tilt;
    cameraFov = defaultCamera.fov;
    cameraTarget = [...defaultCamera.target];
    autoSpin = defaultCamera.autoSpin;
    spinSpeed = defaultCamera.spinSpeed;
    handheldIntensity = defaultCamera.handheldIntensity;
  }

  // Easing function for smooth animation
  function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  // Lerp helper for angles (handles wraparound)
  function lerpAngle(from: number, to: number, t: number): number {
    let delta = to - from;
    // Normalize delta to [-PI, PI]
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    return from + delta * t;
  }

  // Compute effective terrain height using true scale system
  function getEffectiveTerrainHeight(): number {
    return trueHeightRatio * heightExaggeration * terrainScale;
  }

  // Compute optimal camera position to frame the current mountain
  function computeReframeTarget() {
    const aspectRatio = selectedMountain.width / selectedMountain.height;
    // Terrain spans: X = [-aspectRatio, aspectRatio] * terrainScale, Z = [-1, 1] * terrainScale
    const terrainWidth = 2 * aspectRatio * terrainScale;
    const terrainDepth = 2 * terrainScale;
    const effectiveHeight = getEffectiveTerrainHeight();

    // Calculate distance to fit terrain with ~15% padding
    const fovRad = cameraFov * Math.PI / 180;
    const maxExtent = Math.max(terrainWidth, terrainDepth, effectiveHeight);
    const fitDistance = (maxExtent / 2) / Math.tan(fovRad / 2) * 1.15;

    return {
      distance: Math.max(getMinCameraDistance(), Math.min(fitDistance, 10)),
      azimuth: defaultCamera.azimuth,
      elevation: 15 * Math.PI / 180, // 15 degrees - favorable viewing angle
      height: effectiveHeight * 0.25,
      target: [0, 0, 0] as [number, number, number],
    };
  }

  // Start animated camera transition to reframe
  function reframeCamera() {
    if (isAnimating) return;

    // Stop auto spin during reframe
    autoSpin = false;

    // Store current camera state
    animationFrom = {
      distance: cameraDistance,
      azimuth: cameraAzimuth,
      elevation: cameraElevation,
      height: cameraHeight,
      target: [...cameraTarget] as [number, number, number],
    };

    // Compute target state
    animationTo = computeReframeTarget();

    // Start animation
    isAnimating = true;
    animationStartTime = performance.now();
  }

  // Update camera animation (called from render loop)
  function updateCameraAnimation(currentTime: number) {
    if (!isAnimating) return;

    const elapsed = currentTime - animationStartTime;
    const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
    const t = easeOutCubic(progress);

    // Interpolate camera values
    cameraDistance = animationFrom.distance + (animationTo.distance - animationFrom.distance) * t;
    cameraAzimuth = lerpAngle(animationFrom.azimuth, animationTo.azimuth, t);
    cameraElevation = animationFrom.elevation + (animationTo.elevation - animationFrom.elevation) * t;
    cameraHeight = animationFrom.height + (animationTo.height - animationFrom.height) * t;
    cameraTarget[0] = animationFrom.target[0] + (animationTo.target[0] - animationFrom.target[0]) * t;
    cameraTarget[1] = animationFrom.target[1] + (animationTo.target[1] - animationFrom.target[1]) * t;
    cameraTarget[2] = animationFrom.target[2] + (animationTo.target[2] - animationFrom.target[2]) * t;

    if (progress >= 1) {
      isAnimating = false;
    }
  }

  function setUiVisible(nextVisible: boolean) {
    if (showUI === nextVisible) return;
    showUI = nextVisible;

    if (!showUI) {
      lastMountainDrawer = showMountainDrawer;
      lastControlsDrawer = showControlsDrawer;
      showMountainDrawer = false;
      showControlsDrawer = false;
    } else {
      showMountainDrawer = lastMountainDrawer;
      showControlsDrawer = lastControlsDrawer;
    }
  }

  function toggleUI() {
    setUiVisible(!showUI);
  }

  function handleKeydown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (key !== "u" && key !== "r" && key !== "f") return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("input, textarea, select")) return;
    if (key === "u") {
      toggleUI();
    } else if (key === "r") {
      resetCamera();
    } else if (key === "f") {
      reframeCamera();
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (e.changedTouches.length !== 1) return;
    const target = e.target as HTMLElement | null;
    if (!target?.closest(".canvas-frame")) return;

    const touch = e.changedTouches[0];
    const now = performance.now();
    const dx = touch.clientX - lastTapX;
    const dy = touch.clientY - lastTapY;
    const isDoubleTap = now - lastTapTime < 320 && Math.hypot(dx, dy) < 32;

    if (isDoubleTap) {
      lastTapTime = 0;
      toggleUI();
      return;
    }

    lastTapTime = now;
    lastTapX = touch.clientX;
    lastTapY = touch.clientY;
  }

  // Camera state
  let cameraDistance = defaultCamera.distance;
  let cameraAzimuth = defaultCamera.azimuth;
  let cameraElevation = defaultCamera.elevation;
  let cameraHeight = defaultCamera.height;
  let cameraTilt = defaultCamera.tilt;
  let cameraFov = defaultCamera.fov;
  let cameraTarget = [...defaultCamera.target];
  let handheldIntensity = defaultCamera.handheldIntensity;
  let autoSpin = defaultCamera.autoSpin;
  let spinSpeed = defaultCamera.spinSpeed;

  // Mouse state
  let isDragging = false;
  let isPanning = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  // Inertia state for smooth drag release
  let velocityX = 0;
  let velocityY = 0;
  const INERTIA_DECAY = 0.92;
  const INERTIA_THRESHOLD = 0.001;

  // Touch state for mobile controls
  let lastTouchX = 0;
  let lastTouchY = 0;
  let lastPinchDistance = 0;
  let isTouchDragging = false;
  let isTouchPanning = false;
  let activeTouches = 0;

  // Camera animation state
  let isAnimating = false;
  let animationStartTime = 0;
  const ANIMATION_DURATION = 400; // ms
  let animationFrom = {
    distance: 0,
    azimuth: 0,
    elevation: 0,
    height: 0,
    target: [0, 0, 0] as [number, number, number],
  };
  let animationTo = {
    distance: 0,
    azimuth: 0,
    elevation: 0,
    height: 0,
    target: [0, 0, 0] as [number, number, number],
  };

  // PS2 effect parameters
  let renderScale = 0.25;
  let wobbleStrength = 0.35;
  let colorSteps = 64;
  let ditherStrength = 2.0;
  let chromaStrength = 0.30;
  let chromaRadial = 0.65;
  let vignette = 0.44;
  let fogDensity = 0.16;
  let fogColor = [0.55, 0.65, 0.8];
  let ambientColor = [0.25, 0.28, 0.35];

  // Terrain parameters
  let terrainScale = 1.0;
  let heightExaggeration = 5.0;

  // True scale calculation: geographic extent is ~32km (0.3° bounding box)
  const GEOGRAPHIC_EXTENT_METERS = 32000;
  $: trueHeightRatio = (selectedMountain.elevation.max - selectedMountain.elevation.min) / GEOGRAPHIC_EXTENT_METERS;
  let snowLine = 0.40;
  let treeLine = 0.15;

  // Terrain color parameters
  let snowColor = [1.0, 1.0, 1.0];
  let rockColor = [0.40, 0.38, 0.35];
  let forestColor = [0.12, 0.22, 0.10];
  let meadowColor = [0.30, 0.42, 0.22];
  let lightIntensity = 0.8;      // PS2 style: reduced for ambient-dominant
  let ambientIntensity = 0.55;   // PS2 style: now primary driver (50-70%)
  let lightColor = [0.92, 0.86, 0.76]; // warm off-white #EADBC2
  let lightAzimuth = -18 / 180; // -18 degrees

  // Environment parameters
  let sunHeight = 0.25;
  let skyTop = [0.3, 0.55, 0.85];
  let skyHorizon = [0.75, 0.82, 0.92];
  let horizonGlow = 0.6;
  let glowColor = [0.9, 0.85, 0.75];

  // Cloud parameters
  let cloudCoverage = 0.65;
  let cloudSharpness = 3.0;
  let cloudSpeed = 0.30;
  let cloudScale = 1.5;
  let cloudBrightness = 0.75;
  let cloudContrast = 0.35;

  // Color preset state
  let selectedPresetId = "default";

  function applyPreset(preset: ColorPreset) {
    selectedPresetId = preset.id;
    fogColor = [...preset.fog];
    fogDensity = preset.fogDensity;
    skyTop = [...preset.skyTop];
    skyHorizon = [...preset.skyHorizon];
    glowColor = [...preset.glowColor];
    horizonGlow = preset.horizonGlow;
    snowColor = [...preset.snow];
    rockColor = [...preset.rock];
    forestColor = [...preset.forest];
    meadowColor = [...preset.meadow];
    ambientColor = [...preset.ambientColor];
    lightColor = [...preset.lightColor];
    lightIntensity = preset.lightIntensity;
    ambientIntensity = preset.ambientIntensity;
    cloudBrightness = preset.cloudBrightness;
    cloudContrast = preset.cloudContrast;
    rebuildPipelines();
  }

  function selectPreset(id: string) {
    const preset = colorPresets.find(p => p.id === id);
    if (preset) applyPreset(preset);
  }

  // Post-processing
  let filmGrain = 0.03;
  let bloomThreshold = 0.6;
  let bloomIntensity = 0.3;
  let saturation = 0.85;  // PS2 style: slightly desaturated
  let scanlineIntensity = 0.35;
  let scanlineCount = 150;  // number of scanlines across screen
  let scanlineSpeed = 0.0;

  // Terrain mesh
  const GRID_SIZE = 128;

  // Matrix utilities
  function mat4Perspective(fov: number, aspect: number, near: number, far: number): Float32Array {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ]);
  }

  function mat4LookAt(eye: number[], target: number[], up: number[]): Float32Array {
    const zAxis = normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
    const xAxis = normalize(cross(up, zAxis));
    const yAxis = cross(zAxis, xAxis);

    return new Float32Array([
      xAxis[0], yAxis[0], zAxis[0], 0,
      xAxis[1], yAxis[1], zAxis[1], 0,
      xAxis[2], yAxis[2], zAxis[2], 0,
      -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1,
    ]);
  }

  function mat4Multiply(a: Float32Array, b: Float32Array): Float32Array {
    const out = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        out[j * 4 + i] =
          a[0 * 4 + i] * b[j * 4 + 0] +
          a[1 * 4 + i] * b[j * 4 + 1] +
          a[2 * 4 + i] * b[j * 4 + 2] +
          a[3 * 4 + i] * b[j * 4 + 3];
      }
    }
    return out;
  }

  function normalize(v: number[]): number[] {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return len > 0 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0];
  }

  function cross(a: number[], b: number[]): number[] {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  function dot(a: number[], b: number[]): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function mat4Invert(m: Float32Array): Float32Array {
    const out = new Float32Array(16);
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
    const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
    const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
    const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];

    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) return out;
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return out;
  }

  function computeViewMatrix(time: number): Float32Array {
    // Auto-spin
    let azimuth = cameraAzimuth;
    if (autoSpin) {
      azimuth += time * spinSpeed;
    }

    const x = cameraDistance * Math.cos(cameraElevation) * Math.sin(azimuth);
    const y = cameraDistance * Math.sin(cameraElevation);
    const z = cameraDistance * Math.cos(cameraElevation) * Math.cos(azimuth);

    const targetWithHeight = [
      cameraTarget[0],
      cameraTarget[1] + cameraHeight,
      cameraTarget[2],
    ];

    const eye = [
      targetWithHeight[0] + x,
      targetWithHeight[1] + y,
      targetWithHeight[2] + z,
    ];

    let view = mat4LookAt(eye, targetWithHeight, [0, 1, 0]);

    // Apply tilt
    if (Math.abs(cameraTilt) > 0.001) {
      const tiltRad = cameraTilt * Math.PI / 180;
      const c = Math.cos(tiltRad);
      const s = Math.sin(tiltRad);
      const tiltMat = new Float32Array([
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1,
      ]);
      view = mat4Multiply(tiltMat, view);
    }

    // Handheld camera shake
    if (handheldIntensity > 0.001) {
      const shakeX = (
        Math.sin(time * 1.7) * 0.3 +
        Math.sin(time * 3.1) * 0.2 +
        Math.sin(time * 5.3) * 0.1
      ) * handheldIntensity * 0.02;

      const shakeY = (
        Math.sin(time * 1.3 + 1.0) * 0.3 +
        Math.sin(time * 2.7 + 2.0) * 0.2 +
        Math.sin(time * 4.1 + 0.5) * 0.1
      ) * handheldIntensity * 0.015;

      const shakeZ = (
        Math.sin(time * 0.9 + 0.5) * 0.2 +
        Math.sin(time * 2.3 + 1.5) * 0.15
      ) * handheldIntensity * 0.01;

      const cx = Math.cos(shakeX), sx = Math.sin(shakeX);
      const cy = Math.cos(shakeY), sy = Math.sin(shakeY);
      const cz = Math.cos(shakeZ), sz = Math.sin(shakeZ);

      const shakeMat = new Float32Array([
        cy * cz, sx * sy * cz - cx * sz, cx * sy * cz + sx * sz, 0,
        cy * sz, sx * sy * sz + cx * cz, cx * sy * sz - sx * cz, 0,
        -sy, sx * cy, cx * cy, 0,
        0, 0, 0, 1,
      ]);
      view = mat4Multiply(shakeMat, view);
    }

    return view;
  }

  function getCameraEye(time: number): number[] {
    let azimuth = cameraAzimuth;
    if (autoSpin) {
      azimuth += time * spinSpeed;
    }
    const x = cameraDistance * Math.cos(cameraElevation) * Math.sin(azimuth);
    const y = cameraDistance * Math.sin(cameraElevation);
    const z = cameraDistance * Math.cos(cameraElevation) * Math.cos(azimuth);
    return [
      cameraTarget[0] + x,
      cameraTarget[1] + cameraHeight + y,
      cameraTarget[2] + z,
    ];
  }

  // Generate terrain mesh (aspect ratio matches heightmap)
  function generateTerrainMesh(gridSize: number, mountain: MountainConfig): { positions: Float32Array; uvs: Float32Array; indices: Uint32Array } {
    const aspectRatio = mountain.width / mountain.height;
    const vertexCount = (gridSize + 1) * (gridSize + 1);
    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);

    for (let z = 0; z <= gridSize; z++) {
      for (let x = 0; x <= gridSize; x++) {
        const idx = z * (gridSize + 1) + x;
        const u = x / gridSize;
        const v = z / gridSize;

        // Position on XZ plane, centered at origin, with correct aspect ratio
        positions[idx * 3 + 0] = (u - 0.5) * 2 * aspectRatio;
        positions[idx * 3 + 1] = 0; // Height set in shader
        positions[idx * 3 + 2] = (v - 0.5) * 2;

        uvs[idx * 2 + 0] = u;
        uvs[idx * 2 + 1] = v;
      }
    }

    // Generate indices for triangle list
    const faceCount = gridSize * gridSize * 2;
    const indices = new Uint32Array(faceCount * 3);
    let idx = 0;

    for (let z = 0; z < gridSize; z++) {
      for (let x = 0; x < gridSize; x++) {
        const topLeft = z * (gridSize + 1) + x;
        const topRight = topLeft + 1;
        const bottomLeft = (z + 1) * (gridSize + 1) + x;
        const bottomRight = bottomLeft + 1;

        // First triangle
        indices[idx++] = topLeft;
        indices[idx++] = bottomLeft;
        indices[idx++] = topRight;

        // Second triangle
        indices[idx++] = topRight;
        indices[idx++] = bottomLeft;
        indices[idx++] = bottomRight;
      }
    }

    return { positions, uvs, indices };
  }

  const assetBase = import.meta.env.BASE_URL || "/";
  const normalizedAssetBase = assetBase.endsWith("/")
    ? assetBase
    : `${assetBase}/`;

  function resolveAssetPath(url: string) {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith(normalizedAssetBase)) return url;
    if (url.startsWith("/")) return `${normalizedAssetBase}${url.slice(1)}`;
    return `${normalizedAssetBase}${url}`;
  }

  // Load heightmap from PNG file
  async function loadHeightmap(url: string): Promise<{ image: ImageBitmap; width: number; height: number }> {
    const response = await fetch(resolveAssetPath(url));
    const blob = await response.blob();
    const image = await createImageBitmap(blob);
    return { image, width: image.width, height: image.height };
  }

  function buildTerrainShader(mountain: MountainConfig) {
    const aspectRatio = mountain.width / mountain.height;
    return /* wgsl */ `
    struct Uniforms {
      modelViewProj: mat4x4f,  // 0-63
      modelView: mat4x4f,      // 64-127
      lightDir: vec3f,         // 128-139 (vec3f needs 16-byte alignment)
      time: f32,               // 140-143
      resolution: vec2f,       // 144-151 (vec2f needs 8-byte alignment)
      texelSize: vec2f,        // 152-159
      terrainScale: f32,       // 160-163
      heightExaggeration: f32, // 164-167
      trueHeightRatio: f32,    // 168-171
      snowLine: f32,           // 172-175
      treeLine: f32,           // 176-179
      wobbleStrength: f32,     // 180-183
      lightIntensity: f32,     // 184-187
      ambientIntensity: f32,   // 188-191
    }

    @group(0) @binding(0) var<uniform> u: Uniforms;
    @group(0) @binding(1) var heightSampler: sampler;
    @group(0) @binding(2) var heightTex: texture_2d<f32>;

    struct VertexInput {
      @location(0) position: vec3f,
      @location(1) uv: vec2f,
    }

    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) worldPos: vec3f,
      @location(1) uv: vec2f,
      @location(2) height: f32,
      @location(3) viewPos: vec3f,
    }

    // PS2 vertex grid snapping
    fn ps2VertexSnap(clipPos: vec4f, gridRes: f32) -> vec4f {
      var screenPos = clipPos.xy / clipPos.w;
      screenPos = floor(screenPos * gridRes + 0.5) / gridRes;
      return vec4f(screenPos * clipPos.w, clipPos.z, clipPos.w);
    }

    @vertex
    fn vs_main(in: VertexInput) -> VertexOutput {
      var out: VertexOutput;

      // Sample heightmap
      let height = textureSampleLevel(heightTex, heightSampler, in.uv, 0.0).r;

      // Displace Y based on height using true scale system:
      // trueHeightRatio = actual elevation range / geographic extent (true proportions)
      // heightExaggeration = multiplier on true proportions (1.0 = real scale, 2.5 = artistic default)
      var worldPos = in.position * u.terrainScale;
      worldPos.y = height * u.trueHeightRatio * u.heightExaggeration * u.terrainScale;

      var clipPos = u.modelViewProj * vec4f(worldPos, 1.0);

      // PS2 vertex wobble
      if (u.wobbleStrength > 0.001) {
        let gridRes = mix(320.0, 64.0, u.wobbleStrength);
        clipPos = ps2VertexSnap(clipPos, gridRes);
      }

      out.position = clipPos;
      out.worldPos = worldPos;
      out.uv = in.uv;
      out.height = height;
      out.viewPos = (u.modelView * vec4f(worldPos, 1.0)).xyz;

      return out;
    }

    // Baked parameters
    const COLOR_STEPS: f32 = ${colorSteps};
    const DITHER_STRENGTH: f32 = ${ditherStrength};
    const FOG_DENSITY: f32 = ${fogDensity};
    const FOG_COLOR: vec3f = vec3f(${fogColor[0]}, ${fogColor[1]}, ${fogColor[2]});
    const AMBIENT_COLOR: vec3f = vec3f(${ambientColor[0]}, ${ambientColor[1]}, ${ambientColor[2]});
    const LIGHT_COLOR: vec3f = vec3f(${lightColor[0]}, ${lightColor[1]}, ${lightColor[2]});

    // Terrain colors
    const SNOW_COLOR: vec3f = vec3f(${snowColor[0]}, ${snowColor[1]}, ${snowColor[2]});
    const ROCK_COLOR: vec3f = vec3f(${rockColor[0]}, ${rockColor[1]}, ${rockColor[2]});
    const FOREST_COLOR: vec3f = vec3f(${forestColor[0]}, ${forestColor[1]}, ${forestColor[2]});
    const MEADOW_COLOR: vec3f = vec3f(${meadowColor[0]}, ${meadowColor[1]}, ${meadowColor[2]});

    // Aspect ratio for correct normal calculation
    const ASPECT_RATIO: f32 = ${aspectRatio};

    fn saturate(x: f32) -> f32 { return clamp(x, 0.0, 1.0); }

    // Bayer 4x4 ordered dithering matrix
    fn bayer4x4(p: vec2u) -> f32 {
      let m = array<f32, 16>(
         0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
        12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
         3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
        15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
      );
      let idx = (p.y % 4u) * 4u + (p.x % 4u);
      return m[idx];
    }

    fn quantizeDither(col: vec3f, pixelCoord: vec2u) -> vec3f {
      if (COLOR_STEPS < 2.0) { return col; }
      let bayerVal = bayer4x4(pixelCoord) - 0.5;
      let ditherOffset = bayerVal * DITHER_STRENGTH / COLOR_STEPS;
      let dithered = col + vec3f(ditherOffset);
      return floor(dithered * COLOR_STEPS + 0.5) / COLOR_STEPS;
    }

    // Compute normal from heightmap with correct world-space scaling
    fn computeNormal(uv: vec2f) -> vec3f {
      let hL = textureSampleLevel(heightTex, heightSampler, uv - vec2f(u.texelSize.x, 0.0), 0.0).r;
      let hR = textureSampleLevel(heightTex, heightSampler, uv + vec2f(u.texelSize.x, 0.0), 0.0).r;
      let hD = textureSampleLevel(heightTex, heightSampler, uv - vec2f(0.0, u.texelSize.y), 0.0).r;
      let hU = textureSampleLevel(heightTex, heightSampler, uv + vec2f(0.0, u.texelSize.y), 0.0).r;

      // World-space deltas: X spans 2*aspectRatio*terrainScale, Z spans 2*terrainScale
      // Each texel in X covers: (2 * aspectRatio * terrainScale) / width = 2 * aspectRatio * terrainScale * texelSize.x
      // Each texel in Z covers: (2 * terrainScale) / height = 2 * terrainScale * texelSize.y
      let worldDeltaX = 2.0 * ASPECT_RATIO * u.terrainScale * u.texelSize.x;
      let worldDeltaZ = 2.0 * u.terrainScale * u.texelSize.y;

      // Height difference scaled by true height ratio and exaggeration
      // Note: terrainScale cancels out (affects both height and XZ equally)
      let dhdx = (hR - hL) * u.trueHeightRatio * u.heightExaggeration / (2.0 * worldDeltaX);
      let dhdz = (hU - hD) * u.trueHeightRatio * u.heightExaggeration / (2.0 * worldDeltaZ);

      // Normal from gradient: n = normalize(-dh/dx, 1, -dh/dz)
      return normalize(vec3f(-dhdx, 1.0, -dhdz));
    }

    @fragment
    fn fs_main(in: VertexOutput) -> @location(0) vec4f {
      // Compute normal from heightmap
      let n = computeNormal(in.uv);

      // PS2-style lighting: ambient-dominant with color-tinted shadows
      let lightDir = normalize(u.lightDir);
      let ndotl = max(dot(n, lightDir), 0.0);

      // Soft wrap lighting (less harsh shadow falloff)
      let wrapLight = ndotl * 0.7 + 0.3;

      // Height-based coloring
      var baseColor: vec3f;
      let h = in.height;

      // Steepness affects vegetation (1 = vertical cliff, 0 = flat)
      let steepness = 1.0 - n.y;

      if (h > u.snowLine) {
        // Snow with some rock showing through on steep areas
        let snowMix = smoothstep(u.snowLine, u.snowLine + 0.1, h);
        baseColor = mix(ROCK_COLOR, SNOW_COLOR, snowMix * (1.0 - steepness * 0.7));
      } else if (h > u.treeLine) {
        // Rocky/alpine zone
        let rockMix = smoothstep(u.treeLine, u.snowLine, h);
        let alpine = mix(FOREST_COLOR, ROCK_COLOR, rockMix);
        baseColor = mix(alpine, ROCK_COLOR, steepness * 0.8);
      } else {
        // Forest and meadow
        let forestMix = smoothstep(0.1, u.treeLine, h);
        baseColor = mix(MEADOW_COLOR, FOREST_COLOR, forestMix);
        baseColor = mix(baseColor, ROCK_COLOR, steepness * 0.5);
      }

      // PS2-style lighting: ambient is primary driver, diffuse adds warmth
      // Shadow color: blend toward ambient/sky color in shadows
      let shadowTint = mix(AMBIENT_COLOR, vec3f(1.0), 0.4);

      // Ambient is the primary light source (PS2 style)
      let ambient = AMBIENT_COLOR * u.ambientIntensity;

      // Diffuse: warm, muted, never approaches white
      let diffuse = LIGHT_COLOR * wrapLight * u.lightIntensity;

      // Combine with shadow tinting in dark areas
      let shadowBlend = smoothstep(0.0, 0.5, ndotl);
      let tintedAmbient = mix(ambient * shadowTint, ambient, shadowBlend);

      var col = baseColor * (tintedAmbient + diffuse);

      // Clamp highlights to prevent pure white (PS2 style)
      col = min(col, vec3f(0.95));

      // Distance fog
      let dist = length(in.viewPos);
      let fog = 1.0 - exp(-dist * FOG_DENSITY);
      col = mix(col, FOG_COLOR, fog);

      // Tone mapping
      col = col / (col + 0.5);
      col = pow(col, vec3f(0.95));

      // PS2 dithering
      let pixelCoord = vec2u(floor(in.position.xy));
      col = quantizeDither(col, pixelCoord);

      return vec4f(col, 1.0);
    }
    `;
  }

  function buildBackgroundShader() {
    return /* wgsl */ `
    struct Uniforms {
      invViewProj: mat4x4f,
      cameraPos: vec3f,
      time: f32,
      resolution: vec2f,
      _pad: vec2f,
    }

    @group(0) @binding(0) var<uniform> u: Uniforms;

    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) uv: vec2f,
    }

    @vertex
    fn vs_main(@builtin(vertex_index) vi: u32) -> VertexOutput {
      var pos = array<vec2f, 4>(
        vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1), vec2f(1, 1)
      );
      var out: VertexOutput;
      out.position = vec4f(pos[vi], 0.9999, 1);
      out.uv = pos[vi];
      return out;
    }

    const PI: f32 = 3.14159265359;

    // Baked parameters
    const SUN_HEIGHT: f32 = ${sunHeight};
    const SKY_TOP: vec3f = vec3f(${skyTop[0]}, ${skyTop[1]}, ${skyTop[2]});
    const SKY_HORIZON: vec3f = vec3f(${skyHorizon[0]}, ${skyHorizon[1]}, ${skyHorizon[2]});
    const HORIZON_GLOW: f32 = ${horizonGlow};
    const GLOW_COLOR: vec3f = vec3f(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]});
    const FOG_COLOR: vec3f = vec3f(${fogColor[0]}, ${fogColor[1]}, ${fogColor[2]});

    // Cloud parameters
    const CLOUD_COVERAGE: f32 = ${cloudCoverage};
    const CLOUD_SHARPNESS: f32 = ${cloudSharpness};
    const CLOUD_SPEED: f32 = ${cloudSpeed};
    const CLOUD_SCALE: f32 = ${cloudScale};
    const CLOUD_BRIGHTNESS: f32 = ${cloudBrightness};
    const CLOUD_CONTRAST: f32 = ${cloudContrast};

    // PS2 dither
    const COLOR_STEPS: f32 = ${colorSteps};
    const DITHER_STRENGTH: f32 = ${ditherStrength};

    fn saturate(x: f32) -> f32 { return clamp(x, 0.0, 1.0); }

    fn hash12(p: vec2f) -> f32 {
      return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453);
    }

    fn noise2d(p: vec2f) -> f32 {
      let i = floor(p);
      let f = fract(p);
      let u = f * f * (3.0 - 2.0 * f);
      let a = hash12(i);
      let b = hash12(i + vec2f(1.0, 0.0));
      let c = hash12(i + vec2f(0.0, 1.0));
      let d = hash12(i + vec2f(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    fn cloudFbm(p: vec2f, time: f32) -> f32 {
      var f = 0.0;
      var scale = CLOUD_SCALE;
      var amp = 0.5;
      let t = time * CLOUD_SPEED;
      f += amp * noise2d(p * scale + vec2f(t * 0.5, t * 0.3));
      scale *= 2.0; amp *= 0.5;
      f += amp * noise2d(p * scale + vec2f(-t * 0.4, t * 0.7));
      scale *= 2.0; amp *= 0.5;
      f += amp * noise2d(p * scale + vec2f(t * 0.8, -t * 0.5));
      scale *= 2.0; amp *= 0.5;
      f += amp * noise2d(p * scale + vec2f(-t * 0.6, -t * 0.9));
      return f;
    }

    fn cloudDensity(p: vec2f, time: f32) -> f32 {
      let fbm = cloudFbm(p, time);
      let threshold = 1.0 - CLOUD_COVERAGE;
      return saturate((fbm - threshold) * CLOUD_SHARPNESS);
    }

    fn cloudShading(p: vec2f, time: f32, sunDir: vec3f) -> f32 {
      let sunOffset = normalize(sunDir.xz) * 0.15;
      var shadow = 0.0;
      var sampleP = p;
      for (var i = 0; i < 4; i++) {
        sampleP += sunOffset;
        shadow += cloudDensity(sampleP, time) * 0.25;
      }
      return 1.0 - saturate(shadow * 0.8);
    }

    fn sky(rd: vec3f, time: f32) -> vec3f {
      let t = max(rd.y, 0.0);
      var col = mix(SKY_HORIZON, SKY_TOP, sqrt(t));

      let sunDir = normalize(vec3f(0.5, SUN_HEIGHT, 1.0));
      let sunDot = max(dot(rd, sunDir), 0.0);
      col += vec3f(1.0, 0.95, 0.8) * pow(sunDot, 64.0) * 1.2;
      col += vec3f(1.0, 0.9, 0.7) * pow(sunDot, 8.0) * 0.3;

      if (rd.y > 0.01 && CLOUD_COVERAGE > 0.01) {
        let cloudP = rd.xz / (rd.y + 0.1) * 2.0;
        let density = cloudDensity(cloudP, time);
        if (density > 0.001) {
          let shade = cloudShading(cloudP, time, sunDir);
          // Use brightness and contrast for cloud coloring
          // Lower brightness = darker clouds (helps snow stand out)
          let baseGray = CLOUD_BRIGHTNESS;
          let shadowGray = baseGray * (1.0 - CLOUD_CONTRAST);
          let cloudCol = vec3f(mix(shadowGray, baseGray, shade));
          let horizonFade = smoothstep(0.0, 0.15, rd.y);
          col = mix(col, cloudCol, density * horizonFade);
        }
      }

      return col;
    }

    fn bayer4x4(p: vec2u) -> f32 {
      let m = array<f32, 16>(
         0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
        12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
         3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
        15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
      );
      let idx = (p.y % 4u) * 4u + (p.x % 4u);
      return m[idx];
    }

    fn quantizeDither(col: vec3f, pixelCoord: vec2u) -> vec3f {
      if (COLOR_STEPS < 2.0) { return col; }
      let bayerVal = bayer4x4(pixelCoord) - 0.5;
      let ditherOffset = bayerVal * DITHER_STRENGTH / COLOR_STEPS;
      let dithered = col + vec3f(ditherOffset);
      return floor(dithered * COLOR_STEPS + 0.5) / COLOR_STEPS;
    }

    @fragment
    fn fs_main(in: VertexOutput) -> @location(0) vec4f {
      let clipPos = vec4f(in.uv, 1.0, 1.0);
      let worldPos4 = u.invViewProj * clipPos;
      let worldPos = worldPos4.xyz / worldPos4.w;
      let rd = normalize(worldPos - u.cameraPos);

      var col = sky(rd, u.time);

      // Horizon glow
      if (HORIZON_GLOW > 0.001) {
        let horizonDist = abs(rd.y);
        let horizonMask = exp(-horizonDist * 8.0);
        col += GLOW_COLOR * horizonMask * HORIZON_GLOW * 0.5;
      }

      // Tone mapping
      col = col / (col + 0.5);
      col = pow(col, vec3f(0.95));

      // PS2 dithering
      let pixelCoord = vec2u(floor(in.position.xy));
      col = quantizeDither(col, pixelCoord);

      return vec4f(col, 1.0);
    }
    `;
  }

  function buildUpscaleShader() {
    return /* wgsl */ `
    struct Uniforms {
      time: f32,
      _pad: f32,
      resolution: vec2f,
    }

    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) uv: vec2f,
    }

    @group(0) @binding(0) var texSampler: sampler;
    @group(0) @binding(1) var tex: texture_2d<f32>;
    @group(0) @binding(2) var<uniform> u: Uniforms;

    const CHROMA_STRENGTH: f32 = ${chromaStrength};
    const CHROMA_RADIAL: f32 = ${chromaRadial};
    const VIGNETTE: f32 = ${vignette};
    const BLOOM_THRESHOLD: f32 = ${bloomThreshold};
    const BLOOM_INTENSITY: f32 = ${bloomIntensity};
    const FILM_GRAIN: f32 = ${filmGrain};
    const SATURATION: f32 = ${saturation};
    const SCANLINE_INTENSITY: f32 = ${scanlineIntensity};
    const SCANLINE_COUNT: f32 = ${scanlineCount};
    const SCANLINE_SPEED: f32 = ${scanlineSpeed};

    @vertex
    fn vs_main(@builtin(vertex_index) vi: u32) -> VertexOutput {
      var pos = array<vec2f, 4>(
        vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1), vec2f(1, 1)
      );
      var out: VertexOutput;
      out.position = vec4f(pos[vi], 0, 1);
      out.uv = pos[vi] * 0.5 + 0.5;
      out.uv.y = 1.0 - out.uv.y;
      return out;
    }

    fn hash12(p: vec2f) -> f32 {
      var p3 = fract(vec3f(p.x, p.y, p.x) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    @fragment
    fn fs_main(in: VertexOutput) -> @location(0) vec4f {
      let center = vec2f(0.5, 0.5);
      let toCenter = in.uv - center;
      let dist = length(toCenter);

      // Chromatic aberration
      var col: vec3f;
      if (CHROMA_STRENGTH < 0.001) {
        col = textureSample(tex, texSampler, in.uv).rgb;
      } else {
        let edgeFactor = dist * dist * 4.0;
        let radialFactor = mix(1.0, edgeFactor, CHROMA_RADIAL);
        let offset = toCenter * CHROMA_STRENGTH * 0.03 * radialFactor;

        let r = textureSample(tex, texSampler, in.uv + offset).r;
        let g = textureSample(tex, texSampler, in.uv).g;
        let b = textureSample(tex, texSampler, in.uv - offset).b;
        col = vec3f(r, g, b);
      }

      // Simple bloom
      if (BLOOM_INTENSITY > 0.001) {
        let luma = dot(col, vec3f(0.299, 0.587, 0.114));
        let bloom = max(luma - BLOOM_THRESHOLD, 0.0) * BLOOM_INTENSITY;
        col += bloom;
      }

      // Saturation adjustment (PS2 style: slightly washed out)
      if (abs(SATURATION - 1.0) > 0.001) {
        let gray = dot(col, vec3f(0.299, 0.587, 0.114));
        col = mix(vec3f(gray), col, SATURATION);
      }

      // Film grain - pixel-aligned noise for that analog look
      if (FILM_GRAIN > 0.001) {
        let grainCoord = floor(in.uv * u.resolution);
        let grain = hash12(grainCoord + vec2f(u.time * 100.0, 0.0)) - 0.5;
        // Boost grain in darker areas (more visible on shadows)
        let lum = dot(col, vec3f(0.2126, 0.7152, 0.0722));
        let darkBoost = mix(1.5, 0.5, clamp(lum, 0.0, 1.0));
        col += grain * FILM_GRAIN * darkBoost;
      }

      // Vignette
      if (VIGNETTE > 0.001) {
        let vigDist = length(in.uv * 2.0 - 1.0);
        let vig = 1.0 - vigDist * vigDist * VIGNETTE;
        col *= clamp(vig, 0.0, 1.0);
      }

      // CRT Scanlines
      if (SCANLINE_INTENSITY > 0.001) {
        // Scrolling scanlines for that retro CRT feel
        let scanY = in.uv.y * SCANLINE_COUNT + u.time * SCANLINE_SPEED * 20.0;
        let scan1 = smoothstep(0.3, 0.5, fract(scanY));
        let scan2 = smoothstep(0.5, 0.7, fract(scanY));
        let scanMask = mix(1.0, 0.7 + 0.3 * (scan1 * scan2), SCANLINE_INTENSITY);

        // Subtle horizontal interference bands
        let band = sin(in.uv.y * 400.0 + u.time * 3.0) * 0.5 + 0.5;
        let bandMask = mix(1.0, 0.95 + 0.05 * band, SCANLINE_INTENSITY * 0.3);

        col *= scanMask * bandMask;
      }

      return vec4f(col, 1.0);
    }
    `;
  }

  // WebGPU resources
  let terrainPipeline: GPURenderPipeline;
  let upscalePipeline: GPURenderPipeline;
  let backgroundPipeline: GPURenderPipeline;
  let uniformBuffer: GPUBuffer;
  let backgroundUniformBuffer: GPUBuffer;
  let upscaleUniformBuffer: GPUBuffer;
  let terrainBindGroup: GPUBindGroup;
  let upscaleBindGroup: GPUBindGroup;
  let backgroundBindGroup: GPUBindGroup;
  let positionBuffer: GPUBuffer;
  let uvBuffer: GPUBuffer;
  let indexBuffer: GPUBuffer;
  let indexCount = 0;

  let offscreenTexture: GPUTexture | null = null;
  let offscreenView: GPUTextureView | null = null;
  let depthTexture: GPUTexture | null = null;
  let depthView: GPUTextureView | null = null;
  let nearestSampler: GPUSampler;
  let heightTexture: GPUTexture | null = null;
  let heightSampler: GPUSampler;
  let currentOffscreenWidth = 0;
  let currentOffscreenHeight = 0;

  async function init() {
    try {
      ctx = await initWebGPU(canvas, { requestTimestamp: true });
      perf = new PerfMonitor(ctx.device, ctx.canTimestamp);

      // Generate terrain mesh
      const mesh = generateTerrainMesh(GRID_SIZE, selectedMountain);
      indexCount = mesh.indices.length;

      // Create vertex buffers
      positionBuffer = ctx.device.createBuffer({
        size: mesh.positions.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      ctx.device.queue.writeBuffer(positionBuffer, 0, mesh.positions.buffer, mesh.positions.byteOffset, mesh.positions.byteLength);

      uvBuffer = ctx.device.createBuffer({
        size: mesh.uvs.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      ctx.device.queue.writeBuffer(uvBuffer, 0, mesh.uvs.buffer, mesh.uvs.byteOffset, mesh.uvs.byteLength);

      indexBuffer = ctx.device.createBuffer({
        size: mesh.indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });
      ctx.device.queue.writeBuffer(indexBuffer, 0, mesh.indices.buffer, mesh.indices.byteOffset, mesh.indices.byteLength);

      // Load heightmap from USGS 3DEP data
      const heightmapData = await loadHeightmap(selectedMountain.heightmap);

      heightTexture = ctx.device.createTexture({
        size: [heightmapData.width, heightmapData.height],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      });
      ctx.device.queue.copyExternalImageToTexture(
        { source: heightmapData.image },
        { texture: heightTexture },
        [heightmapData.width, heightmapData.height]
      );

      heightSampler = ctx.device.createSampler({
        magFilter: "linear",
        minFilter: "linear",
      });

      // Uniform buffers
      // Terrain: 2 mat4 (128) + vec2 (8) + f32*6 (24) + vec2 (8) + f32*2 (8) + vec3f (12) + f32 (4) = 192 bytes
      uniformBuffer = ctx.device.createBuffer({
        size: 192,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      // Background: mat4 (64) + vec3 (12) + f32 (4) + vec2 (8) + vec2 pad (8) = 96 bytes
      backgroundUniformBuffer = ctx.device.createBuffer({
        size: 96,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      // Upscale: time (4) + pad (4) + resolution (8) = 16 bytes
      upscaleUniformBuffer = ctx.device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      nearestSampler = ctx.device.createSampler({
        magFilter: "nearest",
        minFilter: "nearest",
      });

      rebuildPipelines();
      loading = false;

      const startTime = performance.now();

      function render() {
        if (!ctx) return;
        perf?.beginFrame();

        // Update camera animation if active
        updateCameraAnimation(performance.now());

        // Apply drag inertia
        applyInertia();

        const time = (performance.now() - startTime) / 1000;
        const dpr = window.devicePixelRatio || 1;
        const width = Math.floor(canvas.clientWidth * dpr);
        const height = Math.floor(canvas.clientHeight * dpr);

        if (width < 1 || height < 1) {
          animationId = requestAnimationFrame(render);
          return;
        }

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        const renderWidth = Math.max(1, Math.floor(width * renderScale));
        const renderHeight = Math.max(1, Math.floor(height * renderScale));

        // Resize offscreen textures
        if (renderWidth !== currentOffscreenWidth || renderHeight !== currentOffscreenHeight) {
          offscreenTexture?.destroy();
          depthTexture?.destroy();

          offscreenTexture = ctx.device.createTexture({
            size: [renderWidth, renderHeight],
            format: ctx.format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
          });
          offscreenView = offscreenTexture.createView();

          depthTexture = ctx.device.createTexture({
            size: [renderWidth, renderHeight],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
          });
          depthView = depthTexture.createView();

          currentOffscreenWidth = renderWidth;
          currentOffscreenHeight = renderHeight;

          upscaleBindGroup = ctx.device.createBindGroup({
            layout: upscalePipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: nearestSampler },
              { binding: 1, resource: offscreenView },
              { binding: 2, resource: { buffer: upscaleUniformBuffer } },
            ],
          });
        }

        // Update uniforms
        const aspect = renderWidth / renderHeight;
        const fovRad = cameraFov * Math.PI / 180;
        const projection = mat4Perspective(fovRad, aspect, 0.01, 100);
        const view = computeViewMatrix(time);
        const mvp = mat4Multiply(projection, view);
        const cameraEye = getCameraEye(time);

        // Compute light direction from azimuth and sun height
        const lightAngle = lightAzimuth * Math.PI;
        const lightX = Math.sin(lightAngle);
        const lightY = sunHeight + 0.5; // Tie to sun height
        const lightZ = Math.cos(lightAngle);

        const uniformData = new Float32Array(48);
        uniformData.set(mvp, 0);                           // modelViewProj: 0-15
        uniformData.set(view, 16);                         // modelView: 16-31
        uniformData[32] = lightX;                          // lightDir.x
        uniformData[33] = lightY;                          // lightDir.y
        uniformData[34] = lightZ;                          // lightDir.z
        uniformData[35] = time;                            // time
        uniformData[36] = renderWidth;                     // resolution.x
        uniformData[37] = renderHeight;                    // resolution.y
        uniformData[38] = 1.0 / selectedMountain.width;    // texelSize.x
        uniformData[39] = 1.0 / selectedMountain.height;   // texelSize.y
        uniformData[40] = terrainScale;                    // terrainScale
        uniformData[41] = heightExaggeration;              // heightExaggeration
        uniformData[42] = trueHeightRatio;                 // trueHeightRatio
        uniformData[43] = snowLine;                        // snowLine
        uniformData[44] = treeLine;                        // treeLine
        uniformData[45] = wobbleStrength;                  // wobbleStrength
        uniformData[46] = lightIntensity;                  // lightIntensity
        uniformData[47] = ambientIntensity;                // ambientIntensity

        ctx.device.queue.writeBuffer(uniformBuffer, 0, uniformData);

        // Background uniforms
        const viewProj = mat4Multiply(projection, view);
        const invViewProj = mat4Invert(viewProj);
        const bgUniformData = new Float32Array(24);
        bgUniformData.set(invViewProj, 0);
        bgUniformData[16] = cameraEye[0];
        bgUniformData[17] = cameraEye[1];
        bgUniformData[18] = cameraEye[2];
        bgUniformData[19] = time;
        bgUniformData[20] = renderWidth;
        bgUniformData[21] = renderHeight;

        ctx.device.queue.writeBuffer(backgroundUniformBuffer, 0, bgUniformData);

        // Upscale uniforms
        const upscaleUniformData = new Float32Array(4);
        upscaleUniformData[0] = time;
        upscaleUniformData[1] = 0;
        upscaleUniformData[2] = width;
        upscaleUniformData[3] = height;
        ctx.device.queue.writeBuffer(upscaleUniformBuffer, 0, upscaleUniformData);

        const encoder = ctx.device.createCommandEncoder();

        // Pass 1: Background
        const bgPass = encoder.beginRenderPass({
          colorAttachments: [{
            view: offscreenView!,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: "clear",
            storeOp: "store",
          }],
          depthStencilAttachment: {
            view: depthView!,
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",
          },
        });

        bgPass.setPipeline(backgroundPipeline);
        bgPass.setBindGroup(0, backgroundBindGroup);
        bgPass.draw(4);
        bgPass.end();

        // Pass 2: Terrain
        const terrainPass = encoder.beginRenderPass({
          colorAttachments: [{
            view: offscreenView!,
            loadOp: "load",
            storeOp: "store",
          }],
          depthStencilAttachment: {
            view: depthView!,
            depthLoadOp: "load",
            depthStoreOp: "store",
          },
        });

        terrainPass.setPipeline(terrainPipeline);
        terrainPass.setBindGroup(0, terrainBindGroup);
        terrainPass.setVertexBuffer(0, positionBuffer);
        terrainPass.setVertexBuffer(1, uvBuffer);
        terrainPass.setIndexBuffer(indexBuffer, "uint32");
        terrainPass.drawIndexed(indexCount);
        terrainPass.end();

        // Pass 3: Upscale
        const upscalePass = encoder.beginRenderPass({
          colorAttachments: [{
            view: ctx.context.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: "clear",
            storeOp: "store",
          }],
          timestampWrites: perf?.getTimestampWrites(),
        });

        upscalePass.setPipeline(upscalePipeline);
        upscalePass.setBindGroup(0, upscaleBindGroup);
        upscalePass.draw(4);
        upscalePass.end();

        perf?.endFrame(encoder);
        ctx.device.queue.submit([encoder.finish()]);
        perf?.readGpuTime();

        animationId = requestAnimationFrame(render);
      }

      render();
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    }
    loading = false;
  }

  function switchMountainById(id: string) {
    const mountain = mountains.find(m => m.id === id);
    if (mountain) {
      switchMountain(mountain);
    }
  }

  function toggleMountainDrawer() {
    if (!isDesktop && !showMountainDrawer) {
      showControlsDrawer = false;
    }
    showMountainDrawer = !showMountainDrawer;
  }

  function toggleControlsDrawer() {
    if (!isDesktop && !showControlsDrawer) {
      showMountainDrawer = false;
    }
    showControlsDrawer = !showControlsDrawer;
  }

  function rebuildPipelines() {
    if (!ctx) return;
    const { device, format } = ctx;

    // Terrain pipeline
    const terrainModule = device.createShaderModule({ code: buildTerrainShader(selectedMountain) });
    terrainPipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: terrainModule,
        entryPoint: "vs_main",
        buffers: [
          {
            arrayStride: 12,
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }],
          },
          {
            arrayStride: 8,
            attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }],
          },
        ],
      },
      fragment: {
        module: terrainModule,
        entryPoint: "fs_main",
        targets: [{ format }],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "back",
      },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    });

    terrainBindGroup = device.createBindGroup({
      layout: terrainPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: heightSampler },
        { binding: 2, resource: heightTexture!.createView() },
      ],
    });

    // Upscale pipeline
    const upscaleModule = device.createShaderModule({ code: buildUpscaleShader() });
    upscalePipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module: upscaleModule, entryPoint: "vs_main" },
      fragment: {
        module: upscaleModule,
        entryPoint: "fs_main",
        targets: [{ format }],
      },
      primitive: { topology: "triangle-strip" },
    });

    // Background pipeline
    const bgModule = device.createShaderModule({ code: buildBackgroundShader() });
    backgroundPipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module: bgModule, entryPoint: "vs_main" },
      fragment: {
        module: bgModule,
        entryPoint: "fs_main",
        targets: [{ format }],
      },
      primitive: { topology: "triangle-strip" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less-equal",
      },
    });

    backgroundBindGroup = device.createBindGroup({
      layout: backgroundPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: backgroundUniformBuffer } },
      ],
    });

    // Recreate upscale bind group if needed
    if (offscreenView && nearestSampler) {
      upscaleBindGroup = device.createBindGroup({
        layout: upscalePipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: nearestSampler },
          { binding: 1, resource: offscreenView },
          { binding: 2, resource: { buffer: upscaleUniformBuffer } },
        ],
      });
    }
  }

  function onParamChange() {
    rebuildPipelines();
  }

  async function switchMountain(mountain: MountainConfig) {
    if (!ctx || mountain.id === selectedMountain.id) return;

    loading = true;
    selectedMountain = mountain;

    if (!isDesktop) {
      showMountainDrawer = false;
    }

    // Sync snow/tree lines to mountain defaults
    snowLine = mountain.snowLine;
    treeLine = mountain.treeLine;

    try {
      // Regenerate terrain mesh with new aspect ratio
      const mesh = generateTerrainMesh(GRID_SIZE, selectedMountain);
      indexCount = mesh.indices.length;

      ctx.device.queue.writeBuffer(positionBuffer, 0, mesh.positions.buffer, mesh.positions.byteOffset, mesh.positions.byteLength);
      ctx.device.queue.writeBuffer(uvBuffer, 0, mesh.uvs.buffer, mesh.uvs.byteOffset, mesh.uvs.byteLength);
      ctx.device.queue.writeBuffer(indexBuffer, 0, mesh.indices.buffer, mesh.indices.byteOffset, mesh.indices.byteLength);

      // Load new heightmap
      const heightmapData = await loadHeightmap(selectedMountain.heightmap);

      heightTexture?.destroy();
      heightTexture = ctx.device.createTexture({
        size: [heightmapData.width, heightmapData.height],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      });
      ctx.device.queue.copyExternalImageToTexture(
        { source: heightmapData.image },
        { texture: heightTexture },
        [heightmapData.width, heightmapData.height]
      );

      // Rebuild pipelines with new texture
      rebuildPipelines();
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to switch mountain";
    }

    loading = false;
  }

  function onMouseDown(e: MouseEvent) {
    isDragging = true;
    isPanning = e.shiftKey;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    autoSpin = false;
    // Reset velocity on new drag
    velocityX = 0;
    velocityY = 0;
  }

  function panCamera(dx: number, dy: number) {
    const sinA = Math.sin(cameraAzimuth);
    const cosA = Math.cos(cameraAzimuth);
    const forward = [-sinA, 0, -cosA];
    const right = [cosA, 0, -sinA];
    const panScale = cameraDistance * 0.002;

    cameraTarget[0] -= (right[0] * dx + forward[0] * dy) * panScale;
    cameraTarget[2] -= (right[2] * dx + forward[2] * dy) * panScale;
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging) return;

    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    isPanning = e.shiftKey;
    if (isPanning) {
      panCamera(dx, dy);
      clampCamera();
      // No inertia for panning
      velocityX = 0;
      velocityY = 0;
      return;
    }

    // Track velocity for inertia
    velocityX = dx * 0.01;
    velocityY = dy * 0.01;

    cameraAzimuth -= velocityX;
    cameraElevation += velocityY;
    clampCamera();
  }

  function onMouseUp() {
    isDragging = false;
    isPanning = false;
    // Velocity is preserved for inertia (applied in render loop)
  }

  function applyInertia() {
    // Don't apply inertia while actively dragging (mouse or touch)
    if (isDragging || isTouchDragging || (Math.abs(velocityX) < INERTIA_THRESHOLD && Math.abs(velocityY) < INERTIA_THRESHOLD)) {
      return;
    }

    cameraAzimuth -= velocityX;
    cameraElevation += velocityY;
    clampCamera();

    velocityX *= INERTIA_DECAY;
    velocityY *= INERTIA_DECAY;
  }

  // Clamp helper
  function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  // Compute terrain-aware camera constraints
  function getMinCameraDistance(): number {
    // Minimum distance based on terrain height to prevent camera from entering mesh
    const effectiveHeight = getEffectiveTerrainHeight();
    return Math.max(0.3, effectiveHeight * 0.5 + 0.2);
  }

  function clampCamera() {
    const minDist = getMinCameraDistance();
    cameraDistance = clamp(cameraDistance, minDist, 15);

    // Keep elevation above terrain surface (dynamic minimum based on distance)
    const minElev = Math.max(0.02, 0.1 / cameraDistance);
    const maxElev = Math.PI / 2 - 0.1; // ~80 degrees
    cameraElevation = clamp(cameraElevation, minElev, maxElev);

    // Constrain pan target to stay within terrain bounds
    const maxPan = terrainScale * 1.5;
    cameraTarget[0] = clamp(cameraTarget[0], -maxPan, maxPan);
    cameraTarget[2] = clamp(cameraTarget[2], -maxPan, maxPan);
  }

  function onWheel(e: WheelEvent) {
    // Scale zoom speed relative to camera distance (slower when close)
    const zoomSpeed = 0.001 * Math.max(0.5, cameraDistance / 2);
    cameraDistance *= 1 + e.deltaY * zoomSpeed;
    clampCamera();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOUCH CONTROLS FOR MOBILE
  // ═══════════════════════════════════════════════════════════════════════════

  function getTouchCenter(touches: TouchList): { x: number; y: number } {
    let x = 0, y = 0;
    for (let i = 0; i < touches.length; i++) {
      x += touches[i].clientX;
      y += touches[i].clientY;
    }
    return { x: x / touches.length, y: y / touches.length };
  }

  function getPinchDistance(touches: TouchList): number {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function showTouchHintBriefly() {
    if (!isDesktop && !showMobileTouchHint) {
      showMobileTouchHint = true;
      if (mobileTouchHintTimer) clearTimeout(mobileTouchHintTimer);
      mobileTouchHintTimer = setTimeout(() => {
        showMobileTouchHint = false;
      }, 2500);
    }
  }

  function onTouchStart(e: TouchEvent) {
    // Don't interfere with UI elements
    const target = e.target as HTMLElement;
    if (!target?.closest(".canvas-frame")) return;

    // Show touch hint briefly on first touch
    showTouchHintBriefly();

    activeTouches = e.touches.length;

    if (activeTouches === 1) {
      // Single finger - orbit
      isTouchDragging = true;
      isTouchPanning = false;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      autoSpin = false;
      velocityX = 0;
      velocityY = 0;
    } else if (activeTouches === 2) {
      // Two fingers - pinch zoom + pan
      isTouchDragging = false;
      isTouchPanning = true;
      const center = getTouchCenter(e.touches);
      lastTouchX = center.x;
      lastTouchY = center.y;
      lastPinchDistance = getPinchDistance(e.touches);
      autoSpin = false;
      velocityX = 0;
      velocityY = 0;
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (!isTouchDragging && !isTouchPanning) return;

    // Prevent scrolling when interacting with canvas
    e.preventDefault();

    if (isTouchDragging && e.touches.length === 1) {
      // Single finger orbit
      const touch = e.touches[0];
      const dx = touch.clientX - lastTouchX;
      const dy = touch.clientY - lastTouchY;
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;

      // Track velocity for inertia
      velocityX = dx * 0.008;
      velocityY = dy * 0.008;

      cameraAzimuth -= velocityX;
      cameraElevation += velocityY;
      clampCamera();
    } else if (isTouchPanning && e.touches.length >= 2) {
      // Two finger pinch-zoom and pan
      const center = getTouchCenter(e.touches);
      const pinchDistance = getPinchDistance(e.touches);

      // Pan with two-finger drag
      const dx = center.x - lastTouchX;
      const dy = center.y - lastTouchY;
      panCamera(dx * 0.8, dy * 0.8);

      // Pinch zoom
      if (lastPinchDistance > 0) {
        const pinchDelta = pinchDistance - lastPinchDistance;
        const zoomSpeed = 0.005 * Math.max(0.5, cameraDistance / 2);
        cameraDistance *= 1 - pinchDelta * zoomSpeed;
      }

      lastTouchX = center.x;
      lastTouchY = center.y;
      lastPinchDistance = pinchDistance;
      clampCamera();

      // No inertia for pan/zoom
      velocityX = 0;
      velocityY = 0;
    }
  }

  function onTouchEndCanvas(e: TouchEvent) {
    activeTouches = e.touches.length;

    if (activeTouches === 0) {
      isTouchDragging = false;
      isTouchPanning = false;
      // Velocity preserved for inertia (applied in render loop)
    } else if (activeTouches === 1 && isTouchPanning) {
      // Transitioned from 2 fingers to 1 - switch to orbit mode
      isTouchPanning = false;
      isTouchDragging = true;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      velocityX = 0;
      velocityY = 0;
    }
  }

  onMount(() => {
    init();

    // Viewport size tracking for export framing
    const updateViewportSize = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
    };
    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncLayout = (mq: MediaQueryList | MediaQueryListEvent) => {
      const nextIsDesktop = mq.matches;
      if (nextIsDesktop !== isDesktop) {
        isDesktop = nextIsDesktop;
        if (showUI) {
          showMountainDrawer = nextIsDesktop;
          showControlsDrawer = nextIsDesktop;
        } else {
          lastMountainDrawer = nextIsDesktop;
          lastControlsDrawer = nextIsDesktop;
        }
      } else if (!isDesktop && (showMountainDrawer || showControlsDrawer)) {
        if (showUI) {
          showMountainDrawer = false;
          showControlsDrawer = false;
        } else {
          lastMountainDrawer = false;
          lastControlsDrawer = false;
        }
      }
    };

    syncLayout(mediaQuery);
    mediaQuery.addEventListener("change", syncLayout);
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      mediaQuery.removeEventListener("change", syncLayout);
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", updateViewportSize);
    };
  });
  onDestroy(() => {
    if (animationId) cancelAnimationFrame(animationId);
    if (mobileTouchHintTimer) clearTimeout(mobileTouchHintTimer);
    offscreenTexture?.destroy();
    depthTexture?.destroy();
    heightTexture?.destroy();
    perf?.destroy();
    ctx?.destroy();
  });
</script>

<div
  class="app"
  class:docked={isDesktop}
  class:mountain-open={showMountainDrawer}
  class:controls-open={showControlsDrawer}
  class:frame-active={frameMode !== "none"}
>
  {#if showUI}
    <PS2HUD
      title="RETRO MOUNTAIN"
      showPerf={$perfEnabled}
      fps={$perfEnabled ? $perfMetrics.fps : 0}
      gpuTime={$perfEnabled ? $perfMetrics.gpuTime : 0}
      mountainName={selectedMountain.name}
      showMountains={showMountainDrawer}
      showSettings={showControlsDrawer}
      {cameraAzimuth}
      {cameraElevation}
      {showCompass}
      mountainElevation={selectedMountain.elevation_ft || 0}
      on:toggleMountains={toggleMountainDrawer}
      on:toggleSettings={toggleControlsDrawer}
      on:togglePerf={togglePerf}
      on:toggleUi={toggleUI}
      on:reframe={reframeCamera}
    />
  {/if}

  {#if error}
    <div class="error">{error}</div>
  {:else}
    <div class="content">
      <div class="canvas-container">
        <div
          class="canvas-frame"
          class:constrained={canvasDimensions.constrained}
          style={canvasDimensions.constrained
            ? `width: ${canvasDimensions.width}; height: ${canvasDimensions.height};`
            : ""}
        >
          <canvas
            bind:this={canvas}
            on:mousedown={onMouseDown}
            on:mousemove={onMouseMove}
            on:mouseup={onMouseUp}
            on:mouseleave={onMouseUp}
            on:wheel|preventDefault={onWheel}
            on:touchstart={onTouchStart}
            on:touchmove|preventDefault={onTouchMove}
            on:touchend={onTouchEndCanvas}
            on:touchcancel={onTouchEndCanvas}
          ></canvas>
          {#if loading}
            <div class="loading-overlay">LOADING</div>
          {/if}
          {#if canvasDimensions.constrained}
            <span class="frame-label">{frameLabel}</span>
          {/if}
          {#if showMobileTouchHint}
            <div class="mobile-touch-hint" class:visible={showMobileTouchHint}>
              <div class="hint-content">
                <span class="hint-gesture">👆 Drag</span>
                <span class="hint-action">to orbit</span>
              </div>
              <div class="hint-content">
                <span class="hint-gesture">🤏 Pinch</span>
                <span class="hint-action">to zoom</span>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <PS2Drawer
        position="left"
        width="var(--ps2-mountain-width)"
        title="SELECT MOUNTAIN"
        bind:open={showMountainDrawer}
        mode={isDesktop ? "docked" : "overlay"}
      >
        <PS2MountainSelector
          {mountains}
          selectedId={selectedMountain.id}
          {loading}
          on:select={(e) => switchMountainById(e.detail.id)}
        />
      </PS2Drawer>

      <PS2Drawer
        position="right"
        width="var(--ps2-control-width)"
        title="SETTINGS"
        bind:open={showControlsDrawer}
        mode={isDesktop ? "docked" : "overlay"}
      >
        <PS2ControlPanel
          colorPresets={colorPresets.map(p => ({ id: p.id, name: p.name }))}
          {selectedPresetId}
          on:selectPreset={(e) => selectPreset(e.detail.id)}
          bind:renderScale
          bind:wobbleStrength
          bind:colorSteps
          bind:ditherStrength
          bind:chromaStrength
          bind:chromaRadial
          bind:vignette
          bind:filmGrain
          bind:bloomThreshold
          bind:bloomIntensity
          bind:saturation
          bind:terrainScale
          bind:heightExaggeration
          bind:snowLine
          bind:treeLine
          bind:autoSpin
          bind:spinSpeed
          bind:cameraAzimuth
          bind:cameraElevation
          bind:cameraDistance
          bind:cameraHeight
          bind:cameraTilt
          bind:cameraFov
          bind:handheldIntensity
          bind:lightIntensity
          bind:ambientIntensity
          bind:lightAzimuth
          bind:sunHeight
          bind:fogDensity
          bind:cloudCoverage
          bind:cloudBrightness
          bind:cloudContrast
          bind:cloudSpeed
          bind:scanlineIntensity
          bind:scanlineCount
          bind:scanlineSpeed
          bind:frameMode
          bind:showCompass
          on:resetCamera={resetCamera}
          on:reframeCamera={reframeCamera}
          on:paramChange={onParamChange}
        />
      </PS2Drawer>
    </div>
  {/if}
</div>
