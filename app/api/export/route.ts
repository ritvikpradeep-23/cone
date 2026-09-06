import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { sections } from "@/drizzle/schema";
import { assembleStandaloneHtml } from "@/lib/assemble-html";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const sectionIds: unknown = body?.sectionIds;

  if (!Array.isArray(sectionIds) || sectionIds.length === 0 || !sectionIds.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "sectionIds must be a non-empty string array" }, { status: 400 });
  }

  const rows = await db.select().from(sections).where(inArray(sections.id, sectionIds));
  const byId = new Map(rows.map((row) => [row.id, row]));
  const orderedSections = sectionIds
    .map((id) => byId.get(id))
    .filter((row): row is (typeof rows)[number] => Boolean(row))
    .map((row) => ({ html: row.html, fontToken: row.fontToken }));

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
