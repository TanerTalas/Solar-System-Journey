"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useCoarsePointer } from "@/lib/preferences";

/**
 * Sagittarius A*, raymarched.
 *
 * Ported from the prototype's `black-hole.js`: photons are integrated through
 * the Schwarzschild field (`acc = -1.5·h²·p / r⁵`), the disc is sampled
 * wherever a ray crosses the equatorial plane, and whatever escapes reads the
 * sky. Distances are in Schwarzschild radii, matching the `distance` control
 * in `Black Hole Only.dc.html` (8.5–34 rs, default 13.5).
 */

const VERTEX = /* glsl */ `
varying vec2 vUv;
uniform float uScale;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy * uScale, 0.0, 1.0);
}
`;

const fragment = (steps: number) => /* glsl */ `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform vec3  uCam;
uniform mat3  uBasis;
uniform float uTan;
uniform float uReveal;
uniform float uSky;
varying vec2 vUv;

float hash21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x), mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x), f.y);
}
float fbm2(vec2 p){ float a=0.5,s=0.0; for(int i=0;i<5;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }

vec3 starLayer(vec2 uv, float dens, float thr, vec3 tint){
  vec2 g = uv*vec2(dens*2.0, dens);
  vec2 id = floor(g), f = fract(g)-0.5;
  float h = hash21(id);
  if(h < thr) return vec3(0.0);
  vec2 off = vec2(hash21(id+1.7), hash21(id+9.1))-0.5;
  float d = length((f-off*0.72)*vec2(1.0,1.0));
  float b = smoothstep(0.10,0.0,d);
  float w = hash21(id+4.3);
  vec3 c = mix(vec3(0.72,0.80,1.0), vec3(1.0,0.86,0.66), w);
  return c*tint*b*(0.25+0.95*hash21(id+2.9));
}
vec3 sky(vec3 d){
  vec2 uv = vec2(atan(d.z,d.x)*0.15915494+0.5, acos(clamp(d.y,-1.0,1.0))*0.31830989);
  vec3 col = starLayer(uv, 260.0, 0.915, vec3(1.0))
           + starLayer(uv, 130.0, 0.955, vec3(1.1))*1.6
           + starLayer(uv, 620.0, 0.88,  vec3(0.7))*0.5;
  float n = fbm2(uv*vec2(9.0,4.5));
  vec3 neb = mix(vec3(0.035,0.030,0.075), vec3(0.10,0.055,0.13), n);
  col += neb*pow(n,2.6)*0.55;
  col += vec3(0.006,0.007,0.014);
  return col;
}
vec3 disk(vec3 q, vec3 rd){
  float r = length(q);
  float t = (r-2.35)/(16.5-2.35);
  float ang = atan(q.z,q.x);
  float sw = ang + 14.0/pow(r,0.52) - uTime*0.34;
  float f1 = 0.5+0.5*sin(sw*3.0);
  float f2 = 0.5+0.5*sin(sw*9.0 + r*0.60);
  float f3 = 0.5+0.5*sin(sw*23.0 - r*1.70);
  float f4 = 0.5+0.5*sin(sw*57.0 + r*3.10);
  float turb = fbm2(vec2(sw*2.2, r*0.9));
  float fil = mix(f1,f2,0.6)*0.52 + pow(f3,2.0)*0.30 + pow(f4,3.0)*0.32;
  fil *= 0.50 + 0.85*turb;
  float dens = smoothstep(0.0,0.06,t)*smoothstep(1.0,0.55,t)*(0.20+1.05*fil);
  vec3 c = mix(vec3(1.00,0.99,0.97), vec3(1.00,0.74,0.40), smoothstep(0.0,0.30,t));
  c = mix(c, vec3(0.94,0.42,0.17), smoothstep(0.30,0.72,t));
  c = mix(c, vec3(0.58,0.21,0.09), smoothstep(0.72,1.0,t));
  float knot = smoothstep(0.58,0.93, fbm2(vec2(sw*1.4+3.0, r*0.7 - uTime*0.15)));
  knot *= smoothstep(0.62,0.08,t);
  c = mix(c, vec3(0.62,0.82,1.25), knot*1.0);
  dens += knot*1.25;
  vec3 vd = normalize(cross(vec3(0.0,1.0,0.0), q));
  float beta = 0.72/sqrt(max(r,1.15));
  float dop = 1.0/(1.0 - beta*dot(vd, normalize(-rd)));
  c *= pow(clamp(dop,0.22,3.6), 3.2);
  c *= clamp(pow(3.1/r, 1.55), 0.04, 3.0);
  return c*dens*2.6;
}
void main(){
  vec2 uv = (vUv - 0.5) * vec2(uRes.x/uRes.y, 1.0) * 2.0 * uTan;
  vec3 rd = normalize(uBasis * vec3(uv, -1.0));
  vec3 p = uCam, v = rd;
  bool skip = false;
  if(length(p) > 40.0){
    float tc = -dot(p,v);
    float b2 = dot(p,p) - tc*tc;
    if(tc > 0.0 && b2 < 1600.0) p += v*max(tc - sqrt(1600.0-b2), 0.0);
    else skip = true;
  }
  vec3 h = cross(p,v);
  float h2 = dot(h,h);
  vec3 col = vec3(0.0);
  bool caught = false;
  if(!skip){
  for(int i=0;i<${steps};i++){
    float r = length(p);
    if(r < 1.0){ caught = true; break; }
    if(r > 70.0 && dot(p,v) > 0.0) break;
    float dt = clamp(r*0.070, 0.020, 1.10);
    vec3 prev = p;
    vec3 acc = -1.5*h2*p/pow(dot(p,p),2.5);
    v += acc*dt; p += v*dt;
    if(prev.y*p.y < 0.0){
      float f = prev.y/(prev.y-p.y);
      vec3 q = mix(prev,p,f);
      float rq = length(q);
      if(rq > 2.35 && rq < 16.5) col += disk(q, normalize(p-prev));
    }
  }
  }
  if(!caught) col += sky(normalize(v)) * uSky;
  col *= uReveal;
  col = col/(col+vec3(1.30));
  col = pow(col, vec3(0.4545));
  gl_FragColor = vec4(col,1.0);
}
`;

/** the finale drives this; the component only reads it */
export type HoleState = {
  /** the raymarched hole owns the frame */
  active: boolean;
  /** camera distance in Schwarzschild radii — 13.5 is the prototype default */
  radius: number;
  /** 0 → 1 as the hole lands */
  reveal: number;
  /** how much of the lensed sky comes back */
  sky: number;
  /** the spark before the burst, in screen-ish units */
  spark: number;
};

export const initialHoleState = (): HoleState => ({
  active: false,
  radius: 34,
  reveal: 0,
  sky: 0,
  spark: 0,
});

/** the point of light in the dark, before there is anything to lens */
function Spark({ state }: { state: React.RefObject<HoleState> }) {
  const sprite = useRef<THREE.Sprite>(null);

  const map = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,246,226,0.95)");
    gradient.addColorStop(0.18, "rgba(255,206,150,0.35)");
    gradient.addColorStop(1, "rgba(255,160,90,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  useFrame(({ camera }) => {
    const mesh = sprite.current;
    const value = state.current;
    if (!mesh || !value) return;
    mesh.visible = value.spark > 0 && !value.active;
    if (!mesh.visible) return;
    // 40 units ahead of the camera, looking down the flight path
    mesh.position.set(0, 0, camera.position.z + 40);
    mesh.scale.setScalar(value.spark);
  });

  return (
    <sprite ref={sprite} visible={false}>
      <spriteMaterial
        map={map}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
        transparent
        toneMapped={false}
        fog={false}
      />
    </sprite>
  );
}

export function BlackHole({ state }: { state: React.RefObject<HoleState> }) {
  const coarse = useCoarsePointer();
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  // the orbit the prototype's viewer runs when nobody is dragging it
  const orbit = useRef({ az: 0.6, incl: 0.2, time: 0, warmup: 2 });
  const eye = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Matrix4(), []);
  const roll = useMemo(() => new THREE.Matrix4().makeRotationZ(-0.32), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uCam: { value: new THREE.Vector3(0, 2.4, 14) },
      uBasis: { value: new THREE.Matrix3() },
      uTan: { value: Math.tan(0.36) },
      uReveal: { value: 0 },
      uSky: { value: 0 },
      uScale: { value: 1 },
    }),
    [],
  );

  useFrame((_, rawDelta) => {
    const node = mesh.current;
    const u = material.current?.uniforms;
    const value = state.current;
    if (!node || !u || !value) return;

    // one nearly invisible frame at mount so the program is compiled before
    // the burst needs it
    if (orbit.current.warmup > 0) {
      orbit.current.warmup -= 1;
      node.visible = true;
      u.uScale.value = 0.004;
      u.uReveal.value = 0;
      return;
    }

    u.uScale.value = 1;
    node.visible = value.active;
    if (!value.active) return;

    const dt = Math.min(rawDelta, 0.05);
    orbit.current.time += dt;
    // the prototype's idle drift: 0.05 rad/s
    orbit.current.az += dt * 0.05;

    const { az, incl } = orbit.current;
    eye.set(Math.cos(az) * value.radius, Math.sin(incl) * value.radius * 0.62, Math.sin(az) * value.radius);
    look.lookAt(eye, target, up);
    look.multiply(roll);

    u.uRes.value.set(size.width * dpr, size.height * dpr);
    u.uTime.value = orbit.current.time;
    u.uCam.value.copy(eye);
    u.uBasis.value.setFromMatrix4(look);
    u.uReveal.value = value.reveal;
    u.uSky.value = value.sky;
  });

  return (
    <>
      <Spark state={state} />
      <mesh ref={mesh} visible={false} frustumCulled={false} renderOrder={999}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={VERTEX}
          fragmentShader={fragment(coarse ? 130 : 210)}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>
    </>
  );
}
