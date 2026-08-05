"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { JourneyScene, type Tick } from "@/components/journey/journey-scene";
import { Starfield } from "@/components/three/starfield";

type Props = {
  running: boolean;
  pace: number;
  spin: number;
  skipToken: number;
  replayToken: number;
  onTick: (tick: Tick) => void;
  onEnd: () => void;
};

export function JourneyCanvas(props: Props) {
  return (
    <Canvas
      className="journey-canvas"
      aria-hidden
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ fov: 45, position: [0, 0, 0], near: 0.005, far: 20000 }}
    >
      <Suspense fallback={null}>
        <Starfield res="2k" radius={9000} />
        <JourneyScene {...props} />
      </Suspense>
    </Canvas>
  );
}
