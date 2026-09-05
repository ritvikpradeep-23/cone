"use client";

import { useState } from "react";
import { ScaledFrame } from "./scaled-frame";
import { assembleStandaloneHtml } from "@/lib/assemble-html";
import { SECTION_TYPE_LABELS, type SectionType } from "@/lib/section-types";

export function SectionThumbnail({
  type,
  html,
  designName,
  onAdd,
}: {
  type: SectionType;
  html: string;
  designName: string;
  onAdd: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group relative rounded-md border border-[var(--dg-border)] bg-white p-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={onAdd}
        className="block w-full text-left"
        aria-label={`Add ${SECTION_TYPE_LABELS[type]} from ${designName} to blueprint`}
      >
        <div className="pointer-events-none overflow-hidden rounded border border-[var(--dg-border)]">
          <ScaledFrame srcDoc={assembleStandaloneHtml(type, [html])} frameWidth={1440} frameHeight={140} title={type} />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase text-[var(--dg-muted)]">
            {SECTION_TYPE_LABELS[type]}
          </span>
          <span className="truncate pl-2 text-[10px] text-[var(--dg-muted)]">{designName}</span>
        </div>
      </button>

      {hovered ? (
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 w-72 -translate-x-1/2 -translate-y-[calc(100%+8px)] overflow-hidden rounded-lg border border-[var(--dg-border)] bg-white shadow-xl">
          <ScaledFrame srcDoc={assembleStandaloneHtml(type, [html])} frameWidth={1440} frameHeight={280} title={`${type} preview`} />
        </div>
      ) : null}
    </div>
  );
}
