"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, History } from "lucide-react";
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
      className="dg-focus-ring group flex items-start gap-3.5 rounded-xl border border-[var(--dg-accent)]/50 bg-[var(--dg-accent-soft)] p-5 transition-colors hover:border-[var(--dg-accent)]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--dg-accent)]/20">
        <History size={16} strokeWidth={2} className="text-[var(--dg-accent-hover)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-sm font-medium text-[var(--dg-text)]">
          Resume your blueprint
          <ArrowUpRight
            size={14}
            strokeWidth={2}
            className="text-[var(--dg-accent-hover)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </p>
        <p className="mt-0.5 text-xs text-[var(--dg-muted)]">
          {count} section{count === 1 ? "" : "s"} saved
        </p>
      </div>
    </Link>
  );
}
