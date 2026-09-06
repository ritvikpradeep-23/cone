import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  index,
  unique,
} from "drizzle-orm/pg-core";

export const sectionTypeEnum = pgEnum("section_type", [
  "navbar",
  "hero",
  "features",
  "pricing",
  "testimonials",
  "cta",
  "footer",
  "faq",
  "stats",
  "team",
  "gallery",
  "contact",
  "blog-list",
  "logos",
]);

export const generationRunStatusEnum = pgEnum("generation_run_status", [
  "running",
  "completed",
  "failed",
]);

export const designs = pgTable(
  "designs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    batchDate: date("batch_date").notNull(),
    name: text("name").notNull(),
    styleSummary: text("style_summary").notNull(),
    fullHtml: text("full_html").notNull(),
    layoutNotes: text("layout_notes"),
    rejected: boolean("rejected").notNull().default(false),
    rejectionReason: text("rejection_reason"),
  },
  (table) => [
    index("designs_batch_date_idx").on(table.batchDate),
    index("designs_created_at_idx").on(table.createdAt),
  ]
);

export const sections = pgTable(
  "sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    designId: uuid("design_id")
      .notNull()
      .references(() => designs.id, { onDelete: "cascade" }),
    type: sectionTypeEnum("type").notNull(),
    html: text("html").notNull(),
    orderIndex: integer("order_index").notNull(),
    fontToken: text("font_token").notNull(),
  },
  (table) => [index("sections_type_design_idx").on(table.type, table.designId)]
);

export const generationRuns = pgTable("generation_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  runAt: timestamp("run_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  batchDate: date("batch_date"),
  status: generationRunStatusEnum("status").notNull().default("running"),
  requestedCount: integer("requested_count").notNull(),
  succeededCount: integer("succeeded_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  notes: text("notes"),
});

export const savedSections = pgTable(
  "saved_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    anonId: text("anon_id").notNull(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("saved_sections_anon_idx").on(table.anonId),
    unique("saved_sections_anon_section_unique").on(table.anonId, table.sectionId),
  ]
);
