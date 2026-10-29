"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const EXPOSURE = 1.05;
const DURATION = 1.8;

/**
 * The studio lights come up: the scene renders from darkness and its exposure
 * eases up once `ready` (first texture drawn). Nothing pops in, and a slow
 * connection just means the page stays dark and calm a moment longer.
 */
export default function Reveal({
  ready,
  instant = false,
  onStart,
}: {
  ready: boolean;
  instant?: boolean;
  onStart?: () => void;
}) {
  const elapsed = useRef(0);
  const started = useRef(false);

  // The canvas starts at exposure 0 (set in onCreated); this eases it up.
  useFrame(({ gl }, dt) => {
    if (!ready) return;
    if (!started.current) {
      started.current = true;
      onStart?.();
    }
    if (elapsed.current >= DURATION) return;
    elapsed.current = instant ? DURATION : Math.min(DURATION, elapsed.current + dt);
    const t = elapsed.current / DURATION;
    // Ease out: most of the light arrives early, then settles.
    gl.toneMappingExposure = EXPOSURE * (1 - Math.pow(1 - t, 3));
  });

  return null;
}
