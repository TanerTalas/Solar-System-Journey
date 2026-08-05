"use client";

import { useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef } from "react";
import * as THREE from "three";

function makeTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** temperature ramp from the inner edge outward */
function discColor(t: number) {
  const stops: [number, [number, number, number]][] = [
    [0.0, [255, 253, 246]],
    [0.12, [255, 232, 186]],
    [0.32, [255, 186, 104]],
    [0.62, [236, 122, 44]],
    [1.0, [150, 56, 20]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (t > stops[i][0] && i < stops.length - 1) continue;
    const [t0, a] = stops[i - 1];
    const [t1, b] = stops[i];
    const k = THREE.MathUtils.clamp((t - t0) / (t1 - t0), 0, 1);
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  }
  return stops[0][1];
}

/**
 * The disc, unrolled: x runs outward along the radius, y runs around it.
 * Written pixel by pixel — canvas composite modes would fill the transparent
 * parts, and the disc lives or dies on where it is *not* there.
 */
function useDiscTexture() {
  return useMemo(() => {
    const w = 1024;
    const h = 256;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    const image = ctx.createImageData(w, h);

    for (let x = 0; x < w; x++) {
      const t = x / (w - 1);

      // hot and dense against the horizon, thinning outward
      const rise = THREE.MathUtils.smoothstep(t, 0, 0.035);
      const falloff = Math.exp(-3.1 * t) * (1 - THREE.MathUtils.smoothstep(t, 0.86, 1));
      // the disc is made of rings, not of paint
      const bands =
        0.78 +
        0.22 * (Math.sin(t * 71) * 0.45 + Math.sin(t * 139 + 1.7) * 0.32 + Math.sin(t * 17) * 0.23);
      const intensity = rise * falloff * bands;
      const [r, g, b] = discColor(t);

      for (let y = 0; y < h; y++) {
        // Doppler beaming: the side turning toward us outshines the other
        const angle = y / h;
        const beam = Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * (angle - 0.25)), 1.7);
        const level = intensity * (0.22 + 1.35 * beam);
        const i = (y * w + x) * 4;
        image.data[i] = r;
        image.data[i + 1] = g;
        image.data[i + 2] = b;
        image.data[i + 3] = Math.round(255 * THREE.MathUtils.clamp(level, 0, 1));
      }
    }

    ctx.putImageData(image, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, []);
}

/** the photon ring: one thin, very bright annulus */
function useRingTexture() {
  return useMemo(
    () =>
      makeTexture(1024, 1024, (ctx, w) => {
        const r = w / 2;
        const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
        gradient.addColorStop(0.0, "rgba(0,0,0,0)");
        gradient.addColorStop(0.468, "rgba(0,0,0,0)");
        gradient.addColorStop(0.484, "rgba(255,226,178,0.4)");
        gradient.addColorStop(0.5, "rgba(255,255,255,1)");
        gradient.addColorStop(0.516, "rgba(255,214,150,0.42)");
        gradient.addColorStop(0.58, "rgba(255,150,70,0.08)");
        gradient.addColorStop(1.0, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, w);
      }),
    [],
  );
}

/**
 * The lensed image of the disc: light from behind and beneath the hole, bent
 * up over the top and down under the bottom. It closes the loop that the flat
 * disc alone cannot draw, and it is masked out across the middle so it does
 * not double up on the band already crossing there.
 */
function useLensTexture() {
  return useMemo(() => {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const image = ctx.createImageData(size, size);
    const half = size / 2;

    for (let y = 0; y < size; y++) {
      const dy = (y - half) / half;
      for (let x = 0; x < size; x++) {
        const dx = (x - half) / half;
        const radius = Math.hypot(dx, dy) || 1e-6;

        // a thin loop at 0.6 of the sprite...
        const ring = Math.exp(-Math.pow((radius - 0.6) / 0.052, 2));
        // ...held to the top and the bottom, where the flat disc cannot reach
        const vertical = Math.pow(Math.abs(dy) / radius, 2.6);
        const level = radius < 1 ? ring * vertical : 0;

        const i = (y * size + x) * 4;
        image.data[i] = 255;
        image.data[i + 1] = 214;
        image.data[i + 2] = 152;
        image.data[i + 3] = Math.round(255 * THREE.MathUtils.clamp(level, 0, 1));
      }
    }

    ctx.putImageData(image, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

/** the soft halo that stands in for the point of light before the burst */
function useGlowTexture() {
  return useMemo(
    () =>
      makeTexture(512, 512, (ctx, w) => {
        const r = w / 2;
        const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
        gradient.addColorStop(0.0, "rgba(255,244,222,0.9)");
        gradient.addColorStop(0.22, "rgba(255,196,128,0.28)");
        gradient.addColorStop(1.0, "rgba(255,150,80,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, w);
      }),
    [],
  );
}

/** disc UVs: u outward along the radius, v around the disc */
function useDiscGeometry(inner: number, outer: number) {
  return useMemo(() => {
    const geometry = new THREE.RingGeometry(inner, outer, 220, 2);
    const position = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i);
      const angle = (Math.atan2(v.y, v.x) + Math.PI) / (Math.PI * 2);
      uv.setXY(i, (v.length() - inner) / (outer - inner), angle);
    }
    uv.needsUpdate = true;
    return geometry;
  }, [inner, outer]);
}

/**
 * Sagittarius A*: an opaque horizon that eats the far side of its own disc, a
 * thin photon ring, and the lensed arcs that close the loop above and below.
 * Unit radius — the parent group scales it from a spark to the whole frame.
 */
export const BlackHole = forwardRef<THREE.Group, { spin: number }>(function BlackHole(
  { spin },
  ref,
) {
  const disc = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Sprite>(null);
  const discTexture = useDiscTexture();
  const ringTexture = useRingTexture();
  const lensTexture = useLensTexture();
  const glowTexture = useGlowTexture();
  const geometry = useDiscGeometry(1.3, 3.2);

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
        <sphereGeometry args={[1, 64, 32]} />
        <meshBasicMaterial color="#000000" toneMapped={false} fog={false} />
      </mesh>

      {/* nearly edge-on, the way the iconic image sits */}
      <group rotation={[-Math.PI / 2 + 0.16, 0, 0.22]}>
        <mesh ref={disc} geometry={geometry}>
          <meshBasicMaterial
            map={discTexture}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            transparent
            toneMapped={false}
            fog={false}
          />
        </mesh>
      </group>

      {/* lensed arcs, drawn over everything — this light comes round the hole */}
      <sprite scale={[6.4, 6.4, 1]}>
        <spriteMaterial
          map={lensTexture}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          transparent
          opacity={0.8}
          toneMapped={false}
          fog={false}
        />
      </sprite>

      {/* the bright annulus sits at half the sprite's half-width, so 5.2 puts
          the photon ring at 1.3 radii — just clear of the horizon */}
      <sprite scale={[5.2, 5.2, 1]}>
        <spriteMaterial
          map={ringTexture}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          transparent
          toneMapped={false}
          fog={false}
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
          fog={false}
        />
      </sprite>
    </group>
  );
});
