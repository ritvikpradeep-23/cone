import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { designs, sections } from "@/drizzle/schema";

export async function GET(_request: Request, ctx: RouteContext<"/api/designs/[id]">) {
  const { id } = await ctx.params;

  const [design] = await db.select().from(designs).where(eq(designs.id, id)).limit(1);
  if (!design || design.rejected) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const designSections = await db
    .select()
    .from(sections)
    .where(eq(sections.designId, id))
    .orderBy(asc(sections.orderIndex));

  return NextResponse.json({ design, sections: designSections });
}
