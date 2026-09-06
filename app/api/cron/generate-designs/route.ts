import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { designs, sections, generationRuns } from "@/drizzle/schema";
import { generateOneDesign } from "@/lib/anthropic";
import type { RecentDesign } from "@/lib/prompt";
import { assembleStandaloneHtml } from "@/lib/assemble-html";

const INVOCATION_TIME_BUDGET_MS = 50_000;
const OVERLAP_GUARD_MS = 90_000;
const PRIOR_DAYS_CONTEXT = 10;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const requestedCount = Number(process.env.DESIGNS_PER_RUN) || 50;
  const batchDate = todayUtc();

  const [existingRun] = await db
    .select()
    .from(generationRuns)
    .where(eq(generationRuns.batchDate, batchDate))
    .limit(1);

  if (existingRun?.status === "completed") {
    return NextResponse.json({ skipped: "already completed for today", runId: existingRun.id });
  }

  if (
    existingRun?.status === "running" &&
    Date.now() - new Date(existingRun.updatedAt).getTime() < OVERLAP_GUARD_MS
  ) {
    return NextResponse.json({ skipped: "another invocation appears to be in progress", runId: existingRun.id });
  }

  const run =
    existingRun ??
    (
      await db
        .insert(generationRuns)
        .values({ requestedCount, status: "running", batchDate })
        .returning()
    )[0];

  let succeeded = run.succeededCount;
  let failed = run.failedCount;
  const notes: string[] = run.notes ? run.notes.split("\n") : [];

  const todayRows = await db
    .select({
      styleSummary: designs.styleSummary,
      layoutNotes: designs.layoutNotes,
      fontToken: sections.fontToken,
    })
    .from(designs)
    .innerJoin(sections, and(eq(sections.designId, designs.id), eq(sections.orderIndex, 0)))
    .where(and(eq(designs.rejected, false), eq(designs.batchDate, batchDate)))
    .orderBy(asc(designs.createdAt));

  const priorRows = await db
    .select({
      styleSummary: designs.styleSummary,
      layoutNotes: designs.layoutNotes,
      fontToken: sections.fontToken,
    })
    .from(designs)
    .innerJoin(sections, and(eq(sections.designId, designs.id), eq(sections.orderIndex, 0)))
    .where(and(eq(designs.rejected, false), ne(designs.batchDate, batchDate)))
    .orderBy(desc(designs.createdAt))
    .limit(PRIOR_DAYS_CONTEXT);

  const recent: RecentDesign[] = [
    ...priorRows.reverse().map((r) => ({
      styleSummary: r.styleSummary,
      fontToken: r.fontToken,
      layoutNotes: r.layoutNotes ?? "",
    })),
    ...todayRows.map((r) => ({
      styleSummary: r.styleSummary,
      fontToken: r.fontToken,
      layoutNotes: r.layoutNotes ?? "",
    })),
  ];

  let generatedThisInvocation = 0;

  while (succeeded + failed < requestedCount && Date.now() - startedAt < INVOCATION_TIME_BUDGET_MS) {
    const outcome = await generateOneDesign(recent);

    if (!outcome.ok) {
      failed += 1;
      notes.push(outcome.reason);
    } else {
      const { name, style_summary, font_token, layout_notes, sections: generatedSections } = outcome.design;
      const fullHtml = assembleStandaloneHtml(
        name,
        generatedSections.map((s) => ({ html: s.html, fontToken: font_token })),
        { reportHeight: true }
      );

      const [design] = await db
        .insert(designs)
        .values({ batchDate, name, styleSummary: style_summary, layoutNotes: layout_notes, fullHtml })
        .returning();

      await db.insert(sections).values(
        generatedSections.map((s, index) => ({
          designId: design.id,
          type: s.type,
          html: s.html,
          orderIndex: index,
          fontToken: font_token,
        }))
      );

      succeeded += 1;
      recent.push({ styleSummary: style_summary, fontToken: font_token, layoutNotes: layout_notes });
    }

    generatedThisInvocation += 1;

    await db
      .update(generationRuns)
      .set({
        succeededCount: succeeded,
        failedCount: failed,
        updatedAt: new Date(),
        notes: notes.length > 0 ? notes.join("\n") : null,
        status: succeeded + failed >= requestedCount ? "completed" : "running",
      })
      .where(eq(generationRuns.id, run.id));
  }

  return NextResponse.json({
    runId: run.id,
    batchDate,
    requestedCount,
    succeededSoFar: succeeded,
    failedSoFar: failed,
    generatedThisInvocation,
    completed: succeeded + failed >= requestedCount,
  });
}
