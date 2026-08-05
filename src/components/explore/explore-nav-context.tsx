"use client";

import { createContext, useContext } from "react";

type ExploreNav = {
  index: number;
  go: (index: number) => void;
  /** overlays lock scroll and arrow-key travel while they are open */
  setNavLocked: (locked: boolean) => void;
};

export const ExploreNavContext = createContext<ExploreNav>({
  index: 0,
  go: () => {},
  setNavLocked: () => {},
});

export const useExploreNav = () => useContext(ExploreNavContext);
