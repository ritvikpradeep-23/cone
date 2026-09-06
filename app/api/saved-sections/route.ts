import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { designs, sections, savedSections } from "@/drizzle/schema";
import { getAnonId } from "@/lib/anon-id";

export async function GET(request: NextRequest) {
  const anonId = getAnonId(request);
  if (!anonId) return NextResponse.json({ sections: [] });

  const rows = await db
    .select({
      savedId: savedSections.id,
      id: sections.id,
      type: sections.type,
      html: sections.html,
      fontToken: sections.fontToken,
      designId: sections.designId,
      designName: designs.name,
    })
    .from(savedSections)
    .innerJoin(sections, eq(savedSections.sectionId, sections.id))
    .innerJoin(designs, eq(sections.designId, designs.id))
    .where(eq(savedSections.anonId, anonId))
    .orderBy(desc(savedSections.savedAt));

  return NextResponse.json({ sections: rows });
}

export async function POST(request: NextRequest) {
  const anonId = getAnonId(request);
  if (!anonId) return NextResponse.json({ error: "missing anon id" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const sectionId: unknown = body?.sectionId;
  if (typeof sectionId !== "string") {
    return NextResponse.json({ error: "sectionId is required" }, { status: 400 });
  }

  const [saved] = await db
    .insert(savedSections)
    .values({ anonId, sectionId })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json({ saved: saved ?? null });
}
