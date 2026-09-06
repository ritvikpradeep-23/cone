// Prints recent designs' style_summary/font_token/layout_notes so a new
// hand-authored batch can be written to avoid repeating them.
// Usage: node scripts/recent-context.mjs [limit]
import { config } from "dotenv";
import { getSql, getRecentContext, FONT_TOKENS } from "./lib/insert-helpers.mjs";

config({ path: ".env.local", quiet: true });

const limit = Number(process.argv[2]) || 30;
const sql = getSql();
const recent = await getRecentContext(sql, limit);

console.log(`Available font tokens: ${Object.keys(FONT_TOKENS).join(", ")}\n`);
console.log(`Last ${recent.length} designs (avoid repeating style, font_token, or layout pattern):`);
for (const r of recent) {
  console.log(`- style: ${r.style_summary} | font: ${r.font_token} | layout: ${r.layout_notes ?? "(none recorded)"}`);
}
