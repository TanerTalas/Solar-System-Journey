"use client";

import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Body } from "@/data/bodies";
import type { TextureRes } from "@/lib/preferences";

const url = (res: TextureRes, name: string) => `/textures/${res}/${name}.webp`;

/** colour maps are authored in sRGB and wrap the sphere seamlessly */
function useColorMap(path: string) {
  const gl = useThree((s) => s.gl);

  return useTexture(path, (loaded) => {
    for (const texture of Array.isArray(loaded) ? loaded : [loaded]) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = gl.capabilities.getMaxAnisotropy();
      texture.wrapS = THREE.RepeatWrapping;
      texture.needsUpdate = true;
    }
  }) as THREE.Texture;
}

/** a soft radial halo, drawn once into a canvas */
function useGlowTexture(color: string) {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.35, "rgba(255,214,150,0.30)");
    gradient.addColorStop(1, "rgba(255,190,120,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [color]);
}

function SunGlow() {
  const texture = useGlowTexture("rgba(255,246,214,0.85)");
  return (
    <sprite scale={[4.6, 4.6, 1]}>
      <spriteMaterial
        map={texture}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        toneMapped={false}
      />
    </sprite>
  );
}

function Clouds({ res, segments }: { res: TextureRes; segments: number }) {
  const map = useColorMap(url(res, "earth-clouds"));
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (mesh.current) mesh.current.rotation.y += dt * 0.012;
  });

  return (
    <mesh ref={mesh} scale={1.012}>
      <sphereGeometry args={[1, segments, segments / 2]} />
      <meshStandardMaterial
        map={map}
        alphaMap={map}
        transparent
        opacity={0.62}
        depthWrite={false}
        roughness={1}
      />
    </mesh>
  );
}

/** ring UVs run outward along the radius, not around the disc */
function useRingGeometry(inner: number, outer: number, segments: number) {
  return useMemo(() => {
    const geometry = new THREE.RingGeometry(inner, outer, segments, 1);
    const position = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const v = new THREE.Vector3();

    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i);
      const t = (v.length() - inner) / (outer - inner);
      uv.setXY(i, t, 0.5);
    }
    uv.needsUpdate = true;
    return geometry;
  }, [inner, outer, segments]);
}

function Ring({ body, res, segments }: { body: Body; res: TextureRes; segments: number }) {
  const map = useColorMap(url(res, "saturn-ring"));
  const geometry = useRingGeometry(body.ring!.inner, body.ring!.outer, segments * 2);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshBasicMaterial map={map} side={THREE.DoubleSide} transparent opacity={0.92} />
    </mesh>
  );
}

type PlanetProps = {
  body: Body;
  res: TextureRes;
  segments: number;
  /** turns per second at the equator; 0 freezes the body */
  spin?: number;
  detail?: boolean;
};

/**
 * A unit-radius body: scale the parent group to size it.
 * The Sun lights the scene rather than being lit by it.
 */
export function Planet({ body, res, segments, spin = 0, detail = true }: PlanetProps) {
  const map = useColorMap(url(res, body.texture));
  const mesh = useRef<THREE.Mesh>(null);
  const isSun = body.slug === "sun";

  useFrame((_, dt) => {
    if (!mesh.current || !spin) return;
    // Venus and Uranus turn the other way
    mesh.current.rotation.y += dt * spin * Math.sign(body.dayHours);
  });

  return (
    <group rotation={[0, 0, THREE.MathUtils.degToRad(body.tiltDeg)]}>
      <mesh ref={mesh}>
        <sphereGeometry args={[1, segments, segments / 2]} />
        {isSun ? (
          <meshBasicMaterial map={map} toneMapped={false} />
        ) : (
          <meshStandardMaterial map={map} roughness={1} metalness={0} />
        )}
      </mesh>

      {isSun && <SunGlow />}
      {detail && body.slug === "earth" && <Clouds res={res} segments={segments} />}
      {detail && body.ring && <Ring body={body} res={res} segments={segments} />}
    </group>
  );
}
