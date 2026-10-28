"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";

// A small photo studio built from light panels instead of an HDR download:
// no network request, and the reflections read as softboxes on brass and marble.
// Metals show nothing but their surroundings, so the "room" is a warm dark
// grey rather than black, with broad panels for the polish to pick up.
export default function Studio({ shadowOpacity = 0.55 }: { shadowOpacity?: number }) {
  return (
    <>
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#17140f"]} />
        {/* Key: tall strip, camera left */}
        <Lightformer form="rect" intensity={4} position={[-3, 1.5, 2]} rotation-y={Math.PI / 3} scale={[1.4, 6, 1]} color="#fff4e3" />
        {/* Fill: wide and soft, camera right */}
        <Lightformer form="rect" intensity={1.2} position={[3, 1, 2.5]} rotation-y={-Math.PI / 3} scale={[4, 3, 1]} />
        {/* Rim: behind the piece, carves the silhouette */}
        <Lightformer form="rect" intensity={3} position={[0, 2, -3.5]} scale={[6, 0.8, 1]} />
        {/* Side strips so turned profiles catch a highlight from any azimuth */}
        <Lightformer form="rect" intensity={1.6} position={[-4, 0.5, -1.5]} rotation-y={Math.PI / 2} scale={[3, 1.2, 1]} color="#ffe6c4" />
        <Lightformer form="rect" intensity={1.6} position={[4, 0.5, -1.5]} rotation-y={-Math.PI / 2} scale={[3, 1.2, 1]} />
        {/* Soft front panel behind the camera, so flat faces (the cross) never mirror black */}
        <Lightformer form="rect" intensity={0.9} position={[0, 1, 5]} scale={[5, 3, 1]} />
        {/* Ceiling bounce and a warm floor bounce */}
        <Lightformer form="circle" intensity={1.4} position={[0, 4, 0]} rotation-x={Math.PI / 2} scale={4} />
        <Lightformer form="rect" intensity={0.5} position={[0, -2, 0]} rotation-x={-Math.PI / 2} scale={[8, 8, 1]} color="#5a4630" />
      </Environment>

      <ambientLight intensity={0.05} />
      <directionalLight position={[-2.5, 4, 3]} intensity={1.4} color="#fff3e2" />
      <directionalLight position={[2, 2, -3]} intensity={0.9} color="#dfe6ff" />

      <ContactShadows position={[0, 0.0005, 0]} opacity={shadowOpacity} scale={2.4} blur={2.6} far={0.8} frames={1} resolution={512} color="#000000" />
    </>
  );
}
