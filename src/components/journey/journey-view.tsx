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

type Stage = "ready" | "flight" | "end";

export function JourneyView() {
  const [stage, setStage] = useState<Stage>("ready");
  const [tick, setTick] = useState<Tick>({ km: 0, speedC: 0, progress: 0 });
  const [skipToken, setSkipToken] = useState(0);
  const [replayToken, setReplayToken] = useState(0);
  const last = useRef<Tick>(tick);
  const reduced = usePrefersReducedMotion();

  // coarse-grain the numeric churn so React only sees ~10 updates a second
  const onTick = useCallback((next: Tick) => {
    const prev = last.current;
    if (Math.abs(next.km - prev.km) < 1 && Math.abs(next.progress - prev.progress) < 0.002) return;
    last.current = next;
    setTick(next);
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
              <div className="hud-stat-value">{kmLabel(tick.km)}</div>
              <div className="hud-stat-note">{auLabel(tick.km)}</div>
            </div>
            <div className="hud-stat">
              <div className="hud-stat-label">Velocity</div>
              <div className="hud-stat-value">{speedLabel(tick.speedC)}</div>
              <div className="hud-stat-note">× speed of light</div>
            </div>
          </div>
        </div>
      )}

      <div className="journey-foot" style={{ opacity: started ? 1 : 0 }}>
        <div className="progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(tick.progress * 100).toFixed(1)}%` }} />
          </div>
        </div>

        <div
          className="journey-chrome"
          style={{ opacity: started && !ended ? 1 : 0, pointerEvents: started && !ended ? "auto" : "none" }}
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
