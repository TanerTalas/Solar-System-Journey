"use client";

import { useEffect, useState } from "react";
import { useExploreNav } from "@/components/explore/explore-nav-context";
import { NasaOverlay } from "@/components/explore/nasa-overlay";
import { Overlay } from "@/components/overlay";
import type { Body } from "@/data/bodies";
import wikiCache from "@/data/wiki-cache.json";

type WikiEntry = { title: string; extract: string; source: string };
const wiki = wikiCache as Record<string, WikiEntry | undefined>;

export function BodyPanel({ body }: { body: Body }) {
  // baked at build time by scripts/build-wiki.mjs; the written fallback in
  // bodies.ts keeps the card full if an entry ever goes missing
  const entry = wiki[body.slug];
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
          <p className="overlay-body">{entry?.extract ?? body.long}</p>
          <div className="overlay-credit">
            Figures · NASA planetary fact sheets
            {entry && (
              <>
                <br />
                Text · excerpt from Wikipedia,{" "}
                <a href={entry.source} target="_blank" rel="noreferrer">
                  {entry.title}
                </a>{" "}
                — CC BY-SA 4.0
              </>
            )}
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
