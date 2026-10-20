export const clamp = n => Math.max(0, Math.min(1, n));
export const frameAt = (progress, count) => Math.round(clamp(progress) * (count - 1));
export const phaseFor = p => p >= .96 ? 6 : Math.min(5, Math.floor(clamp(p) / .96 * 6));

export function sequencePlayer({manifest, mobile, canvas, node, changed, ready}) {
  const context = canvas.getContext("2d", {alpha:false});
  let target = 0;
  const buffer = new FrameBuffer({manifest, mobile, changed});
  return {
    update(progress) {
      target = frameAt(Math.min(1, progress / .96), manifest.frameCount);
      node.dataset.targetFrame = String(target);
      buffer.request(target);
    },
    draw() {
      node.dataset.cacheBytes = String(buffer.bytes);
      node.dataset.cacheLimit = String(buffer.limit);
      node.dataset.cacheFrames = String(buffer.cache.size);
      const entry = buffer.cache.get(target);
      if (!entry || !context) {
        if (!context || buffer.failures.get(target) >= 2) {
          node.classList.remove("has-frames");
          node.dataset.state = "frame-unavailable";
          ready(false);
        }
        return;
      }
      if (canvas.width !== entry.image.width || canvas.height !== entry.image.height) {
        canvas.width = entry.image.width; canvas.height = entry.image.height;
      }
      context.drawImage(entry.image, 0, 0);
      node.dataset.frame = String(target);
      node.classList.add("has-frames");
      ready(true);
    },
    pause(value) { buffer.pause(value); },
    destroy() { buffer.destroy(); },
  };
}

export function validateManifest(value) {
  if (value?.version !== 1 || typeof value.enabled !== "boolean") throw new Error("Invalid sequence manifest");
  if (!value.enabled) return null;
  if (!Number.isInteger(value.frameCount) || value.frameCount < 2 || value.frameCount > 1800) throw new Error("Invalid frame count");
  for (const key of ["desktop", "mobile"]) {
    const variant = value[key];
    if (!variant || !/^\/stage-sequence\/[a-zA-Z0-9_/-]+\/frame-\{index\}\.(webp|avif)$/.test(variant.pattern)
      || !Number.isInteger(variant.width) || !Number.isInteger(variant.height)
      || variant.width < 1 || variant.height < 1 || variant.width > 2560 || variant.height > 2560) throw new Error(`Invalid ${key} sequence`);
  }
  return value;
}

export async function decodeFrame(url, signal, maxWidth) {
  const response = await fetch(url, { signal, cache: "force-cache" });
  if (!response.ok) throw new Error(`Frame HTTP ${response.status}`);
  const blob = await response.blob();
  if (blob.size > 8 * 1024 * 1024) throw new Error("Frame exceeds transfer limit");
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob, { resizeWidth: maxWidth, resizeQuality: "high" });
    if (signal.aborted) { bitmap.close(); throw new DOMException("Aborted", "AbortError"); }
    return bitmap;
  }
  // Older Safari: resize through a temporary canvas, releasing the object URL.
  const urlObject = URL.createObjectURL(blob);
  try {
    const image = new Image(); image.src = urlObject;
    await image.decode();
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(image.naturalWidth, maxWidth);
    canvas.height = Math.round(image.naturalHeight * canvas.width / image.naturalWidth);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally { URL.revokeObjectURL(urlObject); }
}

const release = image => { if (image.close) image.close(); else { image.width = 0; image.height = 0; } };

// Bounded sliding window, never the full decoded sequence. Seeking replaces the
// queue; only two requests/decodes can run, including when direction reverses.
export class FrameBuffer {
  constructor({ manifest, mobile, changed }) {
    this.manifest = manifest;
    this.variant = manifest[mobile ? "mobile" : "desktop"];
    this.maxWidth = Math.min(this.variant.width, mobile ? 960 : 1920);
    this.limit = (mobile ? 20 : 72) * 1024 * 1024;
    this.capacity = mobile ? 6 : 8;
    this.cache = new Map(); this.active = new Map(); this.failures = new Map();
    this.queue = []; this.bytes = 0; this.target = 0; this.changed = changed;
    this.paused = false; this.disposed = false;
  }
  request(index) {
    this.target = index;
    const candidates = [index];
    for (let n = 1; n <= 4; n++) candidates.push(index + n, index - n);
    this.queue = candidates.filter(i => i >= 0 && i < this.manifest.frameCount && !this.cache.has(i) && (this.failures.get(i) || 0) < 2);
    for (const [i, controller] of this.active) if (Math.abs(i - index) > 8) controller.abort();
    this.pump();
  }
  pump() {
    if (this.disposed || this.paused) return;
    while (this.active.size < 2 && this.queue.length) {
      const index = this.queue.shift();
      if (this.active.has(index) || this.cache.has(index)) continue;
      const controller = new AbortController(); this.active.set(index, controller);
      const url = this.variant.pattern.replace("{index}", String(index).padStart(5, "0"));
      decodeFrame(url, controller.signal, this.maxWidth).then(image => {
        if (this.disposed || controller.signal.aborted || Math.abs(index - this.target) > 8) { release(image); return; }
        const bytes = image.width * image.height * 4;
        if (bytes > this.limit) { release(image); throw new Error("Frame exceeds decode budget"); }
        while (this.cache.size && (this.bytes + bytes > this.limit || this.cache.size >= this.capacity)) {
          const furthest = [...this.cache.keys()].sort((a, b) => Math.abs(b - this.target) - Math.abs(a - this.target))[0];
          const old = this.cache.get(furthest); this.bytes -= old.bytes; release(old.image); this.cache.delete(furthest);
        }
        this.cache.set(index, { image, bytes }); this.bytes += bytes;
      }).catch(error => {
        if (!this.disposed && error.name !== "AbortError") {
          this.failures.set(index, (this.failures.get(index) || 0) + 1);
          if (index === this.target && this.failures.get(index) < 2) this.queue.unshift(index);
        }
      }).finally(() => {
        this.active.delete(index);
        if (!this.disposed && !this.paused && controller.signal.aborted && index === this.target && !this.cache.has(index)) this.queue.unshift(index);
        if (!this.disposed) { this.changed(); this.pump(); }
      });
    }
  }
  pause(value) {
    this.paused = value;
    if (value) { for (const controller of this.active.values()) controller.abort(); }
    else this.request(this.target);
  }
  destroy() {
    this.disposed = true;
    for (const controller of this.active.values()) controller.abort();
    for (const { image } of this.cache.values()) release(image);
    this.cache.clear(); this.bytes = 0; this.queue = [];
  }
}
