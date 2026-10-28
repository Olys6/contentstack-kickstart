"use client";

import { useMemo } from "react";
import type * as THREE from "three";
import { SILHOUETTE, createBodyGeometry, createCrossGeometry, type SilhouetteName } from "./kingGeometry";
import { getHardwareMaterial, type KingMaterial } from "./kingMaterial";

const cache = new Map<SilhouetteName, { body: THREE.BufferGeometry; cross: THREE.BufferGeometry }>();

function geometry(name: SilhouetteName) {
  let g = cache.get(name);
  if (!g) {
    g = { body: createBodyGeometry(name), cross: createCrossGeometry(name) };
    cache.set(name, g);
  }
  return g;
}

/** The turned body in its material. */
export function KingBody({ km, silhouette = SILHOUETTE }: { km: KingMaterial; silhouette?: SilhouetteName }) {
  const { body } = useMemo(() => geometry(silhouette), [silhouette]);
  return <mesh geometry={body} material={km.material} castShadow receiveShadow />;
}

/** The brass cross, shared by every king and never part of a material sweep. */
export function KingCross({ silhouette = SILHOUETTE }: { silhouette?: SilhouetteName }) {
  const { cross } = useMemo(() => geometry(silhouette), [silhouette]);
  return <mesh geometry={cross} material={getHardwareMaterial()} castShadow />;
}

export default function King({ km, silhouette = SILHOUETTE }: { km: KingMaterial; silhouette?: SilhouetteName }) {
  return (
    <group>
      <KingBody km={km} silhouette={silhouette} />
      <KingCross silhouette={silhouette} />
    </group>
  );
}
