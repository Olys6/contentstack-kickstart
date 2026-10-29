import * as THREE from "three";
import type { Grain, Material } from "@/lib/types";
import { getGrainTexture } from "./grainTextures";

// A material entry from Contentstack, turned into a physical shader.
// Each one owns a single horizontal clipping plane so the scroll story can
// "sweep" from one material to the next without recompiling shaders.
export interface KingMaterial {
  material: THREE.MeshPhysicalMaterial;
  plane: THREE.Plane;
  /** Resolves when the grain texture has finished drawing. */
  ready: Promise<void>;
}

const KEEP_ALL = 1000;

const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export function materialKey(m: Material) {
  return [m.slug, m.color, m.accent_color, m.grain, m.roughness, m.metalness, m.clearcoat].join("|");
}

const HEX = /^#[0-9a-f]{6}$/i;
const GRAINS: readonly Grain[] = ["wood", "marble", "metal", "none"];
// A neutral stone, used when an entry arrives without usable colours.
const PLAIN = "#8c857a";

const hex = (value: unknown, fallback: string) =>
  typeof value === "string" && HEX.test(value) ? value : fallback;

export function createKingMaterial(m: Material): KingMaterial {
  // Material data comes straight from the CMS. An unresolved reference or an
  // unknown grain renders as a plain colour rather than breaking the scene.
  const base = hex(m.color, PLAIN);
  const accent = hex(m.accent_color, base);
  const grainName = GRAINS.includes(m.grain) ? m.grain : "none";

  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), KEEP_ALL);
  const grain = getGrainTexture(grainName, base, accent);
  const map = grain?.texture ?? null;
  const metal = num(m.metalness, 0);

  const material = new THREE.MeshPhysicalMaterial({
    color: map ? 0xffffff : base,
    map,
    roughness: num(m.roughness, 0.5),
    metalness: metal,
    clearcoat: num(m.clearcoat, 0),
    clearcoatRoughness: 0.25,
    envMapIntensity: metal > 0.5 ? 1.25 : 0.9,
    clippingPlanes: [plane],
    clipShadows: true,
  });

  // Brushed metal: stretch highlights around the piece.
  if (grainName === "metal") {
    material.anisotropy = 0.6;
    material.anisotropyRotation = Math.PI / 2;
  }

  return { material, plane, ready: grain?.ready ?? Promise.resolve() };
}

/** Show only the part of the piece below `height`. */
export function clipBelow(km: KingMaterial, height: number) {
  km.plane.normal.set(0, -1, 0);
  km.plane.constant = height;
}

/** Show only the part of the piece above `height`. */
export function clipAbove(km: KingMaterial, height: number) {
  km.plane.normal.set(0, 1, 0);
  km.plane.constant = -height;
}

export function clipNone(km: KingMaterial) {
  km.plane.normal.set(0, 1, 0);
  km.plane.constant = KEEP_ALL;
}

// The cross is the one part every king shares: polished brass, whatever the
// body is made of, like the hardware on a fine door or a switch plate.
let hardware: THREE.MeshPhysicalMaterial | null = null;
export function getHardwareMaterial() {
  hardware ??= new THREE.MeshPhysicalMaterial({
    color: "#d9b36c",
    metalness: 1,
    // Satin rather than mirror: a mirror-flat face only shows whatever is
    // straight behind the camera, which is usually darkness.
    roughness: 0.3,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.6,
  });
  return hardware;
}
