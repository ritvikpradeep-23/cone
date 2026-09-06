"use client";

import { useEffect, useState } from "react";
import { CanvasSidePanel, type SwapTarget } from "@/components/canvas-side-panel";
import { Canvas } from "@/components/canvas";
import { readBlueprint, writeBlueprint, replaceSectionAt, type BlueprintSection } from "@/lib/blueprint-store";
import { useMediaQuery } from "@/lib/use-media-query";
import type { SectionType } from "@/lib/section-types";

export default function MixPage() {
  const [sections, setSections] = useState<BlueprintSection[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [swapTarget, setSwapTarget] = useState<SwapTarget>(null);
  const [mobileTab, setMobileTab] = useState<"library" | "canvas">("library");
  const isNarrow = useMediaQuery("(max-width: 899px)");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from sessionStorage, unavailable during render
    setSections(readBlueprint());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeBlueprint(sections);
  }, [sections, hydrated]);

  const handleAdd = (section: BlueprintSection) => {
    if (swapTarget) {
      setSections(replaceSectionAt(swapTarget.index, section));
      setSwapTarget(null);
      if (isNarrow) setMobileTab("canvas");
    } else {
      setSections((prev) => [...prev, section]);
      if (isNarrow) setMobileTab("canvas");
    }
  };

  const handleSwapRequest = (index: number, type: SectionType) => {
    setSwapTarget({ index, type });
    if (isNarrow) setMobileTab("library");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-4 border-b border-[var(--dg-border)] px-6 py-3">
        <p className="text-sm font-medium text-[var(--dg-text)]">Mix Canvas</p>

        {isNarrow ? (
          <div className="ml-auto flex gap-1 rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] p-0.5">
            {(["library", "canvas"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`rounded px-3 py-1 text-xs font-medium capitalize transition ${
                  mobileTab === tab ? "bg-[var(--dg-accent)] text-white" : "text-[var(--dg-muted)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isNarrow ? (
        <div className="min-h-0 flex-1">
          {mobileTab === "library" ? (
            <CanvasSidePanel onAdd={handleAdd} swapTarget={swapTarget} onCancelSwap={() => setSwapTarget(null)} />
          ) : (
            <Canvas sections={sections} onChange={setSections} onSwapRequest={handleSwapRequest} />
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="w-[35%] min-w-[320px] border-r border-[var(--dg-border)]">
            <CanvasSidePanel onAdd={handleAdd} swapTarget={swapTarget} onCancelSwap={() => setSwapTarget(null)} />
          </div>
          <div className="flex-1">
            <Canvas sections={sections} onChange={setSections} onSwapRequest={handleSwapRequest} />
          </div>
        </div>
      )}
    </div>
  );
}
