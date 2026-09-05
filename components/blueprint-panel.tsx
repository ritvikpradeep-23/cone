"use client";

import { useState } from "react";
import { GripVertical, X, ChevronUp, ChevronDown, Download } from "lucide-react";
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
import { ScaledFrame, type DeviceWidth } from "./scaled-frame";
import { DeviceToggle } from "./device-toggle";
import { assembleStandaloneHtml } from "@/lib/assemble-html";
import { SECTION_TYPE_LABELS } from "@/lib/section-types";
import type { BlueprintSection } from "@/lib/blueprint-store";
import { useToast } from "./toast";

function Row({
  section,
  index,
  total,
  onRemove,
  onMove,
}: {
  section: BlueprintSection;
  index: number;
  total: number;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.sectionId,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex items-center gap-2 rounded-md border border-[var(--dg-border)] bg-white px-2.5 py-2 ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${SECTION_TYPE_LABELS[section.type]}`}
        className="cursor-grab touch-none text-[var(--dg-muted)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] active:cursor-grabbing"
      >
        <GripVertical size={16} strokeWidth={1.75} />
      </button>

      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase text-[var(--dg-muted)]">
          {SECTION_TYPE_LABELS[section.type]}
        </p>
        <p className="truncate text-xs text-[var(--dg-text)]">{section.designName}</p>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label="Move up"
          className="rounded p-1 text-[var(--dg-muted)] outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] disabled:opacity-30"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          aria-label="Move down"
          className="rounded p-1 text-[var(--dg-muted)] outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] disabled:opacity-30"
        >
          <ChevronDown size={14} />
        </button>
        <button
          onClick={onRemove}
          aria-label={`Remove ${SECTION_TYPE_LABELS[section.type]}`}
          className="rounded p-1 text-[var(--dg-muted)] opacity-0 outline-none transition hover:bg-black/5 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] group-hover:opacity-100"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function BlueprintPanel({
  sections,
  onChange,
}: {
  sections: BlueprintSection[];
  onChange: (sections: BlueprintSection[]) => void;
}) {
  const [device, setDevice] = useState<DeviceWidth>(1440);
  const [exporting, setExporting] = useState(false);
  const showToast = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    onChange(arrayMove(sections, index, target));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.sectionId === active.id);
    const newIndex = sections.findIndex((s) => s.sectionId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(sections, oldIndex, newIndex));
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--dg-border)] px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--dg-muted)]">Blueprint</p>
        <DeviceToggle value={device} onChange={setDevice} variant="overlay" />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {sections.length === 0 ? (
          <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border-2 border-dashed border-[var(--dg-border)] text-center">
            <p className="max-w-[220px] text-sm text-[var(--dg-muted)]">
              Click a section on the left to start building.
            </p>
          </div>
        ) : (
          <>
            <DndContext
              id="mix-blueprint"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sections.map((s) => s.sectionId)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {sections.map((section, index) => (
                    <Row
                      key={section.sectionId}
                      section={section}
                      index={index}
                      total={sections.length}
                      onRemove={() => onChange(sections.filter((s) => s.sectionId !== section.sectionId))}
                      onMove={(direction) => move(index, direction)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="overflow-hidden rounded-lg border border-[var(--dg-border)] bg-white">
              <ScaledFrame
                srcDoc={assembleStandaloneHtml("Blueprint preview", sections.map((s) => s.html))}
                frameWidth={device}
                frameHeight={1200}
                title="Blueprint preview"
              />
            </div>
          </>
        )}
      </div>

      <div className="border-t border-[var(--dg-border)] p-4 text-right">
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
  );
}
