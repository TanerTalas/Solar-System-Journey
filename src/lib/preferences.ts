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

/** phones and tablets get the lighter texture set */
export const useCoarsePointer = () => useMediaQuery("(max-width: 820px), (pointer: coarse)");

export type TextureRes = "2k" | "4k";

export function useTextureRes(): TextureRes {
  return useCoarsePointer() ? "2k" : "4k";
}

/** desktop spheres are smooth, mobile ones halve the triangle count */
export const useSegments = () => (useCoarsePointer() ? 32 : 64);
