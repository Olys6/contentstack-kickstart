import * as THREE from "three";
import type { Grain, Material } from "@/lib/types";
import { getGrainTexture } from "./grainTextures";

// A material entry from Contentstack, turned into a physical shader.
// Each one carries its own sweep uniforms so the scroll story can pass from
// one material to the next without recompiling shaders.
export interface KingMaterial {
  material: THREE.MeshPhysicalMaterial;
  sweep: Sweep;
  /** Resolves when the grain texture has finished drawing. */
  ready: Promise<void>;
}

interface Sweep {
  /** Height of the seam between two materials. */
  uSweepCut: { value: number };
  /** 1: keep what is above the seam, -1: keep what is below, 0: keep everything. */
  uSweepSide: { value: number };
}

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

// The material change: a seam rises up the piece. Rather than a ruler-straight
// cut, the edge wavers gently (low-frequency noise around the piece) and is
// traced by a thin line of warm light, like the polished join of an inlay,
// with a faint glow washing over the new material just behind it.
const SWEEP_HEADER = /* glsl */ `
  uniform float uSweepCut;
  uniform float uSweepSide;
  varying vec3 vSweepPos;
  float sweepHash( vec3 p ) {
    p = fract( p * 0.3183099 + 0.1 );
    p *= 17.0;
    return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
  }
  float sweepNoise( vec3 x ) {
    vec3 i = floor( x );
    vec3 f = fract( x );
    f = f * f * ( 3.0 - 2.0 * f );
    return mix(
      mix( mix( sweepHash( i ), sweepHash( i + vec3( 1, 0, 0 ) ), f.x ),
           mix( sweepHash( i + vec3( 0, 1, 0 ) ), sweepHash( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
      mix( mix( sweepHash( i + vec3( 0, 0, 1 ) ), sweepHash( i + vec3( 1, 0, 1 ) ), f.x ),
           mix( sweepHash( i + vec3( 0, 1, 1 ) ), sweepHash( i + vec3( 1, 1, 1 ) ), f.x ), f.y ),
      f.z );
  }
  // Height above the seam. Both materials use the same field, so the parts
  // they keep meet exactly, with no gap and no overlap.
  float sweepField() {
    vec3 p = vSweepPos;
    float n = sweepNoise( p * vec3( 9.0, 3.0, 9.0 ) ) * 0.65 + sweepNoise( p * vec3( 24.0, 8.0, 24.0 ) ) * 0.35;
    return p.y - uSweepCut - ( n - 0.5 ) * SWEEP_WAVER;
  }
`;

const SWEEP_WAVER = 0.035; // how far the edge wanders, in piece heights
const SEAM_WIDTH = 0.0045;
const HALO_WIDTH = 0.045;

function withSweep(material: THREE.MeshPhysicalMaterial, sweep: Sweep) {
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    Object.assign(shader.uniforms, sweep);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vSweepPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvSweepPos = transformed;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n#define SWEEP_WAVER ${SWEEP_WAVER.toFixed(3)}\n${SWEEP_HEADER}`)
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
        float sweepF = sweepField();
        if ( uSweepSide * sweepF < 0.0 ) discard;`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        if ( uSweepSide != 0.0 ) {
          float sweepD = abs( sweepF );
          float seam = 1.0 - smoothstep( 0.0, ${SEAM_WIDTH.toFixed(4)}, sweepD );
          float halo = uSweepSide < 0.0 ? pow( 1.0 - smoothstep( 0.0, ${HALO_WIDTH.toFixed(3)}, sweepD ), 2.0 ) : 0.0;
          totalEmissiveRadiance += vec3( 1.0, 0.76, 0.42 ) * ( seam * 1.8 + halo * 0.05 );
        }`,
      );
  };
  material.customProgramCacheKey = () => "baked-ao+sweep";
  return material;
}

export function createKingMaterial(m: Material): KingMaterial {
  // Material data comes straight from the CMS. An unresolved reference or an
  // unknown grain renders as a plain colour rather than breaking the scene.
  const base = hex(m.color, PLAIN);
  const accent = hex(m.accent_color, base);
  const grainName = GRAINS.includes(m.grain) ? m.grain : "none";

  const sweep: Sweep = { uSweepCut: { value: 0 }, uSweepSide: { value: 0 } };
  const grain = getGrainTexture(grainName, base, accent);
  const map = grain?.texture ?? null;
  const metal = num(m.metalness, 0);

  const material = withSweep(withBakedOcclusion(new THREE.MeshPhysicalMaterial({
    color: map ? 0xffffff : base,
    map,
    roughness: num(m.roughness, 0.5),
    metalness: metal,
    clearcoat: num(m.clearcoat, 0),
    clearcoatRoughness: 0.25,
    envMapIntensity: metal > 0.5 ? 1.25 : 0.9,
  })), sweep);

  // Brushed metal: stretch highlights around the piece.
  if (grainName === "metal") {
    material.anisotropy = 0.6;
    material.anisotropyRotation = Math.PI / 2;
  }

  return { material, sweep, ready: grain?.ready ?? Promise.resolve() };
}

/** Show only the part of the piece below the seam at `height`. */
export function clipBelow(km: KingMaterial, height: number) {
  km.sweep.uSweepCut.value = height;
  km.sweep.uSweepSide.value = -1;
}

/** Show only the part of the piece above the seam at `height`. */
export function clipAbove(km: KingMaterial, height: number) {
  km.sweep.uSweepCut.value = height;
  km.sweep.uSweepSide.value = 1;
}

export function clipNone(km: KingMaterial) {
  km.sweep.uSweepSide.value = 0;
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
