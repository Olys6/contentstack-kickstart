import * as THREE from "three";
import { bakeOcclusion, sdBox, sdPolygon, type Sdf } from "./occlusion";

// The king is a solid of revolution: one profile line (radius, height) turned
// around the Y axis, exactly like a piece on a wood lathe. Height is
// normalised so the whole piece, cross included, stands 1 unit tall.
//
// Each point is [radius, height, sharp?]. Sharp points keep a crisp edge
// (the base chamfer, the collar); the rest are smoothed with a spline.
type ProfilePoint = [number, number, boolean?];

interface Silhouette {
  profile: ProfilePoint[];
  /** Height where the body ends and the cross begins. */
  top: number;
  /** Optional knurled band: vertices at radius `r` between y0 and y1 get flutes. */
  knurl?: { r: number; y0: number; y1: number; count: number; depth: number };
}

export const KING_HEIGHT = 1;

const SILHOUETTES = {
  // The original: a traditional Staunton king with several beads and rings.
  classic: {
    top: 0.86,
    profile: [
      [0.0, 0.0, true], [0.29, 0.0, true], [0.305, 0.012], [0.305, 0.034], [0.29, 0.046, true],
      [0.262, 0.052, true], [0.27, 0.066], [0.258, 0.08, true], [0.232, 0.088], [0.2, 0.108],
      [0.172, 0.14], [0.15, 0.19], [0.132, 0.26], [0.117, 0.34], [0.106, 0.42], [0.102, 0.48],
      [0.108, 0.512, true], [0.15, 0.522], [0.166, 0.536], [0.152, 0.551, true], [0.122, 0.556, true],
      [0.142, 0.568], [0.13, 0.582, true], [0.108, 0.588, true], [0.112, 0.61], [0.13, 0.66],
      [0.156, 0.716], [0.176, 0.76], [0.182, 0.776], [0.174, 0.79, true], [0.142, 0.795, true],
      [0.118, 0.806], [0.086, 0.826], [0.052, 0.843], [0.03, 0.852, true], [0.03, 0.86, true], [0.0, 0.86, true],
    ],
  },

  // Maison Roque: one long sweep from a chamfered base to a slim waist, a
  // single knurled collar (the detail of fine hardware and watch crowns),
  // and a clean flared crown with a crisp rim.
  moderne: {
    top: 0.846,
    knurl: { r: 0.15, y0: 0.5, y1: 0.524, count: 96, depth: 0.022 },
    profile: [
      [0.0, 0.0, true], [0.28, 0.0, true], [0.288, 0.007, true], [0.288, 0.032, true],
      [0.268, 0.046, true], [0.206, 0.052, true],
      [0.172, 0.072], [0.14, 0.118], [0.113, 0.19], [0.097, 0.29], [0.089, 0.39], [0.087, 0.47, true],
      [0.087, 0.494, true], [0.15, 0.5, true], [0.15, 0.524, true], [0.09, 0.53, true],
      [0.092, 0.56], [0.106, 0.62], [0.13, 0.69], [0.16, 0.752], [0.172, 0.774, true],
      [0.172, 0.79, true], [0.15, 0.793, true], [0.118, 0.808], [0.074, 0.828], [0.03, 0.842], [0.0, 0.846, true],
    ],
  },

  // The most reduced: no collar at all, a straight cone into a plain drum.
  monolithe: {
    top: 0.85,
    profile: [
      [0.0, 0.0, true], [0.25, 0.0, true], [0.25, 0.04, true], [0.19, 0.046, true],
      [0.15, 0.08], [0.115, 0.18], [0.095, 0.3], [0.088, 0.42], [0.09, 0.52], [0.105, 0.62],
      [0.135, 0.72], [0.155, 0.78, true], [0.155, 0.8, true], [0.11, 0.82], [0.04, 0.842, true],
      [0.04, 0.85, true], [0.0, 0.85, true],
    ],
  },
} satisfies Record<string, Silhouette>;

export type SilhouetteName = keyof typeof SILHOUETTES;
export const SILHOUETTE: SilhouetteName = "moderne";

// Turn the control profile into a dense polyline: spline runs between sharp
// points, straight joins at the sharp points themselves.
function sampleProfile(profile: ProfilePoint[]): THREE.Vector2[] {
  const out: THREE.Vector2[] = [];
  let run: THREE.Vector2[] = [];

  const flush = () => {
    if (run.length < 2) {
      out.push(...run);
    } else {
      const curve = new THREE.SplineCurve(run);
      const steps = Math.max(6, run.length * 8);
      curve.getPoints(steps).forEach((p, i) => {
        if (i === 0 && out.length) return;
        out.push(p);
      });
    }
    run = [];
  };

  profile.forEach(([r, y, sharp], i) => {
    const p = new THREE.Vector2(r, y);
    run.push(p);
    if (sharp && i > 0) {
      flush();
      run.push(p.clone());
    }
  });
  flush();

  // Remove consecutive duplicates, which would give the lathe zero-area faces.
  return out.filter((p, i) => i === 0 || p.distanceTo(out[i - 1]) > 1e-5);
}

// Flutes cut around the band: the radius dips in a rounded groove `count`
// times per turn, like the knurling on a brass switch or a watch crown.
function applyKnurl(geometry: THREE.BufferGeometry, k: NonNullable<Silhouette["knurl"]>) {
  const pos = geometry.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.z);
    if (v.y < k.y0 - 1e-4 || v.y > k.y1 + 1e-4 || Math.abs(r - k.r) > 1e-3) continue;
    const theta = Math.atan2(v.z, v.x);
    const groove = 0.5 + 0.5 * Math.cos(theta * k.count);
    const scale = 1 - k.depth * groove;
    pos.setXYZ(i, v.x * scale, v.y, v.z * scale);
  }
  pos.needsUpdate = true;
}

// The whole piece standing on the floor, as a distance field for baking occlusion.
function kingSdf(name: SilhouetteName): Sdf {
  // A lighter outline to measure against: every third point along smooth
  // curves, but every corner kept (the collar is only a few points wide).
  const full = sampleProfile(SILHOUETTES[name].profile);
  const outline = full.filter((p, i) => {
    if (i % 3 === 0 || i === 0 || i === full.length - 1) return true;
    const a = p.clone().sub(full[i - 1]).normalize();
    const b = full[i + 1].clone().sub(p).normalize();
    return a.dot(b) < Math.cos(THREE.MathUtils.degToRad(12));
  });
  const bars = crossBars(name);
  return (x, y, z) =>
    Math.min(
      sdPolygon(Math.hypot(x, z), y, outline),
      ...bars.map((b) => sdBox(x, y, z, b.centre, b.half)),
      y, // the floor
    );
}

export function createBodyGeometry(name: SilhouetteName = SILHOUETTE): THREE.BufferGeometry {
  const s: Silhouette = SILHOUETTES[name];
  // Enough segments around for ~5 vertices per flute on the knurled band.
  const segments = s.knurl ? s.knurl.count * 5 : 160;
  const points = sampleProfile(s.profile);
  const geometry = new THREE.LatheGeometry(points, segments);
  if (s.knurl) applyKnurl(geometry, s.knurl);
  geometry.computeVertexNormals();

  // The body is the same all the way round, so occlusion is computed once per
  // row of the lathe and shared. Only the knurled flutes vary: each groove is
  // darkened by its depth so the band reads as cut metal, not a printed stripe.
  const rows = new Map<number, number>();
  const pos = geometry.getAttribute("position");
  const k = s.knurl;
  const inBand = (i: number) =>
    !!k &&
    pos.getY(i) > k.y0 - 1e-4 &&
    pos.getY(i) < k.y1 + 1e-4 &&
    Math.hypot(pos.getX(i), pos.getZ(i)) > k.r * (1 - k.depth) - 1e-3;
  const atProfile = new THREE.Vector3();
  const outward = new THREE.Vector3();
  bakeOcclusion(geometry, kingSdf(name), undefined, (i, compute) => {
    const row = i % points.length;
    let ao = rows.get(row);
    if (ao === undefined) {
      // The flutes are cut just inside the outline, so the band is measured
      // from its uncut surface, then each groove is darkened by its depth.
      if (inBand(i)) {
        outward.set(pos.getX(i), 0, pos.getZ(i)).normalize();
        ao = compute(atProfile.copy(outward).multiplyScalar(points[row].x).setY(points[row].y), outward);
      } else {
        ao = compute();
      }
      rows.set(row, ao);
    }
    if (k && inBand(i)) {
      const groove = 0.5 + 0.5 * Math.cos(Math.atan2(pos.getZ(i), pos.getX(i)) * k.count);
      ao *= 1 - 0.45 * groove;
    }
    return ao;
  });
  return geometry;
}

// A slim straight cross with chamfered edges, like a piece of jewellery
// hardware rather than a carved ornament.
function crossDims(name: SilhouetteName) {
  const classic = name === "classic";
  return {
    classic,
    w: classic ? 0.026 : 0.0145, // half-width of the bars
    arm: classic ? 0.068 : 0.054, // horizontal arm reach
    // A Latin cross: the long arm is below the bar. Getting this backwards reads
    // as an inverted cross, especially from a raised camera.
    up: classic ? 0.06 : 0.046, // upper arm reach
    down: classic ? 0.082 : 0.086, // lower arm reach (part sinks into the dome)
    depth: classic ? 0.03 : 0.022,
    bevelThickness: classic ? 0.008 : 0.004,
    bevelSize: classic ? 0.006 : 0.0035,
  };
}

// The cross as two boxes, for the occlusion distance field.
function crossBars(name: SilhouetteName) {
  const { w, arm, up, down, depth, bevelThickness, bevelSize } = crossDims(name);
  const y = SILHOUETTES[name].top + down - 0.014;
  const hz = depth / 2 + bevelThickness;
  return [
    { centre: new THREE.Vector3(0, y + (up - down) / 2, 0), half: new THREE.Vector3(w + bevelSize, (up + down) / 2 + bevelSize, hz) },
    { centre: new THREE.Vector3(0, y, 0), half: new THREE.Vector3(arm + bevelSize, w + bevelSize, hz) },
  ];
}

export function createCrossGeometry(name: SilhouetteName = SILHOUETTE): THREE.BufferGeometry {
  const { classic, w, arm, up, down, depth, bevelThickness, bevelSize } = crossDims(name);

  const s = new THREE.Shape();
  s.moveTo(-w, -down);
  s.lineTo(w, -down);
  s.lineTo(w, -w);
  s.lineTo(arm, -w);
  s.lineTo(arm, w);
  s.lineTo(w, w);
  s.lineTo(w, up);
  s.lineTo(-w, up);
  s.lineTo(-w, w);
  s.lineTo(-arm, w);
  s.lineTo(-arm, -w);
  s.lineTo(-w, -w);
  s.closePath();

  const geometry = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelSegments: classic ? 4 : 1, // one segment = a crisp chamfer
    curveSegments: 1,
  });
  // Extrude UVs are in model units (a few centimetres here); scale them so
  // any grain on the cross matches the grain on the body.
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4 + 0.5, uv.getY(i) * 4);
  geometry.translate(0, SILHOUETTES[name].top + down - 0.014, -depth / 2);
  geometry.computeVertexNormals();
  // A short reach: only the last few millimetres where it meets the dome darken.
  // The extrusion's faces are a handful of long triangles, so a corner buried
  // in the dome would smear its darkness halfway up the cross; those corners
  // are hidden anyway and are left fully lit.
  const outline = sampleProfile(SILHOUETTES[name].profile);
  const pos = geometry.getAttribute("position");
  bakeOcclusion(geometry, kingSdf(name), 0.04, (i, compute) =>
    sdPolygon(Math.hypot(pos.getX(i), pos.getZ(i)), pos.getY(i), outline) < 0 ? 1 : compute(),
  );
  return geometry;
}
