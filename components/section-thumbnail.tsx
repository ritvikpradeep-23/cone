"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ScaledFrame } from "./scaled-frame";
import { assembleStandaloneHtml } from "@/lib/assemble-html";
import { SECTION_TYPE_LABELS, type SectionType } from "@/lib/section-types";

export function SectionThumbnail({
  type,
  html,
  fontToken,
  designName,
  onAdd,
  saved,
  onToggleSave,
}: {
  type: SectionType;
  html: string;
  fontToken: string;
  designName: string;
  onAdd: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group relative rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] p-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {onToggleSave ? (
        <button
          type="button"
          onClick={onToggleSave}
          aria-label={saved ? `Remove ${SECTION_TYPE_LABELS[type]} from My Store` : `Save ${SECTION_TYPE_LABELS[type]} to My Store`}
          aria-pressed={saved}
          className={`absolute right-3 top-3 z-10 rounded-md p-1 outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] ${
            saved ? "text-amber-400" : "text-[var(--dg-muted)] opacity-0 hover:text-amber-400 group-hover:opacity-100"
          }`}
        >
          <Star size={14} strokeWidth={1.75} fill={saved ? "currentColor" : "none"} />
        </button>
      ) : null}

      <button
        type="button"
        onClick={onAdd}
        className="block w-full text-left"
        aria-label={`Add ${SECTION_TYPE_LABELS[type]} from ${designName} to blueprint`}
      >
        <div className="pointer-events-none overflow-hidden rounded border border-[var(--dg-border)]">
          <ScaledFrame
            srcDoc={assembleStandaloneHtml(type, [{ html, fontToken }])}
            frameWidth={1440}
            frameHeight={140}
            title={type}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase text-[var(--dg-muted)]">
            {SECTION_TYPE_LABELS[type]}
          </span>
          <span className="truncate pl-2 text-[10px] text-[var(--dg-muted)]">{designName}</span>
        </div>
      </button>

      {hovered ? (
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 w-72 -translate-x-1/2 -translate-y-[calc(100%+8px)] overflow-hidden rounded-lg border border-[var(--dg-border)] bg-[var(--dg-surface)] shadow-xl">
          <ScaledFrame
            srcDoc={assembleStandaloneHtml(type, [{ html, fontToken }])}
            frameWidth={1440}
            frameHeight={280}
            title={`${type} preview`}
          />
        </div>
      ) : null}
    </div>
  );
}
