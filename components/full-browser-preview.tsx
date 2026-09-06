"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Camera } from "lucide-react";
import { DeviceToggle } from "./device-toggle";
import { DEVICE_WIDTHS, type DeviceWidth } from "./scaled-frame";
import { useToast } from "./toast";

export function FullBrowserPreview({
  srcDoc,
  exitHref,
  fileName,
}: {
  srcDoc: string;
  exitHref: string;
  fileName: string;
}) {
  const [device, setDevice] = useState<DeviceWidth>(DEVICE_WIDTHS.desktop);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const showToast = useToast();

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.data?.source !== "design-gallery-frame") return;
      if (event.source !== iframeRef.current?.contentWindow) return;

      if (event.data.type === "scroll") {
        setToolbarVisible(event.data.direction === "up");
      } else if (event.data.type === "capture-result") {
        setCapturing(false);
        const a = document.createElement("a");
        a.href = event.data.dataUrl;
        a.download = `${fileName}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast("Screenshot saved");
      } else if (event.data.type === "capture-error") {
        setCapturing(false);
        showToast("Screenshot failed — try again");
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [fileName, showToast]);

  const handleCapture = () => {
    setCapturing(true);
    iframeRef.current?.contentWindow?.postMessage({ source: "design-gallery-parent", type: "capture-request" }, "*");
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--dg-bg)]">
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center transition-transform duration-200 ease-out ${
          toolbarVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="pointer-events-auto mt-3 flex items-center gap-2 rounded-lg border border-[var(--dg-border)] bg-[var(--dg-surface)]/95 p-1.5 shadow-lg backdrop-blur">
          <DeviceToggle value={device} onChange={setDevice} variant="tabs" />
          <div className="h-5 w-px bg-[var(--dg-border)]" />
          <button
            type="button"
            onClick={handleCapture}
            disabled={capturing}
            aria-label="Capture screenshot"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--dg-muted)] outline-none transition hover:bg-white/5 hover:text-[var(--dg-text)] focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)] disabled:opacity-50"
          >
            <Camera size={14} strokeWidth={1.75} />
            {capturing ? "Capturing..." : "Screenshot"}
          </button>
          <Link
            href={exitHref}
            aria-label="Exit preview"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--dg-muted)] outline-none transition hover:bg-white/5 hover:text-[var(--dg-text)] focus-visible:ring-2 focus-visible:ring-[var(--dg-accent)]"
          >
            <X size={14} strokeWidth={1.75} />
            Exit
          </Link>
        </div>
      </div>

      <div className="flex flex-1 justify-center overflow-y-auto">
        {/* allow-same-origin (unlike the read-only ScaledFrame previews elsewhere) because html2canvas's
            DOM-cloning capture technique throws a cross-origin SecurityError without it. */}
        <iframe
          ref={iframeRef}
          title="Full browser preview"
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-same-origin"
          className="h-full border-0 transition-[width] duration-200 ease-out"
          style={{ width: device === DEVICE_WIDTHS.desktop ? "100%" : device }}
        />
      </div>
    </div>
  );
}
