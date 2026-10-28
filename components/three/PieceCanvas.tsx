"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Material } from "@/lib/types";
import King from "./King";
import type { SilhouetteName } from "./kingGeometry";
import Studio from "./Studio";
import { createKingMaterial, materialKey } from "./kingMaterial";

function Piece({ material, spin, silhouette }: { material: Material; spin: boolean; silhouette?: SilhouetteName }) {
  const key = materialKey(material);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const km = useMemo(() => createKingMaterial(material), [key]);
  useEffect(() => () => km.material.dispose(), [km]);

  const group = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  useFrame((_, dt) => {
    if (!group.current || !spin) return;
    group.current.rotation.y += dt * 0.5;
    invalidate();
  });

  return (
    <group ref={group}>
      <King km={km} silhouette={silhouette} />
    </group>
  );
}

/**
 * A single king on its own canvas. `interactive` adds drag-to-turn (product
 * page); otherwise it renders on demand and only spins while `spin` is true
 * (collection cards), so five of them on one page stay cheap.
 */
export default function PieceCanvas({
  material,
  interactive = false,
  spin = false,
  distance = 3,
  silhouette,
}: {
  material: Material;
  interactive?: boolean;
  spin?: boolean;
  distance?: number;
  silhouette?: SilhouetteName;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={interactive ? "always" : "demand"}
      camera={{ fov: 26, near: 0.05, far: 50, position: [distance * 0.34, 0.5 + distance * 0.12, distance * 0.94] }}
      gl={{ antialias: true }}
      onCreated={({ gl, camera }) => {
        gl.localClippingEnabled = true;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        camera.lookAt(0, 0.47, 0);
      }}
    >
      <Studio shadowOpacity={0.7} />
      <Piece material={material} spin={spin} silhouette={silhouette} />
      {interactive && (
        <OrbitControls
          target={[0, 0.47, 0]}
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.06}
          autoRotate
          autoRotateSpeed={0.6}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.52}
        />
      )}
    </Canvas>
  );
}
