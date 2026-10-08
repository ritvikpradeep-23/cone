import {
  PanelTop,
  Sparkles,
  LayoutGrid,
  Tag,
  Quote,
  Megaphone,
  PanelBottom,
  CircleHelp,
  ChartColumn,
  Users,
  Images,
  Mail,
  Newspaper,
  Award,
  type LucideIcon,
} from "lucide-react";
import type { SectionType } from "@/lib/section-types";

const ICONS: Record<SectionType, LucideIcon> = {
  navbar: PanelTop,
  hero: Sparkles,
  features: LayoutGrid,
  pricing: Tag,
  testimonials: Quote,
  cta: Megaphone,
  footer: PanelBottom,
  faq: CircleHelp,
  stats: ChartColumn,
  team: Users,
  gallery: Images,
  contact: Mail,
  "blog-list": Newspaper,
  logos: Award,
};

export function SectionTypeIcon({
  type,
  size = 14,
  className,
}: {
  type: SectionType;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[type];
  return <Icon size={size} strokeWidth={1.75} className={className} />;
}
