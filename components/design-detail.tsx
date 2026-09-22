"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, CalendarDays, Plus, Shuffle } from "lucide-react";
import { ScaledFrame, type DeviceWidth } from "./scaled-frame";
import { DeviceToggle } from "./device-toggle";
import { assembleStandaloneHtml } from "@/lib/assemble-html";
import { appendToBlueprint, toBlueprintSection } from "@/lib/blueprint-store";
import { useToast } from "./toast";
import { SECTION_TYPE_LABELS, type SectionType } from "@/lib/section-types";
import { formatBatchDate } from "@/lib/format";

type SectionRow = {
  id: string;
  type: SectionType;
  html: string;
  orderIndex: number;
  fontToken: string;
  colorTheme: string;
};

export function DesignDetail({
  design,
  sections,
}: {
  design: { id: string; name: string; styleSummary: string; batchDate: string; fullHtml: string };
  sections: SectionRow[];
}) {
  const [device, setDevice] = useState<DeviceWidth>(1440);
  const showToast = useToast();

  const addSection = (section: SectionRow) => {
    appendToBlueprint(toBlueprintSection({ ...section, designName: design.name }));
    showToast(`${SECTION_TYPE_LABELS[section.type]} added to blueprint`);
  };

  const addWholeDesign = () => {
    for (const section of sections) {
      appendToBlueprint(toBlueprintSection({ ...section, designName: design.name }));
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold tracking-tight text-[var(--dg-text)]">{design.name}</p>
          <p className="mt-1 max-w-xl text-sm text-[var(--dg-muted)]">{design.styleSummary}</p>
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--dg-muted-2)]">
            <CalendarDays size={11} strokeWidth={2} />
            {formatBatchDate(design.batchDate)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/designs/${design.id}/preview`}
            className="dg-focus-ring flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--dg-text)] transition-colors hover:border-[var(--dg-border-strong)] hover:bg-[var(--dg-surface-hover)]"
          >
            <ExternalLink size={13} strokeWidth={2} />
            Test in full browser
          </Link>
          <Link
            href="/mix"
            onClick={addWholeDesign}
            className="dg-focus-ring flex items-center gap-1.5 whitespace-nowrap rounded-md bg-[var(--dg-accent)] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--dg-accent-hover)]"
          >
            <Shuffle size={13} strokeWidth={2} />
            Open full design in Mix canvas
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex justify-center">
            <DeviceToggle value={device} onChange={setDevice} variant="tabs" />
          </div>
          <div
            className="overflow-hidden rounded-lg border border-[var(--dg-border)] bg-[var(--dg-surface)]"
            style={{ boxShadow: "var(--dg-shadow)" }}
          >
            <ScaledFrame srcDoc={design.fullHtml} frameWidth={device} frameHeight={1400} fitContent title={design.name} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--dg-muted)]">
            Sections <span className="text-[var(--dg-muted-2)]">({sections.length})</span>
          </p>
          {sections.map((section) => (
            <div
              key={section.id}
              className="rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] p-2.5 transition-colors hover:border-[var(--dg-border-strong)]"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded bg-[var(--dg-bg)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--dg-muted)]">
                  {SECTION_TYPE_LABELS[section.type]}
                </span>
                <button
                  onClick={() => addSection(section)}
                  className="dg-focus-ring flex items-center gap-1 rounded text-xs font-medium text-[var(--dg-accent-hover)] hover:underline"
                >
                  <Plus size={12} strokeWidth={2} />
                  Add to blueprint
                </button>
              </div>
              <div className="overflow-hidden rounded border border-[var(--dg-border)]">
                <ScaledFrame
                  srcDoc={assembleStandaloneHtml(
                    section.type,
                    [{ html: section.html, fontToken: section.fontToken, colorTheme: section.colorTheme }],
                    { reportHeight: true }
                  )}
                  frameWidth={1440}
                  frameHeight={220}
                  title={section.type}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
