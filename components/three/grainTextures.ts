import * as THREE from "three";
import type { Grain } from "@/lib/types";

// Procedural surface textures, drawn once per material into a canvas.
// The lathe's UVs run u = around the piece, v = up the profile, so the noise
// is sampled on a cylinder to make the seam at u = 0/1 invisible.

function hash(x: number, y: number, z: number) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
}

function fbm(x: number, y: number, z: number, octaves = 4) {
  let sum = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq, z * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

// Returns 0 → base colour, 1 → accent colour for a point on the cylinder.
const patterns: Record<Exclude<Grain, "none">, (cx: number, cz: number, v: number) => number> = {
  // Long grain running up the piece, with slow figure and a few dark lines.
  wood: (cx, cz, v) => {
    const warp = fbm(cx * 1.2, v * 1.5, cz * 1.2) * 3;
    const lines = Math.sin((cx * 3 + cz * 2 + warp) * 9 + v * 0.6);
    const fine = fbm(cx * 18, v * 2, cz * 18, 2);
    return Math.min(1, Math.pow(Math.abs(lines), 6) * 0.55 + fine * 0.45);
  },
  // Turbulent veins drifting diagonally, mostly clean stone in between.
  marble: (cx, cz, v) => {
    const turb = fbm(cx * 2.2, v * 2.6, cz * 2.2, 5);
    const vein = Math.abs(Math.sin((v * 2.4 + cx * 1.3 + turb * 3.2) * Math.PI));
    const thin = Math.pow(1 - vein, 14);
    const cloud = fbm(cx * 4, v * 5, cz * 4, 3) * 0.18;
    return Math.min(1, thin * 0.9 + cloud);
  },
  // Circumferential brushing: fine streaks that vary along the height only.
  metal: (cx, cz, v) => {
    const streak = fbm(v * 220, cx * 0.4, cz * 0.4, 2);
    return streak * 0.35;
  },
};

export interface GrainTexture {
  texture: THREE.CanvasTexture;
  /** Resolves once the grain is fully drawn and uploaded. */
  ready: Promise<void>;
}

// Drawing a 512² texture is a few hundred milliseconds of maths, so it is done
// in small slices between frames instead of in one block. Textures are drawn
// one at a time, in the order they were asked for (the first chapter first).
const SLICE_MS = 6;
const queue: (() => boolean)[] = [];
let pumping = false;

function pump() {
  const start = performance.now();
  while (queue.length && performance.now() - start < SLICE_MS) {
    if (queue[0]()) queue.shift();
  }
  if (queue.length) setTimeout(pump, 0);
  else pumping = false;
}

function schedule(job: () => boolean) {
  queue.push(job);
  if (!pumping) {
    pumping = true;
    setTimeout(pump, 0);
  }
}

const cache = new Map<string, GrainTexture>();
const W = 512;
const H = 512;
const ROWS_PER_STEP = 4;

export function getGrainTexture(grain: Grain, base: string, accent: string): GrainTexture | null {
  if (grain === "none" || typeof document === "undefined") return null;
  const key = `${grain}:${base}:${accent}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // Until the grain is ready the piece shows its plain base colour.
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;

  const img = ctx.createImageData(W, H);
  const a = new THREE.Color(base);
  const b = new THREE.Color(accent);
  const c = new THREE.Color();
  const pattern = patterns[grain];
  const R = 1.6; // cylinder radius in noise space
  let y = 0;

  const ready = new Promise<void>((resolve) => {
    schedule(() => {
      for (const end = Math.min(H, y + ROWS_PER_STEP); y < end; y++) {
        const v = (y / H) * 4;
        for (let x = 0; x < W; x++) {
          const angle = (x / W) * Math.PI * 2;
          const t = pattern(Math.cos(angle) * R, Math.sin(angle) * R, v);
          const i = (y * W + x) * 4;
          // Colours are in linear space; write sRGB bytes for the canvas.
          c.copy(a).lerp(b, t).convertLinearToSRGB();
          img.data[i] = c.r * 255;
          img.data[i + 1] = c.g * 255;
          img.data[i + 2] = c.b * 255;
          img.data[i + 3] = 255;
        }
      }
      if (y < H) return false;
      ctx.putImageData(img, 0, 0);
      texture.needsUpdate = true;
      resolve();
      return true;
    });
  });

  const entry = { texture, ready };
  cache.set(key, entry);
  return entry;
}
