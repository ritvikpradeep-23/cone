export type ColorTheme = {
  id: string;
  label: string;
  accentHex: string;
  accentHoverHex: string;
};

export const COLOR_THEMES: ColorTheme[] = [
  { id: "indigo", label: "Indigo", accentHex: "#6366f1", accentHoverHex: "#818cf8" },
  { id: "coral", label: "Coral", accentHex: "#f43f5e", accentHoverHex: "#fb7185" },
  { id: "emerald", label: "Emerald", accentHex: "#10b981", accentHoverHex: "#34d399" },
  { id: "amber", label: "Amber", accentHex: "#f59e0b", accentHoverHex: "#fbbf24" },
  { id: "sky", label: "Sky", accentHex: "#0ea5e9", accentHoverHex: "#38bdf8" },
  { id: "violet", label: "Violet", accentHex: "#8b5cf6", accentHoverHex: "#a78bfa" },
  { id: "teal", label: "Teal", accentHex: "#14b8a6", accentHoverHex: "#2dd4bf" },
  { id: "slate", label: "Slate", accentHex: "#64748b", accentHoverHex: "#94a3b8" },
];

export const COLOR_THEME_IDS = COLOR_THEMES.map((t) => t.id) as [string, ...string[]];

const COLOR_THEME_MAP = new Map(COLOR_THEMES.map((t) => [t.id, t]));

export function getColorTheme(id: string): ColorTheme {
  return COLOR_THEME_MAP.get(id) ?? COLOR_THEMES[0];
}

export function buildColorThemeStyleTag(): string {
  const rules = COLOR_THEMES.map(
    (t) => `[data-color-theme="${t.id}"]{--dg-accent:${t.accentHex};--dg-accent-hover:${t.accentHoverHex};}`
  ).join("\n");
  return `<style>${rules}</style>`;
}

/** Relative luminance + contrast ratio (WCAG) for the custom-hex contrast warning. */
export function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const [rl, gl, bl] = [channel(r), channel(g), channel(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** WCAG contrast ratio between two hex colors, 1 (no contrast) to 21 (max). */
export function contrastRatio(hexA: string, hexB: string): number | null {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return null;
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

export const CUSTOM_COLOR_PREFIX = "custom:";

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const blended = rgb.map((c) => Math.round(c + (255 - c) * amount)) as [number, number, number];
  return `#${blended.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * A `colorTheme` value is either a curated theme id (handled by the static
 * [data-color-theme="id"] CSS rules from buildColorThemeStyleTag) or
 * "custom:#rrggbb" from the Advanced hex picker, which has no matching CSS
 * rule and must be applied as an inline style instead.
 */
export function resolveCustomColorStyle(colorTheme: string): Record<string, string> | undefined {
  if (!colorTheme.startsWith(CUSTOM_COLOR_PREFIX)) return undefined;
  const hex = colorTheme.slice(CUSTOM_COLOR_PREFIX.length);
  return { "--dg-accent": hex, "--dg-accent-hover": lighten(hex, 0.15) };
}
