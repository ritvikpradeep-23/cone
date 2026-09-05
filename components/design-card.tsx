"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ScaledFrame, type DeviceWidth } from "./scaled-frame";
import { DeviceToggle } from "./device-toggle";

export function DesignCard({
  id,
  name,
  styleSummary,
  batchDate,
  fullHtml,
}: {
  id: string;
  name: string;
  styleSummary: string;
  batchDate: string;
  fullHtml: string;
}) {
  const [device, setDevice] = useState<DeviceWidth>(1440);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="group rounded-lg border border-[var(--dg-border)] bg-white p-3 transition duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md"
    >
      <Link href={`/designs/${id}`} className="block">
        <div className="relative overflow-hidden rounded-md border border-[var(--dg-border)] bg-[var(--dg-bg)]">
          {inView ? (
            <ScaledFrame srcDoc={fullHtml} frameWidth={device} frameHeight={560} title={name} />
          ) : (
            <div style={{ height: 560 * (device === 1440 ? 0.26 : device === 768 ? 0.5 : 0.9) }} />
          )}
          <div className="absolute right-2 top-2" onClick={(e) => e.preventDefault()}>
            <DeviceToggle value={device} onChange={setDevice} variant="overlay" />
          </div>
        </div>
        <div className="mt-3 space-y-0.5">
          <p className="text-sm font-medium text-[var(--dg-text)]">{name}</p>
          <p className="text-xs text-[var(--dg-muted)]">{styleSummary}</p>
          <p className="font-mono text-[11px] text-[var(--dg-muted)]">{batchDate}</p>
        </div>
      </Link>
    </div>
  );
}
