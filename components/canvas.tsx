"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { GripVertical, X, Repeat, Download, Camera, Palette, RotateCcw, AlertTriangle } from "lucide-react";
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
import { COLOR_THEMES, contrastRatio, buildColorThemeStyleTag, resolveCustomColorStyle } from "@/lib/color-themes";
import { buildStyleTokenCss } from "@/lib/style-tokens";
import { SECTION_TYPE_LABELS } from "@/lib/section-types";
import {
  type BlueprintSection,
  type GlobalTheme,
  readGlobalTheme,
  writeGlobalTheme,
  setSectionOverride,
  resetSectionAll,
  applyGlobalTheme,
} from "@/lib/blueprint-store";
import { useToast } from "./toast";

const HTML2CANVAS_SRC = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";

declare global {
  interface Window {
    html2canvas?: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  }
}

type StyleTab = "font" | "color" | "density" | "button";
const STYLE_TABS: { id: StyleTab; label: string }[] = [
  { id: "font", label: "Font" },
  { id: "color", label: "Color" },
  { id: "density", label: "Density" },
  { id: "button", label: "Button" },
];

/** Tabbed Font/Color/Density/Button editor, shared by the per-section popover and the global Theme popover. */
function StyleEditor({
  fontToken,
  colorTheme,
  density,
  buttonStyle,
  onFontToken,
  onColorTheme,
  onDensity,
  onButtonStyle,
}: {
  fontToken: string;
  colorTheme: string;
  density: "compact" | "spacious";
  buttonStyle: "rounded" | "square";
  onFontToken: (v: string) => void;
  onColorTheme: (v: string) => void;
  onDensity: (v: "compact" | "spacious") => void;
  onButtonStyle: (v: "rounded" | "square") => void;
}) {
  const [tab, setTab] = useState<StyleTab>("font");
  const [colorMode, setColorMode] = useState<"swatches" | "advanced">("swatches");
  const [customHex, setCustomHex] = useState("#000000");

  // Accent-solid elements (the main use of this color) typically carry white text —
  // that's the contrast pairing worth warning about, per the addendum's ask to check
  // against "the section's existing text color."
  const customContrast = contrastRatio(customHex, "#ffffff");
  const lowContrast = customContrast !== null && customContrast < 3;

  return (
    <div className="w-64">
      <div className="flex border-b border-[var(--dg-border)]">
        {STYLE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-2 py-1.5 text-[11px] font-medium transition ${
              tab === t.id
                ? "border-b-2 border-[var(--dg-accent)] text-[var(--dg-text)]"
                : "text-[var(--dg-muted)] hover:text-[var(--dg-text)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-2.5">
        {tab === "font" ? (
          <select
            autoFocus
            value={fontToken}
            onChange={(e) => onFontToken(e.target.value)}
            className="w-full rounded bg-transparent px-1 py-1 text-xs text-[var(--dg-text)] outline-none"
          >
            {FONT_TOKENS.map((t) => (
              <option key={t.id} value={t.id} className="bg-[var(--dg-surface)] text-[var(--dg-text)]">
                {t.label}
              </option>
            ))}
          </select>
        ) : null}

        {tab === "color" ? (
          <div>
            <div className="mb-2 flex gap-1">
              <button
                onClick={() => setColorMode("swatches")}
                className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                  colorMode === "swatches" ? "bg-[var(--dg-accent-soft)] text-[var(--dg-accent-hover)]" : "text-[var(--dg-muted)]"
                }`}
              >
                Swatches
              </button>
              <button
                onClick={() => setColorMode("advanced")}
                className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                  colorMode === "advanced" ? "bg-[var(--dg-accent-soft)] text-[var(--dg-accent-hover)]" : "text-[var(--dg-muted)]"
                }`}
              >
                Advanced
              </button>
            </div>
            {colorMode === "swatches" ? (
              <div className="grid grid-cols-4 gap-2">
                {COLOR_THEMES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onColorTheme(c.id)}
                    aria-label={c.label}
                    title={c.label}
                    className={`h-8 w-8 rounded-full transition ${
                      colorTheme === c.id ? "ring-2 ring-[var(--dg-text)] ring-offset-2 ring-offset-[var(--dg-surface)]" : ""
                    }`}
                    style={{ background: c.accentHex }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6}$/i.test(customHex) ? customHex : "#000000"}
                    onChange={(e) => setCustomHex(e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded border border-[var(--dg-border)] bg-transparent p-0"
                  />
                  <input
                    value={customHex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    placeholder="#rrggbb"
                    className="w-full rounded border border-[var(--dg-border)] bg-transparent px-2 py-1 font-mono text-[11px] text-[var(--dg-text)] outline-none"
                  />
                </div>
                {lowContrast ? (
                  <p className="flex items-start gap-1 text-[10px] text-[var(--dg-warning)]">
                    <AlertTriangle size={12} strokeWidth={2} className="mt-0.5 shrink-0" />
                    Low contrast against white text — still usable, may be hard to read on solid buttons.
                  </p>
                ) : null}
                <button
                  onClick={() => onColorTheme(`custom:${customHex}`)}
                  disabled={!/^#[0-9a-f]{6}$/i.test(customHex)}
                  className="w-full rounded bg-[var(--dg-accent)] px-2 py-1.5 text-[11px] font-medium text-white transition hover:bg-[var(--dg-accent-hover)] disabled:opacity-40"
                >
                  Use this color
                </button>
              </div>
            )}
          </div>
        ) : null}

        {tab === "density" ? (
          <div className="flex gap-1.5">
            {(["compact", "spacious"] as const).map((d) => (
              <button
                key={d}
                onClick={() => onDensity(d)}
                className={`flex-1 rounded px-2 py-1.5 text-[11px] font-medium capitalize transition ${
                  density === d ? "bg-[var(--dg-accent)] text-white" : "border border-[var(--dg-border)] text-[var(--dg-muted)] hover:bg-white/5"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        ) : null}

        {tab === "button" ? (
          <div className="flex gap-1.5">
            {(["rounded", "square"] as const).map((b) => (
              <button
                key={b}
                onClick={() => onButtonStyle(b)}
                className={`flex-1 rounded px-2 py-1.5 text-[11px] font-medium capitalize transition ${
                  buttonStyle === b ? "bg-[var(--dg-accent)] text-white" : "border border-[var(--dg-border)] text-[var(--dg-muted)] hover:bg-white/5"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CanvasSection({
  section,
  index,
  onSwap,
  onRemove,
  customizeOpen,
  onToggleCustomize,
  onOverride,
  onReset,
}: {
  section: BlueprintSection;
  index: number;
  onSwap: () => void;
  onRemove: () => void;
  customizeOpen: boolean;
  onToggleCustomize: () => void;
  onOverride: <P extends "fontToken" | "colorTheme" | "density" | "buttonStyle">(
    property: P,
    value: BlueprintSection[P]
  ) => void;
  onReset: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.sectionId,
  });
  const hasAnyOverride = Object.values(section.overrides).some(Boolean);

  return (
    <div
      ref={setNodeRef}
      data-section-index={index}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group/section relative ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-between p-2 opacity-0 transition group-hover/section:opacity-100">
        <div className="pointer-events-auto flex gap-1.5">
          <button
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${SECTION_TYPE_LABELS[section.type]}`}
            className="cursor-grab rounded-md bg-black/70 p-1.5 text-white outline-none backdrop-blur focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] active:cursor-grabbing"
          >
            <GripVertical size={14} strokeWidth={2} />
          </button>
          <button
            onClick={onToggleCustomize}
            aria-label={`Customize ${SECTION_TYPE_LABELS[section.type]}`}
            className={`relative flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-white outline-none backdrop-blur focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] ${
              customizeOpen ? "bg-[var(--dg-accent)]" : "bg-black/70"
            }`}
          >
            <Palette size={13} strokeWidth={2} />
            Customize
            {hasAnyOverride ? (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--dg-accent)]" />
            ) : null}
          </button>
        </div>
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

      {customizeOpen ? (
        <div
          className="absolute left-2 top-11 z-40 rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] shadow-xl"
          onMouseLeave={onToggleCustomize}
        >
          <StyleEditor
            fontToken={section.fontToken}
            colorTheme={section.colorTheme}
            density={section.density}
            buttonStyle={section.buttonStyle}
            onFontToken={(v) => onOverride("fontToken", v)}
            onColorTheme={(v) => onOverride("colorTheme", v)}
            onDensity={(v) => onOverride("density", v)}
            onButtonStyle={(v) => onOverride("buttonStyle", v)}
          />
          {hasAnyOverride ? (
            <button
              onClick={onReset}
              className="flex w-full items-center gap-1.5 border-t border-[var(--dg-border)] px-2.5 py-2 text-[11px] font-medium text-[var(--dg-muted)] hover:text-[var(--dg-text)]"
            >
              <RotateCcw size={12} strokeWidth={2} />
              Reset to generated default
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        data-font-token={section.fontToken}
        data-color-theme={section.colorTheme}
        data-density={section.density}
        data-button-style={section.buttonStyle}
        style={resolveCustomColorStyle(section.colorTheme) as React.CSSProperties}
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [globalTheme, setGlobalTheme] = useState<GlobalTheme | null>(null);
  const canvasContentRef = useRef<HTMLDivElement>(null);
  const showToast = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from sessionStorage, unavailable during render
    setGlobalTheme(readGlobalTheme());
  }, []);

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

  const handleOverride = <P extends "fontToken" | "colorTheme" | "density" | "buttonStyle">(
    index: number,
    property: P,
    value: BlueprintSection[P]
  ) => {
    onChange(setSectionOverride(sections, index, property, value));
  };

  const handleReset = (index: number) => {
    onChange(resetSectionAll(sections, index));
  };

  const handleApplyGlobalTheme = (next: GlobalTheme) => {
    setGlobalTheme(next);
    writeGlobalTheme(next);
    onChange(applyGlobalTheme(sections, next));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: sections.map((s) => ({
            id: s.sectionId,
            fontToken: s.fontToken,
            colorTheme: s.colorTheme,
            density: s.density,
            buttonStyle: s.buttonStyle,
          })),
        }),
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

  return (
    <div className="flex h-full flex-col">
      <Script src="https://cdn.tailwindcss.com" strategy="afterInteractive" />
      <Script src={HTML2CANVAS_SRC} strategy="afterInteractive" />
      <style
        dangerouslySetInnerHTML={{
          __html: [buildFontTokenStyleTag(), buildColorThemeStyleTag(), buildStyleTokenCss()]
            .join("\n")
            .replace(/<\/?style>/g, ""),
        }}
      />
      <div dangerouslySetInnerHTML={{ __html: buildFontLinkHtml() }} />

      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--dg-border)] bg-[var(--dg-bg)] px-4 py-3">
        <div className="flex items-center gap-2">
          <DeviceToggle value={device} onChange={setDevice} variant="overlay" />
          <div className="relative">
            <button
              onClick={() => setThemeOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-md border border-[var(--dg-border)] px-3 py-1.5 text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] ${
                themeOpen ? "bg-[var(--dg-accent-soft)] text-[var(--dg-accent-hover)]" : "text-[var(--dg-text)] hover:bg-white/5"
              }`}
            >
              <Palette size={14} strokeWidth={1.75} />
              Theme
            </button>
            {themeOpen && globalTheme ? (
              <div
                className="absolute left-0 top-full z-40 mt-1 rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] shadow-xl"
                onMouseLeave={() => setThemeOpen(false)}
              >
                <StyleEditor
                  fontToken={globalTheme.fontToken ?? FONT_TOKENS[0].id}
                  colorTheme={globalTheme.colorTheme ?? COLOR_THEMES[0].id}
                  density={globalTheme.density}
                  buttonStyle={globalTheme.buttonStyle}
                  onFontToken={(v) => handleApplyGlobalTheme({ ...globalTheme, fontToken: v })}
                  onColorTheme={(v) => handleApplyGlobalTheme({ ...globalTheme, colorTheme: v })}
                  onDensity={(v) => handleApplyGlobalTheme({ ...globalTheme, density: v })}
                  onButtonStyle={(v) => handleApplyGlobalTheme({ ...globalTheme, buttonStyle: v })}
                />
                <p className="border-t border-[var(--dg-border)] px-2.5 py-2 text-[10px] text-[var(--dg-muted-2,var(--dg-muted))]">
                  Applies to every section without its own override.
                </p>
              </div>
            ) : null}
          </div>
        </div>
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
                      customizeOpen={openIndex === index}
                      onToggleCustomize={() => setOpenIndex((v) => (v === index ? null : index))}
                      onOverride={(property, value) => handleOverride(index, property, value)}
                      onReset={() => handleReset(index)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
