"use client";

import { useEffect, useState } from "react";

function useMediaQuery(query: string, fallback = false) {
  const [matches, setMatches] = useState(fallback);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

/** phones and tablets get the lighter scene */
export const useCoarsePointer = () => useMediaQuery("(max-width: 820px), (pointer: coarse)");

export type TextureRes = "1k" | "2k" | "4k";

/**
 * Picks the smallest map that still gives about one texel per device pixel.
 * A body fills roughly 60% of the frame height, and half of the map wraps the
 * visible hemisphere — so the useful map width is about 3.4× that height.
 * Anything beyond that is memory the GPU pays for and the eye never sees.
 */
export function useTextureRes(): TextureRes {
  const [res, setRes] = useState<TextureRes>("2k");

  useEffect(() => {
    const measure = () => {
      const devicePixels = window.innerHeight * Math.min(window.devicePixelRatio, 2);
      setRes(devicePixels < 620 ? "1k" : devicePixels < 1250 ? "2k" : "4k");
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return res;
}

/** desktop spheres are smooth, mobile ones halve the triangle count */
export const useSegments = () => (useCoarsePointer() ? 32 : 64);
