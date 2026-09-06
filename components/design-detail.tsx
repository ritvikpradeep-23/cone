"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { ScaledFrame, type DeviceWidth } from "./scaled-frame";
import { DeviceToggle } from "./device-toggle";
import { assembleStandaloneHtml } from "@/lib/assemble-html";
import { appendToBlueprint } from "@/lib/blueprint-store";
import { useToast } from "./toast";
import { SECTION_TYPE_LABELS, type SectionType } from "@/lib/section-types";

type SectionRow = { id: string; type: SectionType; html: string; orderIndex: number; fontToken: string };

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
    appendToBlueprint({
      sectionId: section.id,
      type: section.type,
      html: section.html,
      designName: design.name,
      fontToken: section.fontToken,
    });
    showToast(`${SECTION_TYPE_LABELS[section.type]} added to blueprint`);
  };

  const addWholeDesign = () => {
    for (const section of sections) {
      appendToBlueprint({
        sectionId: section.id,
        type: section.type,
        html: section.html,
        designName: design.name,
        fontToken: section.fontToken,
      });
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-medium text-[var(--dg-text)]">{design.name}</p>
          <p className="mt-0.5 text-sm text-[var(--dg-muted)]">{design.styleSummary}</p>
          <p className="mt-0.5 font-mono text-[11px] text-[var(--dg-muted)]">{design.batchDate}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/designs/${design.id}/preview`}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--dg-border)] px-3.5 py-2 text-xs font-medium text-[var(--dg-text)] transition hover:bg-white/5"
          >
            <ExternalLink size={13} strokeWidth={1.75} />
            Test in full browser
          </Link>
          <Link
            href="/mix"
            onClick={addWholeDesign}
            className="whitespace-nowrap rounded-md bg-[var(--dg-accent)] px-3.5 py-2 text-xs font-medium text-white transition hover:opacity-90"
          >
            Open full design in Mix canvas
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex justify-center">
            <DeviceToggle value={device} onChange={setDevice} variant="tabs" />
          </div>
          <div className="overflow-hidden rounded-lg border border-[var(--dg-border)] bg-[var(--dg-surface)]">
            <ScaledFrame srcDoc={design.fullHtml} frameWidth={device} frameHeight={1400} fitContent title={design.name} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--dg-muted)]">Sections</p>
          {sections.map((section) => (
            <div
              key={section.id}
              className="rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] p-2.5"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded bg-[var(--dg-bg)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--dg-muted)]">
                  {SECTION_TYPE_LABELS[section.type]}
                </span>
                <button
                  onClick={() => addSection(section)}
                  className="text-xs font-medium text-[var(--dg-accent)] hover:underline"
                >
                  Add to blueprint
                </button>
              </div>
              <div className="overflow-hidden rounded border border-[var(--dg-border)]">
                <ScaledFrame
                  srcDoc={assembleStandaloneHtml(
                    section.type,
                    [{ html: section.html, fontToken: section.fontToken }],
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
