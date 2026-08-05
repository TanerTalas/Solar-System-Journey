"use client";

import { useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef } from "react";
import * as THREE from "three";

/** paints a canvas and hands back a texture, once */
function useCanvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    draw(canvas.getContext("2d")!, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
    // the draw call is a literal in every use below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** the accretion disc, hottest against the horizon and cooling outward */
function useDiscTexture() {
  return useCanvasTexture((ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0.0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.04, "rgba(255,252,240,0.8)");
    gradient.addColorStop(0.12, "rgba(255,214,150,0.62)");
    gradient.addColorStop(0.3, "rgba(255,146,56,0.34)");
    gradient.addColorStop(0.55, "rgba(206,88,28,0.14)");
    gradient.addColorStop(0.78, "rgba(130,48,18,0.04)");
    gradient.addColorStop(1.0, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // a few brighter streaks so the disc reads as turning
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * h;
      const x = 0.06 * w + Math.random() * 0.5 * w;
      ctx.fillStyle = `rgba(255,236,200,${0.05 + Math.random() * 0.12})`;
      ctx.fillRect(x, y, Math.random() * 0.3 * w, 1 + Math.random() * 2);
    }
  });
}

/** the photon ring: a thin bright annulus, drawn as a billboard */
function useRingTexture() {
  return useCanvasTexture((ctx, w) => {
    const r = w / 2;
    const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
    gradient.addColorStop(0.0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.44, "rgba(0,0,0,0)");
    gradient.addColorStop(0.485, "rgba(255,236,205,0.55)");
    gradient.addColorStop(0.5, "rgba(255,255,255,1)");
    gradient.addColorStop(0.53, "rgba(255,206,140,0.5)");
    gradient.addColorStop(0.66, "rgba(255,150,70,0.12)");
    gradient.addColorStop(1.0, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, w);
  });
}

/** the soft halo that stands in for the point of light before the burst */
function useGlowTexture() {
  return useCanvasTexture((ctx, w) => {
    const r = w / 2;
    const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
    gradient.addColorStop(0.0, "rgba(255,244,222,0.9)");
    gradient.addColorStop(0.22, "rgba(255,196,128,0.28)");
    gradient.addColorStop(1.0, "rgba(255,150,80,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, w);
  });
}

/** disc UVs run outward along the radius, like Saturn's rings */
function useDiscGeometry(inner: number, outer: number) {
  return useMemo(() => {
    const geometry = new THREE.RingGeometry(inner, outer, 180, 1);
    const position = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    uv.needsUpdate = true;
    return geometry;
  }, [inner, outer]);
}

/**
 * Sagittarius A* at the end of the line: an opaque horizon that eats the far
 * side of its own disc, a photon ring, and a halo. Unit radius — the parent
 * group scales it from a spark to the whole frame.
 */
export const BlackHole = forwardRef<THREE.Group, { spin: number }>(function BlackHole(
  { spin },
  ref,
) {
  const disc = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Sprite>(null);
  const discTexture = useDiscTexture();
  const ringTexture = useRingTexture();
  const glowTexture = useGlowTexture();
  const geometry = useDiscGeometry(1.28, 3.1);

  useFrame((_, dt) => {
    if (disc.current) disc.current.rotation.z += dt * spin;

    // the halo *is* the distant point of light; once the hole fills the frame
    // it would only wash the horizon out, so it leaves as the hole arrives
    const sprite = glow.current;
    if (sprite?.parent) {
      const scale = sprite.parent.scale.x;
      sprite.material.opacity = THREE.MathUtils.clamp(1.2 - scale / 2, 0, 1) * 0.6;
    }
  });

  return (
    <group ref={ref} visible={false}>
      {/* event horizon — opaque, so the disc passes behind it */}
      <mesh>
        <sphereGeometry args={[1, 48, 24]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>

      <group rotation={[-Math.PI / 2 + 0.3, 0, 0.35]}>
        <mesh ref={disc} geometry={geometry}>
          <meshBasicMaterial
            map={discTexture}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* the bright annulus sits at half the sprite's half-width, so 5.4 puts
          the photon ring at 1.35 radii — just clear of the horizon */}
      <sprite scale={[5.4, 5.4, 1]}>
        <spriteMaterial
          map={ringTexture}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          transparent
          toneMapped={false}
        />
      </sprite>

      <sprite ref={glow} scale={[14, 14, 1]}>
        <spriteMaterial
          map={glowTexture}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          transparent
          opacity={0.55}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
});
