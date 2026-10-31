import * as THREE from "three";

// Baked ambient occlusion: how enclosed each point of the piece is, computed
// once when the geometry is built. Corners where parts meet (under the collar,
// under the crown rim, where the stem flares into the base) receive less
// light, which is what makes a render read as a solid object rather than a
// flat cut-out. Doing it here instead of as a screen-space pass costs nothing
// per frame and has none of the shimmer of real-time AO.
//
// The scene is described as a signed distance function (negative inside):
// the turned body, the cross and the floor it stands on.

export type Sdf = (x: number, y: number, z: number) => number;

/** Signed distance from (px, py) to a closed polygon (Inigo Quilez's method). */
export function sdPolygon(px: number, py: number, pts: THREE.Vector2[]): number {
  let d = Infinity;
  let s = 1;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i++) {
    const vi = pts[i];
    const vj = pts[j];
    const ex = vj.x - vi.x;
    const ey = vj.y - vi.y;
    const wx = px - vi.x;
    const wy = py - vi.y;
    const t = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey || 1)));
    const bx = wx - ex * t;
    const by = wy - ey * t;
    d = Math.min(d, bx * bx + by * by);
    const c1 = py >= vi.y;
    const c2 = py < vj.y;
    const c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}

/** Signed distance to an axis-aligned box given its centre and half extents. */
export function sdBox(x: number, y: number, z: number, c: THREE.Vector3, h: THREE.Vector3): number {
  const qx = Math.abs(x - c.x) - h.x;
  const qy = Math.abs(y - c.y) - h.y;
  const qz = Math.abs(z - c.z) - h.z;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0));
  return outside + Math.min(Math.max(qx, qy, qz), 0);
}

// Rays per point, spread evenly over the hemisphere above the surface. The same
// set is used everywhere so neighbouring rows of the lathe agree (no speckle).
const RAYS = 40;
// How far (in piece heights) a blocker still darkens a surface. Each part
// passes its own: the body uses the default, the small cross much less.
const DEFAULT_REACH = 0.3;
const SURFACE = 0.0008;

const HEMISPHERE: THREE.Vector3[] = Array.from({ length: RAYS }, (_, i) => {
  // Cosine-weighted Fibonacci spiral: more rays near the normal, as light arrives.
  const r = Math.sqrt((i + 0.5) / RAYS);
  const phi = i * Math.PI * (3 - Math.sqrt(5));
  return new THREE.Vector3(r * Math.cos(phi), r * Math.sin(phi), Math.sqrt(1 - r * r));
});

/** Distance along a ray to the first surface, or Infinity if it escapes. */
function march(sdf: Sdf, o: THREE.Vector3, d: THREE.Vector3, reach: number): number {
  let t = 0;
  for (let i = 0; i < 64 && t < reach; i++) {
    const dist = sdf(o.x + d.x * t, o.y + d.y * t, o.z + d.z * t);
    if (dist < SURFACE) return t;
    t += Math.max(dist, 0.0015);
  }
  return Infinity;
}

const tangent = new THREE.Vector3();
const bitangent = new THREE.Vector3();
const origin = new THREE.Vector3();
const dir = new THREE.Vector3();

/**
 * Occlusion at a surface point: the share of the sky above it that the piece
 * (or the floor) blocks, with nearby blockers counting more than distant ones.
 * Open faces score 1, deep corners approach 0.
 */
export function occlusionAt(sdf: Sdf, p: THREE.Vector3, n: THREE.Vector3, reach = DEFAULT_REACH): number {
  tangent.set(Math.abs(n.y) < 0.9 ? 0 : 1, Math.abs(n.y) < 0.9 ? 1 : 0, 0).cross(n).normalize();
  bitangent.crossVectors(n, tangent);
  origin.copy(p).addScaledVector(n, 0.003);
  let blocked = 0;
  for (const h of HEMISPHERE) {
    dir.copy(tangent).multiplyScalar(h.x).addScaledVector(bitangent, h.y).addScaledVector(n, h.z);
    const t = march(sdf, origin, dir, reach);
    if (t < reach) blocked += 1 - t / reach;
  }
  return 1 - blocked / RAYS;
}

/** Bakes occlusion into a float `ao` attribute, read by the king materials. */
export function bakeOcclusion(
  geometry: THREE.BufferGeometry,
  sdf: Sdf,
  reach = DEFAULT_REACH,
  /**
   * Optional: lets the caller share one computed value between several
   * vertices (e.g. one per lathe row), or measure from a nudged position.
   */
  shared?: (index: number, compute: (at?: THREE.Vector3, normal?: THREE.Vector3) => number) => number,
) {
  const pos = geometry.getAttribute("position");
  const nor = geometry.getAttribute("normal");
  const ao = new Float32Array(pos.count);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const compute = (at?: THREE.Vector3, normal?: THREE.Vector3) => {
      p.copy(at ?? p.fromBufferAttribute(pos, i));
      n.copy(normal ?? n.fromBufferAttribute(nor, i)).normalize();
      return occlusionAt(sdf, p, n, reach);
    };
    ao[i] = shared ? shared(i, compute) : compute();
  }
  geometry.setAttribute("ao", new THREE.BufferAttribute(ao, 1));
}
