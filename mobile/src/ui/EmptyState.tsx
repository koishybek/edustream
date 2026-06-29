import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <div className="t-section">{title}</div>
      {text && (
        <div className="t-caption" style={{ maxWidth: "32ch" }}>
          {text}
        </div>
      )}
      {action}
    </div>
  );
}
