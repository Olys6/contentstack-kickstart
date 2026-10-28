"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Inertial scrolling, which is what makes the camera moves feel continuous.
// Skipped for people who ask the OS for reduced motion.
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.085, wheelMultiplier: 0.9 });
    return () => lenis.destroy();
  }, []);
  return null;
}
