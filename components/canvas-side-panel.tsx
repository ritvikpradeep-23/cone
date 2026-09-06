"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { SectionThumbnail } from "./section-thumbnail";
import { SECTION_TYPES, SECTION_TYPE_LABELS, type SectionType } from "@/lib/section-types";
import type { BlueprintSection } from "@/lib/blueprint-store";

type LibrarySection = {
  id: string;
  type: SectionType;
  html: string;
  fontToken: string;
  designId: string;
  designName: string;
};

type SavedRow = LibrarySection & { savedId: string };

export type SwapTarget = { index: number; type: SectionType } | null;

export function CanvasSidePanel({
  onAdd,
  swapTarget,
  onCancelSwap,
}: {
  onAdd: (section: BlueprintSection) => void;
  swapTarget: SwapTarget;
  onCancelSwap: () => void;
}) {
  const [tab, setTab] = useState<"all" | "my-store">("all");
  const [type, setType] = useState<SectionType | null>(null);
  const [allSections, setAllSections] = useState<LibrarySection[]>([]);
  const [savedRows, setSavedRows] = useState<SavedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const effectiveType = swapTarget ? swapTarget.type : type;

  const loadAll = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (effectiveType) params.set("type", effectiveType);
    fetch(`/api/sections?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => setAllSections(data.sections))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [effectiveType]);

  const loadSaved = useCallback(() => {
    fetch("/api/saved-sections")
      .then((res) => (res.ok ? res.json() : { sections: [] }))
      .then((data) => setSavedRows(data.sections))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch on filter/tab change is the intended trigger
    loadAll();
    loadSaved();
  }, [loadAll, loadSaved]);

  const savedIdBySection = new Map(savedRows.map((r) => [r.id, r.savedId]));

  const toggleSave = async (sectionId: string) => {
    const existingSavedId = savedIdBySection.get(sectionId);
    if (existingSavedId) {
      setSavedRows((prev) => prev.filter((r) => r.savedId !== existingSavedId));
      await fetch(`/api/saved-sections/${existingSavedId}`, { method: "DELETE" }).catch(() => {});
    } else {
      await fetch("/api/saved-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId }),
      }).catch(() => {});
      loadSaved();
    }
  };

  const displayedSections =
    tab === "all" ? allSections : savedRows.filter((r) => !effectiveType || r.type === effectiveType);

  return (
    <div className="flex h-full flex-col">
      {swapTarget ? (
        <div className="flex items-center justify-between gap-2 border-b border-[var(--dg-border)] bg-[var(--dg-accent)]/10 px-4 py-2.5">
          <p className="text-xs text-[var(--dg-text)]">
            Choose a replacement for this <span className="font-medium">{SECTION_TYPE_LABELS[swapTarget.type]}</span> section
          </p>
          <button
            onClick={onCancelSwap}
            aria-label="Cancel swap"
            className="rounded p-1 text-[var(--dg-muted)] outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)]"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div className="flex gap-1 border-b border-[var(--dg-border)] px-4 pt-3">
        {(["all", "my-store"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-md px-3 py-2 text-xs font-medium transition ${
              tab === t
                ? "border-b-2 border-[var(--dg-accent)] text-[var(--dg-text)]"
                : "text-[var(--dg-muted)] hover:text-[var(--dg-text)]"
            }`}
          >
            {t === "all" ? "All" : "My Store"}
          </button>
        ))}
      </div>

      <div className="sticky top-0 z-10 flex flex-wrap gap-1.5 border-b border-[var(--dg-border)] bg-[var(--dg-bg)] px-4 py-3">
        <button
          onClick={() => !swapTarget && setType(null)}
          disabled={!!swapTarget}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-40 ${
            effectiveType === null
              ? "border-[var(--dg-accent)] bg-[var(--dg-accent)] text-white"
              : "border-[var(--dg-border)] bg-[var(--dg-surface)] text-[var(--dg-muted)] hover:bg-white/5"
          }`}
        >
          All
        </button>
        {SECTION_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => !swapTarget && setType(t)}
            disabled={!!swapTarget}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-40 ${
              effectiveType === t
                ? "border-[var(--dg-accent)] bg-[var(--dg-accent)] text-white"
                : "border-[var(--dg-border)] bg-[var(--dg-surface)] text-[var(--dg-muted)] hover:bg-white/5"
            }`}
          >
            {SECTION_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "all" && loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-md bg-[var(--dg-border)]" />
            ))}
          </div>
        ) : tab === "all" && error ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm text-[var(--dg-muted)]">Couldn&apos;t load sections.</p>
            <button onClick={loadAll} className="rounded-md bg-[var(--dg-accent)] px-3 py-1.5 text-xs font-medium text-white">
              Retry
            </button>
          </div>
        ) : displayedSections.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--dg-muted)]">
            {tab === "my-store" ? "No saved sections yet — star one to add it here." : "No sections found."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayedSections.map((section) => (
              <SectionThumbnail
                key={section.id}
                type={section.type}
                html={section.html}
                fontToken={section.fontToken}
                designName={section.designName}
                saved={savedIdBySection.has(section.id)}
                onToggleSave={() => toggleSave(section.id)}
                onAdd={() =>
                  onAdd({
                    sectionId: section.id,
                    type: section.type,
                    html: section.html,
                    designName: section.designName,
                    fontToken: section.fontToken,
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
