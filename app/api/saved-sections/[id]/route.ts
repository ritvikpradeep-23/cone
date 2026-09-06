import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { savedSections } from "@/drizzle/schema";
import { getAnonId } from "@/lib/anon-id";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const anonId = getAnonId(request);
  if (!anonId) return NextResponse.json({ error: "missing anon id" }, { status: 400 });

  const { id } = await params;

  await db.delete(savedSections).where(and(eq(savedSections.id, id), eq(savedSections.anonId, anonId)));

  return NextResponse.json({ ok: true });
}
