"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Planet } from "@/components/three/planet";
import { BODIES } from "@/data/bodies";

/** scene units: 1 = one million km of real distance */
const DIST_UNIT = 1e6;
/** bodies are drawn ten times larger than the distance scale, so they read at speed */
const SIZE_UNIT = 1e5;
/** the breath beside a body, in seconds */
const DWELL_SECONDS = 1.7;
/** the sprint between two bodies, in seconds */
const CRUISE_SECONDS = 2.6;
/** how fast the skip button winds the film forward */
const SKIP_RATE = 26;
/** drift beyond Neptune before the end card lands */
const COAST_SECONDS = 2.6;
const DRIFT_UNITS_PER_SECOND = 90;

const LIGHT_KM_S = 299792.458;

export type Tick = { km: number; speedC: number; progress: number };

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

type Phase = {
  /** seconds since the flight began */
  start: number;
  duration: number;
  from: number;
  to: number;
  /** index into `layout` at each end of the phase */
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
  /** radians per second; 0 when the visitor asked for reduced motion */
  spin: number;
  /** bumping these re-triggers skip / replay */
  skipToken: number;
  replayToken: number;
  onTick: (tick: Tick) => void;
  onEnd: () => void;
};

export function JourneyScene({
  running,
  pace,
  spin,
  skipToken,
  replayToken,
  onTick,
  onEnd,
}: SceneProps) {
  const camera = useThree((s) => s.camera);
  const clock = useRef(0);
  const skipping = useRef(false);
  const ended = useRef(false);

  useEffect(() => {
    if (skipToken > 0) skipping.current = true;
  }, [skipToken]);

  useEffect(() => {
    if (replayToken === 0) return;
    clock.current = 0;
    skipping.current = false;
    ended.current = false;
  }, [replayToken]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05) * pace;
    const rate = skipping.current ? SKIP_RATE : 1;

    if (running) {
      clock.current += dt * rate;
      if (skipping.current && clock.current >= FLIGHT_SECONDS) skipping.current = false;
    }

    const time = Math.min(clock.current, FLIGHT_SECONDS);
    const coast = Math.max(0, clock.current - FLIGHT_SECONDS);
    const phase = phaseAt(time);
    const f = THREE.MathUtils.clamp((time - phase.start) / phase.duration, 0, 1);
    const span = phase.to - phase.from;

    const z = phase.from + span * (phase.cruise ? smooth(f) : f) + coast * DRIFT_UNITS_PER_SECOND;
    const unitsPerSecond = !running
      ? 0
      : coast > 0
        ? DRIFT_UNITS_PER_SECOND
        : (span * (phase.cruise ? smoothPrime(f) : 1) * rate) / phase.duration;

    camera.position.set(0, 0, z);
    // the aim swings to the next body over the first half of a cruise
    lookTarget.lerpVectors(
      layout[phase.bodyFrom].position,
      layout[phase.bodyTo].position,
      phase.cruise ? smooth(Math.min(1, f * 1.8)) : 0,
    );
    if (coast > 0) lookTarget.set(0, 0, z + 400);
    camera.lookAt(lookTarget);

    onTick({
      km: Math.max(0, z) * DIST_UNIT,
      speedC: (unitsPerSecond * DIST_UNIT * pace) / LIGHT_KM_S,
      progress: THREE.MathUtils.clamp(
        (time + Math.min(coast, COAST_SECONDS)) / (FLIGHT_SECONDS + COAST_SECONDS),
        0,
        1,
      ),
    });

    if (!ended.current && coast >= COAST_SECONDS) {
      ended.current = true;
      onEnd();
    }
  });

  return (
    <>
      {/* the Sun lights every body; real falloff would leave the outer planets black */}
      <pointLight position={layout[0].position} intensity={2.6} decay={0} />
      <ambientLight intensity={0.06} />

      {layout.map(({ body, radius, position }) => (
        <group key={body.slug} position={position} scale={radius}>
          <Planet body={body} res="2k" segments={48} spin={spin} detail />
        </group>
      ))}
    </>
  );
}
