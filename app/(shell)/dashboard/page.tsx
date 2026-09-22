import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { ArrowUpRight, LayoutGrid, Layers, Activity, Shuffle } from "lucide-react";
import { db } from "@/drizzle/db";
import { designs, sections, generationRuns } from "@/drizzle/schema";
import { SECTION_TYPE_LABELS, SECTION_TYPES } from "@/lib/section-types";
import { ResumeBlueprintCard } from "@/components/resume-blueprint-card";

export const dynamic = "force-dynamic";

const RUN_STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  completed: { dot: "var(--dg-success)", label: "Completed" },
  running: { dot: "var(--dg-warning)", label: "Running" },
  failed: { dot: "var(--dg-danger)", label: "Failed" },
};

function StatCard({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border border-[var(--dg-border)] bg-[var(--dg-surface)] p-5"
      style={{ boxShadow: "var(--dg-shadow)" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--dg-accent-soft)]">
          <Icon size={14} strokeWidth={2} className="text-[var(--dg-accent-hover)]" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--dg-muted)]">{label}</p>
      </div>
      {children}
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="dg-focus-ring group flex items-start gap-3.5 rounded-xl border border-[var(--dg-border)] bg-[var(--dg-surface)] p-5 transition-colors hover:border-[var(--dg-border-strong)] hover:bg-[var(--dg-surface-hover)]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--dg-accent-soft)]">
        <Icon size={16} strokeWidth={2} className="text-[var(--dg-accent-hover)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-sm font-medium text-[var(--dg-text)]">
          {title}
          <ArrowUpRight
            size={14}
            strokeWidth={2}
            className="text-[var(--dg-muted-2)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--dg-accent-hover)]"
          />
        </p>
        <p className="mt-0.5 text-xs text-[var(--dg-muted)]">{description}</p>
      </div>
    </Link>
  );
}

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
  const runStatus = lastRun ? RUN_STATUS_STYLE[lastRun.status] : null;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--dg-text)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--dg-muted)]">
          Overview of everything generated into the gallery so far.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={LayoutGrid} label="Designs">
          <p className="text-3xl font-semibold tracking-tight text-[var(--dg-text)]">{designCount?.value ?? 0}</p>
        </StatCard>

        <StatCard icon={Layers} label="Sections">
          <p className="text-3xl font-semibold tracking-tight text-[var(--dg-text)]">{totalSections}</p>
          {totalSections > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SECTION_TYPES.filter((t) => countByType[t]).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[var(--dg-border)] bg-[var(--dg-bg)] px-2 py-0.5 font-mono text-[10px] text-[var(--dg-muted)]"
                >
                  {SECTION_TYPE_LABELS[t]} <span className="text-[var(--dg-muted-2)]">{countByType[t]}</span>
                </span>
              ))}
            </div>
          ) : null}
        </StatCard>

        <StatCard icon={Activity} label="Last generation run">
          {lastRun && runStatus ? (
            <>
              <p className="flex items-center gap-2 text-lg font-semibold text-[var(--dg-text)]">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: runStatus.dot }} />
                {runStatus.label}
              </p>
              <p className="mt-1.5 text-xs text-[var(--dg-muted)]">{new Date(lastRun.runAt).toLocaleString()}</p>
              <p className="mt-2.5 text-xs">
                <span className="font-medium text-[var(--dg-text)]">{lastRun.succeededCount} succeeded</span>
                <span className="text-[var(--dg-muted-2)]"> &middot; {lastRun.failedCount} failed</span>
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--dg-muted)]">No runs yet</p>
          )}
        </StatCard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ActionCard href="/gallery" title="Browse gallery" description="Search and filter every design" icon={LayoutGrid} />
        <ActionCard href="/mix" title="Open mix canvas" description="Assemble a page from sections" icon={Shuffle} />
        <ResumeBlueprintCard />
      </div>
    </div>
  );
}
