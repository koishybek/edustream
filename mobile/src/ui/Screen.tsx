import type { ReactNode } from "react";

/** A single routed screen inside the app shell (.app). */
export function Screen({
  children,
  className,
  pop,
}: {
  children: ReactNode;
  className?: string;
  pop?: boolean;
}) {
  return (
    <section className={`screen${pop ? " pop" : ""}${className ? " " + className : ""}`}>
      {children}
    </section>
  );
}
