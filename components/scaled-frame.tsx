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
  fitContent = false,
}: {
  srcDoc: string;
  frameWidth: DeviceWidth;
  /** Initial/fallback height while `fitContent` waits for the real measurement, or the fixed crop height when `fitContent` is false. */
  frameHeight?: number;
  title: string;
  /** When true, resizes to the frame's actual content height (reported via postMessage by `assembleStandaloneHtml({ reportHeight: true })`) instead of a fixed crop. */
  fitContent?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

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

  useEffect(() => {
    if (!fitContent) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the stale measurement when srcDoc changes
    setMeasuredHeight(null);
    const listener = (event: MessageEvent) => {
      if (event.data?.source !== "design-gallery-frame" || event.data?.type !== "height") return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      setMeasuredHeight(event.data.height);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [fitContent, srcDoc]);

  const effectiveHeight = fitContent && measuredHeight ? measuredHeight : frameHeight;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden transition-[height] duration-150 ease-out"
      style={{ height: effectiveHeight * scale }}
    >
      <div
        style={{
          width: frameWidth,
          height: effectiveHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          transition: "width 150ms ease-out, height 150ms ease-out",
        }}
      >
        <iframe
          ref={iframeRef}
          title={title}
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          className="h-full w-full border-0"
          style={{ width: frameWidth, height: effectiveHeight }}
        />
      </div>
    </div>
  );
}
