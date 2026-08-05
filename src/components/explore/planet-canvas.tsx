"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, Suspense, useRef, useState } from "react";
import * as THREE from "three";
import { Planet } from "@/components/three/planet";
import { Starfield } from "@/components/three/starfield";
import { StarPoints } from "@/components/three/star-points";
import type { Body } from "@/data/bodies";
import {
  usePrefersReducedMotion,
  useSegments,
  useTextureRes,
  type TextureRes,
} from "@/lib/preferences";

/**
 * Places the body on the right half of the frame in landscape and up top in
 * portrait, then slides it in the way the prototype's `enter="slide"` did.
 */
function Stage({
  body,
  reduced,
  res,
  segments,
}: {
  body: Body;
  reduced: boolean;
  res: TextureRes;
  segments: number;
}) {
  const group = useRef<THREE.Group>(null);
  const entered = useRef(0);
  const viewport = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);

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
    if (!group.current || entered.current === 1) return;
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

export const PlanetCanvas = memo(function PlanetCanvas({ body }: { body: Body }) {
  const reduced = usePrefersReducedMotion();
  const res = useTextureRes();
  const segments = useSegments();
  // a ceiling, not a fixed ratio — the device stays below it when it can
  const [dprCeiling, setDpr] = useState(1.5);

  return (
    <Canvas
      className="explore-canvas"
      aria-hidden
      dpr={[1, dprCeiling]}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 40, position: [0, 0, 6], near: 0.1, far: 1200 }}
      frameloop={reduced ? "demand" : "always"}
    >
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(1.5)}
        onFallback={() => setDpr(1)}
      />
      <ambientLight intensity={body.slug === "sun" ? 1 : 0.08} />
      <directionalLight position={[-4, 1.6, 3]} intensity={2.4} />
      <Suspense fallback={null}>
        {/* the sky is out of focus behind the body — it never needs the big map */}
        <Starfield res="1k" />
        <StarPoints count={1100} />
        <Stage key={body.slug} body={body} reduced={reduced} res={res} segments={segments} />
      </Suspense>
    </Canvas>
  );
});
