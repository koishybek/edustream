import type { ReactNode } from "react";

type Variant = "free" | "new" | "owned";

export function Badge({
  variant = "free",
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={`badge badge--${variant}${className ? " " + className : ""}`}>
      {children}
    </span>
  );
}
