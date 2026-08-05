"use client";

import { useProgress } from "@react-three/drei";

/**
 * Sits over the canvas while the maps stream in — the same pulsing line the
 * NASA overlay uses, so a wait always looks the same.
 */
export function SceneLoader({ label }: { label: string }) {
  const { active } = useProgress();
  if (!active) return null;

  return (
    <div className="scene-loading" role="status">
      {label}
    </div>
  );
}
