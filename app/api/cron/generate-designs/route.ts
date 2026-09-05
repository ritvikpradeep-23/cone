import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { designs, sections, generationRuns } from "@/drizzle/schema";
import { generateOneDesign } from "@/lib/anthropic";
import { assembleStandaloneHtml } from "@/lib/assemble-html";

const BATCH_SIZE = 5;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const requestedCount = Number(process.env.DESIGNS_PER_RUN) || 15;

  const [run] = await db
    .insert(generationRuns)
    .values({ requestedCount, status: "running" })
    .returning();

  const recent = await db
    .select({ styleSummary: designs.styleSummary })
    .from(designs)
    .where(eq(designs.rejected, false))
    .orderBy(desc(designs.createdAt))
    .limit(20);
  const recentStyleSummaries = recent.map((r) => r.styleSummary);

  let succeeded = 0;
  let failed = 0;
  const notes: string[] = [];
  const batchDate = new Date().toISOString().slice(0, 10);

  for (let start = 0; start < requestedCount; start += BATCH_SIZE) {
    const batchLength = Math.min(BATCH_SIZE, requestedCount - start);
    const results = await Promise.allSettled(
      Array.from({ length: batchLength }, () => generateOneDesign(recentStyleSummaries))
    );

    for (const result of results) {
      if (result.status === "rejected") {
        failed += 1;
        notes.push(`generation threw: ${String(result.reason)}`);
        continue;
      }
      const outcome = result.value;
      if (!outcome.ok) {
        failed += 1;
        notes.push(outcome.reason);
        continue;
      }

      const { name, style_summary, sections: generatedSections } = outcome.design;
      const fullHtml = assembleStandaloneHtml(
        name,
        generatedSections.map((s) => s.html)
      );

      const [design] = await db
        .insert(designs)
        .values({ batchDate, name, styleSummary: style_summary, fullHtml })
        .returning();

      await db.insert(sections).values(
        generatedSections.map((s, index) => ({
          designId: design.id,
          type: s.type,
          html: s.html,
          orderIndex: index,
        }))
      );

      succeeded += 1;
      recentStyleSummaries.unshift(style_summary);
    }
  }

  await db
    .update(generationRuns)
    .set({
      status: "completed",
      succeededCount: succeeded,
      failedCount: failed,
      notes: notes.length > 0 ? notes.join("\n") : null,
    })
    .where(eq(generationRuns.id, run.id));

  return NextResponse.json({ runId: run.id, requestedCount, succeeded, failed });
}
