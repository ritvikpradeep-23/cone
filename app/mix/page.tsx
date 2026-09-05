"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LibraryPanel } from "@/components/library-panel";
import { BlueprintPanel } from "@/components/blueprint-panel";
import { readBlueprint, writeBlueprint, type BlueprintSection } from "@/lib/blueprint-store";
import { useMediaQuery } from "@/lib/use-media-query";

export default function MixPage() {
  const [sections, setSections] = useState<BlueprintSection[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [mobileTab, setMobileTab] = useState<"library" | "blueprint">("library");
  const isNarrow = useMediaQuery("(max-width: 899px)");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from sessionStorage, unavailable during render
    setSections(readBlueprint());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeBlueprint(sections);
  }, [sections, hydrated]);

  const addSection = (section: BlueprintSection) => setSections((prev) => [...prev, section]);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-4 border-b border-[var(--dg-border)] px-6 py-3">
        <Link href="/" className="text-sm font-medium text-[var(--dg-text)]">
          Design Gallery
        </Link>
        <span className="text-[var(--dg-muted)]">/</span>
        <span className="text-sm text-[var(--dg-muted)]">Mix canvas</span>

        {isNarrow ? (
          <div className="ml-auto flex gap-1 rounded-md border border-[var(--dg-border)] bg-white p-0.5">
            {(["library", "blueprint"] as const).map((tab) => (
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
            <LibraryPanel onAdd={addSection} />
          ) : (
            <BlueprintPanel sections={sections} onChange={setSections} />
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="w-[35%] min-w-[320px] border-r border-[var(--dg-border)]">
            <LibraryPanel onAdd={addSection} />
          </div>
          <div className="flex-1">
            <BlueprintPanel sections={sections} onChange={setSections} />
          </div>
        </div>
      )}
    </div>
  );
}
