import type { ReactNode } from "react";

/** Mobile-frame layout: centered, max-width, full dynamic-viewport height. */
export function Screen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div
        className={`mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-6 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
