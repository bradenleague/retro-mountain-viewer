import { writable } from 'svelte/store';

export interface PerfMetrics {
  fps: number;
  jsTime: number;      // ms
  gpuTime: number;     // ms (0 if timestamp-query not supported)
  gpuSupported: boolean;
}

export const perfEnabled = writable(true);
export const perfMetrics = writable<PerfMetrics>({
  fps: 0,
  jsTime: 0,
  gpuTime: 0,
  gpuSupported: false,
});
