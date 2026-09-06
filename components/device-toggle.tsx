"use client";

import { Monitor, Tablet, Smartphone } from "lucide-react";
import type { DeviceWidth } from "./scaled-frame";
import { DEVICE_WIDTHS } from "./scaled-frame";

const OPTIONS: { key: keyof typeof DEVICE_WIDTHS; label: string; icon: typeof Monitor }[] = [
  { key: "desktop", label: "Desktop", icon: Monitor },
  { key: "tablet", label: "Tablet", icon: Tablet },
  { key: "mobile", label: "Mobile", icon: Smartphone },
];

export function DeviceToggle({
  value,
  onChange,
  variant = "overlay",
}: {
  value: DeviceWidth;
  onChange: (width: DeviceWidth) => void;
  variant?: "overlay" | "tabs";
}) {
  const containerClass =
    variant === "overlay"
      ? "flex items-center gap-0.5 rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)]/90 p-0.5 backdrop-blur"
      : "flex items-center gap-1 rounded-md border border-[var(--dg-border)] bg-[var(--dg-surface)] p-1";

  return (
    <div className={containerClass}>
      {OPTIONS.map(({ key, label, icon: Icon }) => {
        const active = DEVICE_WIDTHS[key] === value;
        return (
          <button
            key={key}
            type="button"
            aria-label={`${label} preview`}
            aria-pressed={active}
            onClick={() => onChange(DEVICE_WIDTHS[key])}
            className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] ${
              active ? "bg-[var(--dg-accent)] text-white" : "text-[var(--dg-muted)] hover:bg-white/5"
            }`}
          >
            <Icon size={14} strokeWidth={1.75} />
            {variant === "tabs" ? label : null}
          </button>
        );
      })}
    </div>
  );
}
