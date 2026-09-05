import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { designs, sections } from "@/drizzle/schema";
import { DesignDetail } from "@/components/design-detail";

export default async function DesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [design] = await db.select().from(designs).where(eq(designs.id, id)).limit(1);
  if (!design || design.rejected) notFound();

  const designSections = await db
    .select()
    .from(sections)
    .where(eq(sections.designId, id))
    .orderBy(asc(sections.orderIndex));

  return (
    <DesignDetail
      design={{
        id: design.id,
        name: design.name,
        styleSummary: design.styleSummary,
        batchDate: design.batchDate,
        fullHtml: design.fullHtml,
      }}
      sections={designSections}
    />
  );
}
