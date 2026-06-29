import type { ReactNode } from "react";
import {
  BarChart3,
  Cloud,
  Droplets,
  GraduationCap,
  Leaf,
  Recycle,
  Users,
  type LucideIcon,
} from "lucide-react";

interface Visual {
  gradient: "cv1" | "cv2" | "cv3" | "cv4";
  Icon: LucideIcon;
}

/** Brand gradient + Lucide icon per category (the designer's cover system). */
const BY_SLUG: Record<string, Visual> = {
  climate: { gradient: "cv2", Icon: Cloud },
  water: { gradient: "cv4", Icon: Droplets },
  "circular-economy": { gradient: "cv3", Icon: Recycle },
  "esg-reporting": { gradient: "cv1", Icon: BarChart3 },
  biodiversity: { gradient: "cv1", Icon: Leaf },
  social: { gradient: "cv2", Icon: Users },
};

const FALLBACK: Visual = { gradient: "cv1", Icon: GraduationCap };

export function categoryVisual(slug?: string): Visual {
  return (slug && BY_SLUG[slug]) || FALLBACK;
}

export function Cover({
  gradient,
  Icon,
  className,
  children,
}: {
  gradient: string;
  Icon: LucideIcon;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`${gradient} cv-pat${className ? " " + className : ""}`}>
      {children}
      <div className="cv-ico">
        <Icon className="icon-lg" />
      </div>
    </div>
  );
}
