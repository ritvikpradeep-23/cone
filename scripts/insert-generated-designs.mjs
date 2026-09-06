// Inserts a batch of hand-authored designs into the database, bypassing the
// Anthropic API. Used by the daily "Claude writes 5 designs" scheduled task.
//
// Usage: node scripts/insert-generated-designs.mjs <path-to-designs.json>
//
// The JSON file must be an array of:
//   {
//     "name": string,
//     "style_summary": string,
//     "font_token": one of the keys in scripts/lib/insert-helpers.mjs FONT_TOKENS,
//     "layout_notes": string,
//     "sections": [{ "type": SectionType, "html": string }, ... ]  // 6-9 entries
//   }
//
// Each section's primary heading element should carry
// data-dg-font-role="heading" style="font-family:var(--dg-font-heading)",
// and its primary body-copy element data-dg-font-role="body"
// style="font-family:var(--dg-font-body)" — see an existing design in
// scripts/seed-designs.mjs for the exact pattern.
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { getSql, insertDesigns } from "./lib/insert-helpers.mjs";

config({ path: ".env.local", quiet: true });

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node scripts/insert-generated-designs.mjs <path-to-designs.json>");
  process.exit(1);
}

const designs = JSON.parse(readFileSync(filePath, "utf-8"));
const sql = getSql();

const { succeeded, failed, errors } = await insertDesigns(sql, designs, {
  source: "daily Claude-authored batch, not the Anthropic API",
});

for (const e of errors) console.error("SKIPPED:", e);
console.log(`Done: ${succeeded}/${designs.length} designs inserted (${failed} skipped).`);

if (succeeded === 0) process.exit(1);
