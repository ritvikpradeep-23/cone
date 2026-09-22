import { z } from "zod";
import { SECTION_TYPES } from "./section-types";
import { FONT_TOKEN_IDS } from "./font-tokens";
import { COLOR_THEME_IDS } from "./color-themes";

export const generatedSectionSchema = z.object({
  type: z.enum(SECTION_TYPES),
  html: z.string().min(1),
});

export const generatedDesignSchema = z.object({
  name: z.string().min(1),
  style_summary: z.string().min(1),
  font_token: z.enum(FONT_TOKEN_IDS),
  color_theme: z.enum(COLOR_THEME_IDS),
  layout_notes: z.string().min(1),
  sections: z.array(generatedSectionSchema).min(6).max(9),
});

export type GeneratedDesign = z.infer<typeof generatedDesignSchema>;

export const EMIT_DESIGN_TOOL = {
  name: "emit_design",
  description:
    "Emit one complete static sample website design as structured sections.",
  strict: true,
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "Short descriptive name for the design, e.g. 'Neon SaaS Landing'.",
      },
      style_summary: {
        type: "string",
        description:
          "One sentence describing the visual direction, e.g. 'dark neubrutalist SaaS landing'.",
      },
      font_token: {
        type: "string",
        enum: [...FONT_TOKEN_IDS],
        description: "One font-pairing token from the provided list, applied to every section in this design.",
      },
      color_theme: {
        type: "string",
        enum: [...COLOR_THEME_IDS],
        description:
          "One accent-color theme from the provided list, applied to every accent/button element in this design.",
      },
      layout_notes: {
        type: "string",
        description:
          "Short phrase describing the layout pattern, e.g. '3-col feature grid, sticky nav, asymmetric hero'.",
      },
      sections: {
        type: "array",
        minItems: 6,
        maxItems: 9,
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: [...SECTION_TYPES] },
            html: {
              type: "string",
              description: "Self-contained HTML fragment for this section, Tailwind classes only.",
            },
          },
          required: ["type", "html"],
        },
      },
    },
    required: ["name", "style_summary", "font_token", "color_theme", "layout_notes", "sections"],
  },
};
