import type { CSSProperties } from "react";

export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`skeleton${className ? " " + className : ""}`} style={style} />
  );
}
