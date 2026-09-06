import { SECTION_TYPES } from "./section-types";
import { FONT_TOKENS } from "./font-tokens";

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
- Emit a one-sentence layout_notes value describing the layout pattern (grid
  structure, density, nav style, etc.)
- Visual direction must differ from EVERY design below, and from every other
  design generated earlier in this same run, across ALL of: color palette,
  font_token, layout/grid structure, and section density/order — not just one
  or two of these axes:
${recentList}`;
}
