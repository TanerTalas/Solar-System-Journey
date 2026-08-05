"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { memo, Suspense, useState } from "react";
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

/**
 * Memoised on purpose: the HUD writes to the DOM rather than to state, so this
 * tree only ever re-renders when the flight itself changes.
 */
export const JourneyCanvas = memo(function JourneyCanvas(props: Props) {
  // a ceiling, not a fixed ratio — the device stays below it when it can
  const [dprCeiling, setDpr] = useState(1.5);

  return (
    <Canvas
      className="journey-canvas"
      aria-hidden
      dpr={[1, dprCeiling]}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 45, position: [0, 0, 0], near: 0.005, far: 20000 }}
    >
      {/* ten bodies at once: give the pixels back before the frame rate goes */}
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(1.5)}
        onFallback={() => setDpr(1)}
      />
      <Suspense fallback={null}>
        {/* nothing here is ever closer than a flyby, so 1k maps are already
            about one texel per pixel — and twelve of them stay in memory */}
        <Starfield res="1k" radius={9000} />
        <JourneyScene {...props} />
      </Suspense>
    </Canvas>
  );
});
