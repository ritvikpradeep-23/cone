"use client";

import { Plus, Star } from "lucide-react";
import { ScaledFrame } from "./scaled-frame";
import { SectionTypeIcon } from "./section-type-icon";
import { assembleStandaloneHtml } from "@/lib/assemble-html";
import { SECTION_TYPE_LABELS, type SectionType } from "@/lib/section-types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&amp;|&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function SectionThumbnail({
  type,
  html,
  fontToken,
  colorTheme,
  designName,
  onAdd,
  saved,
  onToggleSave,
}: {
  type: SectionType;
  html: string;
  fontToken: string;
  colorTheme: string;
  designName: string;
  onAdd: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
}) {
  return (
    <div className="group relative rounded-2xl border border-[var(--dg-border)] bg-[var(--dg-surface)] p-2 transition-colors hover:border-[var(--dg-border-strong)]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-[var(--dg-border)] bg-[var(--dg-canvas)]">
        <div className="pointer-events-none transition duration-200 group-hover:scale-[1.02] group-hover:opacity-40 group-hover:blur-[2px]">
          <ScaledFrame
            srcDoc={assembleStandaloneHtml(type, [{ html, fontToken, colorTheme }])}
            frameWidth={1440}
            frameHeight={900}
            title={`${designName} ${type}`}
          />
        </div>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add ${SECTION_TYPE_LABELS[type]} from ${designName} to blueprint`}
          className="dg-focus-ring absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-[var(--dg-accent)] px-3.5 py-1.5 text-xs font-semibold text-[var(--dg-on-accent)] opacity-0 shadow-lg transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Plus size={14} strokeWidth={2.5} />
          Add
        </button>
      </div>

      {onToggleSave ? (
        <button
          type="button"
          onClick={onToggleSave}
          aria-label={saved ? `Remove ${SECTION_TYPE_LABELS[type]} from My Store` : `Save ${SECTION_TYPE_LABELS[type]} to My Store`}
          aria-pressed={saved}
          className={`dg-focus-ring absolute right-4 top-4 z-10 rounded-md bg-[var(--dg-bg)]/70 p-1 backdrop-blur transition ${
            saved ? "text-amber-400" : "text-[var(--dg-muted)] opacity-0 hover:text-amber-400 group-hover:opacity-100"
          }`}
        >
          <Star size={14} strokeWidth={1.75} fill={saved ? "currentColor" : "none"} />
        </button>
      ) : null}

      <div className="relative px-1.5 pb-1 pt-2.5">
        <p className="truncate pr-8 text-sm font-semibold text-[var(--dg-text)]">{designName}</p>
        <p className="truncate pr-8 font-mono text-[11px] text-[var(--dg-muted-2)]">
          {type}/{slugify(designName)}
        </p>
        <SectionTypeIcon
          type={type}
          size={26}
          className="absolute bottom-1 right-1 text-[var(--dg-muted)] opacity-20"
        />
      </div>
    </div>
  );
}
