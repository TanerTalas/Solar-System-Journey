"use client";

import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { TextureRes } from "@/lib/preferences";

/** the Milky Way, painted on the inside of a very large sphere */
export function Starfield({ res, radius = 400 }: { res: TextureRes; radius?: number }) {
  const map = useTexture(`/textures/${res}/stars.webp`, (loaded) => {
    for (const texture of Array.isArray(loaded) ? loaded : [loaded]) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
  }) as THREE.Texture;

  return (
    <mesh scale={[-1, 1, 1]} rotation={[0, 0, 0.38]}>
      <sphereGeometry args={[radius, 48, 24]} />
      <meshBasicMaterial map={map} side={THREE.BackSide} toneMapped={false} color="#6c6c80" />
    </mesh>
  );
}
