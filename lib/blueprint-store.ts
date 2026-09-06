import type { SectionType } from "./section-types";

export type BlueprintSection = {
  sectionId: string;
  type: SectionType;
  html: string;
  designName: string;
  fontToken: string;
};

const STORAGE_KEY = "dg_blueprint";

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

export function updateSectionFontToken(index: number, fontToken: string): BlueprintSection[] {
  const current = readBlueprint();
  const next = [...current];
  if (next[index]) next[index] = { ...next[index], fontToken };
  writeBlueprint(next);
  return next;
}
