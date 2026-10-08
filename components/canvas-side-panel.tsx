"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Layers } from "lucide-react";
import { SectionThumbnail } from "./section-thumbnail";
import { SectionTypeIcon } from "./section-type-icon";
import { Logomark } from "./logomark";
import { SECTION_TYPES, SECTION_TYPE_LABELS, type SectionType } from "@/lib/section-types";
import { toBlueprintSection, type BlueprintSection } from "@/lib/blueprint-store";

type LibrarySection = {
  id: string;
  type: SectionType;
  html: string;
  fontToken: string;
  colorTheme: string;
  designId: string;
  designName: string;
};

type SavedRow = LibrarySection & { savedId: string };

export type SwapTarget = { index: number; type: SectionType } | null;

const pad2 = (n: number) => String(n).padStart(2, "0");

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

  const groups = useMemo(
    () =>
      SECTION_TYPES.map((t) => ({ type: t, items: displayedSections.filter((s) => s.type === t) })).filter(
        (g) => g.items.length > 0
      ),
    [displayedSections]
  );

  const typeCount = new Set(allSections.map((s) => s.type)).size;

  return (
    <div className="flex h-full flex-col bg-[var(--dg-rail)]">
      <div className="border-b border-[var(--dg-border)] px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <Logomark size={38} />
          <div className="min-w-0">
            <p className="font-display text-2xl font-semibold leading-none tracking-tight text-[var(--dg-text)]">
              Mix Canvas
            </p>
            <p className="mt-1.5 font-mono text-[11px] text-[var(--dg-muted-2)]">
              {pad2(typeCount)} types · {pad2(allSections.length)} variants
            </p>
          </div>
        </div>

        {swapTarget ? (
          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-[var(--dg-accent)]/40 bg-[var(--dg-accent-soft)] px-3 py-2">
            <p className="text-xs text-[var(--dg-text)]">
              Pick a replacement for this{" "}
              <span className="font-semibold">{SECTION_TYPE_LABELS[swapTarget.type]}</span>
            </p>
            <button
              onClick={onCancelSwap}
              aria-label="Cancel swap"
              className="dg-focus-ring rounded p-1 text-[var(--dg-muted)] hover:bg-white/5"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}

        <div className="mt-4 flex gap-1 rounded-full border border-[var(--dg-border)] bg-[var(--dg-bg)]/60 p-0.5">
          {(["all", "my-store"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`dg-focus-ring flex-1 rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${
                tab === t
                  ? "bg-[var(--dg-surface)] text-[var(--dg-text)]"
                  : "text-[var(--dg-muted)] hover:text-[var(--dg-text)]"
              }`}
            >
              {t === "all" ? "Library" : "My Store"}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => !swapTarget && setType(null)}
            disabled={!!swapTarget}
            className={`dg-focus-ring flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
              effectiveType === null
                ? "border-[var(--dg-accent)] bg-[var(--dg-accent)] text-[var(--dg-on-accent)]"
                : "border-[var(--dg-border)] bg-[var(--dg-surface)]/60 text-[var(--dg-muted)] hover:border-[var(--dg-border-strong)] hover:text-[var(--dg-text)]"
            }`}
          >
            <Layers size={13} strokeWidth={1.75} />
            All
          </button>
          {SECTION_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => !swapTarget && setType(t)}
              disabled={!!swapTarget}
              className={`dg-focus-ring flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                effectiveType === t
                  ? "border-[var(--dg-accent)] bg-[var(--dg-accent)] text-[var(--dg-on-accent)]"
                  : "border-[var(--dg-border)] bg-[var(--dg-surface)]/60 text-[var(--dg-muted)] hover:border-[var(--dg-border-strong)] hover:text-[var(--dg-text)]"
              }`}
            >
              <SectionTypeIcon type={t} size={13} />
              {SECTION_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {tab === "all" && loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-[var(--dg-surface)]" />
            ))}
          </div>
        ) : tab === "all" && error ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm text-[var(--dg-muted)]">Couldn&apos;t load sections.</p>
            <button
              onClick={loadAll}
              className="rounded-md bg-[var(--dg-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--dg-on-accent)]"
            >
              Retry
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--dg-muted)]">
            {tab === "my-store" ? "No saved sections yet — star one to add it here." : "No sections found."}
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.type}>
                <div className="mb-3 flex items-center gap-2">
                  <SectionTypeIcon type={group.type} size={15} className="text-[var(--dg-muted)]" />
                  <h3 className="font-display text-lg font-semibold text-[var(--dg-text)]">
                    {SECTION_TYPE_LABELS[group.type]}
                  </h3>
                  <span className="ml-auto font-mono text-[11px] text-[var(--dg-muted-2)]">{group.items.length}</span>
                </div>
                <div className="space-y-3">
                  {group.items.map((section) => (
                    <SectionThumbnail
                      key={section.id}
                      type={section.type}
                      html={section.html}
                      fontToken={section.fontToken}
                      colorTheme={section.colorTheme}
                      designName={section.designName}
                      saved={savedIdBySection.has(section.id)}
                      onToggleSave={() => toggleSave(section.id)}
                      onAdd={() => onAdd(toBlueprintSection(section))}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
