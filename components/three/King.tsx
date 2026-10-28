"use client";

import { useMemo } from "react";
import { createBodyGeometry, createCrossGeometry } from "./kingGeometry";
import type { KingMaterial } from "./kingMaterial";

let shared: { body: ReturnType<typeof createBodyGeometry>; cross: ReturnType<typeof createCrossGeometry> } | null =
  null;

function geometry() {
  shared ??= { body: createBodyGeometry(), cross: createCrossGeometry() };
  return shared;
}

export default function King({ km, visible = true }: { km: KingMaterial; visible?: boolean }) {
  const { body, cross } = useMemo(() => geometry(), []);
  return (
    <group visible={visible}>
      <mesh geometry={body} material={km.material} castShadow receiveShadow />
      <mesh geometry={cross} material={km.material} castShadow />
    </group>
  );
}
