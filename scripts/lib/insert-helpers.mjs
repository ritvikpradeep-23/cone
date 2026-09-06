// Shared helpers for scripts that insert hand-authored designs directly into
// the database, bypassing the Anthropic API. Kept in sync by hand with
// lib/font-tokens.ts, lib/assemble-html.ts, and lib/safety-net.ts — this is a
// plain .mjs duplicate because these scripts run outside the Next.js/TS build.
import { neon } from "@neondatabase/serverless";

export const SECTION_TYPES = [
  "navbar",
  "hero",
  "features",
  "pricing",
  "testimonials",
  "cta",
  "footer",
  "faq",
  "stats",
  "team",
  "gallery",
  "contact",
  "blog-list",
  "logos",
];

export const FONT_TOKENS = {
  "modern-sans": { heading: "'Inter', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif", googleFonts: ["Inter:wght@400;500;600;700;800"] },
  "editorial-serif": { heading: "'Playfair Display', serif", body: "'Inter', system-ui, sans-serif", googleFonts: ["Playfair+Display:wght@600;700;800", "Inter:wght@400;500;600"] },
  "warm-serif": { heading: "'Lora', serif", body: "'Source Sans 3', system-ui, sans-serif", googleFonts: ["Lora:wght@500;600;700", "Source+Sans+3:wght@400;500;600"] },
  "technical-mono": { heading: "'JetBrains Mono', ui-monospace, monospace", body: "'Inter', system-ui, sans-serif", googleFonts: ["JetBrains+Mono:wght@500;600;700", "Inter:wght@400;500"] },
  "display-bold": { heading: "'Archivo Black', sans-serif", body: "'Inter', system-ui, sans-serif", googleFonts: ["Archivo+Black", "Inter:wght@400;500;600"] },
  "classic-serif": { heading: "'Merriweather', serif", body: "'Work Sans', system-ui, sans-serif", googleFonts: ["Merriweather:wght@600;700;900", "Work+Sans:wght@400;500;600"] },
  "geometric-sans": { heading: "'Space Grotesk', sans-serif", body: "'Inter', system-ui, sans-serif", googleFonts: ["Space+Grotesk:wght@500;600;700", "Inter:wght@400;500"] },
  "humanist-sans": { heading: "'Poppins', sans-serif", body: "'Nunito Sans', system-ui, sans-serif", googleFonts: ["Poppins:wght@500;600;700;800", "Nunito+Sans:wght@400;500;600"] },
  "condensed-display": { heading: "'Bebas Neue', sans-serif", body: "'Inter', system-ui, sans-serif", googleFonts: ["Bebas+Neue", "Inter:wght@400;500;600"] },
  "elegant-serif": { heading: "'Cormorant Garamond', serif", body: "'Karla', system-ui, sans-serif", googleFonts: ["Cormorant+Garamond:wght@600;700", "Karla:wght@400;500;600"] },
  "soft-rounded": { heading: "'Quicksand', sans-serif", body: "'Nunito', system-ui, sans-serif", googleFonts: ["Quicksand:wght@600;700", "Nunito:wght@400;500;600"] },
  "industrial-mono": { heading: "'IBM Plex Mono', ui-monospace, monospace", body: "'IBM Plex Sans', system-ui, sans-serif", googleFonts: ["IBM+Plex+Mono:wght@500;600;700", "IBM+Plex+Sans:wght@400;500"] },
};

const FORBIDDEN_PATTERNS = [
  /<script/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /on\w+\s*=/i,
  /\baction\s*=/i,
  /javascript:/i,
];
const HREF_PATTERN = /href\s*=\s*["']([^"']*)["']/gi;

export function findSafetyViolation(html) {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(html)) return `matched forbidden pattern: ${pattern}`;
  }
  for (const match of html.matchAll(HREF_PATTERN)) {
    const target = match[1].trim();
    if (target !== "" && !target.startsWith("#")) {
      return `href target outside fragment: "${target}"`;
    }
  }
  return null;
}

const HEIGHT_REPORT_SCRIPT = `<script>
(function () {
  function report() {
    window.parent.postMessage(
      { source: "design-gallery-frame", type: "height", height: document.documentElement.scrollHeight },
      "*"
    );
  }
  window.addEventListener("load", report);
  setTimeout(report, 300);
  if (window.ResizeObserver) {
    new ResizeObserver(report).observe(document.documentElement);
  }
})();
</script>`;

export function buildFontTokenStyleTag() {
  const rules = Object.entries(FONT_TOKENS)
    .map(([id, f]) => `[data-font-token="${id}"]{--dg-font-heading:${f.heading};--dg-font-body:${f.body};}`)
    .join("\n");
  return `<style>${rules}</style>`;
}

export function buildFontLinkHtml() {
  const families = Object.values(FONT_TOKENS)
    .flatMap((f) => f.googleFonts)
    .map((f) => `family=${f}`)
    .join("&");
  return `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?${families}&display=swap" rel="stylesheet" />`;
}

export function assembleStandaloneHtml(title, sections) {
  const body = sections.map((s) => `<div data-font-token="${s.fontToken}">${s.html}</div>`).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
${buildFontLinkHtml()}
${buildFontTokenStyleTag()}
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${body}
${HEIGHT_REPORT_SCRIPT}
</body>
</html>
`;
}

export function getSql() {
  return neon(process.env.DATABASE_URL);
}

/**
 * Validates and inserts an array of hand-authored designs:
 *   { name, style_summary, font_token, layout_notes, sections: [{ type, html }] }
 * Returns { succeeded, failed, errors }.
 */
export async function insertDesigns(sql, designs, { source = "manual insert" } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  let succeeded = 0;
  const errors = [];

  for (const d of designs) {
    if (!FONT_TOKENS[d.font_token]) {
      errors.push(`"${d.name}": unknown font_token "${d.font_token}"`);
      continue;
    }
    if (!Array.isArray(d.sections) || d.sections.length < 6 || d.sections.length > 9) {
      errors.push(`"${d.name}": must have 6-9 sections, got ${d.sections?.length ?? 0}`);
      continue;
    }
    const badType = d.sections.find((s) => !SECTION_TYPES.includes(s.type));
    if (badType) {
      errors.push(`"${d.name}": invalid section type "${badType.type}"`);
      continue;
    }
    const violations = d.sections.map((s) => findSafetyViolation(s.html)).filter(Boolean);
    if (violations.length > 0) {
      errors.push(`"${d.name}": safety-net violations: ${violations.join("; ")}`);
      continue;
    }

    const fullHtml = assembleStandaloneHtml(
      d.name,
      d.sections.map((s) => ({ html: s.html, fontToken: d.font_token }))
    );

    const [design] = await sql`
      insert into designs (batch_date, name, style_summary, layout_notes, full_html)
      values (${today}, ${d.name}, ${d.style_summary}, ${d.layout_notes}, ${fullHtml})
      returning id
    `;

    for (let i = 0; i < d.sections.length; i++) {
      const s = d.sections[i];
      await sql`
        insert into sections (design_id, type, html, order_index, font_token)
        values (${design.id}, ${s.type}, ${s.html}, ${i}, ${d.font_token})
      `;
    }

    succeeded += 1;
  }

  const failed = designs.length - succeeded;

  await sql`
    insert into generation_runs (status, batch_date, requested_count, succeeded_count, failed_count, notes)
    values (
      'completed', ${today}, ${designs.length}, ${succeeded}, ${failed},
      ${`${source}${errors.length > 0 ? "\n" + errors.join("\n") : ""}`}
    )
  `;

  return { succeeded, failed, errors };
}

/** Recent designs' style/font/layout, for prompting variety — same shape used by the app's own cron route. */
export async function getRecentContext(sql, limit = 30) {
  const rows = await sql`
    select d.style_summary, d.layout_notes, s.font_token
    from designs d
    join sections s on s.design_id = d.id and s.order_index = 0
    where d.rejected = false
    order by d.created_at desc
    limit ${limit}
  `;
  return rows;
}
