import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { sections } from "@/drizzle/schema";
import { assembleStandaloneHtml, type AssembleSection } from "@/lib/assemble-html";
import { DEFAULT_DENSITY, DEFAULT_BUTTON_STYLE, DENSITY_VALUES, BUTTON_STYLE_VALUES } from "@/lib/style-tokens";

type SectionOverride = {
  id: string;
  fontToken?: string;
  colorTheme?: string;
  density?: string;
  buttonStyle?: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const rawSections: unknown = body?.sections;

  // sections: [{ id, fontToken?, colorTheme?, density?, buttonStyle? }, ...] in canvas order.
  // Any property a client omits falls back to that section's own generated value (or the
  // fixed baseline for density/buttonStyle) so this endpoint still works with a plain id list.
  if (!Array.isArray(rawSections) || rawSections.length === 0) {
    return NextResponse.json({ error: "sections must be a non-empty array" }, { status: 400 });
  }
  const overrides: SectionOverride[] = rawSections.filter(
    (s): s is SectionOverride => s && typeof s === "object" && typeof (s as SectionOverride).id === "string"
  );
  if (overrides.length === 0) {
    return NextResponse.json({ error: "no valid section entries found" }, { status: 400 });
  }

  const ids = overrides.map((s) => s.id);
  const rows = await db.select().from(sections).where(inArray(sections.id, ids));
  const byId = new Map(rows.map((row) => [row.id, row]));

  const orderedSections: AssembleSection[] = [];
  for (const override of overrides) {
    const row = byId.get(override.id);
    if (!row) continue;
    const density = DENSITY_VALUES.includes(override.density as (typeof DENSITY_VALUES)[number])
      ? (override.density as AssembleSection["density"])
      : DEFAULT_DENSITY;
    const buttonStyle = BUTTON_STYLE_VALUES.includes(override.buttonStyle as (typeof BUTTON_STYLE_VALUES)[number])
      ? (override.buttonStyle as AssembleSection["buttonStyle"])
      : DEFAULT_BUTTON_STYLE;
    orderedSections.push({
      html: row.html,
      fontToken: override.fontToken || row.fontToken,
      colorTheme: override.colorTheme || row.colorTheme,
      density,
      buttonStyle,
    });
  }

  if (orderedSections.length === 0) {
    return NextResponse.json({ error: "no matching sections found" }, { status: 404 });
  }

  const html = assembleStandaloneHtml("Blueprint Export", orderedSections);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": 'attachment; filename="blueprint.html"',
    },
  });
}
