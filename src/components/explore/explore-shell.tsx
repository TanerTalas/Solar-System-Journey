"use client";

import Link from "next/link";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { ExploreNavContext } from "@/components/explore/explore-nav-context";
import { PlanetCanvas } from "@/components/explore/planet-canvas";
import { SceneLoader } from "@/components/three/scene-loader";
import { BODIES, bodyIndex } from "@/data/bodies";

/** one step per gesture; keep scrolling → next step after the cooldown */
const WHEEL_COOLDOWN = 1100;
const WHEEL_THRESHOLD = 90;
const SWIPE_THRESHOLD = 60;

export function ExploreShell({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const router = useRouter();
  const index = Math.max(0, bodyIndex(segment ?? BODIES[0].slug));
  const body = BODIES[index];
  const prev = BODIES[index - 1];
  const next = BODIES[index + 1];

  // only the wheel/key handlers read this, so a ref keeps it out of rendering
  const lockedRef = useRef(false);
  const setNavLocked = useCallback((locked: boolean) => {
    lockedRef.current = locked;
  }, []);

  const go = useCallback(
    (target: number) => {
      const to = BODIES[target];
      if (!to || target === index) return;
      router.push(`/explore/${to.slug}`);
    },
    [index, router],
  );

  const step = useCallback((dir: number) => go(index + dir), [go, index]);

  // neighbouring bodies are one gesture away — have them ready
  useEffect(() => {
    for (const i of [index - 1, index + 1]) {
      if (BODIES[i]) router.prefetch(`/explore/${BODIES[i].slug}`);
    }
  }, [index, router]);

  useEffect(() => {
    let acc = 0;
    let lockUntil = 0;
    const coarse = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;

    const onWheel = (e: WheelEvent) => {
      if (coarse || lockedRef.current) return;
      const now = performance.now();
      if (now < lockUntil) {
        acc = 0;
        return;
      }
      acc += e.deltaY;
      if (Math.abs(acc) > WHEEL_THRESHOLD) {
        const dir = acc > 0 ? 1 : -1;
        acc = 0;
        lockUntil = now + WHEEL_COOLDOWN;
        step(dir);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (lockedRef.current) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") step(-1);
    };

    let startX = 0;
    let startY = 0;
    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (lockedRef.current || e.pointerType === "mouse") return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
      step(dx < 0 ? 1 : -1);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [step]);

  return (
    <div className="explore">
      <PlanetCanvas body={body} />
      <SceneLoader label={`Approaching ${body.name}…`} />
      <div className="explore-scrim" />
      <div className="explore-vignette" />

      <div className="explore-top">
        <Link href="/" className="explore-back">
          <ChevronLeft /> Return to main area
        </Link>
        <div className="explore-counter">
          <span className="explore-counter-dot" /> Exploration · {body.num} /{" "}
          {String(BODIES.length).padStart(2, "0")}
        </div>
      </div>

      <ExploreNavContext.Provider
        value={useMemo(() => ({ index, go, setNavLocked }), [index, go, setNavLocked])}
      >
        {children}
      </ExploreNavContext.Provider>

      <div className="explore-hint">Scroll to travel</div>

      <nav className="nav-bar" aria-label="Bodies">
        <button
          type="button"
          className="btn nav-btn"
          onClick={() => step(-1)}
          aria-disabled={!prev}
          aria-label={prev ? `Previous body: ${prev.name}` : "No previous body"}
        >
          <ChevronLeft />
          {prev?.name ?? ""}
        </button>

        <button
          type="button"
          className="btn nav-btn"
          onClick={() => step(1)}
          aria-disabled={!next}
          aria-label={next ? `Next body: ${next.name}` : "No next body"}
        >
          {next?.name ?? ""}
          <ChevronRight />
        </button>
      </nav>
    </div>
  );
}
