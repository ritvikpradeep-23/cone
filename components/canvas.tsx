"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import {
  GripVertical,
  Camera,
  Download,
  Palette,
  RotateCcw,
  AlertTriangle,
  Undo2,
  Redo2,
  Eye,
  Trash2,
  ArrowUp,
  ArrowDown,
  Shuffle,
  Type,
  Rows3,
  Square,
  ChevronDown,
} from "lucide-react";
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
import { FONT_TOKENS, getFontToken, buildFontLinkHtml, buildFontTokenStyleTag } from "@/lib/font-tokens";
import {
  COLOR_THEMES,
  CUSTOM_COLOR_PREFIX,
  contrastRatio,
  getColorTheme,
  buildColorThemeStyleTag,
  resolveCustomColorStyle,
} from "@/lib/color-themes";
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

export type SaveStatus = { state: "ready" | "unsaved" | "saved"; time?: string };

type StyleTab = "font" | "color" | "density" | "button";
const STYLE_TABS: { id: StyleTab; label: string }[] = [
  { id: "font", label: "Font" },
  { id: "color", label: "Color" },
  { id: "density", label: "Density" },
  { id: "button", label: "Button" },
];

const POPOVER_WIDTH = 256;
const pad2 = (n: number) => String(n).padStart(2, "0");
const keyOf = (s: BlueprintSection) => s.instanceId ?? s.sectionId;

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
}

/** Tabbed Font/Color/Density/Button editor, shared by the per-section popover and the global Theme popover. */
function StyleEditor({
  initialTab = "font",
  fontToken,
  colorTheme,
  density,
  buttonStyle,
  onFontToken,
  onColorTheme,
  onDensity,
  onButtonStyle,
}: {
  initialTab?: StyleTab;
  fontToken: string;
  colorTheme: string;
  density: "compact" | "spacious";
  buttonStyle: "rounded" | "square";
  onFontToken: (v: string) => void;
  onColorTheme: (v: string) => void;
  onDensity: (v: "compact" | "spacious") => void;
  onButtonStyle: (v: "rounded" | "square") => void;
}) {
  const [tab, setTab] = useState<StyleTab>(initialTab);
  const [colorMode, setColorMode] = useState<"swatches" | "advanced">("swatches");
  const [customHex, setCustomHex] = useState("#000000");

  // Accent-solid elements (the main use of this color) typically carry white text —
  // that's the contrast pairing worth warning about.
  const customContrast = contrastRatio(customHex, "#ffffff");
  const lowContrast = customContrast !== null && customContrast < 3;
  const validHex = /^#[0-9a-f]{6}$/i.test(customHex);

  return (
    <div className="w-full">
      <div className="flex border-b border-[var(--dg-border)]">
        {STYLE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-2 py-2 text-[11px] font-semibold transition ${
              tab === t.id
                ? "border-b-2 border-[var(--dg-accent)] text-[var(--dg-text)]"
                : "text-[var(--dg-muted)] hover:text-[var(--dg-text)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-3">
        {tab === "font" ? (
          <select
            value={fontToken}
            onChange={(e) => onFontToken(e.target.value)}
            className="w-full rounded-lg border border-[var(--dg-border)] bg-[var(--dg-canvas)] px-2 py-1.5 text-xs text-[var(--dg-text)] outline-none"
          >
            {FONT_TOKENS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        ) : null}

        {tab === "color" ? (
          <div>
            <div className="mb-2.5 flex gap-1">
              {(["swatches", "advanced"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setColorMode(mode)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                    colorMode === mode
                      ? "bg-[var(--dg-accent-soft)] text-[var(--dg-accent-hover)]"
                      : "text-[var(--dg-muted)]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            {colorMode === "swatches" ? (
              <div className="grid grid-cols-4 gap-2.5">
                {COLOR_THEMES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onColorTheme(c.id)}
                    aria-label={c.label}
                    title={c.label}
                    className={`h-8 w-8 rounded-full transition ${
                      colorTheme === c.id
                        ? "ring-2 ring-[var(--dg-text)] ring-offset-2 ring-offset-[var(--dg-surface)]"
                        : "hover:scale-110"
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
                    value={validHex ? customHex : "#000000"}
                    onChange={(e) => setCustomHex(e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded border border-[var(--dg-border)] bg-transparent p-0"
                  />
                  <input
                    value={customHex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    placeholder="#rrggbb"
                    className="w-full rounded-lg border border-[var(--dg-border)] bg-[var(--dg-canvas)] px-2 py-1 font-mono text-[11px] text-[var(--dg-text)] outline-none"
                  />
                </div>
                {lowContrast ? (
                  <p className="flex items-start gap-1 text-[10px] text-[var(--dg-warning)]">
                    <AlertTriangle size={12} strokeWidth={2} className="mt-0.5 shrink-0" />
                    Low contrast against white text — still usable, may be hard to read on solid buttons.
                  </p>
                ) : null}
                <button
                  onClick={() => onColorTheme(`${CUSTOM_COLOR_PREFIX}${customHex}`)}
                  disabled={!validHex}
                  className="w-full rounded-lg bg-[var(--dg-accent)] px-2 py-1.5 text-[11px] font-semibold text-[var(--dg-on-accent)] transition hover:bg-[var(--dg-accent-hover)] disabled:opacity-40"
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
                className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold capitalize transition ${
                  density === d
                    ? "bg-[var(--dg-accent)] text-[var(--dg-on-accent)]"
                    : "border border-[var(--dg-border)] text-[var(--dg-muted)] hover:bg-white/5"
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
                className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold capitalize transition ${
                  buttonStyle === b
                    ? "bg-[var(--dg-accent)] text-[var(--dg-on-accent)]"
                    : "border border-[var(--dg-border)] text-[var(--dg-muted)] hover:bg-white/5"
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

function ChipButton({
  label,
  onClick,
  disabled,
  trigger,
  active,
  children,
  listeners,
}: {
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  trigger?: boolean;
  active?: boolean;
  children: React.ReactNode;
  listeners?: Record<string, unknown>;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      data-style-trigger={trigger ? "" : undefined}
      {...listeners}
      className={`flex h-7 w-7 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? "bg-[var(--dg-accent-soft)] text-[var(--dg-accent-hover)]"
          : "text-[var(--dg-muted)] hover:bg-white/10 hover:text-[var(--dg-text)]"
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-0.5 h-4 w-px bg-white/10" />;

function CanvasSection({
  section,
  index,
  total,
  selected,
  previewMode,
  hasOverride,
  popoverTab,
  onSelect,
  onMove,
  onSwap,
  onRemove,
  onOpenStyle,
}: {
  section: BlueprintSection;
  index: number;
  total: number;
  selected: boolean;
  previewMode: boolean;
  hasOverride: boolean;
  popoverTab: StyleTab | null;
  onSelect: () => void;
  onMove: (direction: -1 | 1) => void;
  onSwap: () => void;
  onRemove: () => void;
  onOpenStyle: (tab: StyleTab, anchor: HTMLElement) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: keyOf(section),
  });
  const label = SECTION_TYPE_LABELS[section.type];
  const showChrome = selected && !previewMode;

  return (
    <div
      ref={setNodeRef}
      data-section-index={index}
      onClick={previewMode ? undefined : onSelect}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group/section relative border-b border-[var(--dg-border-strong)] last:border-b-0 ${
        isDragging ? "z-40 opacity-60" : ""
      }`}
    >
      {!previewMode ? (
        <div
          className={`pointer-events-none absolute inset-0 z-20 transition-shadow ${
            showChrome
              ? "shadow-[inset_0_0_0_2px_var(--dg-accent)]"
              : "group-hover/section:shadow-[inset_0_0_0_1px_rgb(200_160_36_/_0.35)]"
          }`}
        />
      ) : null}

      {showChrome ? (
        <>
          <div className="dg-glass absolute left-3 top-3 z-30 flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[11px] text-[var(--dg-muted)]">
            <span className="text-[var(--dg-accent)]">{pad2(index + 1)}</span>
            <span>
              {section.type} / {section.designName}
            </span>
          </div>
          <div className="dg-glass absolute right-3 top-3 z-30 flex items-center rounded-full p-1">
            <ChipButton label={`Reorder ${label}`} listeners={{ ...attributes, ...listeners }}>
              <GripVertical size={14} strokeWidth={2} />
            </ChipButton>
            <ChipButton label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
              <ArrowUp size={14} strokeWidth={2} />
            </ChipButton>
            <ChipButton label="Move down" disabled={index === total - 1} onClick={() => onMove(1)}>
              <ArrowDown size={14} strokeWidth={2} />
            </ChipButton>
            <ChipButton label={`Swap ${label}`} onClick={onSwap}>
              <Shuffle size={14} strokeWidth={2} />
            </ChipButton>
            <Divider />
            <ChipButton
              label="Color"
              trigger
              active={popoverTab === "color"}
              onClick={(e) => onOpenStyle("color", e.currentTarget)}
            >
              <span className="relative flex">
                <Palette size={14} strokeWidth={2} />
                {hasOverride ? (
                  <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-[var(--dg-accent)]" />
                ) : null}
              </span>
            </ChipButton>
            <ChipButton
              label="Font"
              trigger
              active={popoverTab === "font"}
              onClick={(e) => onOpenStyle("font", e.currentTarget)}
            >
              <Type size={14} strokeWidth={2} />
            </ChipButton>
            <ChipButton
              label="Spacing density"
              trigger
              active={popoverTab === "density"}
              onClick={(e) => onOpenStyle("density", e.currentTarget)}
            >
              <Rows3 size={14} strokeWidth={2} />
            </ChipButton>
            <ChipButton
              label="Button style"
              trigger
              active={popoverTab === "button"}
              onClick={(e) => onOpenStyle("button", e.currentTarget)}
            >
              <Square size={14} strokeWidth={2} />
            </ChipButton>
            <Divider />
            <ChipButton label={`Remove ${label}`} onClick={onRemove}>
              <Trash2 size={14} strokeWidth={2} />
            </ChipButton>
          </div>
        </>
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

function EmptyState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-8 py-16 text-center">
      <svg width="170" height="130" viewBox="0 0 170 130" fill="none" aria-hidden>
        <rect x="35" y="8" width="100" height="30" rx="8" stroke="#2d5a52" strokeWidth="1.5" />
        <rect x="46" y="20" width="36" height="4" rx="2" fill="#2d5a52" />
        <circle cx="122" cy="23" r="4" stroke="#2d5a52" strokeWidth="1.5" />
        <rect x="22" y="46" width="112" height="44" rx="8" stroke="#3b6d63" strokeWidth="1.5" />
        <rect x="34" y="58" width="48" height="4" rx="2" fill="#3b6d63" />
        <rect x="34" y="68" width="76" height="4" rx="2" fill="#3b6d63" />
        <rect x="142" y="58" width="2" height="22" rx="1" fill="#c8a024" />
        <rect x="14" y="98" width="120" height="26" rx="8" stroke="#c8a024" strokeWidth="1.5" />
        <path d="M74 105v12M68 111h12" stroke="#c8a024" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <h2 className="mt-6 max-w-sm font-display text-3xl font-semibold leading-tight text-[var(--dg-text)]">
        Click a section on the left to start building
      </h2>
      <p className="mt-3 max-w-xs text-sm text-[var(--dg-muted)]">
        Pick a navbar, hero or footer. Reorder and restyle once it lands.
      </p>
      <p className="mt-5 font-mono text-[11px] text-[var(--dg-muted-2)]">autosaves · ⌘Z undo · drag to reorder</p>
    </div>
  );
}

export function Canvas({
  sections,
  onChange,
  onSwapRequest,
  selectedId,
  onSelect,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  saveStatus,
}: {
  sections: BlueprintSection[];
  onChange: (sections: BlueprintSection[]) => void;
  onSwapRequest: (index: number, type: BlueprintSection["type"]) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  saveStatus: SaveStatus;
}) {
  const [device, setDevice] = useState<DeviceWidth>(DEVICE_WIDTHS.desktop);
  const [exporting, setExporting] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [popover, setPopover] = useState<{ key: string; tab: StyleTab; top: number; left: number } | null>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [globalTheme, setGlobalTheme] = useState<GlobalTheme | null>(null);
  const canvasContentRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const showToast = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage, unavailable during render
    setGlobalTheme(readGlobalTheme());
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedIndex = selectedId ? sections.findIndex((s) => keyOf(s) === selectedId) : -1;

  const moveSection = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= sections.length) return;
      setPopover(null);
      onChange(arrayMove(sections, index, target));
    },
    [sections, onChange]
  );

  // Close popovers on any outside press.
  useEffect(() => {
    if (!popover && !themeOpen) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      if (popover && !popoverRef.current?.contains(target) && !target.closest("[data-style-trigger]")) {
        setPopover(null);
      }
      if (themeOpen && !themeRef.current?.contains(target)) setThemeOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [popover, themeOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) onRedo();
        else onUndo();
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        onRedo();
      } else if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown") && selectedIndex >= 0) {
        event.preventDefault();
        moveSection(selectedIndex, event.key === "ArrowUp" ? -1 : 1);
      } else if (event.key === "Escape") {
        if (popover) setPopover(null);
        else if (themeOpen) setThemeOpen(false);
        else if (previewMode) setPreviewMode(false);
        else onSelect(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onUndo, onRedo, onSelect, moveSection, selectedIndex, popover, themeOpen, previewMode]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => keyOf(s) === active.id);
    const newIndex = sections.findIndex((s) => keyOf(s) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setPopover(null);
    onChange(arrayMove(sections, oldIndex, newIndex));
  };

  const handleOverride = <P extends "fontToken" | "colorTheme" | "density" | "buttonStyle">(
    index: number,
    property: P,
    value: BlueprintSection[P]
  ) => {
    onChange(setSectionOverride(sections, index, property, value));
  };

  const handleApplyGlobalTheme = (next: GlobalTheme) => {
    setGlobalTheme(next);
    writeGlobalTheme(next);
    onChange(applyGlobalTheme(sections, next));
  };

  const openStyle = (section: BlueprintSection, tab: StyleTab, anchor: HTMLElement) => {
    const key = keyOf(section);
    if (popover && popover.key === key && popover.tab === tab) {
      setPopover(null);
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.right - POPOVER_WIDTH, window.innerWidth - POPOVER_WIDTH - 8));
    setThemeOpen(false);
    setPopover({ key, tab, top: rect.bottom + 8, left });
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
      showToast("Exported", "blueprint.html");
    } catch {
      showToast("Export failed", "Try again in a moment");
    } finally {
      setExporting(false);
    }
  };

  const handleCapture = useCallback(async () => {
    if (!canvasContentRef.current || !window.html2canvas) {
      showToast("Screenshot tool still loading", "Try again in a moment");
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
      showToast("Screenshot saved", "canvas.png");
    } catch {
      showToast("Screenshot failed", "Try again in a moment");
    } finally {
      setCapturing(false);
    }
  }, [showToast]);

  const popoverIndex = popover ? sections.findIndex((s) => keyOf(s) === popover.key) : -1;
  const popoverSection = popoverIndex >= 0 ? sections[popoverIndex] : null;
  const popoverHasOverride = popoverSection ? Object.values(popoverSection.overrides).some(Boolean) : false;

  const themeFontLabel = globalTheme?.fontToken ? getFontToken(globalTheme.fontToken).label : "Original";
  const themeColorId = globalTheme?.colorTheme ?? null;
  const themeColorLabel = !themeColorId
    ? "Original"
    : themeColorId.startsWith(CUSTOM_COLOR_PREFIX)
      ? "Custom"
      : getColorTheme(themeColorId).label;
  const themeDotColor = !themeColorId
    ? "var(--dg-accent)"
    : themeColorId.startsWith(CUSTOM_COLOR_PREFIX)
      ? themeColorId.slice(CUSTOM_COLOR_PREFIX.length)
      : getColorTheme(themeColorId).accentHex;

  return (
    <div className="dg-dot-grid flex h-full flex-col">
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

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-3 md:px-9" onScroll={() => setPopover(null)}>
        <div className="sticky top-0 z-40 mx-auto mb-4 flex w-fit max-w-full flex-wrap items-center justify-center gap-0.5 rounded-full dg-glass px-2 py-1.5">
          <ChipButton label="Undo" onClick={onUndo} disabled={!canUndo}>
            <Undo2 size={15} strokeWidth={2} />
          </ChipButton>
          <ChipButton label="Redo" onClick={onRedo} disabled={!canRedo}>
            <Redo2 size={15} strokeWidth={2} />
          </ChipButton>
          <Divider />

          <div ref={themeRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setPopover(null);
                setThemeOpen((v) => !v);
              }}
              className={`flex items-center gap-2 rounded-full border px-2.5 py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] ${
                themeOpen
                  ? "border-[var(--dg-accent)]/60 bg-[var(--dg-accent-soft)]"
                  : "border-white/10 hover:bg-white/5"
              }`}
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-white/20"
                style={{ background: themeDotColor }}
              />
              <span className="font-display text-sm font-semibold text-[var(--dg-text)]">Theme</span>
              <span className="hidden font-mono text-[11px] text-[var(--dg-muted)] sm:inline">
                {themeFontLabel} · {themeColorLabel}
              </span>
              <ChevronDown size={13} strokeWidth={2} className="text-[var(--dg-muted)]" />
            </button>
            {themeOpen && globalTheme ? (
              <div
                className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-[var(--dg-border-strong)] bg-[var(--dg-surface)] shadow-xl"
                style={{ boxShadow: "var(--dg-shadow)" }}
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
                <p className="border-t border-[var(--dg-border)] px-3 py-2 text-[10px] text-[var(--dg-muted-2)]">
                  Applies to every section without its own override.
                </p>
              </div>
            ) : null}
          </div>

          <Divider />
          <ChipButton
            label={previewMode ? "Exit preview" : "Preview"}
            active={previewMode}
            onClick={() => {
              setPreviewMode((v) => !v);
              setPopover(null);
            }}
          >
            <Eye size={15} strokeWidth={2} />
          </ChipButton>
          <ChipButton label="Clear canvas" onClick={onClear} disabled={sections.length === 0}>
            <Trash2 size={15} strokeWidth={2} />
          </ChipButton>
          <Divider />

          <span className="flex items-center gap-1.5 px-2 font-mono text-[11px] text-[var(--dg-muted)]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  saveStatus.state === "unsaved"
                    ? "var(--dg-accent)"
                    : saveStatus.state === "saved"
                      ? "var(--dg-success)"
                      : "var(--dg-muted-2)",
              }}
            />
            {saveStatus.state === "ready"
              ? "Ready"
              : saveStatus.state === "unsaved"
                ? "Unsaved"
                : `Saved · ${saveStatus.time}`}
          </span>
          <Divider />

          <DeviceToggle value={device} onChange={setDevice} variant="overlay" />
          <ChipButton label={capturing ? "Capturing..." : "Screenshot"} onClick={handleCapture} disabled={capturing}>
            <Camera size={15} strokeWidth={2} />
          </ChipButton>
          <button
            onClick={handleExport}
            disabled={sections.length === 0 || exporting}
            className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--dg-accent)] px-3.5 py-1.5 text-xs font-semibold text-[var(--dg-on-accent)] outline-none transition hover:bg-[var(--dg-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Download size={13} strokeWidth={2} />
            {exporting ? "Exporting..." : "Export"}
          </button>
        </div>

        <div
          className="mx-auto max-w-full transition-[width] duration-200 ease-out"
          style={{ width: device === DEVICE_WIDTHS.desktop ? "100%" : device }}
        >
          <div
            className="overflow-hidden rounded-2xl border border-[var(--dg-border)] bg-[var(--dg-canvas)]"
            style={{ boxShadow: "var(--dg-shadow)" }}
          >
            <div className="flex items-center gap-3 border-b border-[var(--dg-border)] bg-[var(--dg-surface)]/50 px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              </div>
              <div className="min-w-0 flex-1 truncate rounded-full border border-[var(--dg-border)] bg-[var(--dg-canvas)] px-4 py-1 font-mono text-[11px] text-[var(--dg-muted)]">
                blueprint.studio / home
              </div>
              <span className="shrink-0 font-mono text-[11px] text-[var(--dg-muted-2)]">
                {sections.length} {sections.length === 1 ? "section" : "sections"}
              </span>
            </div>

            <div ref={canvasContentRef}>
              {sections.length === 0 ? (
                <EmptyState />
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={sections.map(keyOf)} strategy={verticalListSortingStrategy}>
                    {sections.map((section, index) => (
                      <CanvasSection
                        key={keyOf(section)}
                        section={section}
                        index={index}
                        total={sections.length}
                        selected={selectedId === keyOf(section)}
                        previewMode={previewMode}
                        hasOverride={Object.values(section.overrides).some(Boolean)}
                        popoverTab={popover && popover.key === keyOf(section) ? popover.tab : null}
                        onSelect={() => onSelect(keyOf(section))}
                        onMove={(direction) => moveSection(index, direction)}
                        onSwap={() => onSwapRequest(index, section.type)}
                        onRemove={() => {
                          setPopover(null);
                          onSelect(null);
                          onChange(sections.filter((_, i) => i !== index));
                        }}
                        onOpenStyle={(tab, anchor) => openStyle(section, tab, anchor)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      </div>

      {popover && popoverSection ? (
        <div
          ref={popoverRef}
          className="fixed z-50 rounded-xl border border-[var(--dg-border-strong)] bg-[var(--dg-surface)]"
          style={{ top: popover.top, left: popover.left, width: POPOVER_WIDTH, boxShadow: "var(--dg-shadow)" }}
        >
          <StyleEditor
            key={`${popover.key}-${popover.tab}`}
            initialTab={popover.tab}
            fontToken={popoverSection.fontToken}
            colorTheme={popoverSection.colorTheme}
            density={popoverSection.density}
            buttonStyle={popoverSection.buttonStyle}
            onFontToken={(v) => handleOverride(popoverIndex, "fontToken", v)}
            onColorTheme={(v) => handleOverride(popoverIndex, "colorTheme", v)}
            onDensity={(v) => handleOverride(popoverIndex, "density", v)}
            onButtonStyle={(v) => handleOverride(popoverIndex, "buttonStyle", v)}
          />
          {popoverHasOverride ? (
            <button
              onClick={() => {
                onChange(resetSectionAll(sections, popoverIndex));
                setPopover(null);
              }}
              className="flex w-full items-center gap-1.5 border-t border-[var(--dg-border)] px-3 py-2.5 text-[11px] font-semibold text-[var(--dg-muted)] hover:text-[var(--dg-text)]"
            >
              <RotateCcw size={12} strokeWidth={2} />
              Reset to generated default
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
