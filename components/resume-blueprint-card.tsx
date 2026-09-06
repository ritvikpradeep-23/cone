"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readBlueprint } from "@/lib/blueprint-store";

export function ResumeBlueprintCard() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from sessionStorage, unavailable during render
    setCount(readBlueprint().length);
  }, []);

  if (!count) return null;

  return (
    <Link
      href="/mix"
      className="rounded-lg border border-[var(--dg-accent)] bg-[var(--dg-surface)] p-4 text-sm font-medium text-[var(--dg-text)] transition hover:bg-white/5"
    >
      Resume your blueprint ({count} section{count === 1 ? "" : "s"})
    </Link>
  );
}
