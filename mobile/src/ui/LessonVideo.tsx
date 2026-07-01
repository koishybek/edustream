/**
 * Plays a lesson video. Real YouTube URLs render as a privacy-friendly embed;
 * anything else (e.g. a direct .mp4) falls back to a native <video>. Fills its
 * positioned parent (the `.player` box).
 */

/** Extract a YouTube video id from watch?v=, youtu.be/ or /embed/ URLs. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1) || null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
    }
    return null;
  } catch {
    return null;
  }
}

const fill: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  border: 0,
  background: "#0E120F",
};

export function LessonVideo({ url, title }: { url: string; title?: string }) {
  const id = youtubeId(url);
  if (id) {
    return (
      <iframe
        style={fill}
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`}
        title={title ?? "Lesson video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return <video src={url} controls playsInline style={fill} />;
}
