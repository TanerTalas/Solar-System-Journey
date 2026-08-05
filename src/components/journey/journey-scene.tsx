"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { BlackHole } from "@/components/three/black-hole";
import { Planet } from "@/components/three/planet";
import { Starfield } from "@/components/three/starfield";
import { BODIES } from "@/data/bodies";

/** scene units: 1 = one million km of real distance */
const DIST_UNIT = 1e6;
/** bodies are drawn ten times larger than the distance scale, so they read at speed */
const SIZE_UNIT = 1e5;
/** the breath beside a body, in seconds */
const DWELL_SECONDS = 0.9;
/** the sprint between two bodies, in seconds */
const CRUISE_SECONDS = 1.2;
/** how fast the skip button winds the film forward */
const SKIP_RATE = 26;

/** past Neptune: the sky fades out and a point of light grows ahead */
const DARK_SECONDS = 2.4;
/** the light becomes Sagittarius A*, all at once */
const BURST_SECONDS = 0.5;
/** how long the hole holds the frame before the card lands */
const HOLD_SECONDS = 1.4;
const DRIFT_UNITS_PER_SECOND = 90;

/** the hole rides this far ahead of the camera, so only its scale sells the burst */
const HOLE_DISTANCE = 60;
const SPARK_SCALE = 0.055;
const APPROACH_SCALE = 0.6;
const HOLE_SCALE = 8.5;
/** thick enough to swallow a starfield 9000 units out, thin enough to spare the hole */
const FOG_DENSITY = 3.4e-4;

const LIGHT_KM_S = 299792.458;

export type Tick = { km: number; speedC: number; progress: number };
export type Stage = "flight" | "dark" | "hole" | "end";

const layout = BODIES.map((body, i) => {
  const radius = body.radiusKm / SIZE_UNIT;
  // pass every body at the same relative distance so they frame alike;
  // the Sun gets extra room because it opens the film behind the title card
  const offset = radius * (body.slug === "sun" ? 3.5 : 3.4);
  const side = i % 2 === 0 ? 1 : -1;
  return {
    body,
    radius,
    /** how far before and after the body the flyby runs */
    reach: offset * 1.5,
    position: new THREE.Vector3(
      side * offset * 0.92,
      (i % 3 === 0 ? -1 : 1) * offset * 0.24,
      body.distanceKm / DIST_UNIT,
    ),
  };
});

// no flyby may reach into its neighbour's — the Moon sits close behind Earth
for (const [i, stop] of layout.entries()) {
  const before = layout[i - 1];
  const after = layout[i + 1];
  const gap = Math.min(
    before ? stop.position.z - before.position.z : Infinity,
    after ? after.position.z - stop.position.z : Infinity,
  );
  stop.reach = Math.min(stop.reach, gap * 0.4);
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const smoothPrime = (t: number) => 6 * t * (1 - t);
/** overshoots a little, the way something arriving too fast would */
const outBack = (t: number) => {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

type Phase = {
  start: number;
  duration: number;
  from: number;
  to: number;
  bodyFrom: number;
  bodyTo: number;
  /** a flyby holds a steady crawl; a cruise eases in and out */
  cruise: boolean;
};

/** alternating flybys and cruises, laid end to end */
const phases: Phase[] = [];
{
  let clock = 0;
  layout.forEach((stop, i) => {
    phases.push({
      start: clock,
      duration: DWELL_SECONDS,
      from: stop.position.z - stop.reach,
      to: stop.position.z + stop.reach,
      bodyFrom: i,
      bodyTo: i,
      cruise: false,
    });
    clock += DWELL_SECONDS;

    const next = layout[i + 1];
    if (!next) return;
    phases.push({
      start: clock,
      duration: CRUISE_SECONDS,
      from: stop.position.z + stop.reach,
      to: next.position.z - next.reach,
      bodyFrom: i,
      bodyTo: i + 1,
      cruise: true,
    });
    clock += CRUISE_SECONDS;
  });
}

const FLIGHT_SECONDS = phases.at(-1)!.start + phases.at(-1)!.duration;
const CODA_SECONDS = DARK_SECONDS + BURST_SECONDS + HOLD_SECONDS;

function phaseAt(time: number) {
  for (let i = phases.length - 1; i >= 0; i--) {
    if (time >= phases[i].start) return phases[i];
  }
  return phases[0];
}

/** scratch vector — the camera aim point, rewritten every frame */
const lookTarget = new THREE.Vector3();

type SceneProps = {
  running: boolean;
  pace: number;
  /** no auto-rotation, no shake */
  reduced: boolean;
  /** bumping these re-triggers skip / replay */
  skipToken: number;
  replayToken: number;
  onTick: (tick: Tick) => void;
  onStage: (stage: Stage) => void;
};

export function JourneyScene({
  running,
  pace,
  reduced,
  skipToken,
  replayToken,
  onTick,
  onStage,
}: SceneProps) {
  const camera = useThree((s) => s.camera);
  const clock = useRef(0);
  const skipping = useRef(false);
  const stage = useRef<Stage>("flight");
  const hole = useRef<THREE.Group>(null);
  const fog = useRef<THREE.FogExp2>(null);

  useEffect(() => {
    if (skipToken > 0) skipping.current = true;
  }, [skipToken]);

  useEffect(() => {
    if (replayToken === 0) return;
    clock.current = 0;
    skipping.current = false;
    stage.current = "flight";
    if (hole.current) hole.current.visible = false;
    if (fog.current) fog.current.density = 0;
  }, [replayToken]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05) * pace;
    const rate = skipping.current ? SKIP_RATE : 1;

    if (running) {
      clock.current += dt * rate;
      if (skipping.current && clock.current >= FLIGHT_SECONDS) skipping.current = false;
    }

    const time = Math.min(clock.current, FLIGHT_SECONDS);
    const coda = Math.max(0, clock.current - FLIGHT_SECONDS);
    const phase = phaseAt(time);
    const f = THREE.MathUtils.clamp((time - phase.start) / phase.duration, 0, 1);
    const span = phase.to - phase.from;

    const z = phase.from + span * (phase.cruise ? smooth(f) : f) + coda * DRIFT_UNITS_PER_SECOND;
    const unitsPerSecond = !running
      ? 0
      : coda > 0
        ? DRIFT_UNITS_PER_SECOND
        : (span * (phase.cruise ? smoothPrime(f) : 1) * rate) / phase.duration;

    // ── the coda: dark, then the light, then the hole ──────────
    let shake = 0;
    if (coda > 0) {
      const dark = Math.min(1, coda / DARK_SECONDS);
      const burst = THREE.MathUtils.clamp((coda - DARK_SECONDS) / BURST_SECONDS, 0, 1);

      if (fog.current) fog.current.density = FOG_DENSITY * smooth(dark);

      if (hole.current) {
        // once it has landed it drifts up a little, clearing room for the card
        const settle = THREE.MathUtils.clamp(
          (coda - DARK_SECONDS - BURST_SECONDS) / HOLD_SECONDS,
          0,
          1,
        );
        hole.current.visible = true;
        hole.current.position.set(0, smooth(settle) * 5, z + HOLE_DISTANCE);
        const scale =
          burst > 0
            ? THREE.MathUtils.lerp(APPROACH_SCALE, HOLE_SCALE, outBack(burst))
            : THREE.MathUtils.lerp(SPARK_SCALE, APPROACH_SCALE, dark * dark);
        hole.current.scale.setScalar(scale);
      }

      if (burst > 0 && burst < 0.7 && !reduced) shake = (1 - burst / 0.7) * 0.55;

      const next: Stage =
        coda >= CODA_SECONDS ? "end" : coda >= DARK_SECONDS ? "hole" : "dark";
      if (next !== stage.current) {
        stage.current = next;
        onStage(next);
      }
    }

    camera.position.set(
      shake ? Math.sin(coda * 71) * shake : 0,
      shake ? Math.sin(coda * 53) * shake : 0,
      z,
    );
    // the aim swings to the next body over the first half of a cruise
    lookTarget.lerpVectors(
      layout[phase.bodyFrom].position,
      layout[phase.bodyTo].position,
      phase.cruise ? smooth(Math.min(1, f * 1.8)) : 0,
    );
    if (coda > 0) lookTarget.set(0, 0, z + 400);
    camera.lookAt(lookTarget);

    onTick({
      km: Math.max(0, z) * DIST_UNIT,
      speedC: (unitsPerSecond * DIST_UNIT * pace) / LIGHT_KM_S,
      progress: THREE.MathUtils.clamp(
        (time + Math.min(coda, CODA_SECONDS)) / (FLIGHT_SECONDS + CODA_SECONDS),
        0,
        1,
      ),
    });
  });

  return (
    <>
      <fogExp2 ref={fog} attach="fog" args={["#05060c", 0]} />

      {/* nothing here is ever closer than a flyby, so 1k maps are already
          about one texel per pixel — and twelve of them stay in memory */}
      <Starfield res="1k" radius={9000} />

      {/* the Sun lights every body; real falloff would leave the outer planets black */}
      <pointLight position={layout[0].position} intensity={2.6} decay={0} />
      <ambientLight intensity={0.06} />

      {layout.map(({ body, radius, position }) => (
        <group key={body.slug} position={position} scale={radius}>
          <Planet body={body} res="1k" segments={40} spin={reduced ? 0 : 0.02} detail />
        </group>
      ))}

      <BlackHole ref={hole} spin={reduced ? 0 : 0.32} />
    </>
  );
}
