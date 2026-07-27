import { useState, type ReactNode } from "react";
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

/** Brand gradient + Lucide icon per category — the graceful fallback under photos. */
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

/** Pull the YouTube video id out of a cover/watch/thumbnail URL. */
function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m =
    url.match(/\/vi\/([^/]+)\//) ||
    url.match(/[?&]v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/);
  return m ? m[1] : null;
}

/**
 * A real course cover: renders the lesson's YouTube thumbnail (crisp maxres,
 * falling back to the always-present mqdefault), and finally to the brand
 * gradient + category icon if no image is available. A scrim keeps overlaid
 * badges/text legible on any photo.
 */
export function CourseCover({
  image,
  slug,
  className,
  children,
}: {
  image?: string | null;
  slug?: string;
  className?: string;
  children?: ReactNode;
}) {
  const { gradient, Icon } = categoryVisual(slug);
  const id = youtubeId(image);
  // 0 = try maxres, 1 = try mqdefault, 2 = gradient + icon only
  const [stage, setStage] = useState<0 | 1 | 2>(id ? 0 : 2);
  const src =
    id && stage < 2
      ? `https://img.youtube.com/vi/${id}/${stage === 0 ? "maxresdefault" : "mqdefault"}.jpg`
      : null;

  return (
    <div className={`${gradient} cv-pat cover${className ? " " + className : ""}`}>
      {src && (
        <img
          className="cover__img"
          src={src}
          alt=""
          loading="lazy"
          onError={() => setStage((s) => (s + 1) as 0 | 1 | 2)}
        />
      )}
      {src && <div className="cover__scrim" />}
      {stage === 2 && (
        <div className="cv-ico">
          <Icon className="icon-lg" />
        </div>
      )}
      {children}
    </div>
  );
}
