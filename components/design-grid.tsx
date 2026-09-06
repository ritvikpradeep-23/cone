"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { DesignCard } from "./design-card";
import { SECTION_TYPES, SECTION_TYPE_LABELS } from "@/lib/section-types";

type DesignSummary = {
  id: string;
  name: string;
  styleSummary: string;
  batchDate: string;
  createdAt: string;
};

type DesignDetail = DesignSummary & { fullHtml: string };

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-[var(--dg-border)] bg-[var(--dg-surface)] p-3">
      <div className="aspect-[16/10] rounded-md bg-[var(--dg-border)]" />
      <div className="mt-3 h-3 w-2/3 rounded bg-[var(--dg-border)]" />
      <div className="mt-2 h-3 w-1/2 rounded bg-[var(--dg-border)]" />
    </div>
  );
}

export function DesignGrid() {
  const [q, setQ] = useState("");
  const [hasType, setHasType] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [items, setItems] = useState<DesignDetail[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (opts: { reset: boolean }) => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (hasType) params.set("hasType", hasType);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (!opts.reset && cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/designs?${params.toString()}`);
        if (!res.ok) throw new Error("failed");
        const data = await res.json();

        const detailed: DesignDetail[] = await Promise.all(
          data.designs.map(async (d: DesignSummary) => {
            const detailRes = await fetch(`/api/designs/${d.id}`);
            const detail = await detailRes.json();
            return { ...d, fullHtml: detail.design.fullHtml };
          })
        );

        setItems((prev) => (opts.reset ? detailed : [...prev, ...detailed]));
        setCursor(data.nextCursor);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [q, hasType, from, to, cursor]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch on filter change is the intended trigger
    load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, hasType, from, to]);

  return (
    <div>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-[var(--dg-border)] bg-[var(--dg-bg)]/95 px-6 py-4 backdrop-blur">
        <p className="text-lg font-medium text-[var(--dg-text)]">Design Gallery</p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] px-2.5 py-1.5">
            <Search size={14} className="text-[var(--dg-muted)]" strokeWidth={1.75} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search style, name..."
              className="w-40 bg-transparent text-xs outline-none placeholder:text-[var(--dg-muted)]"
            />
          </div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] px-2 py-1.5 font-mono text-[11px] text-[var(--dg-text)] outline-none"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] px-2 py-1.5 font-mono text-[11px] text-[var(--dg-text)] outline-none"
          />
          <select
            value={hasType ?? ""}
            onChange={(e) => setHasType(e.target.value || null)}
            className="rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] px-2 py-1.5 text-xs text-[var(--dg-text)] outline-none"
          >
            <option value="">All sections</option>
            {SECTION_TYPES.map((type) => (
              <option key={type} value={type}>
                Has {SECTION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-6">
        {items.length === 0 && loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 && error ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <p className="text-sm text-[var(--dg-muted)]">Couldn&apos;t load designs.</p>
            <button
              onClick={() => load({ reset: true })}
              className="rounded-md bg-[var(--dg-accent)] px-3 py-1.5 text-xs font-medium text-white"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-24 text-center">
            <p className="text-sm text-[var(--dg-text)]">
              {q || hasType || from || to
                ? "No designs match your filters."
                : "No designs yet — the first daily generation run hasn't completed."}
            </p>
            {(q || hasType || from || to) && (
              <button
                onClick={() => {
                  setQ("");
                  setHasType(null);
                  setFrom("");
                  setTo("");
                }}
                className="text-xs font-medium text-[var(--dg-accent)]"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <DesignCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  styleSummary={item.styleSummary}
                  batchDate={item.batchDate}
                  fullHtml={item.fullHtml}
                />
              ))}
            </div>
            {cursor ? (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => load({ reset: false })}
                  disabled={loading}
                  className="rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] px-4 py-2 text-xs font-medium text-[var(--dg-text)] transition hover:bg-white/5 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load more"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
