"use client";

import { useEffect, useState } from "react";
import { useExploreNav } from "@/components/explore/explore-nav-context";
import { NasaOverlay } from "@/components/explore/nasa-overlay";
import { Overlay } from "@/components/overlay";
import type { Body } from "@/data/bodies";

export function BodyPanel({ body }: { body: Body }) {
  const [open, setOpen] = useState<"details" | "nasa" | null>(null);
  const { setNavLocked } = useExploreNav();

  // an open overlay owns the scroll wheel and the arrow keys
  const show = (which: "details" | "nasa" | null) => {
    setOpen(which);
    setNavLocked(which !== null);
  };

  useEffect(() => () => setNavLocked(false), [setNavLocked]);

  return (
    <>
      <div className="caption animate-fade-up">
        <div className="caption-num">{body.num}</div>
        <h1 className="caption-title">{body.name}</h1>
        <div className="caption-rule-row">
          <div className="caption-rule" />
          <div className="caption-tag">{body.tag}</div>
        </div>
        <p className="caption-short">{body.short}</p>
        <div className="caption-actions">
          <button type="button" className="btn btn-accent" onClick={() => show("details")}>
            More details
          </button>
          <button type="button" className="btn btn-outline" onClick={() => show("nasa")}>
            NASA pictures
          </button>
        </div>
      </div>

      {open === "details" && (
        <Overlay onClose={() => show(null)} labelledBy="details-title">
          <div id="details-title" className="overlay-eyebrow">
            {body.num} · {body.name}
          </div>
          <dl className="overlay-stats">
            {body.stats.map((stat) => (
              <div key={stat.label} className="overlay-stat">
                <dt className="overlay-stat-label">{stat.label}</dt>
                <dd className="overlay-stat-value m-0">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <p className="overlay-body">{body.long}</p>
          <div className="overlay-credit">
            Figures · NASA planetary fact sheets
            <br />
            Surface maps ·{" "}
            <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">
              Solar System Scope
            </a>
            , CC BY 4.0
          </div>
        </Overlay>
      )}

      {open === "nasa" && <NasaOverlay body={body} onClose={() => show(null)} />}
    </>
  );
}
