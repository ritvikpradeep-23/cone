import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { designs, sections } from "@/drizzle/schema";
import { SECTION_TYPES, type SectionType } from "@/lib/section-types";

const LIMIT = 200;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const typeParam = searchParams.get("type");
  const type =
    typeParam && (SECTION_TYPES as readonly string[]).includes(typeParam)
      ? (typeParam as SectionType)
      : null;

  const conditions = [eq(designs.rejected, false)];
  if (type) conditions.push(eq(sections.type, type));

  const rows = await db
    .select({
      id: sections.id,
      type: sections.type,
      html: sections.html,
      designId: sections.designId,
      designName: designs.name,
      createdAt: designs.createdAt,
    })
    .from(sections)
    .innerJoin(designs, eq(sections.designId, designs.id))
    .where(and(...conditions))
    .orderBy(desc(designs.createdAt))
    .limit(LIMIT);

  return NextResponse.json({ sections: rows });
}
