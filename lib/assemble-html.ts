import { buildFontLinkHtml, buildFontTokenStyleTag } from "./font-tokens";

export type AssembleOptions = {
  /** Report the document's real content height to the parent via postMessage (for scale-to-fit previews). */
  reportHeight?: boolean;
  /** Report scroll direction to the parent via postMessage (for an auto-hiding toolbar). */
  trackScroll?: boolean;
  /** Load html2canvas and respond to a `capture-request` postMessage with a rendered PNG data URL. */
  enableCapture?: boolean;
};

export type AssembleSection = {
  html: string;
  fontToken: string;
};

const HTML2CANVAS_SRC = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";

function buildInjectedScript({ reportHeight, trackScroll, enableCapture }: AssembleOptions): string {
  const parts: string[] = [];

  if (reportHeight) {
    parts.push(`
    (function () {
      function report() {
        window.parent.postMessage(
          { source: "design-gallery-frame", type: "height", height: document.documentElement.scrollHeight },
          "*"
        );
      }
      window.addEventListener("load", report);
      setTimeout(report, 300);
      if (window.ResizeObserver) new ResizeObserver(report).observe(document.documentElement);
    })();`);
  }

  if (trackScroll) {
    parts.push(`
    (function () {
      var lastY = 0;
      window.addEventListener(
        "scroll",
        function () {
          var y = window.scrollY;
          var direction = y > lastY && y > 40 ? "down" : "up";
          lastY = y;
          window.parent.postMessage({ source: "design-gallery-frame", type: "scroll", direction: direction }, "*");
        },
        { passive: true }
      );
    })();`);
  }

  if (enableCapture) {
    parts.push(`
    window.addEventListener("message", function (event) {
      if (!event.data || event.data.source !== "design-gallery-parent" || event.data.type !== "capture-request") return;
      html2canvas(document.body, { useCORS: true }).then(
        function (canvas) {
          window.parent.postMessage(
            { source: "design-gallery-frame", type: "capture-result", dataUrl: canvas.toDataURL("image/png") },
            "*"
          );
        },
        function (err) {
          window.parent.postMessage(
            { source: "design-gallery-frame", type: "capture-error", message: String(err) },
            "*"
          );
        }
      );
    });`);
  }

  if (parts.length === 0) return "";
  return `<script>${parts.join("\n")}</script>`;
}

export function assembleStandaloneHtml(
  title: string,
  sections: AssembleSection[],
  options: AssembleOptions = {}
): string {
  const body = sections
    .map((s) => `<div data-font-token="${escapeHtml(s.fontToken)}">${s.html}</div>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
${buildFontLinkHtml()}
${buildFontTokenStyleTag()}
<script src="https://cdn.tailwindcss.com"></script>
${options.enableCapture ? `<script src="${HTML2CANVAS_SRC}"></script>` : ""}
</head>
<body>
${body}
${buildInjectedScript(options)}
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
