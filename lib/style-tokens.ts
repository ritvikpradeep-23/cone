export type Density = "compact" | "spacious";
export type ButtonStyle = "rounded" | "square";

export const DENSITY_VALUES: Density[] = ["compact", "spacious"];
export const BUTTON_STYLE_VALUES: ButtonStyle[] = ["rounded", "square"];

export const DEFAULT_DENSITY: Density = "spacious";
export const DEFAULT_BUTTON_STYLE: ButtonStyle = "rounded";

const BUTTON_RADIUS: Record<ButtonStyle, string> = {
  rounded: "9999px",
  square: "0.375rem",
};

const DENSITY_UNIT: Record<Density, string> = {
  compact: "0.5rem",
  spacious: "1rem",
};

export function buildStyleTokenCss(): string {
  const buttonRules = (Object.keys(BUTTON_RADIUS) as ButtonStyle[])
    .map((style) => `[data-button-style="${style}"]{--dg-button-radius:${BUTTON_RADIUS[style]};}`)
    .join("\n");
  const densityRules = (Object.keys(DENSITY_UNIT) as Density[])
    .map((density) => `[data-density="${density}"]{--dg-density-unit:${DENSITY_UNIT[density]};}`)
    .join("\n");
  return `<style>${buttonRules}\n${densityRules}</style>`;
}
