"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { ChevronRight } from "@/components/icons";
import { JourneyCanvas } from "@/components/journey/journey-canvas";
import type { Tick } from "@/components/journey/journey-scene";
import { SceneLoader } from "@/components/three/scene-loader";
import { BODIES } from "@/data/bodies";
import { auLabel, kmLabel, speedLabel } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/preferences";

const START_TITLE = "Outward bound";
const START_SUBTITLE =
  "The Sun to the last planet at true spacing — a sprint between worlds, a breath beside each one.";

/** the readout refreshes ten times a second; the flight runs at sixty */
const HUD_INTERVAL_MS = 100;

type Stage = "ready" | "flight" | "end";

export function JourneyView() {
  const [stage, setStage] = useState<Stage>("ready");
  const [skipToken, setSkipToken] = useState(0);
  const [replayToken, setReplayToken] = useState(0);
  const reduced = usePrefersReducedMotion();

  const km = useRef<HTMLDivElement>(null);
  const au = useRef<HTMLDivElement>(null);
  const speed = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const lastPaint = useRef(0);

  // the numbers are written straight to the DOM: a React render per frame
  // would reconcile the whole scene sixty times a second
  const onTick = useCallback((tick: Tick) => {
    const now = performance.now();
    if (now - lastPaint.current < HUD_INTERVAL_MS) return;
    lastPaint.current = now;

    if (km.current) km.current.textContent = kmLabel(tick.km);
    if (au.current) au.current.textContent = auLabel(tick.km);
    if (speed.current) speed.current.textContent = speedLabel(tick.speedC);
    if (fill.current) fill.current.style.width = `${(tick.progress * 100).toFixed(1)}%`;
  }, []);

  const onEnd = useCallback(() => setStage("end"), []);

  const started = stage !== "ready";
  const ended = stage === "end";

  return (
    <div className="journey">
      <JourneyCanvas
        running={started}
        pace={1}
        spin={reduced ? 0 : 0.02}
        skipToken={skipToken}
        replayToken={replayToken}
        onTick={onTick}
        onEnd={onEnd}
      />

      <SceneLoader label="Charting the route…" />
      <div className="journey-vignette" />

      {started && (
        <div className="hud">
          <div className="hud-id">
            <div className="hud-live">
              <span className="hud-dot" />
              <div className="hud-label">Outbound</div>
            </div>
            <div className="hud-sub">Sol · heliocentric transit</div>
          </div>

          <div className="hud-stats">
            <div className="hud-stat">
              <div className="hud-stat-label">Travelled</div>
              <div ref={km} className="hud-stat-value">
                0 km
              </div>
              <div ref={au} className="hud-stat-note">
                0.000 AU
              </div>
            </div>
            <div className="hud-stat">
              <div className="hud-stat-label">Velocity</div>
              <div ref={speed} className="hud-stat-value">
                0.00
              </div>
              <div className="hud-stat-note">× speed of light</div>
            </div>
          </div>
        </div>
      )}

      <div className="journey-foot" style={{ opacity: started ? 1 : 0 }}>
        <div className="progress">
          <div className="progress-track">
            <div ref={fill} className="progress-fill" style={{ width: "0%" }} />
          </div>
        </div>

        <div
          className="journey-chrome"
          style={{
            opacity: started && !ended ? 1 : 0,
            pointerEvents: started && !ended ? "auto" : "none",
          }}
        >
          <button type="button" className="btn btn-skip" onClick={() => setSkipToken((n) => n + 1)}>
            Skip to the end
            <ChevronRight />
          </button>
        </div>
      </div>

      {!started && (
        <div className="start">
          <div className="start-card">
            <h1 className="start-title">{START_TITLE}</h1>
            <p className="start-sub">{START_SUBTITLE}</p>
            <div className="start-actions">
              <button
                type="button"
                className="btn btn-accent btn-begin"
                onClick={() => setStage("flight")}
              >
                Intro
                <ChevronRight className="btn-icon size-[14px]" />
              </button>
              <Link href={`/explore/${BODIES[0].slug}`} className="btn btn-outline btn-explore">
                Explore
                <ChevronRight className="btn-icon size-[14px]" />
              </Link>
            </div>
          </div>
          <div className="start-meta">
            <span>The Sun, the Moon, 8 planets</span>
            <span>30 AU, to scale</span>
          </div>
        </div>
      )}

      {ended && (
        <div className="end">
          <div className="end-card">
            <div className="end-eyebrow">End of the line</div>
            <p className="end-text">
              The journey ends where light does. Fly it again, or meet the worlds one by one.
            </p>
            <div className="end-actions">
              <button
                type="button"
                className="btn btn-outline btn-replay"
                onClick={() => {
                  setStage("flight");
                  setReplayToken((n) => n + 1);
                }}
              >
                Play the intro again
              </button>
              <Link href={`/explore/${BODIES[0].slug}`} className="btn btn-end-explore">
                Explore the planets
                <ChevronRight className="btn-icon size-[14px]" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
