import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { designs, sections } from "@/drizzle/schema";
import { FullBrowserPreview } from "@/components/full-browser-preview";
import { assembleStandaloneHtml } from "@/lib/assemble-html";

export default async function DesignPreviewPage({
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

  const srcDoc = assembleStandaloneHtml(
    design.name,
    designSections.map((s) => ({ html: s.html, fontToken: s.fontToken })),
    { trackScroll: true, enableCapture: true }
  );

  return <FullBrowserPreview srcDoc={srcDoc} exitHref={`/designs/${id}`} fileName={design.name} />;
}
