"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Camera, Material } from "@/lib/types";
import { KingBody, KingCross } from "@/components/three/King";
import Studio from "@/components/three/Studio";
import Reveal from "@/components/three/Reveal";
import {
  clipAbove,
  clipBelow,
  clipNone,
  createKingMaterial,
  materialKey,
  type KingMaterial,
} from "@/components/three/kingMaterial";

/** One keyframe of the story: where the camera is and what the king is made of. */
export interface Stop {
  camera: Camera;
  material: Material;
}

const { damp, lerp, smoothstep, degToRad, clamp } = THREE.MathUtils;
const PARAMS = ["azimuth", "elevation", "distance", "focus", "offset"] as const;

interface StoryProps {
  stops: Stop[];
  progress: RefObject<number>;
  reducedMotion: boolean;
  /** Called once, when the lights start coming up. */
  onReveal?: () => void;
}

function Rig({ stops, progress, reducedMotion, onReveal }: StoryProps) {
  const camera = useThree((s) => s.camera as THREE.PerspectiveCamera);
  const size = useThree((s) => s.size);

  // One shader per distinct material in the story. Keyed on the material's
  // values, so editing a colour in Visual Builder rebuilds just that shader.
  const signature = stops.map((s) => materialKey(s.material)).join(",");
  const kings = useMemo(() => {
    const map = new Map<string, KingMaterial>();
    for (const s of stops) {
      const key = materialKey(s.material);
      if (!map.has(key)) map.set(key, createKingMaterial(s.material));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  useEffect(() => () => kings.forEach((k) => k.material.dispose()), [kings]);

  // The reveal waits for the first chapter's grain; later ones finish drawing
  // in the background long before they are scrolled to.
  const [ready, setReady] = useState(false);
  const firstKey = materialKey(stops[0].material);
  useEffect(() => {
    let live = true;
    kings.get(firstKey)?.ready.then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, [kings, firstKey]);

  const groups = useRef(new Map<string, THREE.Group>());
  const f = useRef(progress.current ?? 0);
  const cam = useRef<Camera>({ ...stops[0].camera });
  const pivot = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const last = stops.length - 1;
    const speed = reducedMotion ? 1000 : 1;
    const raw = progress.current ?? 0;
    // Reduced motion: no flying between chapters, the camera cuts to the
    // nearest one. A bad measurement can never leave the camera at NaN.
    const goal = clamp(Number.isFinite(raw) ? (reducedMotion ? Math.round(raw) : raw) : 0, 0, last);
    f.current = damp(Number.isFinite(f.current) ? f.current : goal, goal, 3.5 * speed, dt);

    const i = Math.min(Math.floor(f.current), last);
    const j = Math.min(i + 1, last);
    const t = f.current - i;

    // Camera holds while a chapter is centred, then glides to the next one.
    const glide = smoothstep(t, 0.12, 0.88);
    const a = stops[i].camera;
    const b = stops[j].camera;
    for (const p of PARAMS) {
      const target = lerp(a[p] ?? 0, b[p] ?? 0, glide);
      cam.current[p] = damp(cam.current[p] ?? target, target, 5 * speed, dt);
    }

    // Material sweep: the next material rises up the piece from the base.
    const keyA = materialKey(stops[i].material);
    const keyB = materialKey(stops[j].material);
    const kmA = kings.get(keyA)!;
    const kmB = kings.get(keyB)!;
    groups.current.forEach((g, key) => (g.visible = key === keyA || key === keyB));
    if (keyA === keyB) {
      clipNone(kmA);
    } else {
      // Starts and ends just past the piece so the wavering edge never shows a stray fleck.
      const h = lerp(-0.05, 1.05, smoothstep(t, 0.2, 0.8));
      clipAbove(kmA, h);
      clipBelow(kmB, h);
    }

    // Spherical camera around the focus point on the piece.
    const { azimuth, elevation, focus, offset } = cam.current;
    // Portrait screens have a narrow horizontal view, so back the camera off
    // to keep the same framing the editor set on desktop.
    const aspect = size.width / size.height;
    const distance = cam.current.distance * (aspect < 1 ? 1 + (1 - aspect) * 0.7 : 1);
    const az = degToRad(azimuth);
    const el = degToRad(elevation);
    const target = new THREE.Vector3(0, focus, 0);
    camera.position.set(
      target.x + distance * Math.cos(el) * Math.sin(az),
      target.y + distance * Math.sin(el),
      target.z + distance * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(target);

    // Slide the piece beside the copy on wide screens; centre it on phones.
    const shift = size.width >= 768 ? -offset * size.width * 0.32 : 0;
    camera.setViewOffset(size.width, size.height, shift, 0, size.width, size.height);

    // A barely-there breathing sway so the light keeps moving across the grain.
    if (pivot.current && !reducedMotion) {
      pivot.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.06;
    }
  });

  return (
    <group ref={pivot}>
      <Reveal ready={ready} instant={reducedMotion} onStart={onReveal} />
      {[...kings.entries()].map(([key, km]) => (
        <group
          key={key}
          ref={(g) => {
            if (g) groups.current.set(key, g);
            else groups.current.delete(key);
          }}
        >
          <KingBody km={km} />
        </group>
      ))}
      <KingCross />
    </group>
  );
}

export default function StoryCanvas({ stops, progress, reducedMotion, onReveal }: StoryProps) {
  if (!stops.length) return null;
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 26, near: 0.05, far: 50, position: [0, 0.5, 3] }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0; // <Reveal> brings the lights up
      }}
    >
      <Studio />
      <Rig stops={stops} progress={progress} reducedMotion={reducedMotion} onReveal={onReveal} />
    </Canvas>
  );
}
