"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

/** a soft round dot — square points read as dust, not as stars */
function useDotTexture() {
  return useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    // a hard core with a short falloff: a soft blob at this size is invisible
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.32, "rgba(255,255,255,0.95)");
    gradient.addColorStop(0.52, "rgba(255,255,255,0.35)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

/** scattered over a shell, tinted the way real stars are */
function useStarGeometry(count: number, radius: number, seed: number) {
  return useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    // a small deterministic generator, so the sky is the same on every load
    let state = seed;
    const random = () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
    const colour = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const r = radius * (0.75 + random() * 0.25);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // most are faint; a few carry the frame
      const brightness = Math.pow(random(), 1.6) * 0.62 + 0.38;
      const warm = random();
      colour.setRGB(
        brightness * (0.78 + warm * 0.22),
        brightness * (0.82 + warm * 0.13),
        brightness * (0.95 - warm * 0.17),
      );
      colors[i * 3] = colour.r;
      colors[i * 3 + 1] = colour.g;
      colors[i * 3 + 2] = colour.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [count, radius, seed]);
}

type LayerProps = { count: number; radius: number; size: number; seed: number; opacity: number };

function Layer({
  count,
  radius,
  size,
  seed,
  opacity,
  dim,
}: LayerProps & { dim?: RefObject<number> }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useStarGeometry(count, radius, seed);
  const map = useDotTexture();

  useFrame(({ camera }) => {
    const node = points.current;
    if (!node) return;
    // stars belong at infinity: they ride along, they never slide past
    node.position.copy(camera.position);
    if (dim) (node.material as THREE.PointsMaterial).opacity = opacity * dim.current;
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={map}
        size={size}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
        fog={false}
      />
    </points>
  );
}

/**
 * Individual stars, over the Milky Way haze. Two layers: a wide faint one and
 * a sparse bright one, so the sky has a few points that actually carry.
 * `dim` fades them out — the finale needs an empty sky before the hole lands.
 */
export function StarPoints({ count = 1200, dim }: { count?: number; dim?: RefObject<number> }) {
  return (
    <>
      <Layer count={count} radius={600} size={2.6} seed={20260805} opacity={0.85} dim={dim} />
      <Layer
        count={Math.round(count / 9)}
        radius={520}
        size={5.4}
        seed={77002153}
        opacity={1}
        dim={dim}
      />
    </>
  );
}
