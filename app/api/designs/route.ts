import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, exists, gte, lt, lte, or, ilike } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { designs, sections } from "@/drizzle/schema";
import { SECTION_TYPES, type SectionType } from "@/lib/section-types";

const DEFAULT_LIMIT = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const hasTypeParam = searchParams.get("hasType");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit")) || DEFAULT_LIMIT, 50);

  const hasType =
    hasTypeParam && (SECTION_TYPES as readonly string[]).includes(hasTypeParam)
      ? (hasTypeParam as SectionType)
      : null;

  const conditions = [eq(designs.rejected, false)];

  if (q) {
    conditions.push(
      or(ilike(designs.name, `%${q}%`), ilike(designs.styleSummary, `%${q}%`))!
    );
  }
  if (from) conditions.push(gte(designs.batchDate, from));
  if (to) conditions.push(lte(designs.batchDate, to));
  if (cursor) conditions.push(lt(designs.createdAt, new Date(cursor)));
  if (hasType) {
    conditions.push(
      exists(
        db
          .select({ one: sections.id })
          .from(sections)
          .where(and(eq(sections.designId, designs.id), eq(sections.type, hasType)))
      )
    );
  }

  const rows = await db
    .select({
      id: designs.id,
      name: designs.name,
      styleSummary: designs.styleSummary,
      batchDate: designs.batchDate,
      createdAt: designs.createdAt,
    })
    .from(designs)
    .where(and(...conditions))
    .orderBy(desc(designs.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1].createdAt.toISOString() : null;

  return NextResponse.json({ designs: page, nextCursor });
}
