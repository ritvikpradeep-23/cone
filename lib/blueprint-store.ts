import type { SectionType } from "./section-types";
import { DEFAULT_DENSITY, DEFAULT_BUTTON_STYLE, type Density, type ButtonStyle } from "./style-tokens";

export type BlueprintSection = {
  sectionId: string;
  type: SectionType;
  html: string;
  designName: string;
  /** The section's own generated values — the "reset to generated default" target for font/color. */
  originalFontToken: string;
  originalColorTheme: string;
  /** Current resolved values (may equal the global default or be an individual override). */
  fontToken: string;
  colorTheme: string;
  density: Density;
  buttonStyle: ButtonStyle;
  /** Which properties this section has overridden individually — these are never touched by
   *  a global Theme change, and are exactly what "reset to generated default" clears. */
  overrides: {
    fontToken: boolean;
    colorTheme: boolean;
    density: boolean;
    buttonStyle: boolean;
  };
};

export type GlobalTheme = {
  fontToken: string | null;
  colorTheme: string | null;
  density: Density;
  buttonStyle: ButtonStyle;
};

const STORAGE_KEY = "dg_blueprint";
const THEME_STORAGE_KEY = "dg_blueprint_theme";

export const DEFAULT_GLOBAL_THEME: GlobalTheme = {
  fontToken: null,
  colorTheme: null,
  density: DEFAULT_DENSITY,
  buttonStyle: DEFAULT_BUTTON_STYLE,
};

export function readBlueprint(): BlueprintSection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeBlueprint(sections: BlueprintSection[]): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
}

/** Builds a fresh BlueprintSection (no overrides yet) from a section's generated values. */
export function toBlueprintSection(section: {
  id: string;
  type: SectionType;
  html: string;
  fontToken: string;
  colorTheme: string;
  designName: string;
}): BlueprintSection {
  return {
    sectionId: section.id,
    type: section.type,
    html: section.html,
    designName: section.designName,
    originalFontToken: section.fontToken,
    originalColorTheme: section.colorTheme,
    fontToken: section.fontToken,
    colorTheme: section.colorTheme,
    density: DEFAULT_DENSITY,
    buttonStyle: DEFAULT_BUTTON_STYLE,
    overrides: { fontToken: false, colorTheme: false, density: false, buttonStyle: false },
  };
}

export function appendToBlueprint(section: BlueprintSection): void {
  const current = readBlueprint();
  writeBlueprint([...current, section]);
}

export function replaceSectionAt(index: number, section: BlueprintSection): BlueprintSection[] {
  const current = readBlueprint();
  const next = [...current];
  next[index] = section;
  writeBlueprint(next);
  return next;
}

export function readGlobalTheme(): GlobalTheme {
  if (typeof window === "undefined") return DEFAULT_GLOBAL_THEME;
  try {
    const raw = window.sessionStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_GLOBAL_THEME;
    return { ...DEFAULT_GLOBAL_THEME, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GLOBAL_THEME;
  }
}

export function writeGlobalTheme(theme: GlobalTheme): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}

type OverridableProperty = "fontToken" | "colorTheme" | "density" | "buttonStyle";

/** Sets one property on one section as an explicit individual override — survives later global Theme changes. */
export function setSectionOverride<P extends OverridableProperty>(
  sections: BlueprintSection[],
  index: number,
  property: P,
  value: BlueprintSection[P]
): BlueprintSection[] {
  const next = [...sections];
  const current = next[index];
  if (!current) return sections;
  next[index] = {
    ...current,
    [property]: value,
    overrides: { ...current.overrides, [property]: true },
  };
  return next;
}

/** Clears a section's override for one property, restoring it to the current global default. */
export function resetSectionProperty<P extends OverridableProperty>(
  sections: BlueprintSection[],
  index: number,
  property: P,
  globalTheme: GlobalTheme
): BlueprintSection[] {
  const next = [...sections];
  const current = next[index];
  if (!current) return sections;
  const fallback: Record<OverridableProperty, BlueprintSection[P]> = {
    fontToken: (globalTheme.fontToken ?? current.originalFontToken) as BlueprintSection[P],
    colorTheme: (globalTheme.colorTheme ?? current.originalColorTheme) as BlueprintSection[P],
    density: globalTheme.density as BlueprintSection[P],
    buttonStyle: globalTheme.buttonStyle as BlueprintSection[P],
  };
  next[index] = {
    ...current,
    [property]: fallback[property],
    overrides: { ...current.overrides, [property]: false },
  };
  return next;
}

/** Clears every override on a section, restoring font/color to as-generated and density/button to baseline. */
export function resetSectionAll(sections: BlueprintSection[], index: number): BlueprintSection[] {
  const next = [...sections];
  const current = next[index];
  if (!current) return sections;
  next[index] = {
    ...current,
    fontToken: current.originalFontToken,
    colorTheme: current.originalColorTheme,
    density: DEFAULT_DENSITY,
    buttonStyle: DEFAULT_BUTTON_STYLE,
    overrides: { fontToken: false, colorTheme: false, density: false, buttonStyle: false },
  };
  return next;
}

/** Applies a new global Theme default to every section that hasn't individually overridden that property. */
export function applyGlobalTheme(sections: BlueprintSection[], theme: GlobalTheme): BlueprintSection[] {
  return sections.map((s) => ({
    ...s,
    fontToken: s.overrides.fontToken ? s.fontToken : theme.fontToken ?? s.originalFontToken,
    colorTheme: s.overrides.colorTheme ? s.colorTheme : theme.colorTheme ?? s.originalColorTheme,
    density: s.overrides.density ? s.density : theme.density,
    buttonStyle: s.overrides.buttonStyle ? s.buttonStyle : theme.buttonStyle,
  }));
}
