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

// Baked occlusion (see occlusion.ts) arrives as a per-vertex `ao` attribute and
// replaces three's ambient-occlusion step. Physically it only dims bounced
// light; the two direct lights cast no shadows here, so part of it is applied
// to them too, standing in for the collar's soft shadow on the stem.
const DIRECT_OCCLUSION = 0.55;

const AO_FRAGMENT = /* glsl */ `
  // Squared for contrast: the overhangs are shallow, so true occlusion alone reads too faint.
  float ambientOcclusion = vBakedAo * vBakedAo;
  reflectedLight.indirectDiffuse *= ambientOcclusion;
  #if defined( USE_CLEARCOAT )
    clearcoatSpecularIndirect *= ambientOcclusion;
  #endif
  #if defined( USE_ENVMAP ) && defined( STANDARD )
    float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
    reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
  #endif
  float directOcclusion = mix( 1.0, ambientOcclusion, ${DIRECT_OCCLUSION.toFixed(2)} );
  reflectedLight.directDiffuse *= directOcclusion;
  reflectedLight.directSpecular *= directOcclusion;
  #if defined( USE_CLEARCOAT )
    clearcoatSpecularDirect *= directOcclusion;
  #endif
`;

function withBakedOcclusion<T extends THREE.Material>(material: T): T {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float ao;\nvarying float vBakedAo;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBakedAo = ao;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vBakedAo;")
      .replace("#include <aomap_fragment>", AO_FRAGMENT);
  };
  material.customProgramCacheKey = () => "baked-ao";
  return material;
}

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

  const material = withBakedOcclusion(new THREE.MeshPhysicalMaterial({
    color: map ? 0xffffff : base,
    map,
    roughness: num(m.roughness, 0.5),
    metalness: metal,
    clearcoat: num(m.clearcoat, 0),
    clearcoatRoughness: 0.25,
    envMapIntensity: metal > 0.5 ? 1.25 : 0.9,
    clippingPlanes: [plane],
    clipShadows: true,
  }));

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
  hardware ??= withBakedOcclusion(new THREE.MeshPhysicalMaterial({
    color: "#d9b36c",
    metalness: 1,
    // Satin rather than mirror: a mirror-flat face only shows whatever is
    // straight behind the camera, which is usually darkness.
    roughness: 0.34,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.6,
  }));
  return hardware;
}
