"use client";

import { useEffect, useState } from "react";
import { Overlay } from "@/components/overlay";
import type { Body } from "@/data/bodies";

type NasaImage = { src: string; title: string };
type Status = "loading" | "empty" | "done";

export function NasaOverlay({ body, onClose }: { body: Body; onClose: () => void }) {
  const [status, setStatus] = useState<Status>("loading");
  const [images, setImages] = useState<NasaImage[]>([]);

  useEffect(() => {
    let live = true;

    fetch(`/api/nasa/${body.slug}`)
      .then((r) => r.json())
      .then((json: { images?: NasaImage[] }) => {
        if (!live) return;
        const next = json.images ?? [];
        setImages(next);
        setStatus(next.length ? "done" : "empty");
      })
      .catch(() => {
        if (live) setStatus("empty");
      });

    return () => {
      live = false;
    };
  }, [body.slug]);

  return (
    <Overlay onClose={onClose} labelledBy="nasa-title" className="nasa-card">
      <div id="nasa-title" className="overlay-eyebrow">
        NASA archive · {body.name}
      </div>

      {status === "loading" && <div className="nasa-status">Contacting the NASA archive…</div>}

      {status === "empty" && (
        <div className="nasa-empty">
          <div className="nasa-empty-title">No pictures on file</div>
          <div className="nasa-empty-sub">No data</div>
        </div>
      )}

      {status === "done" && (
        <>
          <div className="nasa-grid">
            {images.map((image) => (
              <div key={image.src} className="nasa-tile">
                {/* remote NASA thumbnails, served straight from their CDN */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.src} alt={image.title} loading="lazy" className="nasa-img" />
              </div>
            ))}
          </div>
          <div className="overlay-credit">Images · NASA Image and Video Library</div>
        </>
      )}
    </Overlay>
  );
}
