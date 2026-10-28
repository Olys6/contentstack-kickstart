import * as THREE from "three";

// The king is a solid of revolution: one profile line (radius, height) turned
// around the Y axis, exactly like a piece on a wood lathe. Height is
// normalised so the whole piece, cross included, stands 1 unit tall.
//
// Each segment is [radius, height, sharp?]. Sharp points keep a crisp edge
// (the base lip, collar rings); the rest are smoothed with a spline.
type ProfilePoint = [number, number, boolean?];

export const KING_HEIGHT = 1;
const BODY_TOP = 0.86;

const PROFILE: ProfilePoint[] = [
  [0.0, 0.0, true],
  [0.29, 0.0, true],
  [0.305, 0.012],
  [0.305, 0.034],
  [0.29, 0.046, true],
  [0.262, 0.052, true],
  [0.27, 0.066],
  [0.258, 0.08, true],
  [0.232, 0.088],
  [0.2, 0.108],
  [0.172, 0.14],
  [0.15, 0.19],
  [0.132, 0.26],
  [0.117, 0.34],
  [0.106, 0.42],
  [0.102, 0.48],
  [0.108, 0.512, true],
  [0.15, 0.522],
  [0.166, 0.536],
  [0.152, 0.551, true],
  [0.122, 0.556, true],
  [0.142, 0.568],
  [0.13, 0.582, true],
  [0.108, 0.588, true],
  [0.112, 0.61],
  [0.13, 0.66],
  [0.156, 0.716],
  [0.176, 0.76],
  [0.182, 0.776],
  [0.174, 0.79, true],
  [0.142, 0.795, true],
  [0.118, 0.806],
  [0.086, 0.826],
  [0.052, 0.843],
  [0.03, 0.852, true],
  [0.03, BODY_TOP, true],
  [0.0, BODY_TOP, true],
];

// Turn the control profile into a dense polyline: spline runs between sharp
// points, straight joins at the sharp points themselves.
function sampleProfile(): THREE.Vector2[] {
  const out: THREE.Vector2[] = [];
  let run: THREE.Vector2[] = [];

  const flush = () => {
    if (run.length < 2) {
      out.push(...run);
    } else {
      const curve = new THREE.SplineCurve(run);
      const steps = Math.max(4, run.length * 8);
      curve.getPoints(steps).forEach((p, i) => {
        if (i === 0 && out.length) return;
        out.push(p);
      });
    }
    run = [];
  };

  PROFILE.forEach(([r, y, sharp], i) => {
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

export function createBodyGeometry(segments = 160): THREE.BufferGeometry {
  const geometry = new THREE.LatheGeometry(sampleProfile(), segments);
  geometry.computeVertexNormals();
  return geometry;
}

// A slightly flared cross ("croix pattée"), extruded with a soft bevel.
export function createCrossGeometry(): THREE.BufferGeometry {
  const w = 0.026; // half-width of the arms at the centre
  const f = 0.036; // half-width at the flared ends
  const arm = 0.068; // horizontal arm reach
  const up = 0.082; // upper arm reach
  const down = 0.06; // lower arm reach

  const s = new THREE.Shape();
  s.moveTo(-w, -down);
  s.lineTo(w, -down);
  s.lineTo(w * 0.8, -w);
  s.lineTo(arm, -f);
  s.lineTo(arm, f);
  s.lineTo(w * 0.8, w);
  s.lineTo(f, up);
  s.lineTo(-f, up);
  s.lineTo(-w * 0.8, w);
  s.lineTo(-arm, f);
  s.lineTo(-arm, -f);
  s.lineTo(-w * 0.8, -w);
  s.closePath();

  const depth = 0.03;
  const geometry = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.006,
    bevelSegments: 4,
    curveSegments: 4,
  });
  // Extrude UVs are in model units (a few centimetres here); scale them so the
  // grain on the cross matches the grain on the body.
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4 + 0.5, uv.getY(i) * 4);
  geometry.translate(0, BODY_TOP + down - 0.004, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}
