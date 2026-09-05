CREATE TYPE "public"."generation_run_status" AS ENUM('running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."section_type" AS ENUM('navbar', 'hero', 'features', 'pricing', 'testimonials', 'cta', 'footer', 'faq', 'stats', 'team', 'gallery', 'contact', 'blog-list', 'logos');--> statement-breakpoint
CREATE TABLE "designs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"batch_date" date NOT NULL,
	"name" text NOT NULL,
	"style_summary" text NOT NULL,
	"full_html" text NOT NULL,
	"rejected" boolean DEFAULT false NOT NULL,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "generation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "generation_run_status" DEFAULT 'running' NOT NULL,
	"requested_count" integer NOT NULL,
	"succeeded_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"design_id" uuid NOT NULL,
	"type" "section_type" NOT NULL,
	"html" text NOT NULL,
	"order_index" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_design_id_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "designs_batch_date_idx" ON "designs" USING btree ("batch_date");--> statement-breakpoint
CREATE INDEX "designs_created_at_idx" ON "designs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sections_type_design_idx" ON "sections" USING btree ("type","design_id");