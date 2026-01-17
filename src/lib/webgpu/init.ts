// WebGPU initialization utilities

export interface WebGPUContext {
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  canvas: HTMLCanvasElement;
  canTimestamp: boolean;
  /** Call this to properly release all WebGPU resources */
  destroy: () => void;
}

export interface InitOptions {
  requestTimestamp?: boolean;
}

export async function initWebGPU(
  canvas: HTMLCanvasElement,
  options: InitOptions = {},
): Promise<WebGPUContext> {
  if (!navigator.gpu) {
    throw new Error(
      "WebGPU not supported. Try Chrome/Edge 113+ or Firefox Nightly with flags enabled.",
    );
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No GPU adapter found. Your GPU may not support WebGPU.");
  }

  // Check for timestamp query support
  const canTimestamp = adapter.features.has("timestamp-query");
  const requiredFeatures: GPUFeatureName[] = [];

  if (options.requestTimestamp && canTimestamp) {
    requiredFeatures.push("timestamp-query");
  }

  const device = await adapter.requestDevice({
    requiredFeatures,
  });

  const context = canvas.getContext("webgpu");
  if (!context) {
    // Clean up the device we already created
    device.destroy();
    throw new Error("Failed to get WebGPU context");
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: "premultiplied" });

  let destroyed = false;

  // Handle device loss
  device.lost.then((info) => {
    console.error("WebGPU device lost:", info.message);
    if (info.reason !== "destroyed") {
      // Could attempt recovery here
    }
  });

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    // Unconfigure the context first to release the swap chain
    context.unconfigure();
    // Then destroy the device
    device.destroy();
  };

  return { device, context, format, canvas, canTimestamp, destroy };
}

export function resizeCanvas(canvas: HTMLCanvasElement, ctx: WebGPUContext) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth * dpr;
  const height = canvas.clientHeight * dpr;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}
