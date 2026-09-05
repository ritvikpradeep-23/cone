import { SECTION_TYPES } from "./section-types";

export function buildGenerationPrompt(recentStyleSummaries: string[]): string {
  const recentList =
    recentStyleSummaries.length > 0
      ? recentStyleSummaries.map((s) => `- ${s}`).join("\n")
      : "(none yet)";

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
- Visual direction must be clearly distinct from these recent style
  summaries — do not repeat any of them:
${recentList}
- Vary at least two of the following from your last few designs: color
  palette, layout density, typography pairing, grid structure`;
}
