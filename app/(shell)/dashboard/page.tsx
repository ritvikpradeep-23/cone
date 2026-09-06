import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { designs, sections, generationRuns } from "@/drizzle/schema";
import { SECTION_TYPE_LABELS, SECTION_TYPES } from "@/lib/section-types";
import { ResumeBlueprintCard } from "@/components/resume-blueprint-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [[designCount], sectionCountsByType, [lastRun]] = await Promise.all([
    db.select({ value: count() }).from(designs).where(eq(designs.rejected, false)),
    db
      .select({ type: sections.type, value: count() })
      .from(sections)
      .innerJoin(designs, eq(sections.designId, designs.id))
      .where(eq(designs.rejected, false))
      .groupBy(sections.type),
    db.select().from(generationRuns).orderBy(desc(generationRuns.runAt)).limit(1),
  ]);

  const totalSections = sectionCountsByType.reduce((sum, row) => sum + row.value, 0);
  const countByType = Object.fromEntries(sectionCountsByType.map((row) => [row.type, row.value]));

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-8">
      <p className="mb-6 text-lg font-medium text-[var(--dg-text)]">Dashboard</p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--dg-border)] bg-[var(--dg-surface)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--dg-muted)]">Designs</p>
          <p className="mt-1 text-2xl font-medium text-[var(--dg-text)]">{designCount?.value ?? 0}</p>
        </div>

        <div className="rounded-lg border border-[var(--dg-border)] bg-[var(--dg-surface)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--dg-muted)]">Sections</p>
          <p className="mt-1 text-2xl font-medium text-[var(--dg-text)]">{totalSections}</p>
          {totalSections > 0 ? (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {SECTION_TYPES.filter((t) => countByType[t]).map((t) => (
                <span key={t} className="font-mono text-[10px] text-[var(--dg-muted)]">
                  {SECTION_TYPE_LABELS[t]} {countByType[t]}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-[var(--dg-border)] bg-[var(--dg-surface)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--dg-muted)]">Last generation run</p>
          {lastRun ? (
            <>
              <p className="mt-1 text-sm text-[var(--dg-text)] capitalize">{lastRun.status}</p>
              <p className="mt-0.5 font-mono text-[11px] text-[var(--dg-muted)]">
                {new Date(lastRun.runAt).toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-[var(--dg-muted)]">
                {lastRun.succeededCount} succeeded / {lastRun.failedCount} failed
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-[var(--dg-muted)]">No runs yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/gallery"
          className="rounded-lg border border-[var(--dg-border)] bg-[var(--dg-surface)] p-4 text-sm font-medium text-[var(--dg-text)] transition hover:bg-white/5"
        >
          Browse gallery
        </Link>
        <Link
          href="/mix"
          className="rounded-lg border border-[var(--dg-border)] bg-[var(--dg-surface)] p-4 text-sm font-medium text-[var(--dg-text)] transition hover:bg-white/5"
        >
          Open mix canvas
        </Link>
        <ResumeBlueprintCard />
      </div>
    </div>
  );
}
