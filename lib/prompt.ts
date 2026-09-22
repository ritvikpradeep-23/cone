import { SECTION_TYPES } from "./section-types";
import { FONT_TOKENS } from "./font-tokens";
import { COLOR_THEMES } from "./color-themes";

export type RecentDesign = {
  styleSummary: string;
  fontToken: string;
  layoutNotes: string;
};

export function buildGenerationPrompt(recent: RecentDesign[]): string {
  const recentList =
    recent.length > 0
      ? recent
          .map((r) => `- style: ${r.styleSummary} | font: ${r.fontToken} | layout: ${r.layoutNotes}`)
          .join("\n")
      : "(none yet)";

  const fontTokenList = FONT_TOKENS.map((t) => `${t.id} (${t.label})`).join(", ");
  const colorThemeList = COLOR_THEMES.map((t) => `${t.id} (${t.label})`).join(", ");

  return `You are generating one static sample website design for a design-inspiration
gallery used by professional designers browsing for layout ideas. Produce
structural HTML using Tailwind CSS utility classes only, and call the
emit_design tool with the result.

Rules:
- Tailwind utility classes only — no <style> blocks, no inline style attributes
  beyond what Tailwind can't express
- No <script> tags, no working form submissions, no href targets that assume
  a real route, no JS event handlers
- No authentication, no data fetching, no backend assumptions — every
  section is static markup only, purely visual
- 6 to 9 sections forming one plausible full-page layout, in visual order
- Section "type" must be one of: ${SECTION_TYPES.join(", ")}
- Pick exactly one font_token from this list: ${fontTokenList}. Do not hardcode
  any other font-family anywhere. Instead:
  - Add style="font-family:var(--dg-font-heading)" and data-dg-font-role="heading"
    to the section's primary heading element (the largest/most prominent text)
  - Add style="font-family:var(--dg-font-body)" and data-dg-font-role="body" to
    the section's primary body-copy element (the main paragraph of running text)
  - Every other element uses Tailwind's default font stack — do not set
    font-family on anything else
- Pick exactly one color_theme from this list: ${colorThemeList}. This is the
  ONLY customizable color role — every other background and text color stays
  exactly as you'd otherwise design it. Do not hardcode this accent color
  anywhere; instead, on every element that uses it:
  - A solid accent fill (e.g. a primary button, an active/highlighted badge)
    gets style="background:var(--dg-accent)" and data-dg-color-role="accent-solid"
  - Accent-colored text, an icon, or a link (not a solid fill) gets
    style="color:var(--dg-accent)" and data-dg-color-role="accent-text"
  - A section needs at least one accent-tagged element (usually its main CTA
    button) but not every element should be tagged — most content keeps its
    own generated colors untouched
- Every primary or secondary button element additionally gets
  style="border-radius:var(--dg-button-radius)" and data-dg-button-role="button"
  instead of a hardcoded Tailwind rounded-* class for its corner radius
- The section's outer wrapper and any element whose padding or gap defines
  the section's density get data-dg-density-role="container" plus their
  padding/gap expressed inline via calc(), e.g.
  style="padding:calc(var(--dg-density-unit) * 3) calc(var(--dg-density-unit) * 4);gap:calc(var(--dg-density-unit) * 2)"
  instead of fixed Tailwind spacing classes for those specific properties —
  this is the one deliberate exception to "Tailwind classes only, no inline
  style beyond what Tailwind can't express," exactly like the font-family
  rule above. Pick multipliers so the section reads as normally-spaced at
  1x — a later density change just scales --dg-density-unit up or down.
- Emit a one-sentence layout_notes value describing the layout pattern (grid
  structure, density, nav style, etc.)
- Visual direction must differ from EVERY design below, and from every other
  design generated earlier in this same run, across ALL of: color palette,
  font_token, layout/grid structure, and section density/order — not just one
  or two of these axes:
${recentList}`;
}
