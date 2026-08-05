"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { memo, Suspense, useState } from "react";
import { JourneyScene, type Stage, type Tick } from "@/components/journey/journey-scene";
import { useCoarsePointer } from "@/lib/preferences";

type Props = {
  running: boolean;
  pace: number;
  reduced: boolean;
  /** the raymarched finale is expensive; it renders at the prototype's ratio */
  lensing: boolean;
  skipToken: number;
  replayToken: number;
  onTick: (tick: Tick) => void;
  onStage: (stage: Stage) => void;
};

/**
 * Memoised on purpose: the HUD writes to the DOM rather than to state, so this
 * tree only ever re-renders when the flight itself changes.
 */
export const JourneyCanvas = memo(function JourneyCanvas(props: Props) {
  // a ceiling, not a fixed ratio — the device stays below it when it can
  const [dprCeiling, setDpr] = useState(1.5);
  const coarse = useCoarsePointer();
  // the prototype's viewer pins the raymarched pass to 1.0 (0.75 on phones)
  const ceiling = props.lensing ? (coarse ? 0.75 : 1) : dprCeiling;

  return (
    <Canvas
      className="journey-canvas"
      aria-hidden
      dpr={[Math.min(1, ceiling), ceiling]}
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
        <JourneyScene {...props} />
      </Suspense>
    </Canvas>
  );
});
