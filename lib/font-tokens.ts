export type FontToken = {
  id: string;
  label: string;
  headingFamily: string;
  bodyFamily: string;
  /** Google Fonts CSS2 family spec, e.g. "Playfair+Display:wght@600;700" */
  googleFontsSpec: string[];
};

export const FONT_TOKENS: FontToken[] = [
  {
    id: "modern-sans",
    label: "Modern Sans",
    headingFamily: "'Inter', system-ui, sans-serif",
    bodyFamily: "'Inter', system-ui, sans-serif",
    googleFontsSpec: ["Inter:wght@400;500;600;700;800"],
  },
  {
    id: "editorial-serif",
    label: "Editorial Serif",
    headingFamily: "'Playfair Display', serif",
    bodyFamily: "'Inter', system-ui, sans-serif",
    googleFontsSpec: ["Playfair+Display:wght@600;700;800", "Inter:wght@400;500;600"],
  },
  {
    id: "warm-serif",
    label: "Warm Serif",
    headingFamily: "'Lora', serif",
    bodyFamily: "'Source Sans 3', system-ui, sans-serif",
    googleFontsSpec: ["Lora:wght@500;600;700", "Source+Sans+3:wght@400;500;600"],
  },
  {
    id: "technical-mono",
    label: "Technical Mono",
    headingFamily: "'JetBrains Mono', ui-monospace, monospace",
    bodyFamily: "'Inter', system-ui, sans-serif",
    googleFontsSpec: ["JetBrains+Mono:wght@500;600;700", "Inter:wght@400;500"],
  },
  {
    id: "display-bold",
    label: "Display Bold",
    headingFamily: "'Archivo Black', sans-serif",
    bodyFamily: "'Inter', system-ui, sans-serif",
    googleFontsSpec: ["Archivo+Black", "Inter:wght@400;500;600"],
  },
  {
    id: "classic-serif",
    label: "Classic Serif",
    headingFamily: "'Merriweather', serif",
    bodyFamily: "'Work Sans', system-ui, sans-serif",
    googleFontsSpec: ["Merriweather:wght@600;700;900", "Work+Sans:wght@400;500;600"],
  },
  {
    id: "geometric-sans",
    label: "Geometric Sans",
    headingFamily: "'Space Grotesk', sans-serif",
    bodyFamily: "'Inter', system-ui, sans-serif",
    googleFontsSpec: ["Space+Grotesk:wght@500;600;700", "Inter:wght@400;500"],
  },
  {
    id: "humanist-sans",
    label: "Humanist Sans",
    headingFamily: "'Poppins', sans-serif",
    bodyFamily: "'Nunito Sans', system-ui, sans-serif",
    googleFontsSpec: ["Poppins:wght@500;600;700;800", "Nunito+Sans:wght@400;500;600"],
  },
  {
    id: "condensed-display",
    label: "Condensed Display",
    headingFamily: "'Bebas Neue', sans-serif",
    bodyFamily: "'Inter', system-ui, sans-serif",
    googleFontsSpec: ["Bebas+Neue", "Inter:wght@400;500;600"],
  },
  {
    id: "elegant-serif",
    label: "Elegant Serif",
    headingFamily: "'Cormorant Garamond', serif",
    bodyFamily: "'Karla', system-ui, sans-serif",
    googleFontsSpec: ["Cormorant+Garamond:wght@600;700", "Karla:wght@400;500;600"],
  },
  {
    id: "soft-rounded",
    label: "Soft Rounded",
    headingFamily: "'Quicksand', sans-serif",
    bodyFamily: "'Nunito', system-ui, sans-serif",
    googleFontsSpec: ["Quicksand:wght@600;700", "Nunito:wght@400;500;600"],
  },
  {
    id: "industrial-mono",
    label: "Industrial Mono",
    headingFamily: "'IBM Plex Mono', ui-monospace, monospace",
    bodyFamily: "'IBM Plex Sans', system-ui, sans-serif",
    googleFontsSpec: ["IBM+Plex+Mono:wght@500;600;700", "IBM+Plex+Sans:wght@400;500"],
  },
];

export const FONT_TOKEN_IDS = FONT_TOKENS.map((t) => t.id) as [string, ...string[]];

const FONT_TOKEN_MAP = new Map(FONT_TOKENS.map((t) => [t.id, t]));

export function getFontToken(id: string): FontToken {
  return FONT_TOKEN_MAP.get(id) ?? FONT_TOKENS[0];
}

export function buildFontTokenStyleTag(): string {
  const rules = FONT_TOKENS.map(
    (t) =>
      `[data-font-token="${t.id}"]{--dg-font-heading:${t.headingFamily};--dg-font-body:${t.bodyFamily};}`
  ).join("\n");
  return `<style>${rules}</style>`;
}

export function buildFontLinkHtml(): string {
  const families = FONT_TOKENS.flatMap((t) => t.googleFontsSpec)
    .map((spec) => `family=${spec}`)
    .join("&");
  return `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?${families}&display=swap" rel="stylesheet" />`;
}
