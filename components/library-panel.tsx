"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionThumbnail } from "./section-thumbnail";
import { SECTION_TYPES, SECTION_TYPE_LABELS, type SectionType } from "@/lib/section-types";
import type { BlueprintSection } from "@/lib/blueprint-store";

type LibrarySection = {
  id: string;
  type: SectionType;
  html: string;
  designId: string;
  designName: string;
};

export function LibraryPanel({ onAdd }: { onAdd: (section: BlueprintSection) => void }) {
  const [type, setType] = useState<SectionType | null>(null);
  const [sections, setSections] = useState<LibrarySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    fetch(`/api/sections?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => setSections(data.sections))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [type]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch on type-filter change is the intended trigger
    load();
  }, [load]);

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap gap-1.5 border-b border-[var(--dg-border)] bg-[var(--dg-bg)] px-4 py-3">
        <button
          onClick={() => setType(null)}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
            type === null
              ? "border-[var(--dg-accent)] bg-[var(--dg-accent)] text-white"
              : "border-[var(--dg-border)] bg-white text-[var(--dg-muted)] hover:bg-black/5"
          }`}
        >
          All
        </button>
        {SECTION_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
              type === t
                ? "border-[var(--dg-accent)] bg-[var(--dg-accent)] text-white"
                : "border-[var(--dg-border)] bg-white text-[var(--dg-muted)] hover:bg-black/5"
            }`}
          >
            {SECTION_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-md bg-[var(--dg-border)]" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm text-[var(--dg-muted)]">Couldn&apos;t load sections.</p>
            <button onClick={load} className="rounded-md bg-[var(--dg-accent)] px-3 py-1.5 text-xs font-medium text-white">
              Retry
            </button>
          </div>
        ) : sections.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--dg-muted)]">No sections found.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sections.map((section) => (
              <SectionThumbnail
                key={section.id}
                type={section.type}
                html={section.html}
                designName={section.designName}
                onAdd={() =>
                  onAdd({
                    sectionId: section.id,
                    type: section.type,
                    html: section.html,
                    designName: section.designName,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
