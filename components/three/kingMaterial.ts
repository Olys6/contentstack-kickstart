import * as THREE from "three";
import type { Material } from "@/lib/types";
import { getGrainTexture } from "./grainTextures";

// A material entry from Contentstack, turned into a physical shader.
// Each one owns a single horizontal clipping plane so the scroll story can
// "sweep" from one material to the next without recompiling shaders.
export interface KingMaterial {
  material: THREE.MeshPhysicalMaterial;
  plane: THREE.Plane;
}

const KEEP_ALL = 1000;

const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export function materialKey(m: Material) {
  return [m.slug, m.color, m.accent_color, m.grain, m.roughness, m.metalness, m.clearcoat].join("|");
}

export function createKingMaterial(m: Material): KingMaterial {
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), KEEP_ALL);
  const map = getGrainTexture(m.grain, m.color, m.accent_color || m.color);
  const metal = num(m.metalness, 0);

  const material = new THREE.MeshPhysicalMaterial({
    color: map ? 0xffffff : m.color,
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
  if (m.grain === "metal") {
    material.anisotropy = 0.6;
    material.anisotropyRotation = Math.PI / 2;
  }

  return { material, plane };
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
