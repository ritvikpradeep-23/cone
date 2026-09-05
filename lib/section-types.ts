export const SECTION_TYPES = [
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
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  navbar: "Navbar",
  hero: "Hero",
  features: "Features",
  pricing: "Pricing",
  testimonials: "Testimonials",
  cta: "CTA",
  footer: "Footer",
  faq: "FAQ",
  stats: "Stats",
  team: "Team",
  gallery: "Gallery",
  contact: "Contact",
  "blog-list": "Blog List",
  logos: "Logos",
};
