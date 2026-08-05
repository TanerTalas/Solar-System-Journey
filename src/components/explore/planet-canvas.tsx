"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { Planet } from "@/components/three/planet";
import { Starfield } from "@/components/three/starfield";
import type { Body } from "@/data/bodies";
import { usePrefersReducedMotion, useSegments, useTextureRes } from "@/lib/preferences";

/**
 * Places the body on the right half of the frame in landscape and up top in
 * portrait, then slides it in the way the prototype's `enter="slide"` did.
 */
function Stage({ body, reduced }: { body: Body; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const entered = useRef(0);
  const viewport = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);
  const res = useTextureRes();
  const segments = useSegments();

  const portrait = size.height * 1.1 > size.width;
  const targetX = portrait ? 0 : viewport.width * 0.24;
  const targetY = portrait ? viewport.height * 0.2 : 0;
  // rings reach far past the globe, so they set how big the globe can be
  const spread = body.ring ? body.ring.outer * 0.92 : 1;
  const radius =
    (portrait
      ? Math.min(viewport.width * 0.3, viewport.height * 0.22)
      : Math.min(viewport.height * 0.36, viewport.width * 0.24)) / spread;

  useFrame((_, dt) => {
    if (!group.current) return;
    entered.current = Math.min(1, entered.current + dt / (reduced ? 0.2 : 0.9));
    const t = 1 - Math.pow(1 - entered.current, 3);
    group.current.position.set(targetX + (1 - t) * radius * 1.6, targetY, 0);
    group.current.scale.setScalar(radius * (0.88 + 0.12 * t));
  });

  return (
    <group ref={group} position={[targetX, targetY, 0]} scale={radius}>
      <Planet body={body} res={res} segments={segments} spin={reduced ? 0 : 0.045} />
    </group>
  );
}

export function PlanetCanvas({ body }: { body: Body }) {
  const reduced = usePrefersReducedMotion();
  const res = useTextureRes();

  return (
    <Canvas
      className="explore-canvas"
      aria-hidden
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ fov: 40, position: [0, 0, 6], near: 0.1, far: 1200 }}
      frameloop={reduced ? "demand" : "always"}
    >
      <ambientLight intensity={body.slug === "sun" ? 1 : 0.08} />
      <directionalLight position={[-4, 1.6, 3]} intensity={2.4} />
      <Suspense fallback={null}>
        <Starfield res={res} />
        <Stage body={body} reduced={reduced} />
      </Suspense>
    </Canvas>
  );
}
