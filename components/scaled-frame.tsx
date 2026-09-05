"use client";

import { useEffect, useRef, useState } from "react";

export type DeviceWidth = 1440 | 768 | 375;

export const DEVICE_WIDTHS: Record<"desktop" | "tablet" | "mobile", DeviceWidth> = {
  desktop: 1440,
  tablet: 768,
  mobile: 375,
};

export function ScaledFrame({
  srcDoc,
  frameWidth,
  frameHeight = 900,
  title,
}: {
  srcDoc: string;
  frameWidth: DeviceWidth;
  frameHeight?: number;
  title: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? el.clientWidth;
      setScale(Math.min(1, width / frameWidth));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [frameWidth]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden transition-[height] duration-150 ease-out"
      style={{ height: frameHeight * scale }}
    >
      <div
        style={{
          width: frameWidth,
          height: frameHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          transition: "width 150ms ease-out",
        }}
      >
        <iframe
          title={title}
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          className="h-full w-full border-0"
          style={{ width: frameWidth, height: frameHeight }}
        />
      </div>
    </div>
  );
}
