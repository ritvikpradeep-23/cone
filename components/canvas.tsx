"use client";

import { useCallback, useRef, useState } from "react";
import Script from "next/script";
import { GripVertical, X, Repeat, Download, Camera } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DeviceToggle } from "./device-toggle";
import { DEVICE_WIDTHS, type DeviceWidth } from "./scaled-frame";
import { FONT_TOKENS } from "@/lib/font-tokens";
import { buildFontLinkHtml, buildFontTokenStyleTag } from "@/lib/font-tokens";
import { SECTION_TYPE_LABELS } from "@/lib/section-types";
import type { BlueprintSection } from "@/lib/blueprint-store";
import { useToast } from "./toast";

const HTML2CANVAS_SRC = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";

declare global {
  interface Window {
    html2canvas?: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  }
}

type FontHover = { sectionIndex: number; top: number; left: number };

function CanvasSection({
  section,
  index,
  onSwap,
  onRemove,
  onFontHover,
}: {
  section: BlueprintSection;
  index: number;
  onSwap: () => void;
  onRemove: () => void;
  onFontHover: (hover: FontHover | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.sectionId,
  });
  const contentRef = useRef<HTMLDivElement>(null);

  const handleMouseOver = (event: React.MouseEvent) => {
    const target = (event.target as HTMLElement).closest("[data-dg-font-role]");
    if (!target) return;
    const rect = target.getBoundingClientRect();
    onFontHover({ sectionIndex: index, top: rect.top, left: rect.right + 8 });
  };

  return (
    <div
      ref={setNodeRef}
      data-section-index={index}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group/section relative ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-between p-2 opacity-0 transition group-hover/section:opacity-100">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${SECTION_TYPE_LABELS[section.type]}`}
          className="pointer-events-auto cursor-grab rounded-md bg-black/70 p-1.5 text-white outline-none backdrop-blur focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] active:cursor-grabbing"
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>
        <div className="pointer-events-auto flex gap-1.5">
          <button
            onClick={onSwap}
            aria-label={`Swap ${SECTION_TYPE_LABELS[section.type]}`}
            className="flex items-center gap-1 rounded-md bg-black/70 px-2 py-1.5 text-xs font-medium text-white outline-none backdrop-blur focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)]"
          >
            <Repeat size={13} strokeWidth={2} />
            Swap
          </button>
          <button
            onClick={onRemove}
            aria-label={`Remove ${SECTION_TYPE_LABELS[section.type]}`}
            className="rounded-md bg-black/70 p-1.5 text-white outline-none backdrop-blur focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)]"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        ref={contentRef}
        data-font-token={section.fontToken}
        onMouseOver={handleMouseOver}
        onMouseLeave={() => onFontHover(null)}
      >
        <div dangerouslySetInnerHTML={{ __html: section.html }} />
      </div>
    </div>
  );
}

export function Canvas({
  sections,
  onChange,
  onSwapRequest,
}: {
  sections: BlueprintSection[];
  onChange: (sections: BlueprintSection[]) => void;
  onSwapRequest: (index: number, type: BlueprintSection["type"]) => void;
}) {
  const [device, setDevice] = useState<DeviceWidth>(DEVICE_WIDTHS.desktop);
  const [exporting, setExporting] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [fontHover, setFontHover] = useState<FontHover | null>(null);
  const canvasContentRef = useRef<HTMLDivElement>(null);
  const showToast = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.sectionId === active.id);
    const newIndex = sections.findIndex((s) => s.sectionId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(sections, oldIndex, newIndex));
  };

  const setFontTokenAt = (index: number, fontToken: string) => {
    const next = [...sections];
    next[index] = { ...next[index], fontToken };
    onChange(next);
    setFontHover(null);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionIds: sections.map((s) => s.sectionId) }),
      });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "blueprint.html";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Exported blueprint.html");
    } catch {
      showToast("Export failed — try again");
    } finally {
      setExporting(false);
    }
  };

  const handleCapture = useCallback(async () => {
    if (!canvasContentRef.current || !window.html2canvas) {
      showToast("Screenshot tool still loading — try again in a moment");
      return;
    }
    setCapturing(true);
    try {
      const canvas = await window.html2canvas(canvasContentRef.current, { useCORS: true });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "canvas.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("Screenshot saved");
    } catch {
      showToast("Screenshot failed — try again");
    } finally {
      setCapturing(false);
    }
  }, [showToast]);

  const hoveredSection = fontHover ? sections[fontHover.sectionIndex] : null;

  return (
    <div className="flex h-full flex-col">
      <Script src="https://cdn.tailwindcss.com" strategy="afterInteractive" />
      <Script src={HTML2CANVAS_SRC} strategy="afterInteractive" />
      <style dangerouslySetInnerHTML={{ __html: buildFontTokenStyleTag().replace(/<\/?style>/g, "") }} />
      <div dangerouslySetInnerHTML={{ __html: buildFontLinkHtml() }} />

      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--dg-border)] bg-[var(--dg-bg)] px-4 py-3">
        <DeviceToggle value={device} onChange={setDevice} variant="overlay" />
        <div className="flex items-center gap-2">
          <button
            onClick={handleCapture}
            disabled={capturing}
            className="flex items-center gap-1.5 rounded-md border border-[var(--dg-border)] px-3 py-1.5 text-xs font-medium text-[var(--dg-text)] outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] disabled:opacity-50"
          >
            <Camera size={14} strokeWidth={1.75} />
            {capturing ? "Capturing..." : "Screenshot"}
          </button>
          <button
            onClick={handleExport}
            disabled={sections.length === 0 || exporting}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--dg-accent)] px-4 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Download size={14} strokeWidth={1.75} />
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sections.length === 0 ? (
          <div className="flex h-full min-h-[400px] items-center justify-center p-8">
            <div className="flex h-full min-h-[240px] w-full max-w-md items-center justify-center rounded-lg border-2 border-dashed border-[var(--dg-border)] text-center">
              <p className="max-w-[220px] text-sm text-[var(--dg-muted)]">
                Click a section on the left to start building.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="mx-auto transition-[width] duration-200 ease-out"
            style={{ width: device === DEVICE_WIDTHS.desktop ? "100%" : device }}
          >
            <div ref={canvasContentRef}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map((s) => s.sectionId)} strategy={verticalListSortingStrategy}>
                  {sections.map((section, index) => (
                    <CanvasSection
                      key={section.sectionId}
                      section={section}
                      index={index}
                      onSwap={() => onSwapRequest(index, section.type)}
                      onRemove={() => onChange(sections.filter((_, i) => i !== index))}
                      onFontHover={setFontHover}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )}
      </div>

      {fontHover && hoveredSection ? (
        <div
          className="fixed z-40 rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] p-1 shadow-xl"
          style={{ top: fontHover.top, left: fontHover.left }}
          onMouseLeave={() => setFontHover(null)}
        >
          <select
            autoFocus
            value={hoveredSection.fontToken}
            onChange={(e) => setFontTokenAt(fontHover.sectionIndex, e.target.value)}
            className="rounded bg-transparent px-2 py-1 text-xs text-[var(--dg-text)] outline-none"
          >
            {FONT_TOKENS.map((t) => (
              <option key={t.id} value={t.id} className="bg-[var(--dg-surface)] text-[var(--dg-text)]">
                {t.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}
