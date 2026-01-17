import { get } from 'svelte/store';
import { perfEnabled, perfMetrics } from './store';

export class PerfMonitor {
  private device: GPUDevice;
  private querySet: GPUQuerySet | null = null;
  private resolveBuffer: GPUBuffer | null = null;
  private resultBuffer: GPUBuffer | null = null;
  private gpuSupported = false;

  // Timing state
  private lastFrameTime = 0;
  private jsStartTime = 0;

  // Rolling averages (smooths out fluctuations)
  private fpsHistory: number[] = [];
  private jsHistory: number[] = [];
  private gpuHistory: number[] = [];
  private readonly historySize = 30;

  constructor(device: GPUDevice, canTimestamp: boolean) {
    this.device = device;
    this.gpuSupported = canTimestamp;

    if (canTimestamp) {
      this.setupTimestampQueries();
    }

    perfMetrics.update(m => ({ ...m, gpuSupported: canTimestamp }));
  }

  private setupTimestampQueries() {
    // Query set for start and end timestamps
    this.querySet = this.device.createQuerySet({
      type: 'timestamp',
      count: 2,
    });

    // Buffer to resolve query results
    this.resolveBuffer = this.device.createBuffer({
      size: 16, // 2 x 8 bytes (BigUint64)
      usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
    });

    // Buffer to read results back to CPU
    this.resultBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
  }

  /** Call at the start of your render function */
  beginFrame() {
    if (!get(perfEnabled)) return;
    this.jsStartTime = performance.now();
  }

  /** Returns timestampWrites config to add to your render pass descriptor */
  getTimestampWrites(): GPURenderPassTimestampWrites | undefined {
    if (!get(perfEnabled) || !this.querySet) return undefined;
    return {
      querySet: this.querySet,
      beginningOfPassWriteIndex: 0,
      endOfPassWriteIndex: 1,
    };
  }

  /** Call after submitting commands to the queue */
  async endFrame(encoder: GPUCommandEncoder) {
    if (!get(perfEnabled)) return;

    const now = performance.now();

    // Calculate JS time
    const jsTime = now - this.jsStartTime;
    this.jsHistory.push(jsTime);
    if (this.jsHistory.length > this.historySize) this.jsHistory.shift();

    // Calculate FPS
    if (this.lastFrameTime > 0) {
      const delta = now - this.lastFrameTime;
      const fps = 1000 / delta;
      this.fpsHistory.push(fps);
      if (this.fpsHistory.length > this.historySize) this.fpsHistory.shift();
    }
    this.lastFrameTime = now;

    // Resolve GPU timestamps
    if (this.gpuSupported && this.querySet && this.resolveBuffer && this.resultBuffer) {
      encoder.resolveQuerySet(this.querySet, 0, 2, this.resolveBuffer, 0);

      if (this.resultBuffer.mapState === 'unmapped') {
        encoder.copyBufferToBuffer(this.resolveBuffer, 0, this.resultBuffer, 0, 16);
      }
    }
  }

  /** Call after queue.submit() to read GPU timing (async) */
  async readGpuTime() {
    if (!get(perfEnabled) || !this.gpuSupported || !this.resultBuffer) return;
    if (this.resultBuffer.mapState !== 'unmapped') return;

    try {
      await this.resultBuffer.mapAsync(GPUMapMode.READ);
      const times = new BigUint64Array(this.resultBuffer.getMappedRange());
      const gpuTimeNs = Number(times[1] - times[0]);
      const gpuTimeMs = gpuTimeNs / 1_000_000;
      this.resultBuffer.unmap();

      this.gpuHistory.push(gpuTimeMs);
      if (this.gpuHistory.length > this.historySize) this.gpuHistory.shift();
    } catch {
      // Buffer mapping can fail if device is lost or busy
    }

    // Update store with averaged values
    this.updateMetrics();
  }

  private updateMetrics() {
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    perfMetrics.set({
      fps: Math.round(avg(this.fpsHistory)),
      jsTime: Number(avg(this.jsHistory).toFixed(2)),
      gpuTime: Number(avg(this.gpuHistory).toFixed(2)),
      gpuSupported: this.gpuSupported,
    });
  }

  destroy() {
    this.querySet?.destroy();
    this.resolveBuffer?.destroy();
    this.resultBuffer?.destroy();
  }
}
