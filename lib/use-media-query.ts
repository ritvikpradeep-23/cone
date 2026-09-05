"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to a browser API not available during render
    setMatches(mql.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
