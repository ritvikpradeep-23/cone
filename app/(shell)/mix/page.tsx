"use client";

import { useCallback, useEffect, useState } from "react";
import { CanvasSidePanel, type SwapTarget } from "@/components/canvas-side-panel";
import { Canvas, type SaveStatus } from "@/components/canvas";
import { useToast } from "@/components/toast";
import {
  readBlueprint,
  writeBlueprint,
  readGlobalTheme,
  applyGlobalTheme,
  type BlueprintSection,
} from "@/lib/blueprint-store";
import { useMediaQuery } from "@/lib/use-media-query";
import { SECTION_TYPE_LABELS, type SectionType } from "@/lib/section-types";

const MAX_HISTORY = 50;

export default function MixPage() {
  const [sections, setSections] = useState<BlueprintSection[]>([]);
  const [past, setPast] = useState<BlueprintSection[][]>([]);
  const [future, setFuture] = useState<BlueprintSection[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: "ready" });
  const [hydrated, setHydrated] = useState(false);
  const [swapTarget, setSwapTarget] = useState<SwapTarget>(null);
  const [mobileTab, setMobileTab] = useState<"library" | "canvas">("library");
  const isNarrow = useMediaQuery("(max-width: 899px)");
  const showToast = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage, unavailable during render
    setSections(readBlueprint());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || saveStatus.state !== "unsaved") return;
    const timer = setTimeout(() => {
      writeBlueprint(sections);
      setSaveStatus({
        state: "saved",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [sections, saveStatus.state, hydrated]);

  const commit = useCallback(
    (next: BlueprintSection[]) => {
      setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), sections]);
      setFuture([]);
      setSections(next);
      setSaveStatus({ state: "unsaved" });
    },
    [sections]
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [sections, ...f]);
    setSections(previous);
    setSaveStatus({ state: "unsaved" });
  }, [past, sections]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const [next, ...rest] = future;
    setFuture(rest);
    setPast((p) => [...p, sections]);
    setSections(next);
    setSaveStatus({ state: "unsaved" });
  }, [future, sections]);

  const clear = useCallback(() => {
    if (sections.length === 0) return;
    commit([]);
    setSelectedId(null);
    showToast("Canvas cleared", "Press ⌘Z to undo");
  }, [sections.length, commit, showToast]);

  const handleAdd = (section: BlueprintSection) => {
    const [themed] = applyGlobalTheme([section], readGlobalTheme());
    const label = SECTION_TYPE_LABELS[themed.type];
    if (swapTarget) {
      const next = [...sections];
      next[swapTarget.index] = themed;
      commit(next);
      setSwapTarget(null);
      showToast(`${label} swapped`, themed.designName);
    } else {
      commit([...sections, themed]);
      showToast(`${label} added`, themed.designName);
    }
    setSelectedId(themed.instanceId ?? themed.sectionId);
    if (isNarrow) setMobileTab("canvas");
  };

  const handleSwapRequest = (index: number, type: SectionType) => {
    setSwapTarget({ index, type });
    if (isNarrow) setMobileTab("library");
  };

  const canvas = (
    <Canvas
      sections={sections}
      onChange={commit}
      onSwapRequest={handleSwapRequest}
      selectedId={selectedId}
      onSelect={setSelectedId}
      canUndo={past.length > 0}
      canRedo={future.length > 0}
      onUndo={undo}
      onRedo={redo}
      onClear={clear}
      saveStatus={saveStatus}
    />
  );
  const panel = (
    <CanvasSidePanel onAdd={handleAdd} swapTarget={swapTarget} onCancelSwap={() => setSwapTarget(null)} />
  );

  return (
    <div className="flex h-full flex-col">
      {isNarrow ? (
        <div className="flex items-center gap-4 border-b border-[var(--dg-border)] px-4 py-2.5">
          <p className="font-display text-lg font-semibold text-[var(--dg-text)]">Mix Canvas</p>
          <div className="ml-auto flex gap-1 rounded-full border border-[var(--dg-border)] bg-[var(--dg-surface)] p-0.5">
            {(["library", "canvas"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                  mobileTab === tab ? "bg-[var(--dg-accent)] text-[var(--dg-on-accent)]" : "text-[var(--dg-muted)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {isNarrow ? (
        <div className="min-h-0 flex-1">{mobileTab === "library" ? panel : canvas}</div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="w-[328px] shrink-0 border-r border-[var(--dg-border)]">{panel}</div>
          <div className="min-w-0 flex-1">{canvas}</div>
        </div>
      )}
    </div>
  );
}
