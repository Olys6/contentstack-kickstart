"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Material } from "@/lib/types";
import King from "./King";
import type { SilhouetteName } from "./kingGeometry";
import Studio from "./Studio";
import Reveal from "./Reveal";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { createKingMaterial, materialKey } from "./kingMaterial";

function Piece({ material, spin, silhouette }: { material: Material; spin: boolean; silhouette?: SilhouetteName }) {
  const key = materialKey(material);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const km = useMemo(() => createKingMaterial(material), [key]);
  useEffect(() => () => km.material.dispose(), [km]);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    km.ready.then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, [km]);
  const reducedMotion = useReducedMotion();

  const group = useRef<THREE.Group>(null);
  const revealed = useRef(false);
  const invalidate = useThree((s) => s.invalidate);
  useFrame((_, dt) => {
    // On-demand canvases only draw when asked; keep asking while the lights come up.
    if (!ready || !revealed.current) invalidate();
    if (!group.current || !spin) return;
    group.current.rotation.y += dt * 0.5;
    invalidate();
  });

  return (
    <group ref={group}>
      <Reveal ready={ready} instant={reducedMotion} onStart={() => setTimeout(() => (revealed.current = true), 2000)} />
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
  label,
}: {
  /** Accessible description, e.g. "3D model: The King — Walnut". */
  label: string;
  material: Material;
  interactive?: boolean;
  spin?: boolean;
  distance?: number;
  silhouette?: SilhouetteName;
}) {
  return (
    <div role="img" aria-label={label} className="h-full w-full">
    <Canvas
      dpr={[1, 2]}
      frameloop={interactive ? "always" : "demand"}
      camera={{ fov: 26, near: 0.05, far: 50, position: [distance * 0.34, 0.5 + distance * 0.12, distance * 0.94] }}
      gl={{ antialias: true }}
      onCreated={({ gl, camera }) => {
        gl.localClippingEnabled = true;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0; // <Reveal> brings the lights up
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
    </div>
  );
}
